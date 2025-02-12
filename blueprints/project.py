# blueprints/project.py
from flask import Blueprint, request, jsonify
import jwt
from db import get_db_connection
from config import SECRET_KEY

project_bp = Blueprint('project', __name__, url_prefix='/project')

@project_bp.route('/get_all_project', methods=['GET', 'OPTIONS'])
def get_all_project():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'})
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor(dictionary=True)
        sql="SELECT * FROM Project_Details WHERE is_delete = 0"
        
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

@project_bp.route('/get_search_project', methods=['GET', 'OPTIONS'])
def get_search_project():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'})

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
        
        query = "SELECT * FROM Project_Details WHERE 1=1 AND is_delete = 0"
        params = []

        # 각 검색 조건을 확인하고 쿼리에 추가
        if business_start_date:
            query += " AND Business_Start_Date >= %s"
            params.append(business_start_date)
        if business_end_date:
            query += " AND Business_End_Date <= %s"
            params.append(business_end_date)
        if project_pm:
            query += " AND Project_PM LIKE %s"
            params.append(f"%{project_pm}%")
        if sales_representative:
            query += " AND Sales_Representative LIKE %s"
            params.append(f"%{sales_representative}%")
        if group_name:
            query += " AND Group_Name LIKE %s"
            params.append(f"%{group_name}%")
        if project_code:
            query += " AND Project_Code LIKE %s"
            params.append(f"%{project_code}%")
        if project_name:
            query += " AND Project_Name LIKE %s"
            params.append(f"%{project_name}%")
        
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
        sql = "SELECT * FROM Project_Details WHERE Project_Code = %s AND Is_Delete = 0"
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

@project_bp.route('/edit_project', methods=['POST', 'OPTIONS'])
def edit_project():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'})
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
        expected_invoice_date = data.get('Expected_Invoice_Date')
        expected_payment_date = data.get('Expected_Payment_Date')
        sales_representative = data.get('Sales_Representative')
        project_pm = data.get('Project_PM')
        project_manager = data.get('Project_Manager')
        project_participant = data.get('Project_Participant')
        business_details_and_notes = data.get('Business_Details_and_Notes')
        changes = data.get('Changes')

        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor()

        sql = """
        UPDATE Project_Details
        SET 
            Category = %s,
            Status = %s,
            Business_Start_Date = %s,
            Business_End_Date = %s,
            Project_Name = %s,
            Customer = %s,
            Supplier = %s,
            Person_in_Charge = %s,
            Contact_Number = %s,
            Expected_Invoice_Date = %s,
            Expected_Payment_Date = %s,
            Sales_Representative = %s,
            Project_PM = %s,
            Project_Manager = %s,
            Project_Participant = %s,
            Business_Details_and_Notes = %s,
            Changes = %s
        WHERE Project_Code = %s
        """
        values = (
            category, status, business_start_date, business_end_date,
            project_name, customer, supplier, person_in_charge, contact_number,
            expected_invoice_date, expected_payment_date, sales_representative,
            project_pm, project_manager, project_participant,
            business_details_and_notes, changes, project_code
        )
        
        cursor.execute(sql, values)
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

@project_bp.route('/delete_project/<int:project_code>', methods=['DELETE', 'OPTIONS'])
def delete_project(project_code):
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'})
    
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor()
        
        # 논리 삭제 Is_Delete 칼럼 값을 1로 업데이트
        sql = "UPDATE Project_Details SET Is_Delete = 1 WHERE Project_Code = %s"
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
