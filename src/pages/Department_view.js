import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Chatbot from "./Chatbot"; // Chatbot 컴포넌트 import
import "./Calendar.css";

const Department_view = () => {
    const [departments, setDepartments] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [otherUsersSchedule, setOtherUsersSchedule] = useState([]);
    const [userStatus, setUserStatus] = useState("");
    const [showChatbot, setShowChatbot] = useState(false); // 챗봇 토글 상태
    const navigate = useNavigate();

    // 로그인한 사용자 정보 가져오기 (localStorage에서 가져오기)
    const user = JSON.parse(localStorage.getItem('user'));

    // 로그인 상태 확인 및 사용자 정보 불러오기
    useEffect(() => {
        if (!user) {
            alert("로그인된 사용자 정보가 없습니다. 로그인해주세요.");
            navigate("/");
        } else {
            fetchLoggedInUser(); // 사용자 정보 API 호출하여 상태 업데이트
        }
    }, []);

    const handleScheduleClick = (schedule) => {
        console.log("선택된 일정:", schedule);
        // 여기에 일정 클릭 시 수행할 동작을 추가
    };

    // 로그인된 사용자 상태 변경
    const handleStatusChange = async (e) => {
        const newStatus = e.target.value;
        setUserStatus(newStatus);
    
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/update_status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });
    
            if (response.status === 401) {
                handleLogout(); // 401 응답 시 자동 로그아웃
                return;
            }
    
            if (response.ok) {
                alert("상태가 변경되었습니다.");
                fetchLoggedInUser(); // 상태 변경 후 다시 사용자 정보 불러오기
            } else {
                alert("상태 변경에 실패했습니다.");
            }
        } catch (error) {
            console.error("상태 변경 오류:", error);
            alert("상태 변경에 실패했습니다.");
        }
    };
    
    // 자동 로그아웃 함수
    const handleLogout = () => {
        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };
    
    // 로그인한 사용자 정보를 다시 가져오는 함수
    const fetchLoggedInUser = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${process.env.REACT_APP_API_URL}/get_logged_in_user`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });
    
            if (response.status === 401) {
                handleLogout(); // 401 응답 시 자동 로그아웃 처리
                return;
            }
    
            if (response.ok) {
                const data = await response.json();
                setUserStatus(data.user.status);
                localStorage.setItem("user", JSON.stringify(data.user)); // 최신 상태 업데이트
            } else {
                console.error("사용자 정보 불러오기 실패");
            }
        } catch (error) {
            console.error("로그인 사용자 정보 불러오기 실패:", error);
        }
    };
    
    // 챗봇 토글 함수
    const toggleChatbot = () => {
        setShowChatbot(!showChatbot);
    };
    const closeChatbot = () => {
        setShowChatbot(false);
    };

    // 상태에 맞는 색상 클래스를 반환하는 함수
    const getStatusClass = (status) => {
        switch (status) {
            case "준비 중":
                return "red"; // 빨간색
            case "진행 중":
                return "green"; // 초록색
            case "완료":
                return "lightblue"; // 스카이 블루
            default:
                return ""; // 기본값
        }
    };

    return (
        <div className="Department_view-page">
            <Sidebar />
            <div className="calendar">
                {/* 사용자 상태 변경 UI */}
                <div className="user-status">
                    <div className="user-info">
                        <span>{user.name} ({user.position})</span>
                    </div>
                    <div className="status-container">
                        <label htmlFor="status">상태 변경:</label>
                        <select id="status" value={userStatus} onChange={handleStatusChange}>
                            <option value="출근">출근</option>
                            <option value="외근">외근</option>
                            <option value="파견">파견</option>
                            <option value="휴가">휴가</option>
                        </select>
                    </div>
                </div>
                <div className="schedule-area">
                    <div className="schedule-section">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                            <h4 style={{ margin: 0 }}>일정 목록</h4> {/* 제목의 기본 마진을 제거 */}
                            {/* 부서별 보기 버튼 */}
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
                        </div>
                        <ul className="schedule-list">
                            {otherUsersSchedule.length > 0 ? (
                            otherUsersSchedule.map((schedule) => (
                                <li
                                key={schedule.id}
                                className="schedule-item other-user-schedule"
                                onClick={() => handleScheduleClick(schedule)}
                                >
                                <span
                                    className="status-icon"
                                    style={{ backgroundColor: getStatusClass(schedule.status) }}
                                ></span>
                                {schedule.name} :&nbsp; <span className="task-name-two">{schedule.task}</span>
                                </li>
                            ))
                            ) : (
                            <li className="empty-schedule">이 날짜에 다른 사용자 일정이 없습니다.</li>
                            )}
                        </ul>
                    </div>
                </div>
                <button className="toggle-chatbot-button" onClick={toggleChatbot}>
                챗봇 열기
                </button>

                {showChatbot && <Chatbot onClose={closeChatbot} />}
            </div>
        </div>
    );
};

export default Department_view;
