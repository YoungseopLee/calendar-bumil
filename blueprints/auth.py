from flask import Blueprint, request, jsonify
from flask_bcrypt import Bcrypt
from flask_cors import cross_origin
import jwt
from datetime import datetime, timedelta, timezone
from db import get_db_connection
from config import SECRET_KEY
from Cryptodome.Cipher import AES
import base64
import os

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')
bcrypt = Bcrypt()

# AES 키 (정확히 32 바이트로 설정)
AES_KEY = os.environ.get("AES_SECRET_KEY", "Bumil-calendar-1234567890!@#$%^&*").ljust(32)[:32]
BLOCK_SIZE = AES.block_size  # 16

def pad(data_bytes: bytes) -> bytes:
    """바이트 데이터를 AES CBC 모드에 맞게 PKCS7 패딩 적용"""
    padding_length = BLOCK_SIZE - len(data_bytes) % BLOCK_SIZE
    return data_bytes + bytes([padding_length]) * padding_length

def unpad(data_bytes: bytes) -> bytes:
    """PKCS7 패딩 제거"""
    padding_length = data_bytes[-1]
    return data_bytes[:-padding_length]

def encrypt_aes(data: str) -> str:
    """AES 암호화 (CBC 모드, 바이트 단위 패딩 적용)"""
    iv = os.urandom(BLOCK_SIZE)  # 초기화 벡터 생성 (16바이트)
    cipher = AES.new(AES_KEY.encode('utf-8'), AES.MODE_CBC, iv)
    data_bytes = data.encode('utf-8')
    padded_data = pad(data_bytes)
    encrypted = cipher.encrypt(padded_data)
    return base64.b64encode(iv + encrypted).decode('utf-8')

def decrypt_aes(encrypted_data: str) -> str:
    """AES 복호화 (CBC 모드, 바이트 단위 언패딩 적용)"""
    raw_data = base64.b64decode(encrypted_data)
    iv = raw_data[:BLOCK_SIZE]
    cipher = AES.new(AES_KEY.encode('utf-8'), AES.MODE_CBC, iv)
    decrypted_bytes = cipher.decrypt(raw_data[BLOCK_SIZE:])
    unpadded_bytes = unpad(decrypted_bytes)
    return unpadded_bytes.decode('utf-8')

def encrypt_deterministic(data: str) -> str:
    fixed_iv = b'\x00' * BLOCK_SIZE  # 16바이트의 고정 IV
    cipher = AES.new(AES_KEY.encode('utf-8'), AES.MODE_CBC, fixed_iv)
    data_bytes = data.encode('utf-8')
    padded_data = pad(data_bytes)
    encrypted = cipher.encrypt(padded_data)
    return base64.b64encode(encrypted).decode('utf-8')

def decrypt_deterministic(encrypted_data: str) -> str:
    fixed_iv = b'\x00' * BLOCK_SIZE  # 암호화에 사용된 고정 IV
    cipher = AES.new(AES_KEY.encode('utf-8'), AES.MODE_CBC, fixed_iv)
    encrypted_bytes = base64.b64decode(encrypted_data)
    decrypted_bytes = cipher.decrypt(encrypted_bytes)
    unpadded_bytes = unpad(decrypted_bytes)
    return unpadded_bytes.decode('utf-8')

# 회원가입 (AES 암호화 적용)
@auth_bp.route('/signup', methods=['POST', 'OPTIONS'])
@cross_origin(supports_credentials=True)
def signup():
    conn = None
    try:
        data = request.get_json() or {}
        print("회원가입 요청 데이터:", data)
        # 필수 항목 확인
        if not data.get('email') or not data.get('username') or not data.get('position') or not data.get('department') or not data.get('phone'):
            return jsonify({'message': '필수 항목이 누락되었습니다.'}), 400

        # 이메일은 결정적 암호화 (검색용)
        email = encrypt_deterministic(data.get('email'))
        name = data.get('username')
        position = data.get('position')
        department = data.get('department')
        phone = encrypt_aes(data.get('phone'))
        password = data.get('password')

        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500

        cursor = conn.cursor()
        # 새 DB에서는 테이블명이 tb_user임
        cursor.execute("SELECT * FROM tb_user WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({'message': '이미 사용 중인 이메일입니다.'}), 400

        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        # 기본 역할(role_id): 일반 사용자 = 3
        # 상태는 '출근', 삭제 플래그는 'n', 첫 로그인 여부는 'y'
        # 생성일, 수정일은 NOW(), 생성자 및 수정자는 생략(또는 'SYSTEM' 대신 null)
        sql = """
        INSERT INTO tb_user 
        (name, position, department, email, phone_number, password, role_id, status, is_delete_yn, first_login_yn, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, '출근', 'n', 'y', NOW(), NOW())
        """
        default_role_id = 3  # 0: admin, 1: project admin, 2: project manager, 3: user
        values = (name, position, department, email, phone, hashed_password, default_role_id)
        cursor.execute(sql, values)
        conn.commit()
        return jsonify({'message': '회원가입 성공!'}), 201
    except Exception as e:
        print(f"회원가입 오류: {e}")
        return jsonify({'message': f'오류: {e}'}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if conn is not None:
            conn.close()

@auth_bp.route('/login', methods=['POST', 'OPTIONS'])
@cross_origin(supports_credentials=True)
def login():
    conn = None
    cursor = None
    try:
        if request.method == 'OPTIONS':
            return jsonify({'message': 'CORS preflight request success'}), 200

        data = request.get_json() or {}
        if not data.get('email') or not data.get('password'):
            return jsonify({'message': '이메일과 비밀번호는 필수입니다.'}), 400

        # 이메일은 결정적 암호화를 사용하여 암호문 생성
        encrypted_email = encrypt_deterministic(data.get('email'))
        password = data.get('password')

        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500

        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM tb_user WHERE email = %s", (encrypted_email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({'message': '사용자를 찾을 수 없습니다!'}), 404

        if not bcrypt.check_password_hash(user['password'], password):
            return jsonify({'message': '잘못된 비밀번호!'}), 401

        # JWT 생성
        payload = {
            'user_id': user['id'],
            'name': user['name'],
            'exp': datetime.now(timezone.utc) + timedelta(hours=1)
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')

        user_data = {
            'id': user['id'],
            'name': user['name'],
            'position': user['position'],
            'department': user['department'],
            'email': decrypt_deterministic(user['email']),
            'phone_number': decrypt_aes(user['phone_number']),
            'status': user.get('status', '출근'),
            'first_login_yn': user.get('first_login_yn', 'y')
        }

        return jsonify({'message': '로그인 성공!', 'user': user_data, 'token': token}), 200

    except Exception as e:
        print(f"로그인 중 오류 발생: {e}")
        return jsonify({'message': '로그인 실패!'}), 500
    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None:
            conn.close()

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
        cursor.execute("SELECT * FROM tb_user WHERE id = %s", (user_id,))
        user = cursor.fetchone()

        if user:
            try:
                user['email'] = decrypt_deterministic(user['email'])
                user['name'] = user['name']
                user['phone_number'] = decrypt_aes(user['phone_number'])
            except Exception as decryption_error:
                print(f"복호화 오류: {decryption_error}")
                return jsonify({'message': '사용자 정보 복호화 실패'}), 500

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
