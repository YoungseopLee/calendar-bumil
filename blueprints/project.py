from flask import Blueprint, request, jsonify
import jwt
from db import get_db_connection
from config import SECRET_KEY

project_bp = Blueprint('project', __name__, url_prefix='/project')

# 모든 프로젝트 조회 (tb_project와 tb_project_user를 조인)
@project_bp.route('/get_all_project', methods=['GET', 'OPTIONS'])
def get_all_project():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'})
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor(dictionary=True)
        # tb_project와 tb_project_user를 LEFT JOIN하여, 각 프로젝트에 할당된 user_id 목록을 집계
        sql = """
        SELECT p.*, GROUP_CONCAT(pu.user_id) AS assigned_user_ids
        FROM tb_project p
        LEFT JOIN tb_project_user pu ON p.project_code = pu.project_code AND pu.is_delete_yn = 'n'
        WHERE p.is_delete_yn = 'n'
        GROUP BY p.project_code
        """
        cursor.execute(sql)
        projects = cursor.fetchall()
        return jsonify({'projects': projects}), 200
    except Exception as e:
        print(f"프로젝트 가져오기 오류: {e}")
        return jsonify({'message': '프로젝트 가져오기 오류'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

# 검색 조건에 따른 프로젝트 조회
@project_bp.route('/get_search_project', methods=['GET', 'OPTIONS'])
def get_search_project():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'})
    
    # 쿼리 스트링에서 검색 조건 추출 (키는 기존 클라이언트와 동일한 형식으로 가정)
    business_start_date = request.args.get('Business_Start_Date')
    business_end_date = request.args.get('Business_End_Date')
    project_pm = request.args.get('Project_PM')
    sales_representative = request.args.get('Sales_Representative')
    group_name = request.args.get('Group_Name')
    project_code = request.args.get('Project_Code')
    project_name = request.args.get('Project_Name')

    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor(dictionary=True)
        
        # 기본 쿼리: 활성 프로젝트만 조회
        query = """
        SELECT p.*, GROUP_CONCAT(pu.user_id) AS assigned_user_ids
        FROM tb_project p
        LEFT JOIN tb_project_user pu ON p.project_code = pu.project_code AND pu.is_delete_yn = 'n'
        WHERE p.is_delete_yn = 'n'
        """
        params = []

        if business_start_date:
            query += " AND p.business_start_date >= %s"
            params.append(business_start_date)
        if business_end_date:
            query += " AND p.business_end_date <= %s"
            params.append(business_end_date)
        if project_pm:
            query += " AND p.project_pm LIKE %s"
            params.append(f"%{project_pm}%")
        if sales_representative:
            query += " AND p.sales_representative LIKE %s"
            params.append(f"%{sales_representative}%")
        if group_name:
            query += " AND p.group_name LIKE %s"
            params.append(f"%{group_name}%")
        if project_code:
            query += " AND p.project_code LIKE %s"
            params.append(f"%{project_code}%")
        if project_name:
            query += " AND p.project_name LIKE %s"
            params.append(f"%{project_name}%")
        
        query += " GROUP BY p.project_code"
        cursor.execute(query, tuple(params))
        search_projects = cursor.fetchall()
        return jsonify({'projects': search_projects}), 200
    except Exception as e:
        print(f"검색 프로젝트 가져오기 오류: {e}")
        return jsonify({'message': '검색 프로젝트 가져오기 오류'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

# 특정 프로젝트 상세 정보 조회 (JOIN 포함)
@project_bp.route('/get_project_details', methods=['GET', 'OPTIONS'])
def get_project_details():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'})
    
    project_code = request.args.get('project_code')
    if not project_code:
        return jsonify({'message': '프로젝트 코드가 제공되지 않았습니다.'}), 400
    
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor(dictionary=True)

        # 특정 프로젝트의 상세 정보를 조회하면서 할당된 사용자들을 집계
        sql = """
        SELECT p.*, GROUP_CONCAT(pu.user_id) AS assigned_user_ids
        FROM tb_project p
        LEFT JOIN tb_project_user pu ON p.project_code = pu.project_code AND pu.is_delete_yn = 'n'
        WHERE p.project_code = %s AND p.is_delete_yn = 'n'
        GROUP BY p.project_code
        """
        cursor.execute(sql, (project_code,))
        project = cursor.fetchone() 
        if project:
            return jsonify({'project': project}), 200
        else:
            return jsonify({'message': '해당 프로젝트를 찾을 수 없습니다.'}), 404
    except Exception as e:
        print(f"프로젝트 상세정보 조회 오류: {e}")
        return jsonify({'message': '프로젝트 상세정보 조회 오류'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

# 프로젝트 추가
@project_bp.route('/add_project', methods=['POST', 'OPTIONS'])
def add_project():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'}), 200

    # JWT 토큰에서 생성자(created_by) 및 사용자 id 가져오기
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': '토큰이 없습니다.'}), 401
    token = token.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        created_by = payload.get('name', 'SYSTEM')
        user_id_from_token = payload.get('user_id')
    except jwt.ExpiredSignatureError:
        return jsonify({'message': '토큰이 만료되었습니다.'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': '유효하지 않은 토큰입니다.'}), 401
    except Exception as e:
        print(f"토큰 검증 오류: {e}")
        return jsonify({'message': '토큰 검증 오류'}), 401

    try:
        data = request.get_json()

        project_code = data.get('Project_Code')
        category = data.get('Category')
        status = data.get('Status')
        business_start_date = data.get('Business_Start_Date')
        business_end_date = data.get('Business_End_Date')
        project_name = data.get('Project_Name')
        customer = data.get('Customer')
        supplier = data.get('Supplier')
        person_in_charge = data.get('Person_in_Charge')
        contact_number = data.get('Contact_Number')
        sales_representative = data.get('Sales_Representative')
        project_pm = data.get('Project_PM')
        project_manager = data.get('Project_Manager')
        business_details_and_notes = data.get('Business_Details_and_Notes')
        changes = data.get('Changes')
        group_name = data.get('Group_Name')

        # 프로젝트 상태가 "진행 중"이면 해당 프로젝트에 할당된 사용자의 current_project_yn은 'Y'로 설정
        current_project_yn = 'y' if status == "진행 중" else 'n'

        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500

        cursor = conn.cursor()

        # tb_project
        sql_project = """
        INSERT INTO tb_project
        (
            project_code,
            category,
            status,
            business_start_date,
            business_end_date,
            project_name,
            customer,
            supplier,
            person_in_charge,
            contact_number,
            sales_representative,
            project_pm,
            project_manager,
            business_details_and_notes,
            changes,
            group_name,
            is_delete_yn,
            created_at,
            updated_at,
            created_by,
            updated_by
        )
        VALUES
        (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'n', NOW(), NOW(), %s, %s
        )
        """
        values_project = (
            project_code, category, status, business_start_date, business_end_date,
            project_name, customer, supplier, person_in_charge, contact_number,
            sales_representative, project_pm, project_manager, business_details_and_notes, changes,
            group_name, created_by, created_by
        )
        cursor.execute(sql_project, values_project)

        # tb_project_user
        sql_project_user = """
        INSERT INTO tb_project_user
        (
            project_code,
            user_id,
            current_project_yn,
            is_delete_yn,
            created_at,
            updated_at,
            created_by,
            updated_by
        )
        VALUES
        (
            %s, %s, %s, 'n', NOW(), NOW(), %s, %s
        )
        """
        values_project_user = (
            project_code, user_id_from_token, current_project_yn, created_by, created_by
        )
        cursor.execute(sql_project_user, values_project_user)

        conn.commit()
        return jsonify({'message': '프로젝트가 추가되었습니다.'}), 201

    except Exception as e:
        print(f"프로젝트 추가 오류: {e}")
        return jsonify({'message': f'프로젝트 추가 중 오류 발생: {e}'}), 500

    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

# 프로젝트 수정
@project_bp.route('/edit_project', methods=['POST', 'OPTIONS'])
def edit_project():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'}), 200

    # JWT 토큰에서 수정한 사용자의 이름(updated_by) 가져오기
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': '토큰이 없습니다.'}), 401
    token = token.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        updated_by = payload.get('name', 'SYSTEM')
    except jwt.ExpiredSignatureError:
        return jsonify({'message': '토큰이 만료되었습니다.'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': '유효하지 않은 토큰입니다.'}), 401
    except Exception as e:
        print(f"토큰 검증 오류: {e}")
        return jsonify({'message': '토큰 검증 오류'}), 401

    try:
        data = request.get_json()

        new_project_code = data.get('Project_Code')
        category = data.get('Category')
        status = data.get('Status')
        business_start_date = data.get('Business_Start_Date')
        business_end_date = data.get('Business_End_Date')
        project_name = data.get('Project_Name')
        customer = data.get('Customer')
        supplier = data.get('Supplier')
        person_in_charge = data.get('Person_in_Charge')
        contact_number = data.get('Contact_Number')
        sales_representative = data.get('Sales_Representative')
        project_pm = data.get('Project_PM')
        project_manager = data.get('Project_Manager')
        business_details_and_notes = data.get('Business_Details_and_Notes')
        changes = data.get('Changes')
        group_name = data.get('Group_Name')

        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500

        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT project_code 
            FROM tb_project 
            WHERE project_code = %s AND is_delete_yn = 'n'
        """, (new_project_code,))
        old_project = cursor.fetchone()
        if not old_project:
            return jsonify({'message': '수정할 프로젝트를 찾을 수 없습니다.'}), 404
        old_project_code = old_project['project_code']

        # 현재 프로젝트 여부: 상태가 "진행 중"이면 'Y', 아니면 'N'
        current_project_yn = 'y' if status == "진행 중" else 'n'

        # tb_project 업데이트
        cursor = conn.cursor()
        sql_project = """
        UPDATE tb_project
        SET 
            category = %s,
            status = %s,
            business_start_date = %s,
            business_end_date = %s,
            project_name = %s,
            customer = %s,
            supplier = %s,
            person_in_charge = %s,
            contact_number = %s,
            sales_representative = %s,
            project_pm = %s,
            project_manager = %s,
            business_details_and_notes = %s,
            changes = %s,
            group_name = %s,
            project_code = %s,
            updated_at = NOW(),
            updated_by = %s
        WHERE project_code = %s
        """
        values_project = (
            category, status, business_start_date, business_end_date,
            project_name, customer, supplier, person_in_charge, contact_number,
            sales_representative, project_pm, project_manager, business_details_and_notes, changes,
            group_name, new_project_code, updated_by,
            old_project_code
        )
        cursor.execute(sql_project, values_project)

        # tb_project_user 업데이트
        sql_project_user = """
        UPDATE tb_project_user
        SET 
            project_code = %s,
            current_project_yn = %s,
            updated_at = NOW(),
            updated_by = %s
        WHERE project_code = %s AND is_delete_yn = 'n'
        """
        cursor.execute(sql_project_user, (new_project_code, current_project_yn, updated_by, old_project_code))

        conn.commit()
        return jsonify({'message': '프로젝트가 수정되었습니다.'}), 200

    except Exception as e:
        print(f"프로젝트 수정 오류: {e}")
        return jsonify({'message': f'프로젝트 수정 중 오류 발생: {e}'}), 500

    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

# 프로젝트 삭제 (논리 삭제)
@project_bp.route('/delete_project/<string:project_code>', methods=['DELETE', 'OPTIONS'])
def delete_project(project_code):
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'}), 200
    
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor()
        
        # 논리 삭제: is_delete_yn 값을 'Y'로 업데이트
        sql = "UPDATE tb_project SET is_delete_yn = 'Y' WHERE project_code = %s"
        cursor.execute(sql, (project_code,))
        conn.commit()
        
        return jsonify({'message': '프로젝트가 삭제되었습니다.'}), 200

    except jwt.ExpiredSignatureError:
        return jsonify({'message': '토큰이 만료되었습니다.'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': '유효하지 않은 토큰입니다.'}), 401
    except Exception as e:
        print(f"프로젝트 삭제 오류: {e}")
        return jsonify({'message': '프로젝트 삭제 오류'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass
