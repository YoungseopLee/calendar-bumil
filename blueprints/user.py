from flask import Blueprint, request, jsonify
import jwt
from db import get_db_connection
from config import SECRET_KEY
from .auth import encrypt_aes, encrypt_deterministic, decrypt_aes, decrypt_deterministic
from flask_bcrypt import Bcrypt

user_bp = Blueprint('user', __name__, url_prefix='/user')
bcrypt = Bcrypt()

# 첫 로그인 사용자 목록 조회
@user_bp.route('/get_pending_users', methods=['GET', 'OPTIONS'])
def get_pending_users():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'})
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, name, position, department, email, phone_number 
            FROM tb_user 
            WHERE first_login_yn = 'n' AND is_delete_yn = 'n'
        """)
        pending_users = cursor.fetchall()
        return jsonify({'users': pending_users}), 200
    except Exception as e:
        print(f"미승인 사용자 목록 가져오기 오류: {e}")
        return jsonify({'message': '미승인 사용자 목록 가져오기 오류'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

# 모든 사용자 목록 조회
@user_bp.route('/get_users', methods=['GET'])
def get_users():
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, name, position, department, email, phone_number, status, first_login_yn 
            FROM tb_user 
            WHERE is_delete_yn = 'n'
        """)
        users = cursor.fetchall()

        # phone_number 복호화 (암호화된 경우)
        for user in users:
            try:
                user['phone_number'] = decrypt_aes(user['phone_number'])
            except Exception as e:
                print(f"전화번호 복호화 오류 (user id {user['id']}): {e}")
                user['phone_number'] = None

        return jsonify({'users': users}), 200
    except Exception as e:
        print(f"사용자 목록 조회 오류: {e}")
        return jsonify({'message': '사용자 목록 조회 오류'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

# 특정 사용자들의 상태 조회
@user_bp.route('/get_users_status', methods=['POST', 'OPTIONS'])
def get_users_status():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'}), 200
    data = request.get_json()
    user_ids = data.get("user_ids", [])
    if not user_ids:
        return jsonify({'message': 'user_ids가 제공되지 않았습니다.'}), 400
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor(dictionary=True)
        format_strings = ','.join(['%s'] * len(user_ids))
        query = f"SELECT id, status FROM tb_user WHERE id IN ({format_strings})"
        cursor.execute(query, tuple(user_ids))
        statuses = cursor.fetchall()
        statuses_dict = {user["id"]: user["status"] for user in statuses}
        return jsonify({'statuses': statuses_dict}), 200
    except Exception as e:
        print(f"사용자 상태 조회 오류: {e}")
        return jsonify({'message': '사용자 상태 조회 오류'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

# 유저 상태 업데이트
@user_bp.route('/update_status', methods=['PUT', 'OPTIONS'])
def update_status():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'}), 200
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': '토큰이 없습니다.'}), 401
    token = token.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_id = payload['user_id']
        data = request.get_json()
        new_status = data.get('status')
        
        if new_status is None or new_status.strip() == '':
            new_status = None
        elif new_status.strip() not in ["휴가", "파견"]:
            return jsonify({'message': '유효하지 않은 상태 값입니다.'}), 400
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor()
        cursor.execute("UPDATE tb_user SET status = %s WHERE id = %s", (new_status, user_id))
        conn.commit()
        return jsonify({'message': '상태가 업데이트되었습니다.'}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({'message': '토큰이 만료되었습니다.'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': '유효하지 않은 토큰입니다.'}), 401
    except Exception as e:
        print(f"상태 업데이트 오류: {e}")
        return jsonify({'message': '상태 업데이트 오류'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

# 유저 생성 API (관리자용)
@user_bp.route('/add_user', methods=['POST', 'OPTIONS'])
def create_user():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'}), 200

    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': '토큰이 없습니다.'}), 401
    token = token.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        created_by = payload.get('name', 'SYSTEM')
    except jwt.ExpiredSignatureError:
        return jsonify({'message': '토큰이 만료되었습니다.'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': '유효하지 않은 토큰입니다.'}), 401
    except Exception as e:
        return jsonify({'message': '토큰 검증 오류'}), 401

    data = request.get_json() or {}
    # 필수 항목 확인
    required_fields = ['email', 'username', 'position', 'department', 'phone', 'password', 'role_id']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'message': f'{field} 필드가 누락되었습니다.'}), 400

    # 암호화
    email = encrypt_deterministic(data.get('email'))
    name = data.get('username')
    position = data.get('position')
    department = data.get('department')
    phone = encrypt_aes(data.get('phone'))
    password = data.get('password')
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    role_id = data.get('role_id')
    # status와 first_login_yn은 선택 사항 (미제공시 기본값 사용)
    status = data.get('status')  # 예: null 혹은 '휴가', '파견' 등
    first_login_yn = data.get('first_login_yn', 'N')

    conn = get_db_connection()
    if conn is None:
        return jsonify({'message': '데이터베이스 연결 실패!'}), 500
    cursor = conn.cursor()
    try:
        # 이미 사용중인 이메일 확인
        cursor.execute("SELECT * FROM tb_user WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({'message': '이미 사용 중인 이메일입니다.'}), 400

        sql = """
        INSERT INTO tb_user 
        (name, position, department, email, phone_number, password, role_id, status, first_login_yn, created_at, updated_at, created_by, updated_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW(), %s, %s)
        """
        values = (name, position, department, email, phone, hashed_password, role_id, status, first_login_yn, created_by, created_by)
        cursor.execute(sql, values)
        conn.commit()
        return jsonify({'message': '유저 생성 성공!'}), 201
    except Exception as e:
        conn.rollback()
        print(f"유저 생성 오류: {e}")
        return jsonify({'message': f'유저 생성 중 오류 발생: {e}'}), 500
    finally:
        cursor.close()
        conn.close()


# 유저 정보 수정 API (날짜 관련 컬럼 제외)
@user_bp.route('/update_user', methods=['PUT', 'OPTIONS'])
def update_user():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'}), 200

    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': '토큰이 없습니다.'}), 401
    token = token.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        updated_by = payload.get('name', 'SYSTEM')
    except jwt.ExpiredSignatureError:
        return jsonify({'message': '토큰이 만료되었습니다.'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': '유효하지 않은 토큰입니다.'}), 401
    except Exception as e:
        return jsonify({'message': '토큰 검증 오류'}), 401

    data = request.get_json() or {}
    if not data.get('id'):
        return jsonify({'message': '유저 id가 제공되지 않았습니다.'}), 400
    user_id = data.get('id')

    fields = []
    values = []
    if 'username' in data:
        fields.append("name = %s")
        values.append(data['username'])
    if 'position' in data:
        fields.append("position = %s")
        values.append(data['position'])
    if 'department' in data:
        fields.append("department = %s")
        values.append(data['department'])
    if 'email' in data:
        fields.append("email = %s")
        values.append(encrypt_deterministic(data['email']))
    if 'phone' in data:
        fields.append("phone_number = %s")
        values.append(encrypt_aes(data['phone']))
    if 'password' in data:
        new_pass = data['password']
        hashed_password = bcrypt.generate_password_hash(new_pass).decode('utf-8')
        fields.append("password = %s")
        values.append(hashed_password)
    if 'role_id' in data:
        fields.append("role_id = %s")
        values.append(data['role_id'])
    if 'status' in data:
        fields.append("status = %s")
        values.append(data['status'])
    if 'first_login_yn' in data:
        fields.append("first_login_yn = %s")
        values.append(data['first_login_yn'])

    if not fields:
        return jsonify({'message': '수정할 필드가 제공되지 않았습니다.'}), 400

    fields.append("updated_by = %s")
    values.append(updated_by)
    values.append(user_id)

    set_clause = ", ".join(fields)

    conn = get_db_connection()
    if conn is None:
        return jsonify({'message': '데이터베이스 연결 실패!'}), 500
    cursor = conn.cursor()
    try:
        sql = f"UPDATE tb_user SET {set_clause} WHERE id = %s AND is_delete_yn = 'N'"
        cursor.execute(sql, tuple(values))
        conn.commit()
        return jsonify({'message': '유저 정보가 업데이트되었습니다.'}), 200
    except Exception as e:
        conn.rollback()
        print(f"유저 정보 업데이트 오류: {e}")
        return jsonify({'message': f'유저 정보 업데이트 오류: {e}'}), 500
    finally:
        cursor.close()
        conn.close()


# 유저 삭제 API (논리 삭제)
@user_bp.route('/delete_user/<int:user_id>', methods=['DELETE', 'OPTIONS'])
def delete_user(user_id):
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'}), 200

    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': '토큰이 없습니다.'}), 401
    token = token.split(" ")[1]
    try:
        jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return jsonify({'message': '토큰이 만료되었습니다.'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': '유효하지 않은 토큰입니다.'}), 401
    except Exception as e:
        return jsonify({'message': '토큰 검증 오류'}), 401

    conn = get_db_connection()
    if conn is None:
        return jsonify({'message': '데이터베이스 연결 실패!'}), 500
    cursor = conn.cursor()
    try:
        sql = "UPDATE tb_user SET is_delete_yn = 'Y' WHERE id = %s"
        cursor.execute(sql, (user_id,))
        conn.commit()
        return jsonify({'message': '유저가 삭제되었습니다.'}), 200
    except Exception as e:
        conn.rollback()
        print(f"유저 삭제 오류: {e}")
        return jsonify({'message': f'유저 삭제 오류: {e}'}), 500
    finally:
        cursor.close()
        conn.close()