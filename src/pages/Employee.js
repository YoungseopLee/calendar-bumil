import React, { useState, useEffect } from "react";
import "./Employee.css";
import Sidebar from "./Sidebar";
import BackButton from "./BackButton";

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

    useEffect(() => {
        const fetchLoggedInUser = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error("사용자 인증 정보가 없습니다.");

                const response = await fetch(`${apiUrl}/get_logged_in_user`, {
                    method: "GET",
                    headers: { "Authorization": `Bearer ${token}` },
                });

                if (!response.ok) throw new Error("로그인 사용자 정보를 가져오는 데 실패했습니다.");

                const data = await response.json();
                setLoggedInUserId(data.user.id);
                fetchFavorites(data.user.id);
                fetchEmployees();
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLoggedInUser();
    }, []);

    const fetchStatus = async (employeeId) => {
        try {
            const response = await fetch(`${apiUrl}/get_user_status?user_id=${employeeId}`);
            if (!response.ok) throw new Error("사용자 상태를 가져오는 데 실패했습니다.");

            const data = await response.json();
            return data.status || "출근";
        } catch (err) {
            console.error("사용자 상태 가져오기 오류:", err);
            return "출근";
        }
    };

    const fetchFavorites = async (userId) => {
        try {
            const response = await fetch(`${apiUrl}/get_favorites?user_id=${userId}`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
            });

            if (!response.ok) throw new Error("즐겨찾기 목록을 가져오는 데 실패했습니다.");

            const data = await response.json();
            const favoritesWithStatus = await Promise.all(
                data.favorites.map(async (favorite) => {
                    const status = await fetchStatus(favorite.id);
                    return { ...favorite, status };
                })
            );

            setFavoriteEmployees(favoritesWithStatus);
        } catch (err) {
            setError(err.message);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await fetch(`${apiUrl}/get_users`);
            if (!response.ok) throw new Error("사용자 데이터를 가져오는 데 실패했습니다.");

            const data = await response.json();
            const employeesWithStatus = await Promise.all(
                data.users.map(async (employee) => {
                    const status = await fetchStatus(employee.id);
                    return { ...employee, status };
                })
            );

            setEmployees(employeesWithStatus);

            const uniqueDepartments = [...new Set(data.users.map(emp => emp.department))];
            setDepartments(uniqueDepartments);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleFavorite = async (employeeId) => {
        try {
            const response = await fetch(`${apiUrl}/toggle_favorite`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ user_id: loggedInUserId, favorite_user_id: employeeId }),
            });

            if (!response.ok) throw new Error("즐겨찾기 상태를 업데이트하는 데 실패했습니다.");

            fetchFavorites(loggedInUserId);
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
    
    /* ✅ 상태별 텍스트 색상 변경 */
    const getStatusTextColor = (status) => {
        switch (status) {
            case "외근": // 밝은 배경
                return "black";
            default: // 어두운 배경
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
                <h2 className="title">내 즐겨찾기 목록</h2>
                {isFavoritesOpen && (
                    <div className="favorite-list">
                        {favoriteEmployees.length > 0 ? (
                            favoriteEmployees.map((favorite) => (
                                <div key={favorite.id} className={`favorite-item ${getStatusClass(favorite.status)}`}>
                                    <span className="favorite-icon" onClick={() => toggleFavorite(favorite.id)}>★</span>
                                    <span className="employee-name">{favorite.name}</span>
                                    <span className="employee-position">{favorite.position}</span>
                                    <span 
                                        className={`employee-status ${getStatusClass(favorite.status)}`} 
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
                )}

                <h2 className="title">사원 목록</h2>
                <select
                    className="department-dropdown"
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                    <option value="">전체 부서</option>
                    {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                    ))}
                </select>

                <input type="text" className="search-input" placeholder="사원 이름으로 검색..." onChange={handleSearch} />

                <ul className="employee-list">
                    {employees
                        .filter(emp => !selectedDepartment || emp.department === selectedDepartment)
                        .filter(emp => emp.name.toLowerCase().includes(searchText))
                        .map((employee) => (
                            <li key={employee.id} className={`employee-item ${getStatusClass(employee.status)}`}>
                                <span className="favorite-icon" onClick={() => toggleFavorite(employee.id)}>
                                    {favoriteEmployees.some(fav => fav.id === employee.id) ? "★" : "☆"}
                                </span>
                                <span className="employee-name">{employee.name}</span>
                                <span className="employee-position">{employee.position}</span>
                                <span 
                                    className={`employee-status ${getStatusClass(employee.status)}`} 
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
