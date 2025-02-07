# blueprints/schedule.py
from flask import Blueprint, request, jsonify
import jwt
from db import get_db_connection
from config import SECRET_KEY

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
        FROM Schedule
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
    user_id = request.args.get('user_id')
    date = request.args.get('date')
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor(dictionary=True)
        sql = """
        SELECT s.id, s.task, s.start_date, s.end_date, s.status, u.name
        FROM Schedule s
        JOIN User u ON s.user_id = u.id
        WHERE DATE(s.start_date) <= %s AND DATE(s.end_date) >= %s AND s.user_id != %s
        """
        cursor.execute(sql, (date, date, user_id))
        other_users_schedules = cursor.fetchall()
        return jsonify({'schedules': other_users_schedules}), 200
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
    try:
        data = request.get_json()
        start_date = data.get('start')
        end_date = data.get('end')
        task = data.get('task')
        status = data.get('status')
        user_id = data.get('user_id')
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor()
        sql = """
        INSERT INTO Schedule (user_id, start_date, end_date, task, status)
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
        user_id = payload['user_id']
        data = request.get_json()
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        task = data.get('task')
        status = data.get('status')
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500
        cursor = conn.cursor()
        cursor.execute("SELECT user_id FROM Schedule WHERE id = %s", (schedule_id,))
        schedule_owner = cursor.fetchone()
        if schedule_owner and schedule_owner[0] != user_id:
            return jsonify({'message': '일정을 수정할 권한이 없습니다.'}), 403
        sql = """
        UPDATE Schedule
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
        cursor.execute("SELECT user_id FROM Schedule WHERE id = %s", (schedule_id,))
        schedule_owner = cursor.fetchone()
        if schedule_owner and schedule_owner[0] != user_id:
            return jsonify({'message': '일정을 삭제할 권한이 없습니다.'}), 403
        cursor.execute("DELETE FROM Schedule WHERE id = %s", (schedule_id,))
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
        sql = "SELECT * FROM Schedule"
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
