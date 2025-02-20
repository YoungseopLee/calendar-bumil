import React, { useState, useEffect } from "react";
import "./Employee.css";
import Sidebar from "./Sidebar";
import BackButton from "./BackButton";
import { useNavigate } from "react-router-dom";


const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [favoriteEmployees, setFavoriteEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [searchField, setSearchField] = useState("name"); 
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [statusList, setStatusList] = useState([]);
  const [userRole, setUserRole] = useState(null); // AD_ADMIN, USR_GENERAL


  const apiUrl = process.env.REACT_APP_API_URL;

  const fetchStatusList = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/status/get_status_list`
      );
      if (!response.ok) throw new Error("상태 목록을 불러오지 못했습니다.");
      const data = await response.json();
      setStatusList(data.statuses);
    } catch (error) {
      console.error("상태 목록 로딩 오류:", error);
    }
  };

  useEffect(() => {
    const fetchLoggedInUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("사용자 인증 정보가 없습니다.");
    
        const response = await fetch(`${apiUrl}/auth/get_logged_in_user`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
    
        if (!response.ok)
          throw new Error("로그인 사용자 정보를 가져오는 데 실패했습니다.");
    
        const data = await response.json();
        setLoggedInUserId(data.user.id);
        setUserRole(data.user.role_id); 
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLoggedInUser();
    fetchStatusList();
  }, []);

  useEffect(() => {
    if (loggedInUserId) {
      fetchFavorites(loggedInUserId);
      fetchEmployees();
    }
  }, [loggedInUserId]);

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
          credentials: "include",
        }
      );

      if (!response.ok)
        throw new Error("즐겨찾기 목록을 가져오는 데 실패했습니다.");

      const data = await response.json();
      setFavoriteEmployees(data.favorite || []);
    } catch (err) {
      setError(err.message);
    }
  };

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
  
      fetchFavorites(loggedInUserId);
    } catch (error) {
      setError(error.message);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${apiUrl}/user/get_users`);
      if (!response.ok)
        throw new Error("사용자 데이터를 가져오는 데 실패했습니다.");

      const data = await response.json();
      setEmployees(data.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event) => {
    setSearchText(event.target.value.trim().toLowerCase());
  };

  const handleSearchFieldChange = (event) => {
    setSearchField(event.target.value);
    setSearchText("");
  };

  const filterEmployees = (emp) => {
    if (!searchText) return true;
    const value = emp[searchField]?.toLowerCase() || "";
    return value.includes(searchText);
  };

  if (loading) return <p>데이터를 불러오는 중...</p>;
  if (error) return <p>오류 발생: {error}</p>;


  const handleStatusChange = async (employeeId, newStatus) => {
    try {
      const response = await fetch(`${apiUrl}/status/update_status`, {  // ✅ API 경로 수정
        method: "PUT", 
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,  // ✅ JWT 토큰 포함
        },
        body: JSON.stringify({
          user_id: employeeId, 
          status: newStatus, 
        }),
      });
  
      if (!response.ok) throw new Error("상태 변경 실패 + " + response.status);
  
      fetchEmployees(); 
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="app">
      <Sidebar />
      <BackButton />
      <div className="box">
        <h2 className="title">사원 목록</h2>
  
        <div className="toggle-container">
          <button className="toggle-button" onClick={() => setShowFavorites(!showFavorites)}>
            {showFavorites ? "전체 사원 보기" : "즐겨찾기 보기"}
          </button>
        </div>
  
        <div className="search-container">
          <select className="search-dropdown" value={searchField} onChange={handleSearchFieldChange}>
            <option value="name">이름</option>
            <option value="position">직급</option>
            <option value="department">부서</option>
            <option value="status">상태</option>
          </select>
  
          <input
            type="text"
            className="search-input"
            placeholder={`검색할 ${searchField} 입력...`}
            onChange={handleSearch}
            value={searchText}
          />
        </div>
        <ul className="employee-list">
          {(showFavorites ? favoriteEmployees : employees)
            .filter(filterEmployees)
            .map((employee) => (
              <li
                key={employee.id}
                className={`employee-item`}
              >
                <span
                  className={`favorite-icon ${favoriteEmployees.some((fav) => fav.id === employee.id) ? "" : "not-favorite"}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(employee.id);
                  }}
                >
                  ★
                </span>
                <span className="employee-name">{employee.name}</span>
                <span className="employee-position">{employee.position}</span>

                {/* ✅ 관리자(admin)만 상태 변경 가능 */}
                {userRole === "AD_ADMIN" ? (
                  <select
                    className="status-dropdown"
                    value={employee.status} 
                    onChange={(e) => handleStatusChange(employee.id, e.target.value)}
                  >
                    {statusList.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.comment}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span>{employee.status}</span> 
                )}
              </li>
            ))}
        </ul>  

      </div>
    </div>
  );

};

export default EmployeeList;

