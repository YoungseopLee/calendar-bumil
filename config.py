# config.py
import os
from dotenv import load_dotenv

load_dotenv()

# CORS 관련 설정
SERVER_URL = os.getenv("REACT_APP_URL")
API_URL = os.getenv("REACT_APP_API_URL")
ALLOWED_ORIGINS = ["http://localhost:3000", SERVER_URL, API_URL]

# DB 설정
db_config = {
    "host": os.getenv("REACT_APP_DB_HOST"),
    "user": os.getenv("REACT_APP_DB_USER"),
    "password": os.getenv("REACT_APP_DB_PASSWORD"),
    "database": os.getenv("REACT_APP_DB_NAME"),
    "raise_on_warnings": True
}

# JWT 시크릿키
SECRET_KEY = os.getenv("REACT_APP_SECRET_KEY")

# Gemini API 키
GEMINI_API_KEY = os.getenv("REACT_APP_AI_API_URL")
