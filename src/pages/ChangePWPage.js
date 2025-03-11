import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ChangePWPage.css";

const ChangePWPage = () => {
  const [formData, setFormData] = useState({
    old_password: "", //현재 비밀번호
    new_password: "", //변경할 비밀번호
    confirm_password: "", // 비밀번호 확인용
  });
  const [changepwStatus, setchangepwStatus] = useState("");
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();
  const loggedInUser = JSON.parse(localStorage.getItem("user")); // 본인 정보 수정을 위해 로그인한 유저의 정보 가져오기

  const validateForm = () => {
    let newErrors = {};
    const passwordRegex =
      /^(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(formData.new_password)) {
      newErrors.new_password =
        "비밀번호는 최소 8자리, 숫자 1개, 특수문자 1개 포함해야 합니다.";
    }

    // 비밀번호 확인 검사
    if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password =
        "비밀번호와 비밀번호 확인이 일치하지 않습니다.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/change_password`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setchangepwStatus("비밀번호 변경이 완료되었습니다!");
        alert("비밀번호 변경 성공!");
        navigate("/calendar");
      } else {
        setchangepwStatus(data.message);
      }
    } catch (error) {
      console.error("Change error:", error);
      setchangepwStatus("오류로 인해 비밀번호 변경에 실패했습니다.");
    }
  };

  return (
    <div className="changepw-body">
      <div className="changepw-container">
        <h2>
          {loggedInUser.first_login_yn === "Y"
            ? "비밀번호 변경 페이지"
            : "최초 비밀번호 변경 페이지"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group-changepw">
            <label htmlFor="old_password">현재 비밀번호</label>
            <input
              type="password"
              id="old_password"
              name="old_password"
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group-changepw">
            <label htmlFor="new_password">변경 비밀번호</label>
            <input
              type="password"
              id="new_password"
              name="new_password"
              onChange={handleChange}
              required
            />
            {errors.new_password && (
              <div className="error">{errors.new_password}</div>
            )}
          </div>
          <div className="form-group-changepw">
            <label htmlFor="confirm_password">변경 비밀번호 확인</label>
            <input
              type="password"
              id="confirm_password"
              name="confirm_password"
              onChange={handleChange}
              required
            />
            {errors.confirm_password && (
              <div className="error">{errors.confirm_password}</div>
            )}
          </div>
          <div className="changepw-button-container">
            <button type="submit" className="changepw-button">
              비밀번호 변경
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
        {changepwStatus && <div className="message">{changepwStatus}</div>}
      </div>
    </div>
  );
};

export default ChangePWPage;
