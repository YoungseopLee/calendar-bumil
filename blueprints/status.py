from flask import Blueprint, request, jsonify
import jwt
from db import get_db_connection
from config import SECRET_KEY

status_bp = Blueprint('status', __name__, url_prefix='/status')

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
    token = token.split(" ")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_id = payload['user_id']
        data = request.get_json()
        new_status = data.get('status')

        # 만약 빈 문자열이면 None으로 처리 (상태 삭제)
        if new_status is None or new_status.strip() == '':
            new_status = None

        # 검증을 생략하거나 tb_status 테이블에서 존재하는지 추가 검증 가능
        # 예를 들어:
        # conn = get_db_connection()
        # cursor = conn.cursor()
        # cursor.execute("SELECT id FROM tb_status WHERE id = %s", (new_status,))
        # if not cursor.fetchone():
        #     return jsonify({'message': '유효하지 않은 상태 값입니다.'}), 400
        # cursor.close()
        # conn.close()

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
