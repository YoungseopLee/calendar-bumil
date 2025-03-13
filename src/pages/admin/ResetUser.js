import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./ResetUser.css";

const ResetUser = () => {
  const [employees, setEmployees] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [searchField, setSearchField] = useState("name");
  const [activeRoleFilter, setActiveRoleFilter] = useState(null); // ✅ 선택된 역할 필터

  const navigate = useNavigate();

  // 로그인한 사용자 정보 (localStorage에 저장된 최신 정보)
  const user = JSON.parse(localStorage.getItem("user"));
  const apiUrl = process.env.REACT_APP_API_URL;

  // 로그인한 사용자 정보 최신화 및 어드민 여부 체크
  useEffect(() => {
    fetchLoggedInUser();
    if (!user) {
      alert("로그인된 사용자 정보가 없습니다. 로그인해주세요.");
      navigate("/");
      return;
    }

    if (user.role_id !== "AD_ADMIN") {
      alert("관리자 권한이 없습니다.");
      navigate("/");
      return;
    }
  }, []);

  // 로그인한 사용자 정보 API 호출
  const fetchLoggedInUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/auth/get_logged_in_user`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        console.error("사용자 정보 불러오기 실패");
      }
    } catch (error) {
      console.error("로그인 사용자 정보 불러오기 실패:", error);
    }
  };

  // 로그아웃 함수
  const handleLogout = () => {
    alert("세션이 만료되었습니다. 다시 로그인해주세요.");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // ✅ 사용자 데이터 가져오기
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${apiUrl}/user/get_users`);
      if (!response.ok)
        throw new Error("사용자 데이터를 가져오는 데 실패했습니다.");

      const data = await response.json();
      setEmployees(data.users);
      console.log("사용자 데이터:", data.users);
    } catch (err) {
      console.error("데이터 불러오기 오류:", err);
    }
  };

  // ✅ 비밀번호 초기화 API 호출
  const handleResetPassword = async (employeeId, phone) => {
    try {
      // 전화번호의 뒷자리 4자리 추출
      const phoneLast4Digits = phone.slice(-4); // 전화번호에서 뒷자리 4자리

      // 비밀번호 설정: "bumil" + 전화번호 뒷자리 4자리
      const newPassword = `bumil${phoneLast4Digits}!`;

      const response = await fetch(`${apiUrl}/admin/update_user`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          id: employeeId,
          password: newPassword,
          first_login_yn: "N", // ✅ 첫 로그인 여부 초기화
        }),
      });

      if (!response.ok) throw new Error("비밀번호 초기화 실패");

      console.log("비밀번호 초기화 성공:", employeeId, newPassword);
      alert("✅ 비밀번호가 성공적으로 초기화되었습니다!");
    } catch (error) {
      console.error("비밀번호 초기화 오류:", error);
      console.log("Token:", localStorage.getItem("token"));

      alert("❌ 비밀번호 초기화에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // 검색 필드 한글 매핑
  const searchFieldLabelMap = {
    name: "이름",
    position: "직급",
    department: "부서",
  };

  // ✅ 검색 및 필터링
  const filterEmployees = (emp) => {
    if (activeRoleFilter && emp.role_id !== activeRoleFilter) return false;
    if (!searchText) return true;

    const value = emp[searchField]?.toLowerCase() || "";
    return value.includes(searchText.toLowerCase());
  };

  return (
    <div className="user-reset-page">
      <Sidebar />
      <div className="user-reset-box">
        <div className="user-reset-employee-container">
          <h2 className="user-reset-title">사용자 비밀번호 초기화</h2>
          {/* 🔍 검색 필터 */}
          <div className="user-reset-search-container">
            <select
              className="user-reset-search-dropdown"
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
            >
              <option value="name">이름</option>
              <option value="position">직급</option>
              <option value="department">부서</option>
            </select>

            <input
              type="text"
              className="user-reset-search-input"
              placeholder={`${searchFieldLabelMap[searchField]}를 입력하세요.`}
              onChange={(e) => setSearchText(e.target.value.trim())}
              value={searchText}
            />
          </div>
          {/* ✅ 인덱스 헤더 바 추가 */}
          <div className="user-reset-employee-index-bar">
            <span className="user-reset-index-item">이름</span>
            <span className="user-reset-index-item">직급</span>
            <span className="user-reset-index-item">초기화</span>
          </div>

          {/* ✅ 사용자 목록 */}
          <ul className="user-reset-employee-list">
            {employees.filter(filterEmployees).map((employee) => (
              <li key={employee.id} className="user-reset-employee-item">
                <span className="user-reset-column">{employee.name}</span>
                <span className="user-reset-column">{employee.position}</span>
                <div className="user-reset-action-buttons">
                  <button
                    className="user-reset-button"
                    onClick={() =>
                      handleResetPassword(employee.id, employee.phone_number)
                    }
                  >
                    초기화
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ResetUser;
