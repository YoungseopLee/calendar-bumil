from flask import Blueprint, request, jsonify
import jwt
from db import get_db_connection
from .auth import encrypt_deterministic
from config import SECRET_KEY

status_bp = Blueprint('status', __name__, url_prefix='/status')

# 전체 상태 목록 조회
@status_bp.route('/get_all_status', methods=['GET', 'OPTIONS'])
def get_all_status():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'}), 200
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, comment FROM tb_status")
        statuses = cursor.fetchall()
        return jsonify({'statuses': statuses}), 200
    except Exception as e:
        print(f"상태 목록 조회 오류: {e}")
        return jsonify({'message': '상태 목록 조회 오류'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

@status_bp.route('/get_status_list', methods=['GET', 'OPTIONS'])
def get_status_list():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'})
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, comment FROM tb_status")
        statuses = cursor.fetchall()
        return jsonify({'statuses': statuses}), 200
    except Exception as e:
        print(f"상태 목록 조회 오류: {e}")
        return jsonify({'message': '상태 목록 조회 오류'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

# 특정 사용자들의 상태 조회
@status_bp.route('/get_users_status', methods=['POST', 'OPTIONS'])
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

# 상태 목록 추가
@status_bp.route('/add_status', methods=['POST', 'OPTIONS'])
def add_status():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'})
    data = request.get_json()
    new_status = data.get('status')
    comment = data.get('comment', '')
    if not new_status:
        return jsonify({'message': '상태 ID가 제공되지 않았습니다.'}), 400
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor()
        cursor.execute("INSERT INTO tb_status (id, comment) VALUES (%s, %s)", (new_status, comment))
        conn.commit()
        return jsonify({'message': '상태가 추가되었습니다.'}), 201
    except Exception as e:
        print(f"상태 추가 오류: {e}")
        return jsonify({'message': '상태 추가 오류'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

# 상태 목록 삭제
@status_bp.route('/delete_status/<string:status>', methods=['DELETE', 'OPTIONS'])
def delete_status(status):
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'})
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor()
        cursor.execute("DELETE FROM tb_status WHERE id = %s", (status,))
        conn.commit()
        return jsonify({'message': '상태가 삭제되었습니다.'}), 200
    except Exception as e:
        print(f"상태 삭제 오류: {e}")
        return jsonify({'message': '상태 삭제 오류'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

# 유저 상태 업데이트
@status_bp.route('/update_status', methods=['PUT', 'OPTIONS'])
def update_status():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'}), 200

    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': '토큰이 없습니다.'}), 401
    token = token.split(" ")[1]

    try:
        # 토큰 디코딩: payload에 user_id와 role_id가 포함되어 있다고 가정
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        requester_user_id = payload['user_id']
        requester_role = payload.get('role_id')
        
        # payload에 role_id가 없으면 DB에서 조회
        if not requester_role:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT role_id FROM tb_user WHERE id = %s", (requester_user_id,))
            result = cursor.fetchone()
            requester_role = result.get('role_id') if result else None
            cursor.close()
            conn.close()
        
        data = request.get_json()
        new_status = data.get('status')

        # 변경 대상 사용자 ID (관리자는 요청 본문에 user_id를 보낼 수 있음)
        # 일반 사용자는 자신의 상태만 변경할 수 있음.
        target_user_id = data.get('user_id', requester_user_id)
        if requester_role != "AD_ADMIN" and target_user_id != requester_user_id:
            return jsonify({'message': '자신의 상태만 업데이트할 수 있습니다.'}), 403

        # 빈 문자열이면 None으로 처리 (상태 삭제)
        if new_status is None or new_status.strip() == '':
            new_status = None

        encrypted_target_user_id = encrypt_deterministic(target_user_id)

        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor()
        cursor.execute("UPDATE tb_user SET status = %s WHERE id = %s", (new_status, encrypted_target_user_id))
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
