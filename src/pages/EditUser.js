import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./EditUser.css";

const EditUser = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;
  const [userData, setUserData] = useState({
    username: "",
    position: "",
    department: "",
    phone: "",
    role_id: "",
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${apiUrl}/user/get_user?user_id=${userId}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok)
        throw new Error("유저 데이터를 가져오는 데 실패했습니다.");

      const data = await response.json();
      setUserData({
        username: data.user.name,
        position: data.user.position,
        department: data.user.department,
        phone: data.user.phone_number,
        role_id: data.user.role_id,
      });
    } catch (error) {
      console.error("유저 데이터 불러오기 오류:", error);
      alert("유저 데이터를 불러오는데 실패했습니다.");
    }
  };

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/admin/edit_user`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: userId, ...userData }),
      });

      if (!response.ok) throw new Error("유저 정보 수정 실패");

      alert("✅ 유저 정보가 성공적으로 수정되었습니다!");
      navigate("/manage-users");
    } catch (error) {
      console.error("유저 수정 오류:", error);
      alert("❌ 유저 수정에 실패했습니다.");
    }
  };

  return (
    <div className="edit-user-container">
      <h2 className="edit-user-title">유저 정보 수정</h2>
      <form className="edit-user-form" onSubmit={handleSubmit}>
        <label>이름</label>
        <input
          type="text"
          name="username"
          value={userData.username}
          onChange={handleChange}
          required
        />

        <label>직급</label>
        <input
          type="text"
          name="position"
          value={userData.position}
          onChange={handleChange}
          required
        />

        <label>부서</label>
        <input
          type="text"
          name="department"
          value={userData.department}
          onChange={handleChange}
          required
        />

        <label>전화번호</label>
        <input
          type="text"
          name="phone"
          value={userData.phone}
          onChange={handleChange}
          required
        />

        <label>권한</label>
        <select
          name="role_id"
          value={userData.role_id}
          onChange={handleChange}
          required
        >
          <option value="USER">일반 사용자</option>
          <option value="MANAGER">매니저</option>
          <option value="ADMIN">관리자</option>
        </select>

        <div className="edit-user-buttons">
          <button type="submit" className="edit-user-save-button">
            저장
          </button>
          <button
            type="button"
            className="edit-user-cancel-button"
            onClick={() => navigate("/manage-users")}
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditUser;
