import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./LoginPage.css";

const LoginPage = () => {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false); // 아이디 저장 상태
  const [autoLogin, setAutoLogin] = useState(false); // 자동 로그인 상태
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // 저장된 이메일과 자동 로그인 상태 가져오기
    const savedId = localStorage.getItem("savedId");
    const savedAutoLogin = localStorage.getItem("autoLogin") === "true";

    if (savedId) {
      setId(savedId);
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
        body: JSON.stringify({ id, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
      
        // ✅ 토큰 저장
        localStorage.setItem("token", data.token);
      
        // ✅ 전체 사용자 정보 다시 요청
        const userResponse = await fetch(`${apiUrl}/auth/get_logged_in_user`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${data.token}`,
          },
        });
      
        if (userResponse.ok) {
          const userData = await userResponse.json();
          localStorage.setItem("user", JSON.stringify(userData.user)); // ✅ 최신 사용자 정보 저장
        }
      
        // ✅ 로그인 옵션 설정
        if (rememberMe) {
          localStorage.setItem("savedId", id);
        } else {
          localStorage.removeItem("savedId");
        }
      
        if (autoLogin) {
          localStorage.setItem("autoLogin", "true");
        } else {
          localStorage.removeItem("autoLogin");
        }
      
        // ✅ 최초 로그인 여부에 따라 라우팅
        if (data.user.first_login_yn === "y") {
          navigate("/projects", { replace: true });
        } else if (data.user.first_login_yn === "n") {
          navigate("/change-pw", { replace: true });
        }
      }
      else {
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
            <label htmlFor="id">E-mail</label>
            <input
              type="text"
              id="id"
              name="id"
              value={id}
              onChange={(e) => setId(e.target.value)}
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
