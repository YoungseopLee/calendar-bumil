from flask import Blueprint, request, jsonify
from db import get_db_connection
from datetime import datetime, timezone
from config import SECRET_KEY
from blueprints.auth import verify_and_refresh_token
import logging, jwt

inquiry_bp = Blueprint('inquiry', __name__, url_prefix='/inquiry')
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# 문의사항 전체 조회
@inquiry_bp.route('/get_all_inquiries', methods=['GET', 'OPTIONS'])
def get_inquiries():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'})

    user_id, user_name, role_id, new_access_token, error_response, status_code = verify_and_refresh_token(request)
    if error_response:
        return error_response, status_code

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        sql = """
        SELECT * FROM tb_inquiry
        WHERE user_id = %s AND is_delete_yn = 'N'
        ORDER BY created_at DESC"""
        cursor.execute(sql, (user_id,))
        result = cursor.fetchall()
        logger.info(f"[SQL/SELECT] {sql} | PARAMS: ({user_id})")
        response = jsonify({'inquiries': result})
        if new_access_token:
            response.headers["X-New-Access-Token"] = new_access_token
        return response
    finally:
        cursor.close()
        conn.close()

# 특정 문의사항 조회
@inquiry_bp.route('/get_inquiry/<int:inquiry_id>', methods=['GET', 'OPTIONS'])
def get_inquiry(inquiry_id):
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'})

    user_id, user_name, role_id, new_access_token, error_response, status_code = verify_and_refresh_token(request)
    if error_response:
        return error_response, status_code

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        sql = """
        SELECT * FROM tb_inquiry
        WHERE id = %s AND user_id = %s AND is_delete_yn = 'N'"""
        cursor.execute(sql, (inquiry_id, user_id))
        inquiry = cursor.fetchone()
        logger.info(f"[SQL/SELECT] {sql} | PARAMS: ({inquiry_id}, {user_id})")
        if not inquiry:
            return jsonify({'message': '해당 문의사항을 찾을 수 없습니다.'}), 404

        response = jsonify({'inquiry': inquiry})
        if new_access_token:
            response.headers["X-New-Access-Token"] = new_access_token
        return response
    finally:
        cursor.close()
        conn.close()

# (유저) 문의사항 생성
@inquiry_bp.route('/add_inquiry', methods=['POST', 'OPTIONS'])
def create_inquiry():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'})

    # 토큰 검증 및 자동 갱신 처리
    user_id, user_name, role_id, new_access_token, error_response, status_code = verify_and_refresh_token(request)
    if error_response:
        return error_response, status_code

    if user_id is None:
        return jsonify({'message': '토큰 인증 실패'}), 401

    data = request.get_json()
    title = data.get('title')
    content = data.get('content')
    private_yn = data.get('private_yn', 'N')

    if not title or not content:
        return jsonify({'message': '제목과 내용을 입력해주세요.'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        sql = """
        INSERT INTO tb_inquiry (title, content, user_id, created_by, private_yn)
        VALUES (%s, %s, %s, %s, %s)"""
        cursor.execute(sql, (title, content, user_id, user_name, private_yn))
        conn.commit()
        logger.info(f"[SQL/INSERT] {sql} | PARAMS: ({title}, {content}, {user_id}, {user_name}, {private_yn})")

        response = jsonify({'message': '문의가 등록되었습니다.'})
        if new_access_token:
            response.headers["X-New-Access-Token"] = new_access_token
        return response, 201
    except Exception as e:
        logger.error(f"[ERROR] 문의 등록 실패: {str(e)}")
        return jsonify({'message': f'문의 등록 실패: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

# (유저) 문의사항 수정
@inquiry_bp.route('/update_inquiry/<int:inquiry_id>', methods=['PUT', 'OPTIONS'])
def update_inquiry(inquiry_id):
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'})

    user_id, user_name, role_id, new_access_token, error_response, status_code = verify_and_refresh_token(request)
    if error_response:
        return error_response, status_code

    data = request.get_json()
    title = data.get('title')
    content = data.get('content')
    private_yn = data.get('private_yn', 'N')

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        sql_check = "SELECT user_id FROM tb_inquiry WHERE id = %s AND is_delete_yn = 'N'"
        cursor.execute(sql_check, (inquiry_id,))
        row = cursor.fetchone()
        if not row or row['user_id'] != user_id:
            return jsonify({'message': '수정 권한이 없습니다.'}), 403

        sql = """
        UPDATE tb_inquiry
        SET title = %s, content = %s, private_yn = %s, updated_by = %s
        WHERE id = %s"""
        cursor.execute(sql, (title, content, private_yn, user_name, inquiry_id))
        conn.commit()
        logger.info(f"[SQL/UPDATE] {sql} | PARAMS: ({title}, {content}, {private_yn}, {user_name})")
        response = jsonify({'message': '문의사항이 수정되었습니다.'})
        if new_access_token:
            response.headers["X-New-Access-Token"] = new_access_token
        return response
    finally:
        cursor.close()
        conn.close()

# 문의사항 삭제 (논리 삭제)
@inquiry_bp.route('/delete_inquiry/<int:inquiry_id>', methods=['DELETE', 'OPTIONS'])
def delete_inquiry(inquiry_id):
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'})

    user_id, user_name, role_id, new_access_token, error_response, status_code = verify_and_refresh_token(request)
    if error_response:
        return error_response, status_code

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        sql_check = """
        SELECT user_id FROM tb_inquiry 
        WHERE id = %s AND is_delete_yn = 'N'"""
        cursor.execute(sql_check, (inquiry_id,))
        row = cursor.fetchone()
        if not row or row['user_id'] != user_id:
            return jsonify({'message': '삭제 권한이 없습니다.'}), 403

        sql = """
        UPDATE tb_inquiry
        SET is_delete_yn = 'Y', updated_by = %s
        WHERE id = %s"""
        cursor.execute(sql, (user_name, inquiry_id))
        conn.commit()
        logger.info(f"[SQL/DELETE] {sql} | PARAMS: ({user_name}, {inquiry_id})")
        response = jsonify({'message': '문의사항이 삭제되었습니다.'})
        if new_access_token:
            response.headers["X-New-Access-Token"] = new_access_token
        return response
    finally:
        cursor.close()
        conn.close()

# (관리자) 답변 등록 및 수정
@inquiry_bp.route('/respond_inquiry/<int:inquiry_id>', methods=['PUT', 'OPTIONS'])
def respond_inquiry(inquiry_id):
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'})

    user_id, user_name, role_id, new_access_token, error_response, status_code = verify_and_refresh_token(request)
    if error_response:
        return error_response, status_code

    if role_id != 'AD_ADMIN':
        return jsonify({'message': '관리자만 답변할 수 있습니다.'}), 403

    data = request.get_json()
    response_content = data.get('response_content')

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        sql = """
        UPDATE tb_inquiry
        SET response_content = %s,
            response_by = %s,
            response_at = NOW(3),
            status = '답변완료',
            updated_by = %s
        WHERE id = %s AND is_delete_yn = 'N'"""
        cursor.execute(sql, (response_content, user_name, user_name, inquiry_id))
        conn.commit()
        logger.info(f"[SQL/RESPONSE] {sql} | PARAMS: ({user_name}, {inquiry_id})")
        response = jsonify({'message': '답변이 등록되었습니다.'})
        if new_access_token:
            response.headers["X-New-Access-Token"] = new_access_token
        return response
    finally:
        cursor.close()
        conn.close()



