from flask import Blueprint, request, jsonify
from db import get_db_connection
from Cryptodome.Cipher import AES
from .auth import decrypt_aes, decrypt_deterministic
import os

favorite_bp = Blueprint('favorite', __name__, url_prefix='/favorite')

# AES 키 (정확히 32 바이트로 설정)
AES_KEY = os.environ.get("AES_SECRET_KEY", "Bumil-calendar-1234567890!@#$%^&*").ljust(32)[:32]
BLOCK_SIZE = AES.block_size  # 16

@favorite_bp.route('/toggle_favorite', methods=['POST', 'OPTIONS'])
def toggle_favorite():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'})
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        favorite_user_id = data.get('favorite_user_id')
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor()
        # tb_favorite 테이블에서 즐겨찾기 여부 확인
        cursor.execute(
            "SELECT * FROM tb_favorite WHERE user_id = %s AND favorite_user_id = %s",
            (user_id, favorite_user_id)
        )
        favorite = cursor.fetchone()
        if favorite:
            # 이미 즐겨찾기 상태면 삭제 (즐겨찾기 해제)
            cursor.execute(
                "DELETE FROM tb_favorite WHERE user_id = %s AND favorite_user_id = %s",
                (user_id, favorite_user_id)
            )
            conn.commit()
            response_message = '즐겨찾기가 삭제되었습니다.'
        else:
            # 즐겨찾기 상태가 아니면 새로 추가
            cursor.execute(
                "INSERT INTO tb_favorite (user_id, favorite_user_id, is_favorite_yn) VALUES (%s, %s, 'y')",
                (user_id, favorite_user_id)
            )
            conn.commit()
            response_message = '즐겨찾기가 추가되었습니다.'
        return jsonify({'message': response_message}), 200
    except Exception as e:
        print(f"즐겨찾기 오류: {e}")
        return jsonify({'message': f'오류: {e}'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

@favorite_bp.route('/get_favorites', methods=['GET', 'OPTIONS'])
def get_favorites():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'})
    try:
        user_id = request.args.get('user_id')
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor(dictionary=True)
        # tb_favorite와 tb_user를 조인
        sql = """
        SELECT u.id, u.name, u.position, u.department, u.email, u.phone_number,
              COALESCE(u.status, '출근') AS status
        FROM tb_favorite f
        JOIN tb_user u ON f.favorite_user_id = u.id
        WHERE f.user_id = %s
        """
        cursor.execute(sql, (user_id,))
        favorites = cursor.fetchall()

        for fav in favorites:
            try:
                fav['email'] = decrypt_deterministic(fav['email'])
                fav['phone_number'] = decrypt_aes(fav['phone_number'])
            except Exception as decryption_error:
                print(f"복호화 오류: {decryption_error}")
                return jsonify({'message': '사용자 정보 복호화 실패'}), 500

        return jsonify({'favorite': favorites}), 200
    except Exception as e:
        print(f"즐겨찾기 목록 조회 오류: {e}")
        return jsonify({'message': '즐겨찾기 목록 조회 오류'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass
