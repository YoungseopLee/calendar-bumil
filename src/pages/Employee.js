import React, { useState, useEffect } from "react";
import "./Employee.css";
import Sidebar from "./Sidebar";
import BackButton from "./BackButton";
import { useNavigate } from "react-router-dom";

const EmployeeList = () => {
  // ✅ 상태 관리 (State)
  const [employees, setEmployees] = useState([]); // 전체 사원 목록
  const [favoriteEmployees, setFavoriteEmployees] = useState([]); // 즐겨찾기 목록
  const [statusList, setStatusList] = useState([]); // 상태 목록 (근무 중, 휴가 등)

  const [loggedInUserId, setLoggedInUserId] = useState(null); // 로그인된 사용자 ID
  const [userRole, setUserRole] = useState(null); // 로그인된 사용자 역할 (AD_ADMIN, USR_GENERAL 등)

  const [loading, setLoading] = useState(true); // 데이터 로딩 상태
  const [error, setError] = useState(null); // 에러 메시지

  const [searchText, setSearchText] = useState(""); // 검색 텍스트
  const [searchField, setSearchField] = useState("name"); // 검색 기준 필드 (이름, 직급 등)
  const [showFavorites, setShowFavorites] = useState(false); // 즐겨찾기 보기 여부 (true/false)

  const navigate = useNavigate(); // 페이지 이동 훅
  const apiUrl = process.env.REACT_APP_API_URL; // API URL 환경 변수

  // 🔄 **1. 로그인 사용자 정보 및 상태 목록 로딩**
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // 로그인한 사용자 정보 불러오기
        const token = localStorage.getItem("token");
        if (!token) throw new Error("사용자 인증 정보가 없습니다.");

        const response = await fetch(`${apiUrl}/auth/get_logged_in_user`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok)
          throw new Error("로그인 사용자 정보를 가져오는 데 실패했습니다.");
        const data = await response.json();

        setLoggedInUserId(data.user.id); // 사용자 ID 저장
        setUserRole(data.user.role_id); // 사용자 역할 저장
        await fetchStatusList(); // 상태 목록 불러오기
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // 🔄 **2. 사용자 및 즐겨찾기 목록 불러오기**
  useEffect(() => {
    if (loggedInUserId) {
      fetchFavorites(loggedInUserId); // 즐겨찾기 목록
      fetchEmployees(); // 사원 목록
    }
  }, [loggedInUserId]);

  // 🏷️ **상태 목록 가져오기 (근무 중, 휴가 등)**
  const fetchStatusList = async () => {
    try {
      const response = await fetch(`${apiUrl}/status/get_status_list`);
      if (!response.ok) throw new Error("상태 목록을 불러오지 못했습니다.");

      const data = await response.json();
      setStatusList(data.statuses);
    } catch (error) {
      console.error("상태 목록 로딩 오류:", error);
    }
  };

  // ⭐ **즐겨찾기 목록 가져오기**
  const fetchFavorites = async (userId) => {
    try {
      const response = await fetch(
        `${apiUrl}/favorite/get_favorites?user_id=${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok)
        throw new Error("즐겨찾기 목록을 가져오는 데 실패했습니다.");

      const data = await response.json();
      setFavoriteEmployees(data.favorite || []);
      fetchEmployees(); // 사원 목록 새로고침
    } catch (err) {
      setError(err.message);
    }
  };

  // 👥 **사원 목록 가져오기**
  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${apiUrl}/user/get_users`);
      if (!response.ok)
        throw new Error("사원 데이터를 가져오는 데 실패했습니다.");

      const data = await response.json();
      setEmployees(data.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ⭐ **즐겨찾기 추가/삭제 (토글)**
  const toggleFavorite = async (employeeId) => {
    if (!loggedInUserId) return;

    try {
      const response = await fetch(`${apiUrl}/favorite/toggle_favorite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          user_id: loggedInUserId,
          favorite_user_id: employeeId,
        }),
      });

      if (!response.ok) throw new Error("즐겨찾기 상태 업데이트 실패");

      fetchFavorites(loggedInUserId); // 즐겨찾기 목록 새로고침
    } catch (error) {
      setError(error.message);
    }
  };

  // 🔄 **사원 상태 변경 (관리자만 가능)**
  const handleStatusChange = async (employeeId, newStatus) => {
    try {
      const response = await fetch(`${apiUrl}/admin/update_status_admin`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          user_id: employeeId,
          status: newStatus,
        }),
      });

      if (!response.ok) throw new Error("상태 변경 실패!");

      alert("상태가 성공적으로 변경되었습니다! ✅");

      // ✅ 전체 사원 목록 새로고침
      fetchEmployees();

      // ✅ 즐겨찾기 목록도 새로고침
      if (showFavorites) {
        fetchFavorites(loggedInUserId);
      }
    } catch (error) {
      alert("❌ 상태 변경에 실패했습니다!");
      setError(error.message);
    }
  };

  // 🔍 **검색 필터링 로직**
  const filterEmployees = (emp) => {
    if (!searchText) return true;
    const value = emp[searchField]?.toLowerCase() || "";
    return value.includes(searchText);
  };

  // ⏳ **로딩 및 에러 처리**
  if (loading) return <p>데이터를 불러오는 중...</p>;
  if (error) return <p>오류 발생: {error}</p>;

  // 📋 **UI 구성 (사원 목록 렌더링)**
  return (
    <div className="app">
      <Sidebar />
      <BackButton />

      <div className="box">
        <h2 className="title">사원 목록</h2>

        {/* 🔄 즐겨찾기 토글 */}
        <div className="toggle-container">
          <button
            className="toggle-button"
            onClick={() => setShowFavorites(!showFavorites)}
          >
            {showFavorites ? "전체 사원 보기" : "즐겨찾기 보기"}
          </button>
        </div>

        {/* 🔍 검색 UI */}
        <div className="search-container">
          <select
            className="search-dropdown"
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
          >
            <option value="name">이름</option>
            <option value="position">직급</option>
            <option value="department">부서</option>
            <option value="status">상태</option>
          </select>

          <input
            type="text"
            className="search-input"
            placeholder={`검색어를 입력해주세요...`}
            onChange={(e) => setSearchText(e.target.value.trim().toLowerCase())}
            value={searchText}
          />
        </div>

        {/* 스크롤 가능한 컨테이너 추가 */}
        <div className="employee-list-container">
          {/* 🏷️ 인덱스 바 - sticky로 변경 */}
          <div className="employee-index-bar sticky-header">
            <span className="index-item-1">즐겨찾기</span>
            <span className="index-item">이름</span>
            <span className="index-item">직급</span>
            <span className="index-item">상태</span>
          </div>

          {/* 👥 사원 목록 렌더링 */}
          <ul className="employee-list">
            {(showFavorites ? favoriteEmployees : employees)
              .filter(filterEmployees)
              .map((employee) => (
                <li
                  key={employee.id}
                  className="employee-item"
                  onClick={() =>
                    navigate(`/user-details?user_id=${employee.id}`)
                  }
                >
                  {/* ⭐ 즐겨찾기 토글 */}
                  <span
                    className={`favorite-icon ${
                      favoriteEmployees.some((fav) => fav.id === employee.id)
                        ? ""
                        : "not-favorite"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(employee.id);
                    }}
                  >
                    ★
                  </span>

                  {/* 🔠 사원 정보 */}
                  <span className="employee-name">{employee.name}</span>
                  <span className="employee-position">{employee.position}</span>

                  {/* 🔄 관리자 전용 상태 변경 드롭다운 */}
                  {userRole === "AD_ADMIN" ? (
                    <select
                      className="status-dropdown"
                      value={employee.status || ""}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        handleStatusChange(employee.id, e.target.value)
                      }
                    >
                      {statusList.map((status, index) => (
                        <option
                          key={`${status.comment}-${index}`}
                          value={status.id}
                        >
                          {status.comment}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="status-dropdown2">
                      {employee.status === "DISPATCH"
                        ? "파견"
                        : employee.status === "HQ"
                        ? "본사"
                        : employee.status === "LEAVE"
                        ? "휴가"
                        : employee.status === "OUT"
                        ? "외근"
                        : employee.status}
                    </span>
                  )}
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EmployeeList;
