from flask import Blueprint, request, jsonify
import jwt
from db import get_db_connection
from config import SECRET_KEY
from .auth import decrypt_deterministic, encrypt_deterministic

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

        # 프로젝트 상세 정보 조회
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
            # assigned_user_ids가 있으면 복호화 처리
            if project.get("assigned_user_ids"):
                encrypted_ids = project["assigned_user_ids"].split(",")
                # 각 암호화된 id를 복호화
                decrypted_ids = [decrypt_deterministic(eid) for eid in encrypted_ids]
                # 복호화한 id들을 다시 쉼표로 합침
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

    # JWT 토큰 확인
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

        # 빈 문자열을 None으로 변환하는 함수
        def clean_value(value):
            return value if value and value.strip() else None

        # 필수 필드 확인
        required_fields = ["project_code", "category", "status", "business_start_date", "business_end_date", "project_name", "project_pm"]
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return jsonify({'message': f'필수 입력 값이 누락되었습니다: {missing_fields}'}), 400

        # 필수 필드
        project_code = data.get('project_code')
        category = data.get('category')
        status = data.get('status')
        business_start_date = data.get('business_start_date')
        business_end_date = data.get('business_end_date')
        project_name = data.get('project_name')
        project_pm = data.get('project_pm')

        # NULL 허용 필드 (빈 값은 None으로 변환)
        customer = clean_value(data.get('customer'))
        supplier = clean_value(data.get('supplier'))
        person_in_charge = clean_value(data.get('person_in_charge'))
        contact_number = clean_value(data.get('contact_number'))
        sales_representative = clean_value(data.get('sales_representative'))
        project_manager = clean_value(data.get('project_manager'))
        business_details_and_notes = clean_value(data.get('business_details_and_notes'))
        changes = clean_value(data.get('changes'))
        group_name = clean_value(data.get('group_name'))

        # 프로젝트 상태가 "진행 중"이면 current_project_yn은 'y', 아니면 'n'
        current_project_yn = 'y' if status == "진행 중" else 'n'

        # 참여자 목록 (assigned_user_ids)는 선택적 필드; 없으면 None
        assigned_user_ids = data.get('participants')  # 예: [1, 3, 5]

        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500

        cursor = conn.cursor()

        # tb_project INSERT
        sql_project = """
        INSERT INTO tb_project
        (
            project_code, category, status, business_start_date, business_end_date,
            project_name, customer, supplier, person_in_charge, contact_number,
            sales_representative, project_pm, project_manager, business_details_and_notes, changes,
            group_name, is_delete_yn, created_at, updated_at, created_by, updated_by
        )
        VALUES
        (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'n', NOW(), NOW(), %s, %s
        )
        """
        values_project = (
            project_code, category, status, business_start_date, business_end_date,
            project_name, customer, supplier, person_in_charge, contact_number,
            sales_representative, project_pm, project_manager, business_details_and_notes, changes,
            group_name, created_by, created_by
        )
        cursor.execute(sql_project, values_project)

        # tb_project_user INSERT : 기본적으로 로그인한 사용자를 등록
        sql_project_user = """
        INSERT INTO tb_project_user
        (
            project_code, user_id, current_project_yn, is_delete_yn, created_at, updated_at, created_by, updated_by
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

        # 추가 참여자(있다면) tb_project_user에 추가
        if assigned_user_ids and isinstance(assigned_user_ids, list):
            for uid in assigned_user_ids:
                # uid는 평문으로 전달되므로, 암호화된 값으로 변환합니다.
                encrypted_uid = encrypt_deterministic(uid)
                cursor.execute(sql_project_user, (project_code, encrypted_uid, current_project_yn, created_by, created_by))
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

        # 프로젝트 기본 정보
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

        # 클라이언트에서 전달된 참여자 목록 (assigned_user_ids, 예: "1,3,5" 혹은 [1,3,5])
        assigned_user_ids = data.get('assigned_user_ids')
        if isinstance(assigned_user_ids, str):
            assigned_user_ids = [uid.strip() for uid in assigned_user_ids.split(",") if uid.strip()]
        if not assigned_user_ids:
            assigned_user_ids = []


        # 현재 프로젝트 여부: 상태가 "진행 중"이면 'y', 아니면 'n'
        current_project_yn = 'y' if status == "진행 중" else 'n'

        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500

        # 먼저 기존 프로젝트 정보를 조회 (수정 대상)
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

        # tb_project_user 업데이트 (참여자 정보 업데이트)
        cursor = conn.cursor()
        # 먼저 기존 참여자 레코드를 논리 삭제 처리 (is_delete_yn = 'y')
        cursor.execute("UPDATE tb_project_user SET is_delete_yn = 'y', updated_at = NOW(), updated_by = %s WHERE project_code = %s", (updated_by, old_project_code))
        # 새 참여자들 INSERT
        if assigned_user_ids:
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
            for uid in assigned_user_ids:
                encrypted_uid = encrypt_deterministic(uid)
                cursor.execute(sql_project_user, (new_project_code, encrypted_uid, current_project_yn, updated_by, updated_by))
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
        # 논리 삭제: tb_project의 is_delete_yn 값을 'y'로 업데이트
        cursor.execute("UPDATE tb_project SET is_delete_yn = 'y', updated_at = NOW() WHERE project_code = %s", (project_code,))
        # tb_project_user의 해당 프로젝트와 관련된 레코드들도 논리 삭제 처리
        cursor.execute("UPDATE tb_project_user SET is_delete_yn = 'y', updated_at = NOW() WHERE project_code = %s", (project_code,))
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
