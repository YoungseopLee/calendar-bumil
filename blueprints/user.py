from flask import Blueprint, request, jsonify
import jwt
from db import get_db_connection
from config import SECRET_KEY
from .auth import decrypt_aes, decrypt_deterministic

user_bp = Blueprint('user', __name__, url_prefix='/user')

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
            SELECT id, name, position, department, phone_number 
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
            SELECT id, name, position, department, phone_number, status, first_login_yn 
            FROM tb_user 
            WHERE is_delete_yn = 'n'
        """)
        users = cursor.fetchall()
        for user in users:
            try:
                # 사용자 ID도 복호화하여 평문으로 변경
                user['id'] = decrypt_deterministic(user['id'])
                user['phone_number'] = decrypt_aes(user['phone_number'])
            except Exception as e:
                print(f"복호화 오류 (user id {user['id']}): {e}")
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

# 특정 사용자의 user_id를 사용해 tb_user 정보 및 tb_project_user 정보를 불러오는 api 추가 필요
# @user_bp.route('/get_pending_users', methods=['GET', 'OPTIONS'])
# def get_pending_users():
#     if request.method == 'OPTIONS':
#         return jsonify({'message': 'CORS preflight request success'})
#     try:
#         conn = get_db_connection()
#         if conn is None:
#             return jsonify({'message': '데이터베이스 연결 실패!'}), 500
#         cursor = conn.cursor(dictionary=True)
#         cursor.execute("""
#             SELECT id, name, position, department, phone_number 
#             FROM tb_user 
#             WHERE first_login_yn = 'n' AND is_delete_yn = 'n'
#         """)
#         pending_users = cursor.fetchall()
#         return jsonify({'users': pending_users}), 200
#     except Exception as e:
#         print(f"미승인 사용자 목록 가져오기 오류: {e}")
#         return jsonify({'message': '미승인 사용자 목록 가져오기 오류'}), 500
#     finally:
#         try:
#             cursor.close()
#             conn.close()
#         except Exception:
#             pass