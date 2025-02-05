import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Chatbot from "./Chatbot"; // Chatbot 컴포넌트 import
import { FaEdit, FaTrash } from "react-icons/fa";
import "./Calendar.css";

const Calendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [userSchedule, setUserSchedule] = useState([]);
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
            navigate("/login");
        } else {
            fetchLoggedInUser(); // 사용자 정보 API 호출하여 상태 업데이트
        }
    }, []);

    const monthNames = [
        "1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"
    ];

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth - 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth + 1));
    };

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const calendarDays = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarDays.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        calendarDays.push(i);
    }

    const handleDateClick = async (day) => {
        if (day) {
            const selectedDate = new Date(currentYear, currentMonth, day);
            setSelectedDate(selectedDate);

            const selectedDateString = selectedDate.toISOString().split('T')[0];

            // 자신의 일정 가져오기
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/get_schedule?user_id=${user.id}&date=${selectedDateString}`);
                const data = await response.json();
                if (response.ok) {
                    setUserSchedule(data.schedules || []);
                } else {
                    alert("자신의 일정 로드에 실패했습니다.");
                }
            } catch (error) {
                console.error("자신의 일정 로드 실패:", error);
                alert("자신의 일정 로드에 실패했습니다.");
            }

            // 다른 사용자 일정 가져오기
            try {
                const otherUsersResponse = await fetch(
                    `${process.env.REACT_APP_API_URL}/get_other_users_schedule?user_id=${user.id}&date=${selectedDateString}`
                );
                const otherUsersData = await otherUsersResponse.json();
                if (otherUsersResponse.ok) {
                    setOtherUsersSchedule(otherUsersData.schedules || []);
                } else {
                    alert("다른 사용자 일정 로드에 실패했습니다.");
                }
            } catch (error) {
                console.error("다른 사용자 일정 로드 실패:", error);
                alert("다른 사용자 일정 로드에 실패했습니다.");
            }
        }
    };

    const handleScheduleClick = (schedule) => {
        console.log("선택된 일정:", schedule);
        // 여기에 일정 클릭 시 수행할 동작을 추가
    };

    // 일정 수정
    const handleEditSchedule = (schedule) => {
        navigate(`/edit-schedule/${schedule.id}`, { state: { schedule } });
    };

    // 일정 삭제
    const handleDeleteSchedule = async (scheduleId) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/delete-schedule/${scheduleId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`, // 토큰이 제대로 들어가는지 확인
                },
            });
    
            if (response.ok) {
                handleDateClick(selectedDate.getDate()); // 삭제 후 일정 목록 새로고침
            } else {
            }
        } catch (error) {
            console.error("일정 삭제 오류:", error);
        }
    };    

    const handleAddScheduleClick = () => {
        navigate("/addschedule", { state: { selectedDate } });
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
        navigate("/login");
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
    
    // 오늘 날짜와 비교하여 색을 구분하기 위한 함수
    const isToday = (day) => {
        const today = new Date();
        return (
            day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear()
        );
    };

    // 선택된 날짜가 오늘과 같은지 확인
    const isSelected = (day) => {
        if (!selectedDate) return false;
        return (
            day === selectedDate.getDate() &&
            currentMonth === selectedDate.getMonth() &&
            currentYear === selectedDate.getFullYear()
        );
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
        <div className="calendar-page">
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
                <div className="calendar-navigation">
                    <button onClick={handlePrevMonth} className="nav-button">{"<"}</button>
                    <h2 className="calendar-title">
                        {currentYear}년 {monthNames[currentMonth]}
                    </h2>
                    <button onClick={handleNextMonth} className="nav-button">{">"}</button>
                </div>
                <div className="calendar-days-header">
                    {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                        <div key={day} className="day-header">{day}</div>
                    ))}
                </div>
                <div className="calendar-days">
                    {calendarDays.map((day, index) => (
                        <div
                            key={index}
                            className={`calendar-day ${day ? "active" : ""} ${
                                isToday(day) ? "today" : ""} ${isSelected(day) ? "selected" : ""}`}
                            onClick={() => handleDateClick(day)}
                        >
                            {day}
                            {/* 상태 색상 원 */}
                            {day && userSchedule.some(schedule => new Date(schedule.start_date).getDate() === day) && (
                                <div
                                    className={`status-circle ${getStatusClass(
                                        userSchedule.find(schedule => new Date(schedule.start_date).getDate() === day)?.status
                                    )}`}
                                ></div>
                            )}
                        </div>
                    ))}
                </div>

                {selectedDate && (
                    <div className="schedule-area">
                        <div className="selected-date-info">
                            <h3>{selectedDate.toLocaleDateString()}</h3>
                        </div>

                        <div className="add-schedule-container">
                            <button className="button add-schedule-button" onClick={handleAddScheduleClick}>
                                일정 추가
                            </button>
                        </div>

                        <div className="schedule-section">
                            <h4>내 일정</h4>
                            <ul className="schedule-list">
                                {userSchedule.length > 0 ? (
                                    userSchedule.map((schedule) => (
                                        <div className="schedule-container">
                                            <li
                                                key={schedule.id}
                                                className="schedule-item"
                                                onClick={() => handleScheduleClick(schedule)}
                                            >
                                                <span
                                                    className="status-icon"
                                                    style={{ backgroundColor: getStatusClass(schedule.status) }}
                                                ></span>
                                                <span className="task-name">{schedule.task}</span>
                                            </li>
                                            <div className="button-group">
                                                {/* 수정 버튼 아이콘 */}
                                                <button
                                                className="edit-button icon-button"
                                                onClick={() => handleEditSchedule(schedule)}
                                                title="수정"
                                                >
                                                <FaEdit />
                                                </button>
                                                {/* 삭제 버튼 아이콘 */}
                                                <button
                                                    className="delete-button icon-button"
                                                    onClick={() => handleDeleteSchedule(schedule.id)}
                                                    title="삭제"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <li className="empty-schedule">일정이 없습니다.</li>
                                )}
                            </ul>
                        </div>

                        <div className="schedule-section">
                            <h4>다른 사용자 일정</h4>
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
                )}
                <button className="toggle-chatbot-button" onClick={toggleChatbot}>
                챗봇 열기
                </button>

                {showChatbot && <Chatbot onClose={closeChatbot} />}
            </div>
        </div>
    );
};

export default Calendar;
