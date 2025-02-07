# blueprints/gemini.py
from flask import Blueprint, request, jsonify
import google.generativeai as genai
from config import GEMINI_API_KEY

gemini_bp = Blueprint('gemini', __name__, url_prefix='/gemini')

# Gemini API 구성
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")

@gemini_bp.route('', methods=['POST', 'OPTIONS'])
def gemini_chat():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request success'})
    try:
        data = request.get_json()
        user_message = data.get("message")
        response = model.generate_content(user_message)
        return jsonify({"response": response.text}), 200
    except Exception as e:
        print(f"Gemini API 호출 오류: {e}")
        return jsonify({"error": "Gemini API 호출 중 오류가 발생했습니다."}), 500
