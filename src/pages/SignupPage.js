import React, { useState } from "react";
import "./SignupPage.css";

const SignupPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    rank: "",
    department: "",
    phone: "",
  });

  const [signupStatus, setSignupStatus] = useState("");
  const [errors, setErrors] = useState({});

  const departments = [
    "전략사업본부",
    "전략사업본부 DT사업부 DT사업팀",
    "전략사업본부 DT사업부 보안솔루션팀",
    "전략사업본부 DT사업부 MSP팀",
    "전략사업본부 개발사업부 교육개발팀",
    "전략사업본부 개발사업부 SI개발팀",
    "전략사업본부 사업지원팀",
    "전략사업본부 특수사업부",
    "비티에이",
  ];
  const ranks = [
    "대표이사",
    "부사장",
    "전무",
    "본부장",
    "이사",
    "상무",
    "팀장",
    "부장",
    "과장",
    "차장",
    "대리",
    "주임",
    "사원",
  ];

  // 전화번호 입력 시 자동으로 '-' 추가
  const formatPhoneNumber = (value) => {
    // 숫자만 남기기
    const onlyNumbers = value.replace(/\D/g, "");

    if (onlyNumbers.length <= 3) {
      return onlyNumbers;
    } else if (onlyNumbers.length <= 7) {
      return `${onlyNumbers.slice(0, 3)}-${onlyNumbers.slice(3)}`;
    } else {
      return `${onlyNumbers.slice(0, 3)}-${onlyNumbers.slice(
        3,
        7
      )}-${onlyNumbers.slice(7, 11)}`;
    }
  };

  const validateForm = () => {
    let newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^010-\d{4}-\d{4}$/; // 010-xxxx-xxxx 형식
    const passwordRegex =
      /^(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!emailRegex.test(formData.email)) {
      newErrors.email = "올바른 이메일 형식이 아닙니다.";
    }

    if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "전화번호 형식은 010-1234-5678 입니다.";
    }

    if (!passwordRegex.test(formData.password)) {
      newErrors.password =
        "비밀번호는 최소 8자리, 숫자 1개, 특수문자 1개 포함해야 합니다.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      setFormData({ ...formData, phone: formatPhoneNumber(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSignupStatus("회원가입이 완료되었습니다!");
        alert("회원가입 성공!");
        window.history.back();
      } else {
        setSignupStatus(data.message);
      }
    } catch (error) {
      console.error("Signup error:", error);
      setSignupStatus("오류로 인해 회원가입에 실패했습니다.");
    }
  };

  return (
    <div className="signup-body">
      <div className="signup-container">
        <h2>회원가입</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">이메일 (아이디)</label>
            <input
              type="email"
              id="email"
              name="email"
              onChange={handleChange}
              required
            />
            {errors.email && <div className="error">{errors.email}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              name="password"
              onChange={handleChange}
              required
            />
            {errors.password && <div className="error">{errors.password}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="username">이름</label>
            <input
              type="text"
              id="username"
              name="username"
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="department">부서</label>
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
            >
              <option value="">부서를 선택하세요</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="rank">직급</label>
            <select
              id="rank"
              name="rank"
              value={formData.rank}
              onChange={handleChange}
              required
            >
              <option value="">직급을 선택하세요</option>
              {ranks.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="phone">전화번호</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
            {errors.phone && <div className="error">{errors.phone}</div>}
          </div>
          <div className="signup-button-container">
            <button type="submit" className="signup-button">
              회원가입
            </button>
            <button
              type="button"
              className="cancle-button"
              onClick={() => window.history.back()}
            >
              돌아가기
            </button>
          </div>
        </form>
        {signupStatus && <div className="message">{signupStatus}</div>}
      </div>
    </div>
  );
};

export default SignupPage;
