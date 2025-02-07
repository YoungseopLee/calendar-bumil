# blueprints/user.py
from flask import Blueprint, request, jsonify
import jwt
from db import get_db_connection
from config import SECRET_KEY

user_bp = Blueprint('user', __name__, url_prefix='/user')

@user_bp.route('/get_pending_users', methods=['GET', 'OPTIONS'])
def get_pending_users():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'})
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, name, position, department, email, phone_number FROM User WHERE is_approved = 0")
        pending_users = cursor.fetchall()
        return jsonify({'users': pending_users}), 200
    except Exception as e:
        print(f"승인 대기 사용자 목록 가져오기 오류: {e}")
        return jsonify({'message': '승인 대기 사용자 목록 가져오기 오류'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

@user_bp.route('/approve_user', methods=['POST', 'OPTIONS'])
def approve_user():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'}), 200
    try:
        data = request.get_json()
        user_id = data.get('userId')
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor()
        cursor.execute("UPDATE User SET is_approved = 1 WHERE id = %s", (user_id,))
        conn.commit()
        return jsonify({'message': '사용자가 승인되었습니다.'}), 200
    except Exception as e:
        print(f"사용자 승인 오류: {e}")
        return jsonify({'message': '사용자 승인 오류'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

@user_bp.route('/reject_user', methods=['POST', 'OPTIONS'])
def reject_user():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'}), 200
    try:
        data = request.get_json()
        user_id = data.get('userId')
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor()
        cursor.execute("DELETE FROM User WHERE id = %s", (user_id,))
        conn.commit()
        return jsonify({'message': '사용자가 거절되었습니다.'}), 200
    except Exception as e:
        print(f"사용자 거절 오류: {e}")
        return jsonify({'message': '사용자 거절 오류'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

@user_bp.route('/get_users', methods=['GET'])
def get_users():
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, name, position, department, email, phone_number, is_approved, COALESCE(status, '출근') AS status
            FROM User
        """)
        users = cursor.fetchall()
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
        query = f"SELECT id, COALESCE(status, '출근') AS status FROM User WHERE id IN ({format_strings})"
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
        valid_statuses = ['출근', '외근', '파견', '휴가']
        if new_status not in valid_statuses:
            return jsonify({'message': '유효하지 않은 상태 값입니다.'}), 400
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor()
        cursor.execute("UPDATE User SET status = %s WHERE id = %s", (new_status, user_id))
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
