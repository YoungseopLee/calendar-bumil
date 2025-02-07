# blueprints/auth.py
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import jwt
from datetime import datetime, timedelta, timezone
from db import get_db_connection
from config import SECRET_KEY

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'}), 200
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM User WHERE email = %s", (email,))
        user = cursor.fetchone()
        if user:
            if password == user['password']:
                if user['is_approved'] == 1:
                    payload = {
                        'user_id': user['id'],
                        'name': user['name'],
                        'email': user['email'],
                        'exp': datetime.now(timezone.utc) + timedelta(hours=1)
                    }
                    token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
                    return jsonify({
                        'message': '로그인 성공!',
                        'user': {
                            'id': user['id'],
                            'name': user['name'],
                            'position': user['position'],
                            'department': user['department'],
                            'email': user['email'],
                            'phone_number': user['phone_number'],
                            'is_admin': user['is_admin'],
                            'is_approved': user['is_approved']
                        },
                        'token': token
                    }), 200
                else:
                    return jsonify({'message': '승인 대기 중입니다!'}), 403
            else:
                return jsonify({'message': '잘못된 비밀번호!'}), 401
        else:
            return jsonify({'message': '사용자를 찾을 수 없습니다!'}), 404
    except Exception as e:
        print(f"로그인 중 오류 발생: {e}")
        return jsonify({'message': '로그인 실패!'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

@auth_bp.route('/signup', methods=['POST', 'OPTIONS'])
def signup():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'}), 200
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        username = data.get('username')
        rank = data.get('rank')
        department = data.get('department')
        phone = data.get('phone')
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM User WHERE email = %s", (email,))
        existing_user = cursor.fetchone()
        if existing_user:
            return jsonify({'message': '이미 사용 중인 이메일입니다.'}), 400
        
        sql = """
        INSERT INTO User (name, position, department, email, phone_number, password)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        values = (username, rank, department, email, phone, password)
        cursor.execute(sql, values)
        conn.commit()
        return jsonify({'message': '회원가입 성공!'}), 201
    except Exception as e:
        print(f"회원가입 오류: {e}")
        return jsonify({'message': f'오류: {e}'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

@auth_bp.route('/get_logged_in_user', methods=['GET', 'OPTIONS'])
@cross_origin(supports_credentials=True)
def get_logged_in_user():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'}), 200
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': '토큰이 없습니다.'}), 401
    token = token.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_id = payload['user_id']
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM User WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        if user:
            return jsonify({'user': user}), 200
        else:
            return jsonify({'message': '사용자 정보를 찾을 수 없습니다.'}), 404
    except jwt.ExpiredSignatureError:
        return jsonify({'message': '토큰이 만료되었습니다.'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': '유효하지 않은 토큰입니다.'}), 401
    except Exception as e:
        print(f"토큰 검증 오류: {e}")
        return jsonify({'message': '사용자 정보 조회 실패'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass
