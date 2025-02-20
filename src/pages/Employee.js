import React, { useState, useEffect } from "react";
import "./Employee.css";
import Sidebar from "./Sidebar";
import BackButton from "./BackButton";
import { useNavigate } from "react-router-dom";

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [favoriteEmployees, setFavoriteEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [isFavoritesOpen] = useState(true);

  const apiUrl = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();

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
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLoggedInUser();
  }, []);

  useEffect(() => {
    if (loggedInUserId) {
      fetchFavorites(loggedInUserId);
      fetchEmployees();
    }
  }, [loggedInUserId]); // ✅ 즐겨찾기 목록 변경될 때도 갱신

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

      if (!data.favorite || !Array.isArray(data.favorite)) {
        setFavoriteEmployees([]);
        return;
      }

      setFavoriteEmployees(data.favorite);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${apiUrl}/user/get_users`);
      if (!response.ok)
        throw new Error("사용자 데이터를 가져오는 데 실패했습니다.");
      const data = await response.json();
      setEmployees(data.users); // 필터링 없이 전체 사용자 목록 저장
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 렌더링 시에 즐겨찾기 목록 기준 필터링 적용
  const displayedEmployees = employees.filter(
    (emp) => !favoriteEmployees.some((fav) => fav.id === emp.id)
  );

  const toggleFavorite = async (employeeId) => {
    console.log("toggleFavorite 호출 - employeeId:", employeeId);
    if (!employeeId) {
      console.error("employeeId가 유효하지 않습니다:", employeeId);
      return;
    }

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

      if (!response.ok)
        throw new Error("즐겨찾기 상태를 업데이트하는 데 실패했습니다.");

      // ✅ 즐겨찾기 목록과 사원 목록 업데이트
      fetchFavorites(loggedInUserId);
      fetchEmployees();
    } catch (error) {
      setError(error.message);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "출근":
        return "status-work";
      case "외근":
        return "status-outside";
      case "휴가":
        return "status-vacation";
      case "파견":
        return "status-dispatch";
      default:
        return "status-default";
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case "외근":
        return "black";
      default:
        return "white";
    }
  };

  const handleSearch = (event) => {
    setSearchText(event.target.value.trim().toLowerCase());
  };

  if (loading) return <p>데이터를 불러오는 중...</p>;
  if (error) return <p>오류 발생: {error}</p>;

  return (
    <div className="app">
      <Sidebar />
      <BackButton />
      <div className="box">
        {/* <h2 className="title">내 즐겨찾기 목록</h2>
        {isFavoritesOpen && (
          <div className="favorite-list">
            {favoriteEmployees.length > 0 ? (
              favoriteEmployees.map((favorite, index) => (
                <div
                  key={favorite.id ? favorite.id : `${index}`}
                  className={`favorite-item ${getStatusClass(favorite.status)}`}
                >
                  <span
                    className="favorite-icon"
                    onClick={() => toggleFavorite(favorite.id)}
                  >
                    ★
                  </span>
                  <span className="employee-name">{favorite.name}</span>
                  <span className="employee-position">{favorite.position}</span>
                  <span
                    className={`employee-status ${getStatusClass(
                      favorite.status
                    )}`}
                    style={{ color: getStatusTextColor(favorite.status) }}
                  >
                    {favorite.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="no-favorites">즐겨찾기가 없습니다.</p>
            )}
          </div>
        )} */}

        <h2 className="title">사원 목록</h2>
        {/* <select
          className="department-dropdown"
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
        >
          <option value="">전체 부서</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select> */}

        <input
          type="text"
          className="search-input"
          placeholder="사원 이름으로 검색..."
          onChange={handleSearch}
        />

        <ul className="employee-list">
          {displayedEmployees
            .filter(
              (emp) =>
                !selectedDepartment ||
                emp.department.includes(selectedDepartment)
            )
            .filter((emp) => emp.name.toLowerCase().includes(searchText))
            .map((employee) => (
              <li
                key={employee.id}
                className={`employee-item ${getStatusClass(employee.status)}`}
                onClick={() => {
                  console.log(`선택한 사원: `, employee);
                  navigate(`/user-details?user_id=${employee.id}`); //클릭하면 사용자 상세 페이지로 이동
                }}
              >
                <span className="employee-name">{employee.name}</span>
                <span className="employee-position">{employee.position}</span>
                <span
                  className={`employee-status ${getStatusClass(
                    employee.status
                  )}`}
                  style={{ color: getStatusTextColor(employee.status) }}
                >
                  {employee.status}
                </span>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

export default EmployeeList;
