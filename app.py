# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import os
import jwt
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

app = Flask(__name__)

serverUrl = os.getenv("REACT_APP_URL")
apiUrl = os.getenv("REACT_APP_API_URL")

allowed_origins = ["http://localhost:3000", serverUrl, apiUrl]
CORS(app, supports_credentials=True, origins=allowed_origins)

@app.after_request
def after_request(response):
    origin = request.headers.get('Origin')
    if origin in allowed_origins:
        # 이미 헤더가 설정되어 있지 않은 경우에만 설정
        if 'Access-Control-Allow-Origin' not in response.headers:
            response.headers['Access-Control-Allow-Origin'] = origin
    else:
        response.headers['Access-Control-Allow-Origin'] = allowed_origins[0]
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    return response

# DB 설정
db_config = {
    "host": os.getenv("REACT_APP_DB_HOST"),
    "user": os.getenv("REACT_APP_DB_USER"),
    "password": os.getenv("REACT_APP_DB_PASSWORD"),
    "database": os.getenv("REACT_APP_DB_NAME"),
    "raise_on_warnings": True
}

# JWT 비밀 키
SECRET_KEY = os.getenv("REACT_APP_SECRET_KEY")

def get_db_connection():
    try:
        print(f"DB 연결 설정: {db_config}")
        conn = mysql.connector.connect(**db_config)
        return conn
    except mysql.connector.Error as err:
        print(f"MySQL 연결 오류: {err}")
        return None

# Gemini API 설정
GEMINI_API_KEY = os.getenv("REACT_APP_AI_API_URL")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")

# 로그인 API
@app.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight request success'})
        return response

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
                        'exp': datetime.now(timezone.utc) + timedelta(hours=1)  # 1시간 유효
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
        except:
            pass

# 회원가입 API
@app.route('/signup', methods=['POST', 'OPTIONS'])
def signup():
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight request success'})
        return response

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
    except mysql.connector.Error as err:
        print(f"DB 오류: {err}")
        return jsonify({'message': f'데이터베이스 오류: {err}'}), 500
    except Exception as e:
        print(f"오류: {e}")
        return jsonify({'message': f'오류: {e}'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except:
            pass

# 내 일정 조회 API
@app.route('/get_schedule', methods=['GET', 'OPTIONS'])
def get_schedule():
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight request success'})
        return response

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
        except:
            pass

# 다른 유저 일정 조회 API
@app.route('/get_other_users_schedule', methods=['GET', 'OPTIONS'])
def get_other_users_schedule():
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight request success'})
        return response

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
        except:
            pass

# 일정 추가 API
@app.route('/api/add-schedule', methods=['POST', 'OPTIONS'])
def add_schedule():
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight request success'})
        return response

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
    except mysql.connector.Error as err:
        print(f"일정 추가 오류: {err}")
        return jsonify({'message': f'일정 추가 실패: {err}'}), 500
    except Exception as e:
        print(f"일정 추가 중 오류 발생: {e}")
        return jsonify({'message': f'일정 추가 중 오류 발생: {e}'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except:
            pass

# 일정 수정 API
@app.route('/edit-schedule/<int:schedule_id>', methods=['PUT', 'OPTIONS'])
def edit_schedule(schedule_id):
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight request success'})
        return response

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
        schedule_owner_id = cursor.fetchone()
        if schedule_owner_id and schedule_owner_id[0] != user_id:
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
        except:
            pass

# 일정 삭제 API
@app.route('/delete-schedule/<int:schedule_id>', methods=['DELETE', 'OPTIONS'])
def delete_schedule(schedule_id):
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight request success'})
        return response

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
        schedule_owner_id = cursor.fetchone()
        if schedule_owner_id and schedule_owner_id[0] != user_id:
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
        except:
            pass

# 승인 대기 사용자 조회 API
@app.route('/get_pending_users', methods=['GET', 'OPTIONS'])
def get_pending_users():
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight request success'})
        return response

    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500

        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, name, position, department, email, phone_number FROM User WHERE is_approved = 0")
        pending_users = cursor.fetchall()
        return jsonify({'users': pending_users}), 200
    except Exception as e:
        print(f"승인 대기 사용자 목록 가져오기 오류: {e}")
        return jsonify({'message': '승인 대기 사용자 목록 가져오기 오류'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except:
            pass

# 사용자 승인 API
@app.route('/approve_user', methods=['POST', 'OPTIONS'])
def approve_user():
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight request success'})
        return response

    try:
        data = request.get_json()
        user_id = data.get('userId')

        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500

        cursor = conn.cursor()
        cursor.execute("UPDATE User SET is_approved = 1 WHERE id = %s", (user_id,))
        conn.commit()
        return jsonify({'message': '사용자가 승인되었습니다.'}), 200
    except Exception as e:
        print(f"사용자 승인 오류: {e}")
        return jsonify({'message': '사용자 승인 오류'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except:
            pass

# 사용자 승인 거부 API
@app.route('/reject_user', methods=['POST', 'OPTIONS'])
def reject_user():
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight request success'})
        return response

    try:
        data = request.get_json()
        user_id = data.get('userId')

        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500

        cursor = conn.cursor()
        cursor.execute("DELETE FROM User WHERE id = %s", (user_id,))
        conn.commit()
        return jsonify({'message': '사용자가 거절되었습니다.'}), 200
    except Exception as e:
        print(f"사용자 거절 오류: {e}")
        return jsonify({'message': '사용자 거절 오류'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except:
            pass

# 사용자 목록 조회 API
@app.route('/get_users', methods=['GET'])
def get_users():
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500

        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, name, position, department, email, phone_number, is_approved, COALESCE(status, '출근') AS status
            FROM User
        """)
        users = cursor.fetchall()
        return jsonify({'users': users}), 200
    except Exception as e:
        print(f"사용자 목록 조회 오류: {e}")
        return jsonify({'message': '사용자 목록 조회 오류'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except:
            pass

# 전체 사용자 상태 조회 API
@app.route('/get_users_status', methods=['POST', 'OPTIONS'])
def get_users_status():
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight request success'})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        return response

    data = request.get_json()
    user_ids = data.get("user_ids", [])
    if not user_ids:
        return jsonify({'message': 'user_ids가 제공되지 않았습니다.'}), 400

    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500

        cursor = conn.cursor(dictionary=True)
        format_strings = ','.join(['%s'] * len(user_ids))
        query = f"SELECT id, COALESCE(status, '출근') AS status FROM User WHERE id IN ({format_strings})"
        cursor.execute(query, tuple(user_ids))
        statuses = cursor.fetchall()
        statuses_dict = {user["id"]: user["status"] for user in statuses}
        return jsonify({'statuses': statuses_dict}), 200
    except Exception as e:
        print(f"사용자 상태 조회 오류: {e}")
        return jsonify({'message': '사용자 상태 조회 오류'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except:
            pass

# 즐겨찾기 추가/삭제 토글 API
@app.route('/toggle_favorite', methods=['POST', 'OPTIONS'])
def toggle_favorite():
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight request success'})
        return response

    try:
        data = request.get_json()
        user_id = data.get('user_id')
        favorite_user_id = data.get('favorite_user_id')

        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500

        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Favorite WHERE user_id = %s AND favorite_user_id = %s", (user_id, favorite_user_id))
        favorite = cursor.fetchone()
        if favorite:
            cursor.execute("DELETE FROM Favorite WHERE user_id = %s AND favorite_user_id = %s", (user_id, favorite_user_id))
            conn.commit()
            response_message = '즐겨찾기가 삭제되었습니다.'
        else:
            cursor.execute("INSERT INTO Favorite (user_id, favorite_user_id) VALUES (%s, %s)", (user_id, favorite_user_id))
            conn.commit()
            response_message = '즐겨찾기가 추가되었습니다.'
        return jsonify({'message': response_message}), 200
    except mysql.connector.Error as err:
        print(f"DB 오류: {err}")
        return jsonify({'message': f'데이터베이스 오류: {err}'}), 500
    except Exception as e:
        print(f"오류: {e}")
        return jsonify({'message': f'오류: {e}'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except:
            pass

# 즐겨찾기 조회 API
@app.route('/get_favorites', methods=['GET', 'OPTIONS'])
def get_favorites():
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight request success'})
        return response

    try:
        user_id = request.args.get('user_id')
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500

        cursor = conn.cursor(dictionary=True)
        sql = """
        SELECT u.id, u.name, u.position, u.department, u.email, u.phone_number,
        COALESCE(u.status, '출근') AS status
        FROM Favorite f
        JOIN User u ON f.favorite_user_id = u.id
        WHERE f.user_id = %s
        """
        cursor.execute(sql, (user_id,))
        favorites = cursor.fetchall()
        return jsonify({'favorites': favorites}), 200
    except Exception as e:
        print(f"즐겨찾기 목록 조회 오류: {e}")
        return jsonify({'message': '즐겨찾기 목록 조회 오류'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except:
            pass

# 토큰 검증 및 로그인 사용자 정보 조회 API
@app.route('/get_logged_in_user', methods=['GET', 'OPTIONS'])
def get_logged_in_user():
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight request success'})
        return response

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
        except:
            pass

# 사용자 상태 업데이트 API
@app.route('/update_status', methods=['PUT', 'OPTIONS'])
def update_status():
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight request success'})
        return response

    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': '토큰이 없습니다.'}), 401
    token = token.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_id = payload['user_id']
        data = request.get_json()
        new_status = data.get('status')
        valid_statuses = ['출근', '외근', '파견', '휴가']
        if new_status not in valid_statuses:
            return jsonify({'message': '유효하지 않은 상태 값입니다.'}), 400

        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500

        cursor = conn.cursor()
        cursor.execute("UPDATE User SET status = %s WHERE id = %s", (new_status, user_id))
        conn.commit()
        return jsonify({'message': '상태가 업데이트되었습니다.'}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({'message': '토큰이 만료되었습니다.'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': '유효하지 않은 토큰입니다.'}), 401
    except Exception as e:
        print(f"상태 업데이트 오류: {e}")
        return jsonify({'message': '상태 업데이트 오류'}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except:
            pass

# Gemini API 호출 라우트
@app.route('/gemini', methods=['POST', 'OPTIONS'])
def gemini_chat():
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight request success'})
        return response

    try:
        data = request.get_json()
        user_message = data.get("message")
        response = model.generate_content(user_message)
        return jsonify({"response": response.text}), 200
    except Exception as e:
        print(f"Gemini API 호출 오류: {e}")
        return jsonify({"error": "Gemini API 호출 중 오류가 발생했습니다."}), 500

# 전체 일정 가져오기
@app.route('/get_all_schedule', methods=['GET']) 
def get_all_schedule():
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({'message': '데이터베이스 연결 실패!'}), 500

        cursor = conn.cursor(dictionary=True)

        sql = """
        SELECT * FROM Schedule  
        """  
        cursor.execute(sql) 
        schedules = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify({'schedules': schedules}), 200

    except Exception as e:
        print(f"일정 가져오기 오류: {e}")
        return jsonify({'message': '일정 가져오기 오류'}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
