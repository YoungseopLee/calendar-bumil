from flask import Blueprint, request, jsonify
import jwt
from db import get_db_connection
from config import SECRET_KEY
from .auth import decrypt_deterministic  # 이메일 복호화 함수

schedule_bp = Blueprint('schedule', __name__, url_prefix='/schedule')

@schedule_bp.route('/get_schedule', methods=['GET', 'OPTIONS'])
def get_schedule():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'})
    user_id = request.args.get('user_id')
    date = request.args.get('date')
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor(dictionary=True)
        sql = """
        SELECT id, task, start_date, end_date, status
        FROM tb_schedule
        WHERE user_id = %s AND DATE(start_date) <= %s AND DATE(end_date) >= %s
        """
        cursor.execute(sql, (user_id, date, date))
        schedules = cursor.fetchall()
        return jsonify({'schedules': schedules}), 200
    except Exception as e:
        print(f"일정 가져오기 오류: {e}")
        return jsonify({'message': '일정 가져오기 오류'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

@schedule_bp.route('/get_other_users_schedule', methods=['GET', 'OPTIONS'])
def get_other_users_schedule():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'})
    
    # 토큰에서 현재 사용자의 암호화된 ID 추출
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': '토큰이 없습니다.'}), 401
    token = token.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        # 현재 사용자 ID (암호화된 값) 그대로 사용
        current_user_id = payload.get('user_id') or payload.get('id')
        if not current_user_id:
            return jsonify({'message': '현재 사용자 ID 정보가 없습니다.'}), 400
    except jwt.ExpiredSignatureError:
        return jsonify({'message': '토큰이 만료되었습니다.'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': '유효하지 않은 토큰입니다.'}), 401
    except Exception as e:
        print(f"토큰 검증 오류: {e}")
        return jsonify({'message': '토큰 검증 오류'}), 401

    date = request.args.get('date')
    if not date:
        return jsonify({'message': '날짜가 제공되지 않았습니다.'}), 400

    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor(dictionary=True)
        sql = """
        SELECT s.id AS schedule_id, s.task, s.start_date, s.end_date, s.status, 
              u.id AS user_id, u.name
        FROM tb_schedule s
        JOIN tb_user u ON s.user_id = u.id
        WHERE DATE(s.start_date) <= %s AND DATE(s.end_date) >= %s
        """
        cursor.execute(sql, (date, date))
        schedules = cursor.fetchall()
        
        # 현재 사용자의 일정은 제외 (암호화된 ID끼리 직접 비교)
        filtered_schedules = [sched for sched in schedules if sched['user_id'] != current_user_id]
                
        return jsonify({'schedules': filtered_schedules}), 200
    except Exception as e:
        print(f"다른 사용자 일정 가져오기 오류: {e}")
        return jsonify({'message': '다른 사용자 일정 가져오기 오류'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

@schedule_bp.route('/add-schedule', methods=['POST', 'OPTIONS'])
def add_schedule():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'})
    
    # 토큰 검증
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': '토큰이 없습니다.'}), 401
    token = token.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_id_from_token = payload['user_id']
        user_name = payload.get('name', 'Unknown')
    except jwt.ExpiredSignatureError:
        return jsonify({'message': '토큰이 만료되었습니다.'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': '유효하지 않은 토큰입니다.'}), 401

    try:
        data = request.get_json()
        start_date = data.get('start')
        end_date = data.get('end')
        task = data.get('task')
        status = data.get('status')
        user_id = user_id_from_token

        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor()
        sql = """
        INSERT INTO tb_schedule 
        (user_id, start_date, end_date, task, status)
        VALUES (%s, %s, %s, %s, %s)
        """
        values = (user_id, start_date, end_date, task, status)
        cursor.execute(sql, values)
        conn.commit()
        return jsonify({'message': '일정이 추가되었습니다.'}), 200
    except Exception as e:
        print(f"일정 추가 오류: {e}")
        return jsonify({'message': f'일정 추가 중 오류 발생: {e}'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

@schedule_bp.route('/edit-schedule/<int:schedule_id>', methods=['PUT', 'OPTIONS'])
def edit_schedule(schedule_id):
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'})
    
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': '토큰이 없습니다.'}), 401
    token = token.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_id_from_token = payload['user_id']
        user_name = payload.get('name', 'Unknown')
    except jwt.ExpiredSignatureError:
        return jsonify({'message': '토큰이 만료되었습니다.'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': '유효하지 않은 토큰입니다.'}), 401

    try:
        data = request.get_json()
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        task = data.get('task')
        status = data.get('status')
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor()
        
        cursor.execute("SELECT user_id FROM tb_schedule WHERE id = %s", (schedule_id,))
        schedule_owner = cursor.fetchone()
        if schedule_owner and schedule_owner[0] != user_id_from_token:
            return jsonify({'message': '일정을 수정할 권한이 없습니다.'}), 403
        
        sql = """
        UPDATE tb_schedule
        SET start_date = %s, end_date = %s, task = %s, status = %s
        WHERE id = %s
        """
        values = (start_date, end_date, task, status, schedule_id)
        cursor.execute(sql, values)
        conn.commit()
        return jsonify({'message': '일정이 수정되었습니다.'}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({'message': '토큰이 만료되었습니다.'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': '유효하지 않은 토큰입니다.'}), 401
    except Exception as e:
        print(f"일정 수정 오류: {e}")
        return jsonify({'message': '일정 수정 오류'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

@schedule_bp.route('/delete-schedule/<int:schedule_id>', methods=['DELETE', 'OPTIONS'])
def delete_schedule(schedule_id):
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'})
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
        cursor = conn.cursor()
        cursor.execute("SELECT user_id FROM tb_schedule WHERE id = %s", (schedule_id,))
        schedule_owner = cursor.fetchone()
        if schedule_owner and schedule_owner[0] != user_id:
            return jsonify({'message': '일정을 삭제할 권한이 없습니다.'}), 403
        cursor.execute("DELETE FROM tb_schedule WHERE id = %s", (schedule_id,))
        conn.commit()
        return jsonify({'message': '일정이 삭제되었습니다.'}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({'message': '토큰이 만료되었습니다.'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': '유효하지 않은 토큰입니다.'}), 401
    except Exception as e:
        print(f"일정 삭제 오류: {e}")
        return jsonify({'message': '일정 삭제 오류'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

@schedule_bp.route('/get_all_schedule', methods=['GET'])
def get_all_schedule():
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor(dictionary=True)
        sql = "SELECT * FROM tb_schedule"
        cursor.execute(sql)
        schedules = cursor.fetchall()
        return jsonify({'schedules': schedules}), 200
    except Exception as e:
        print(f"일정 가져오기 오류: {e}")
        return jsonify({'message': '일정 가져오기 오류'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass
