import React, { useState, useEffect } from "react";
import "./Employee.css";
import Sidebar from "./Sidebar";
import BackButton from "./BackButton";

const EmployeeList = () => {
    const [employees, setEmployees] = useState([]);
    const [favoriteEmployees, setFavoriteEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [loggedInUserId, setLoggedInUserId] = useState(null);
    const [isFavoritesOpen, setIsFavoritesOpen] = useState(true); // 즐겨찾기 열림 상태
    const [isEmployeesOpen, setIsEmployeesOpen] = useState(true); // 사원 목록 열림 상태
    const [userStatus, setUserStatus] = useState(""); // 로그인한 사용자의 상태

    const apiUrl = process.env.REACT_APP_API_URL;

    // 로그인한 사용자 정보 가져오기
    useEffect(() => {
        const fetchLoggedInUser = async () => {
            try {
                const token = localStorage.getItem("token");

                if (!token) {
                    throw new Error("사용자 인증 정보가 없습니다.");
                }

                const response = await fetch(`${apiUrl}/get_logged_in_user`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("로그인 사용자 정보를 가져오는 데 실패했습니다.");
                }

                const data = await response.json();
                setLoggedInUserId(data.user.id); // 서버에서 반환된 사용자 ID로 설정
                setUserStatus(data.user.status); // 로그인된 사용자 상태 업데이트
                fetchFavorites(data.user.id); // 로그인된 사용자 ID로 즐겨찾기 목록 가져오기
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false); // 로딩 상태를 false로 설정
            }
        };

        fetchLoggedInUser();
    }, []); // useEffect 내부에 의존성 배열은 빈 배열로 설정하여 컴포넌트 최초 렌더링 시 한 번만 실행

    // 즐겨찾기 목록 가져오기
    const fetchFavorites = async (userId) => {
        try {
            const response = await fetch(`${apiUrl}/get_favorites?user_id=${userId}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (!response.ok) {
                throw new Error("즐겨찾기 목록을 가져오는 데 실패했습니다.");
            }

            const data = await response.json();
            const favoritesWithStatus = await Promise.all(
                data.favorites.map(async (favorite) => {
                    const status = await fetchStatus(favorite.id);
                    return { ...favorite, status }; // 상태를 추가
                })
            );
            setFavoriteEmployees(favoritesWithStatus); // 즐겨찾기 목록 업데이트
        } catch (err) {
            setError(err.message);
        }
    };

    // 해당 사용자의 당일 일정 상태 조회
    const fetchStatus = async (employeeId) => {
        try {
            const response = await fetch(`${apiUrl}/get_schedule?user_id=${employeeId}&date=${new Date().toISOString().split('T')[0]}`);
            if (!response.ok) {
                throw new Error("일정을 가져오는 데 실패했습니다.");
            }

            const data = await response.json();
            const schedule = data.schedules[0]; // 당일 일정이 하나일 경우
            return schedule ? schedule.status : null; // 일정 상태 반환, 없으면 null
        } catch (err) {
            console.error(err);
            return null; // 일정이 없으면 null 반환
        }
    };

    // 데이터 가져오기 (사원 목록)
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const response = await fetch(`${apiUrl}/get_users`);
                if (!response.ok) {
                    throw new Error("사용자 데이터를 가져오는 데 실패했습니다.");
                }
                const data = await response.json();
                setEmployees(data.users);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false); // 로딩 상태를 false로 설정
            }
        };

        fetchEmployees();
    }, []); // useEffect 내부에 의존성 배열은 빈 배열로 설정하여 컴포넌트 최초 렌더링 시 한 번만 실행

    // 즐겨찾기 상태 추가/삭제
    const toggleFavorite = async (employeeId) => {
        try {
            const response = await fetch(`${apiUrl}/toggle_favorite`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
                },
                body: JSON.stringify({
                    user_id: loggedInUserId, // 로그인한 사용자의 ID
                    favorite_user_id: employeeId, // 즐겨찾기할 직원의 ID
                }),
            });

            if (!response.ok) {
                throw new Error("즐겨찾기 상태를 업데이트하는 데 실패했습니다.");
            }

            // 즐겨찾기 상태 업데이트 후, 즐겨찾기 목록 다시 가져오기
            fetchFavorites(loggedInUserId);
        } catch (error) {
            setError(error.message);
        }
    };

    // 즐겨찾기 열고 닫기 토글
    const toggleFavorites = () => setIsFavoritesOpen(!isFavoritesOpen);

    // 사원 목록 열고 닫기 토글
    const toggleEmployees = () => setIsEmployeesOpen(!isEmployeesOpen);

    // 상태에 맞는 색상 둥근 도형 반환
    const getStatusColor = (status) => {
        console.log("Current status: ", status); // 상태 값 출력
        if (!status) {
            return "gray"; // 상태가 없거나 null일 경우
        }
        
        switch (status) {
            case "출근":
                return "green";
            case "휴가":
                return "blue";
            case "파견":
                return "orange";
            case "병가":
                return "red";
            default:
                return "gray"; // 다른 상태 값이 들어올 경우
        }
    };

    // 검색 기능
    const handleSearch = (event) => {
        setSearchText(event.target.value.trim().toLowerCase());
    };

    if (loading) {
        return <p>데이터를 불러오는 중...</p>;
    }

    if (error) {
        return <p>오류 발생: {error}</p>;
    }

    return (
        <div className="app">
            <Sidebar />
            <BackButton />
            <div className="box">
                <h2 className="title">내 즐겨찾기 목록
                    <button onClick={toggleFavorites} className="toggle-button">
                        {isFavoritesOpen ? "닫기" : "열기"}
                    </button>
                </h2>
                {isFavoritesOpen && (
                    <div className="favorite-list">
                        {favoriteEmployees.length > 0 ? (
                            favoriteEmployees.map((favorite) => (
                                <div key={favorite.id} className="favorite-item">
                                    <span
                                        className="favorite-icon favorite"
                                        onClick={() => toggleFavorite(favorite.id)}
                                    >
                                        ★
                                    </span>
                                    <span className="employee-name">{favorite.name}</span>
                                    <span className="employee-position">{favorite.position}</span>
                                    <span className={`status-dot ${getStatusColor(favorite.status)}`}></span>
                                </div>
                            ))
                        ) : (
                            <p className="no-favorites">즐겨찾기가 없습니다.</p>
                        )}
                    </div>
                )}

                <h2 className="title">사원 목록
                    <button onClick={toggleEmployees} className="toggle-button">
                        {isEmployeesOpen ? "닫기" : "열기"}
                    </button>
                </h2>
                <input
                    type="text"
                    className="search-input"
                    placeholder="사원 이름으로 검색..."
                    onChange={handleSearch}
                />
                {isEmployeesOpen && (
                    <ul className="employee-list">
                        {employees
                            .filter((employee) => employee.name.toLowerCase().includes(searchText))
                            .map((employee) => (
                                <li key={employee.id} className="employee-item">
                                    <span
                                        className="favorite-icon"
                                        onClick={() => toggleFavorite(employee.id)}
                                    >
                                        {favoriteEmployees.some((fav) => fav.id === employee.id)
                                            ? "★"
                                            : "☆"}
                                    </span>
                                    <span className="employee-name">{employee.name}</span>
                                    <span className="employee-position">{employee.position}</span>
                                    <span className={`status-dot ${getStatusColor(employee.status)}`}></span>
                                </li>
                            ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default EmployeeList;
