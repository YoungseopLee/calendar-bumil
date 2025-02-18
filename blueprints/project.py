from flask import Blueprint, request, jsonify
import jwt
from db import get_db_connection
from config import SECRET_KEY
from .auth import decrypt_deterministic

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
        sql = """
        SELECT p.*, GROUP_CONCAT(pu.user_id) AS assigned_user_ids
        FROM tb_project p
        LEFT JOIN tb_project_user pu ON p.project_code = pu.project_code AND pu.is_delete_yn = 'N'
        WHERE p.is_delete_yn = 'N'
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
    # ... (이전과 동일)
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor(dictionary=True)
        query = """
        SELECT p.*, GROUP_CONCAT(pu.user_id) AS assigned_user_ids
        FROM tb_project p
        LEFT JOIN tb_project_user pu ON p.project_code = pu.project_code AND pu.is_delete_yn = 'N'
        WHERE p.is_delete_yn = 'N'
        """
        params = []
        # 조건 추가
        if request.args.get('Business_Start_Date'):
            query += " AND p.business_start_date >= %s"
            params.append(request.args.get('Business_Start_Date'))
        if request.args.get('Business_End_Date'):
            query += " AND p.business_end_date <= %s"
            params.append(request.args.get('Business_End_Date'))
        if request.args.get('Project_PM'):
            query += " AND p.project_pm LIKE %s"
            params.append(f"%{request.args.get('Project_PM')}%")
        if request.args.get('Sales_Representative'):
            query += " AND p.sales_representative LIKE %s"
            params.append(f"%{request.args.get('Sales_Representative')}%")
        if request.args.get('Group_Name'):
            query += " AND p.group_name LIKE %s"
            params.append(f"%{request.args.get('Group_Name')}%")
        if request.args.get('Project_Code'):
            query += " AND p.project_code LIKE %s"
            params.append(f"%{request.args.get('Project_Code')}%")
        if request.args.get('Project_Name'):
            query += " AND p.project_name LIKE %s"
            params.append(f"%{request.args.get('Project_Name')}%")
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
        sql = """
        SELECT p.*, GROUP_CONCAT(pu.user_id) AS assigned_user_ids
        FROM tb_project p
        LEFT JOIN tb_project_user pu ON p.project_code = pu.project_code AND pu.is_delete_yn = 'N'
        WHERE p.project_code = %s AND p.is_delete_yn = 'N'
        GROUP BY p.project_code
        """
        cursor.execute(sql, (project_code,))
        project = cursor.fetchone() 
        if project:
            # assigned_user_ids가 있으면 복호화 처리 (필요하다면)
            if project.get("assigned_user_ids"):
                # 만약 tb_project_user에 저장된 user_id가 암호화된 상태라면 복호화 후 반환
                encrypted_ids = project["assigned_user_ids"].split(",")
                decrypted_ids = [decrypt_deterministic(eid) for eid in encrypted_ids]
                project["assigned_user_ids"] = ",".join(decrypted_ids)
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

@project_bp.route('/add_project', methods=['POST', 'OPTIONS'])
def add_project():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'}), 200

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

    try:
        data = request.get_json()
        def clean_value(value):
            return value if value and value.strip() else None

        required_fields = ["project_code", "category", "status", "business_start_date", "business_end_date", "project_name", "project_pm"]
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return jsonify({'message': f'필수 입력 값이 누락되었습니다: {missing_fields}'}), 400

        project_code = data.get('project_code')
        category = data.get('category')
        status = data.get('status')
        business_start_date = data.get('business_start_date')
        business_end_date = data.get('business_end_date')
        project_name = data.get('project_name')
        project_pm = data.get('project_pm')

        customer = clean_value(data.get('customer'))
        supplier = clean_value(data.get('supplier'))
        person_in_charge = clean_value(data.get('person_in_charge'))
        contact_number = clean_value(data.get('contact_number'))
        sales_representative = clean_value(data.get('sales_representative'))
        project_manager = clean_value(data.get('project_manager'))
        business_details_and_notes = clean_value(data.get('business_details_and_notes'))
        changes = clean_value(data.get('changes'))
        group_name = clean_value(data.get('group_name'))

        current_project_yn = 'y' if status == "진행 중" else 'n'
        assigned_user_ids = data.get('participants')  # 예: [1, 3, 5]

        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor()

        sql_project = """
        INSERT INTO tb_project
        (project_code, category, status, business_start_date, business_end_date,
        project_name, customer, supplier, person_in_charge, contact_number,
        sales_representative, project_pm, project_manager, business_details_and_notes, changes,
        group_name, is_delete_yn, created_at, updated_at, created_by, updated_by)
        VALUES
        (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'N', NOW(), NOW(), %s, %s)
        """
        values_project = (
            project_code, category, status, business_start_date, business_end_date,
            project_name, customer, supplier, person_in_charge, contact_number,
            sales_representative, project_pm, project_manager, business_details_and_notes, changes,
            group_name, created_by, created_by
        )
        cursor.execute(sql_project, values_project)

        # tb_project_user INSERT - 이제 start_date와 end_date 필드를 포함시킵니다.
        sql_project_user = """
        INSERT INTO tb_project_user
        (project_code, user_id, start_date, end_date, current_project_yn, is_delete_yn, created_at, updated_at, created_by, updated_by)
        VALUES
        (%s, %s, %s, %s, %s, 'N', NOW(), NOW(), %s, %s)
        """
        # 기본적으로 로그인한 사용자를 등록 (시작/종료일은 프로젝트의 사업 시작/종료일로 설정)
        values_project_user = (
            project_code, user_id_from_token, business_start_date, business_end_date, current_project_yn, created_by, created_by
        )
        cursor.execute(sql_project_user, values_project_user)

        # 추가 참여자 처리 - 여기서는 사용자 ID를 평문 그대로 사용합니다.
        if assigned_user_ids and isinstance(assigned_user_ids, list):
            for uid in assigned_user_ids:
                # uid는 이미 평문이라 암호화하지 않고 그대로 사용
                cursor.execute(sql_project_user, (project_code, uid, business_start_date, business_end_date, current_project_yn, created_by, created_by))
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

        new_project_code = data.get('project_code')
        category = data.get('category')
        status = data.get('status')
        business_start_date = data.get('business_start_date')
        business_end_date = data.get('business_end_date')
        project_name = data.get('project_name')
        customer = data.get('customer')
        supplier = data.get('supplier')
        person_in_charge = data.get('person_in_charge')
        contact_number = data.get('contact_number')
        sales_representative = data.get('sales_representative')
        project_pm = data.get('project_pm')
        project_manager = data.get('project_manager')
        business_details_and_notes = data.get('business_details_and_notes')
        changes = data.get('changes')
        group_name = data.get('group_name')

        # 클라이언트에서 전달된 참여자 목록 (assigned_user_ids) - 평문 ID로 전달됨
        assigned_user_ids = data.get('assigned_user_ids')
        if isinstance(assigned_user_ids, str):
            assigned_user_ids = [uid.strip() for uid in assigned_user_ids.split(",") if uid.strip()]
        if not assigned_user_ids:
            assigned_user_ids = []

        current_project_yn = 'y' if status == "진행 중" else 'n'

        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500

        # 기존 프로젝트 조회
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT project_code FROM tb_project
            WHERE project_code = %s AND is_delete_yn = 'N'
        """, (new_project_code,))
        old_project = cursor.fetchone()
        if not old_project:
            return jsonify({'message': '수정할 프로젝트를 찾을 수 없습니다.'}), 404
        old_project_code = old_project['project_code']
        cursor.close()

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
            sales_representative, project_pm, project_manager,
            business_details_and_notes, changes, group_name,
            new_project_code, updated_by,
            old_project_code
        )
        cursor.execute(sql_project, values_project)
        cursor.close()

        # tb_project_user 업데이트: 기존 참여자 논리 삭제 후 재등록
        cursor = conn.cursor()
        cursor.execute("UPDATE tb_project_user SET is_delete_yn = 'Y', updated_at = NOW(), updated_by = %s WHERE project_code = %s", (updated_by, old_project_code))
        sql_project_user = """
        INSERT INTO tb_project_user
        (project_code, user_id, start_date, end_date, current_project_yn, is_delete_yn, created_at, updated_at, created_by, updated_by)
        VALUES
        (%s, %s, %s, %s, %s, 'N', NOW(), NOW(), %s, %s)
        """
        for uid in assigned_user_ids:
            # 여기서는 uid는 평문이므로 그대로 사용합니다.
            cursor.execute(sql_project_user, (new_project_code, uid, business_start_date, business_end_date, current_project_yn, updated_by, updated_by))
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
        cursor.execute("UPDATE tb_project SET is_delete_yn = 'Y', updated_at = NOW() WHERE project_code = %s", (project_code,))
        cursor.execute("UPDATE tb_project_user SET is_delete_yn = 'Y', updated_at = NOW() WHERE project_code = %s", (project_code,))
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