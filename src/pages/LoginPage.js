// LoginPage.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage('');
    
        const apiUrl = process.env.REACT_APP_API_URL;
    
        try {
            const response = await fetch(`${apiUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });
    
            const data = await response.json();
    
            if (response.ok) {
                // 로그인 성공 처리
                setMessage(data.message);
                console.log('User info:', data.user);
    
                // 로컬 스토리지 설정 전에 `localStorage`가 null이 아닌지 확인
                if (typeof localStorage !== "undefined") {
                    localStorage.setItem('token', data.token); // JWT 토큰 저장
                    localStorage.setItem('user', JSON.stringify(data.user)); // 사용자 정보 저장
                } else {
                    console.error("localStorage is not supported in this environment");
                }
    
                navigate('/calendar'); // 캘린더로 바로 이동 (state 불필요)
            } else {
                // 로그인 실패 처리
                if (response.status === 403 && data.message === '승인 대기 중입니다!') {
                    alert('승인 대기 중입니다. 관리자의 승인을 기다려주세요.');
                } else {
                    setMessage(data.message);
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            setMessage('Login failed due to an error.');
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
                    <button type="submit" className="login-button">로그인</button>
                </form>
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