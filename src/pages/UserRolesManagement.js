import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import "./UserRolesManagement.css";

const UserRolesManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [searchField, setSearchField] = useState("name");
  const [activeRoleFilter, setActiveRoleFilter] = useState(null); // ✅ 선택된 역할 필터

  const apiUrl = process.env.REACT_APP_API_URL;

  // ✅ 사용자 데이터 가져오기
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${apiUrl}/user/get_users`);
      if (!response.ok) throw new Error("사용자 데이터를 가져오는 데 실패했습니다.");

      const data = await response.json();
      setEmployees(data.users);
    } catch (err) {
      console.error("데이터 불러오기 오류:", err);
    }
  };

  // ✅ 역할 드롭다운 변경 핸들러
  const handleRoleChange = async (employeeId, newRoleId) => {
    try {
      const response = await fetch(`${apiUrl}/user/update_role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          user_id: employeeId,
          role_id: newRoleId,
        }),
      });

      if (!response.ok) throw new Error("역할 변경 실패");

      alert("✅ 역할이 성공적으로 변경되었습니다!");
      fetchEmployees();
    } catch (error) {
      console.error("역할 변경 오류:", error);
    }
  };

  // ✅ 역할 필터링 로직
  const handleRoleFilter = (roleId) => {
    setActiveRoleFilter((prev) => (prev === roleId ? null : roleId)); // ✅ 동일 역할 클릭 시 전체 보기
  };

  // ✅ 검색 및 필터링
  const filterEmployees = (emp) => {
    if (activeRoleFilter && emp.role_id !== activeRoleFilter) return false;
    if (!searchText) return true;

    const value = emp[searchField]?.toLowerCase() || "";
    return value.includes(searchText.toLowerCase());
  };

  return (
    <div className="user-roles-page">
      <Sidebar />

      <div className="box">
        <h2 className="title">사용자 역할 관리</h2>

        {/* 🔍 검색 필터 */}
        <div className="search-container">
          <select
            className="search-dropdown"
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
          >
            <option value="name">이름</option>
            <option value="position">직급</option>
            <option value="department">부서</option>
          </select>

          <input
            type="text"
            className="search-input"
            placeholder={`검색할 ${searchField} 입력...`}
            onChange={(e) => setSearchText(e.target.value.trim())}
            value={searchText}
          />
        </div>

        {/* ✅ 권한별 필터 토글 버튼 */}
        <div className="role-toggle-container">
          {[
            { id: "AD_ADMIN", label: "어드민" },
            { id: "PR_ADMIN", label: "프로젝트 관리자" },
            { id: "PR_MANAGER", label: "PM" },
            { id: "USR_GENERAL", label: "유저" },
          ].map((role) => (
            <button
              key={role.id}
              className={`role-toggle-button ${activeRoleFilter === role.id ? "active" : ""}`}
              onClick={() => handleRoleFilter(role.id)}
            >
              {role.label}
            </button>
          ))}
        </div>

        {/* ✅ 사용자 목록 */}
        <ul className="employee-list">
          {employees.filter(filterEmployees).map((employee) => (
            <li key={employee.id} className="employee-item">
              <span className="employee-name">{employee.name}</span>
              <span className="employee-position">{employee.position}</span>

              {/* ✅ 역할 변경 드롭다운 */}
              <select
                className="role-dropdown"
                value={employee.role_id}
                onChange={(e) => handleRoleChange(employee.id, e.target.value)}
              >
                <option value="AD_ADMIN">어드민</option>
                <option value="PR_ADMIN">프로젝트 관리자</option>
                <option value="PR_MANAGER">PM</option>
                <option value="USR_GENERAL">유저</option>
              </select>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UserRolesManagement;