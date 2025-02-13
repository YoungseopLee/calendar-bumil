import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./LoginPage.css";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false); // 아이디 저장 상태
  const [autoLogin, setAutoLogin] = useState(false); // 자동 로그인 상태
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // 저장된 이메일과 자동 로그인 상태 가져오기
    const savedEmail = localStorage.getItem("savedEmail");
    const savedAutoLogin = localStorage.getItem("autoLogin") === "true";

    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    if (savedAutoLogin) {
      const token = localStorage.getItem("token");
      if (token) {
        navigate("/calendar", { replace: true }); // 자동으로 캘린더 페이지로 이동
      }
      setAutoLogin(true);
    }
  }, [navigate]);

  const handleRememberMeChange = (e) => {
    setRememberMe(e.target.checked);
  };

  const handleAutoLoginChange = (e) => {
    setAutoLogin(e.target.checked);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    const apiUrl = process.env.REACT_APP_API_URL;

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // 로그인 성공 처리
        setMessage(data.message);

        // 저장 설정
        localStorage.setItem("token", data.token); // JWT 토큰 저장
        localStorage.setItem("user", JSON.stringify(data.user)); // 사용자 정보 저장

        if (rememberMe) {
          localStorage.setItem("savedEmail", email); // 이메일 저장
        } else {
          localStorage.removeItem("savedEmail"); // 체크 해제 시 이메일 제거
        }

        if (autoLogin) {
          localStorage.setItem("autoLogin", "true"); // 자동 로그인 활성화
        } else {
          localStorage.removeItem("autoLogin"); // 자동 로그인 비활성화
        }

        //최초 로그인 판정 함수
        if(data.user.first_login_yn == 'y'){
          navigate("/projects", { replace: true }); // 캘린더로 이동
        }
        //최초 로그인이라면, 비밀번호 변경 페이지로 이동하게 하기 
        else if(data.user.first_login_yn == 'n'){
          navigate("/change-pw", { replace: true });
        }

      } else {
        // 로그인 실패 처리
        if (response.status === 403 && data.message === "승인 대기 중입니다!") {
          alert("승인 대기 중입니다. 관리자의 승인을 기다려주세요.");
        } else {
          setMessage(data.message);
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Login failed due to an error.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              type="text"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="checkbox-container">
            <div className="form-group remember-me">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={handleRememberMeChange}
              />
              <label htmlFor="rememberMe">아이디 저장</label>
            </div>
            <div className="form-group auto-login">
              <input
                type="checkbox"
                id="autoLogin"
                checked={autoLogin}
                onChange={handleAutoLoginChange}
              />
              <label htmlFor="autoLogin">자동 로그인</label>
            </div>
          </div>
          <button type="submit" className="login-button">
            로그인
          </button>
        </form>
        {/* 회원가입 */}
        {message && <div className="message">{message}</div>}
        <div className="footer">
          <p>
            Don't have an account? <Link to="/signup">회원가입</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
