# blueprints/favorite.py
from flask import Blueprint, request, jsonify
from db import get_db_connection

favorite_bp = Blueprint('favorite', __name__, url_prefix='/favorite')

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
        cursor.execute("SELECT * FROM Favorite WHERE user_id = %s AND favorite_user_id = %s", (user_id, favorite_user_id))
        favorite = cursor.fetchone()
        if favorite:
            cursor.execute("DELETE FROM Favorite WHERE user_id = %s AND favorite_user_id = %s", (user_id, favorite_user_id))
            conn.commit()
            response_message = '즐겨찾기가 삭제되었습니다.'
        else:
            cursor.execute("INSERT INTO Favorite (user_id, favorite_user_id) VALUES (%s, %s)", (user_id, favorite_user_id))
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
def get_favorite():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'})
    try:
        user_id = request.args.get('user_id')
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor(dictionary=True)
        sql = """
        SELECT u.id, u.name, u.position, u.department, u.email, u.phone_number,
        COALESCE(u.status, '출근') AS status
        FROM Favorite f
        JOIN User u ON f.favorite_user_id = u.id
        WHERE f.user_id = %s
        """
        cursor.execute(sql, (user_id,))
        favorite = cursor.fetchall()
        return jsonify({'favorite': favorite}), 200
    except Exception as e:
        print(f"즐겨찾기 목록 조회 오류: {e}")
        return jsonify({'message': '즐겨찾기 목록 조회 오류'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass
