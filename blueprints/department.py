from flask import Blueprint, request, jsonify
import jwt, logging
from db import get_db_connection
from config import SECRET_KEY
from datetime import datetime
from blueprints.auth import verify_and_refresh_token

department_bp = Blueprint('department', __name__, url_prefix='/department')
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# 부서 목록 조회
@department_bp.route('/get_department_list', methods=['GET', 'OPTIONS'])
def get_department_list():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'})
    
    # verify_and_refresh_token 사용하여 토큰 검증 및 자동 갱신
    user_id, user_name, role_id, new_access_token, error_response, status_code = verify_and_refresh_token(request)
    if error_response:
        return error_response, status_code  # 자동 토큰 갱신 응답 반환
    
    if user_id is None:
        return jsonify({'message': '토큰 인증 실패'}), 401

    conn = get_db_connection()
    if conn is None:
        return jsonify({'message': '데이터베이스 연결 실패!'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        sql = "SELECT * FROM tb_department ORDER BY dpr_nm desc"
        cursor.execute(sql)
        departments = cursor.fetchall()
        logger.info(f"[SQL/SELECT] {sql})")
        
        response = jsonify({'departments': departments})
        if new_access_token:
            response.headers["X-New-Access-Token"] = new_access_token
        return response, 200
    except Exception as e:
        return jsonify({'message': f'부서 목록 조회 실패: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

# 특정 부서 조회
@department_bp.route('/get_department/<string:dpr_id>', methods=['GET', 'OPTIONS'])
def get_department(dpr_id):
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'})
    
    # verify_and_refresh_token 사용하여 토큰 검증 및 자동 갱신
    user_id, user_name, role_id, new_access_token, error_response, status_code = verify_and_refresh_token(request)
    if error_response:
        return error_response, status_code  # 자동 토큰 갱신 응답 반환
    
    if user_id is None:
        return jsonify({'message': '토큰 인증 실패'}), 401
    
    conn = get_db_connection()
    if conn is None:
        return jsonify({'message': '데이터베이스 연결 실패!'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        sql = "SELECT * FROM tb_department WHERE dpr_id = %s"
        cursor.execute(sql, (dpr_id,))
        department = cursor.fetchone()
        logger.info(f"[SQL/SELET] {sql} | PARAMS: ({dpr_id})")
        if department:
            response = jsonify({'department': department})
            if new_access_token:
                response.headers["X-New-Access-Token"] = new_access_token
            return response, 200
        return jsonify({'message': '부서를 찾을 수 없습니다.'}), 404
    except Exception as e:
        return jsonify({'message': f'부서 조회 실패: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

# 부서 추가
@department_bp.route('/create_department', methods=['POST', 'OPTIONS'])
def create_department():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'})
    
    # verify_and_refresh_token 사용하여 토큰 검증 및 자동 갱신
    user_id, user_name, role_id, new_access_token, error_response, status_code = verify_and_refresh_token(request)
    if error_response:
        return error_response, status_code  # 자동 토큰 갱신 응답 반환
    
    if user_id is None:
        return jsonify({'message': '토큰 인증 실패'}), 401
    
    data = request.get_json()
    dpr_id = data.get('dpr_id')
    dpr_nm = data.get('dpr_nm')
    team_nm = data.get('team_nm', None)
    created_by = user_name or 'SYSTEM'

    if not dpr_id or not dpr_nm:
        return jsonify({'message': '부서 ID와 부서명을 입력해야 합니다.'}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({'message': '데이터베이스 연결 실패!'}), 500

    cursor = conn.cursor()
    try:
        sql = """
        INSERT INTO tb_department (dpr_id, dpr_nm, team_nm, created_by, updated_by)
        VALUES (%s, %s, %s, %s, %s)"""
        cursor.execute(sql, (dpr_id, dpr_nm, team_nm, created_by, created_by))
        conn.commit()
        logger.info(f"[SQL/INSERT] {sql} | PARAMS: ({dpr_id}, {dpr_nm}, {team_nm}, {created_by})")
        response = jsonify({'message': '부서가 성공적으로 추가되었습니다.'})
        if new_access_token:
            response.headers["X-New-Access-Token"] = new_access_token
        return response, 201
    except Exception as e:
        return jsonify({'message': f'부서 추가 실패: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

# 부서 수정
@department_bp.route('/update_department/<string:dpr_id>', methods=['PUT', 'OPTIONS'])
def update_department(dpr_id):
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'})
    
    # verify_and_refresh_token 사용하여 토큰 검증 및 자동 갱신
    user_id, user_name, role_id, new_access_token, error_response, status_code = verify_and_refresh_token(request)
    if error_response:
        return error_response, status_code  # 자동 토큰 갱신 응답 반환
    
    if user_id is None:
        return jsonify({'message': '토큰 인증 실패'}), 401
    
    data = request.get_json()
    dpr_nm = data.get('dpr_nm')
    team_nm = data.get('team_nm')
    updated_by = user_name or 'SYSTEM'

    conn = get_db_connection()
    if conn is None:
        return jsonify({'message': '데이터베이스 연결 실패!'}), 500

    cursor = conn.cursor()
    try:
        sql = """
        UPDATE tb_department 
        SET dpr_nm = %s, team_nm = %s, updated_by = %s, updated_at = NOW()
        WHERE dpr_id = %s"""
        cursor.execute(sql, (dpr_nm, team_nm, updated_by, dpr_id))
        logger.info(f"[SQL/UPDATE] {sql} | PARAMS: ({dpr_nm}, {team_nm}, {updated_by})")
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({'message': '부서를 찾을 수 없습니다.'}), 404

        response = jsonify({'message': '부서가 성공적으로 수정되었습니다.'})
        if new_access_token:
            response.headers["X-New-Access-Token"] = new_access_token
        return response, 200
    except Exception as e:
        return jsonify({'message': f'부서 수정 실패: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

# 부서 삭제
@department_bp.route('/delete_department/<string:dpr_id>', methods=['DELETE', 'OPTIONS'])
def delete_department(dpr_id):
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'})
    
    # verify_and_refresh_token 사용하여 토큰 검증 및 자동 갱신
    user_id, user_name, role_id, new_access_token, error_response, status_code = verify_and_refresh_token(request)
    if error_response:
        return error_response, status_code  # 자동 토큰 갱신 응답 반환
    
    if user_id is None:
        return jsonify({'message': '토큰 인증 실패'}), 401
    
    conn = get_db_connection()
    if conn is None:
        return jsonify({'message': '데이터베이스 연결 실패!'}), 500

    cursor = conn.cursor()
    try:
        sql = "DELETE FROM tb_department WHERE dpr_id = %s"
        cursor.execute(sql, (dpr_id,))
        logger.info(f"[SQL/DELETE] {sql} | PARAMS: ({dpr_id})")
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({'message': '부서를 찾을 수 없습니다.'}), 404

        response = jsonify({'message': '부서가 성공적으로 삭제되었습니다.'})
        if new_access_token:
            response.headers["X-New-Access-Token"] = new_access_token
        return response, 200
    except Exception as e:
        return jsonify({'message': f'부서 삭제 실패: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()
