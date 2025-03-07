import logging
from flask import Flask, request, send_from_directory, jsonify
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from config import ALLOWED_ORIGINS
from blueprints.auth import auth_bp
from blueprints.schedule import schedule_bp
from blueprints.user import user_bp
from blueprints.favorite import favorite_bp
from blueprints.project import project_bp
from blueprints.status import status_bp
from blueprints.admin import admin_bp
import os

app = Flask(__name__, static_folder="build", static_url_path="/")

# Bcrypt 설정
bcrypt = Bcrypt()
bcrypt.init_app(app)

# CORS 설정
CORS(app, supports_credentials=True, origins=ALLOWED_ORIGINS)

# 로깅 설정
if not os.path.exists("logs"):
    os.makedirs("logs")

access_handler = logging.FileHandler("logs/access.log")
access_handler.setLevel(logging.INFO)
error_handler = logging.FileHandler("logs/error.log")
error_handler.setLevel(logging.ERROR)

app.logger.addHandler(access_handler)
app.logger.addHandler(error_handler)

# React 정적 파일 서빙 (index.html 없을 경우 404 처리)
@app.route("/")
@app.route("/<path:path>")
def serve_react(path=""):
    return send_from_directory("build", "index.html")

# API 동작 확인용 엔드포인트 추가
@app.route("/health")
def health_check():
    app.logger.info("Health check 요청 받음")
    return jsonify({"status": "OK"}), 200

# CORS 설정 개선
@app.after_request
def after_request(response):
    origin = request.headers.get("Origin")
    if origin and origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
    else:
        response.headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGINS[0]
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    return response

# 블루프린트 등록
app.register_blueprint(auth_bp)
app.register_blueprint(schedule_bp)
app.register_blueprint(user_bp)
app.register_blueprint(favorite_bp)
app.register_blueprint(project_bp)
app.register_blueprint(status_bp)
app.register_blueprint(admin_bp)

# gunicorn 사용 시 주석 처리
if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=5000)
