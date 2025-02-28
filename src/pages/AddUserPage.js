import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import "./AddUserPage.css"; // 스타일 파일 추가

const AddUserPage = () => {
  const [formData, setFormData] = useState({
    id: "",
    password: "",
    username: "",
    position: "",
    department: "",
    phone: "",
    role_id: "USR_GENERAL",
  });

  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [signupStatus, setSignupStatus] = useState("");

  useEffect(() => {
    // API 호출
    const fetchData = async () => {
      try {
        const deptRes = await fetch(
          `${process.env.REACT_APP_API_URL}/admin/get_department_list`
        );
        const posRes = await fetch(
          `${process.env.REACT_APP_API_URL}/admin/get_position_list`
        );
        const roleRes = await fetch(
          `${process.env.REACT_APP_API_URL}/admin/get_role_list`
        );

        const deptData = await deptRes.json();
        const posData = await posRes.json();
        const roleData = await roleRes.json();

        console.log("부서 데이터:", deptData);
        console.log("직급 데이터:", posData);
        console.log("권한 데이터:", roleData);

        setDepartments(Array.isArray(deptData) ? deptData : []);
        setPositions(Array.isArray(posData) ? posData : []);
        setRoles(Array.isArray(roleData) ? roleData : []);
      } catch (error) {
        console.error("데이터 불러오기 오류:", error);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/admin/add_user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("✅ 유저 추가 성공!");
        setSignupStatus("유저 추가 완료!");
        setFormData({
          id: "",
          password: "",
          username: "",
          position: "",
          department: "",
          phone: "",
          role_id: "USR_GENERAL",
        });
      } else {
        alert(`⚠️ 유저 추가 실패: ${data.message}`);
        setSignupStatus(data.message);
      }
    } catch (error) {
      console.error("유저 추가 오류:", error);
      alert("❌ 유저 추가 중 오류가 발생했습니다.");
      setSignupStatus("유저 추가 실패.");
    }
  };

  return (
    <div className="user-add-body">
      <Sidebar />
      <div className="user-add-container">
        <h2>신규 사원 추가</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>이메일 (아이디)</label>
            <input
              type="email"
              name="id"
              value={formData.id}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>비밀번호</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>이름</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>부서</label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
            >
              <option value="">부서를 선택하세요</option>
              {departments.map((dept, index) => (
                <option key={index} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>직급</label>
            <select
              name="position"
              value={formData.position}
              onChange={handleChange}
              required
            >
              <option value="">직급을 선택하세요</option>
              {positions.map((pos, index) => (
                <option key={index} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>전화번호</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>권한</label>
            <select
              name="role_id"
              value={formData.role_id}
              onChange={handleChange}
            >
              <option value="">권한을 선택하세요</option>
              {roles.map((role, index) => (
                <option key={index} value={role.id}>
                  {role.comment} ({role.id})
                </option>
              ))}
            </select>
          </div>
          <div className="user-add-button-container">
            <button type="submit" className="user-add-button">
              추가하기
            </button>
            <button
              type="button"
              className="cancel-button"
              onClick={() => window.history.back()}
            >
              돌아가기
            </button>
          </div>
        </form>
        {signupStatus && <p className="message">{signupStatus}</p>}
      </div>
    </div>
  );
};

export default AddUserPage;
