from flask import Blueprint, request, jsonify
import jwt
from db import get_db_connection
from config import SECRET_KEY
from .auth import decrypt_aes, decrypt_deterministic, encrypt_deterministic

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
            SELECT id, name, position, department, phone_number, role_id, status, first_login_yn 
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

# user_id로 tb_user 테이블 조회
@user_bp.route('/get_user', methods=['GET', 'OPTIONS'])
def get_user():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'})
    
    # 쿼리 스트링에서 평문 user_id를 전달받음
    user_id_plain = request.args.get('user_id')
    if not user_id_plain:
        return jsonify({'message': 'user_id 파라미터가 제공되지 않았습니다.'}), 400

    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor(dictionary=True)
        
        # 평문 user_id를 암호화하여 DB 조회 조건으로 사용
        encrypted_user_id = encrypt_deterministic(user_id_plain)
        
        sql = """
            SELECT id, name, position, department, phone_number, role_id, status, is_delete_yn, first_login_yn
            FROM tb_user
            WHERE id = %s AND is_delete_yn = 'N'
        """
        cursor.execute(sql, (encrypted_user_id,))
        user_info = cursor.fetchone()
        if not user_info:
            return jsonify({'message': '사용자 정보를 찾을 수 없습니다.'}), 404

        # 복호화 처리
        user_info['id'] = decrypt_deterministic(user_info['id'])
        user_info['phone_number'] = decrypt_aes(user_info['phone_number'])
        
        return jsonify({'user': user_info}), 200

    except Exception as e:
        print(f"사용자 조회 오류: {e}")
        return jsonify({'message': '사용자 조회 오류'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass