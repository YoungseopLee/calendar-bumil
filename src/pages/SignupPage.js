import React, { useState } from 'react';
import './SignupPage.css';

const SignupPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        username: '',
        rank: '',
        department: '',
        phone: '',
    });

    const [signupStatus, setSignupStatus] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log(process.env.REACT_APP_API_URL);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setSignupStatus('회원가입이 완료되었습니다!');
                alert('회원가입 성공!');
                window.history.back(); // 이전 페이지로 돌아감
            } else {
                setSignupStatus(data.message);
            }
        } catch (error) {
            console.error('Signup error:', error);
            setSignupStatus('오류로 인해 회원가입에 실패했습니다.');
        }
    };

    return (
        <div className="signup-body">
            <div className="signup-container">
                <h2>회원가입</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">이메일</label>
                        <input type="email" id="email" name="email" onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">비밀번호</label>
                        <input type="password" id="password" name="password" onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="username">사용자명</label>
                        <input type="text" id="username" name="username" onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="department">부서</label>
                        <input type="text" id="department" name="department" onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="rank">직급</label>
                        <input type="text" id="rank" name="rank" onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="phone">전화번호</label>
                        <input type="tel" id="phone" name="phone" onChange={handleChange} required />
                    </div>
                    <div className="signup-button-container">
                        <button type="submit" className="signup-button">회원가입</button>
                        <button type="submit" className="cancle-button" onClick={() => window.history.back()}>돌아가기</button>
                    </div>
                </form>
                {signupStatus && <div className="message">{signupStatus}</div>}
            </div>
        </div>
    );
};

export default SignupPage;
