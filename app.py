# app.py
from flask import Flask, request
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from config import ALLOWED_ORIGINS
from blueprints.auth import auth_bp
from blueprints.schedule import schedule_bp
from blueprints.user import user_bp
from blueprints.favorite import favorite_bp
from blueprints.project import project_bp

app = Flask(__name__)

bcrypt = Bcrypt()
bcrypt.init_app(app)


# CORS 설정
CORS(app, supports_credentials=True, origins=ALLOWED_ORIGINS)

@app.after_request
def after_request(response):
    origin = request.headers.get('Origin')
    if origin in ALLOWED_ORIGINS:
        response.headers['Access-Control-Allow-Origin'] = origin
    else:
        response.headers['Access-Control-Allow-Origin'] = ALLOWED_ORIGINS[0]
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    return response

# 블루프린트 등록
app.register_blueprint(auth_bp)
app.register_blueprint(schedule_bp)
app.register_blueprint(user_bp)
app.register_blueprint(favorite_bp)
app.register_blueprint(project_bp)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')