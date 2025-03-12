import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css"; // 기본 스타일
import "./ManageUser.css";

const ManageUser = () => {
  const [employees, setEmployees] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [searchField, setSearchField] = useState("name");

  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetchLoggedInUser();
    fetchEmployees();

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

  const fetchLoggedInUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/auth/get_logged_in_user`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
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

  const handleLogout = () => {
    alert("세션이 만료되었습니다. 다시 로그인해주세요.");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${apiUrl}/user/get_users`);
      if (!response.ok)
        throw new Error("유저 데이터를 가져오는 데 실패했습니다.");

      const data = await response.json();

      // 직급 우선순위 배열
      const positionOrder = [
        "대표이사",
        "부사장",
        "본부장",
        "이사",
        "상무",
        "팀장",
        "부장",
        "차장",
        "과장",
        "대리",
        "주임",
      ];

      // 직급 기준 정렬
      const sortedEmployees = data.users.sort((a, b) => {
        return (
          positionOrder.indexOf(a.position) - positionOrder.indexOf(b.position)
        );
      });

      // 부서를 기준으로 그룹화하여 정렬
      const groupedEmployees = [];
      const seenDepartments = new Set();

      sortedEmployees.forEach((employee) => {
        const { department, position } = employee;

        // 만약 이 부서를 처음 보는 거라면, 해당 직급의 첫 번째 인원을 추가
        if (!seenDepartments.has(department)) {
          seenDepartments.add(department);

          // 이 부서에 속한 모든 인원들을 추가
          const sameDepartmentEmployees = sortedEmployees.filter(
            (emp) => emp.department === department
          );
          groupedEmployees.push(...sameDepartmentEmployees);
        }
      });

      setEmployees(groupedEmployees);
    } catch (error) {
      console.error("데이터 불러오기 오류:", error);
    }
  };

  const handleDeleteUser = async (employeeId) => {
    if (!window.confirm("정말 이 유저를 삭제하시겠습니까?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${apiUrl}/admin/delete_user/${employeeId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // ✅ JSON 응답이 아닐 경우 대비
      const contentType = response.headers.get("content-type");
      let result;
      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        throw new Error("서버에서 올바른 JSON 응답을 반환하지 않았습니다.");
      }

      if (!response.ok) {
        throw new Error(result.message || "유저 삭제 실패");
      }

      alert("유저가 성공적으로 삭제되었습니다!");

      // 삭제된 유저를 제외한 목록을 즉시 업데이트
      setEmployees((prevEmployees) =>
        prevEmployees.filter((employee) => employee.id !== employeeId)
      );
    } catch (error) {
      console.error("❌ 유저 삭제 오류:", error);
      alert("❌ 유저 삭제에 실패했습니다.");
    }
  };

  const filterEmployees = (emp) => {
    if (!searchText) return true;
    const value = emp[searchField]?.toLowerCase() || "";
    return value.includes(searchText.toLowerCase());
  };

  // 검색 필드 한글 매핑
  const searchFieldLabelMap = {
    name: "이름",
    position: "직급",
    department: "부서",
  };

  return (
    <div className="manage-user-page">
      <Sidebar />
      <div className="manage-user-box">
        <div className="manage-user-list-container">
          <h2 className="manage-user-title">유저 관리</h2>
          {/* 🔍 검색 필터 */}
          <div className="manage-user-search-container">
            <select
              className="manage-user-search-dropdown"
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
            >
              <option value="name">이름</option>
              <option value="position">직급</option>
              <option value="department">부서</option>
            </select>

            <input
              type="text"
              className="manage-user-search-input"
              placeholder={`${searchFieldLabelMap[searchField]}를 입력하세요.`}
              onChange={(e) => setSearchText(e.target.value.trim())}
              value={searchText}
            />
          </div>

          {/* 유저 목록 */}
          <div className="manage-user-index-bar">
            <span className="manage-user-index-item">이름</span>
            <span className="manage-user-index-item">직급</span>
            <span className="manage-user-index-item">부서</span>
            <span className="manage-user-index-item">관리</span>
          </div>

          <ul className="manage-user-list">
            {employees.filter(filterEmployees).map((employee) => (
              <li key={employee.id} className="manage-user-item">
                <span className="manage-user-column">{employee.name}</span>
                <span className="manage-user-column">{employee.position}</span>
                <Tippy content={employee.department}>
                  <span className="manage-user-column">
                    {employee.department.length > 15
                      ? `${employee.department.substring(0, 15)}...`
                      : employee.department}
                  </span>
                </Tippy>
                <div className="manage-user-column manage-user-action-buttons">
                  <button
                    className="manage-user-edit-button"
                    onClick={() => {
                      const encodedId = encodeURIComponent(btoa(employee.id)); // URL 인코딩
                      navigate(`/edit-user/${encodedId}`);
                    }}
                  >
                    수정
                  </button>
                  <button
                    className="manage-user-delete-button"
                    onClick={() => handleDeleteUser(employee.id)}
                  >
                    삭제
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

export default ManageUser;
