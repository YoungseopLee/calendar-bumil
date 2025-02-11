import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { FaEdit, FaTrash } from "react-icons/fa";
import "./Calendar.css";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [userSchedule, setUserSchedule] = useState([]);
  const [otherUsersSchedule, setOtherUsersSchedule] = useState([]);
  const [userStatus, setUserStatus] = useState("");
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [users, setUsers] = useState([]); // 직원 목록
  const navigate = useNavigate();

  // 로그인한 사용자 정보 가져오기 (localStorage에서 가져오기)
  const user = JSON.parse(localStorage.getItem("user"));

  // 로그인 및 부서 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        alert("로그인된 사용자 정보가 없습니다. 로그인해주세요.");
        navigate("/");
        return;
      }

      try {
        // 1. 부서 및 사용자 정보 가져오기
        const usersResponse = await fetch(
          `${process.env.REACT_APP_API_URL}/user/get_users`
        );
        if (!usersResponse.ok)
          throw new Error("직원 목록을 불러오지 못했습니다.");
        const usersData = await usersResponse.json();
        setUsers(usersData.users);

        const uniqueDepartments = [
          ...new Set(usersData.users.map((user) => user.department)),
        ];
        setDepartments(uniqueDepartments);

        /*// 2. 일정 가져오기 (calendar에서 비활성화)
          const scheduleResponse = await fetch(
            `${process.env.REACT_APP_API_URL}/schedule/get_all_schedule`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
              },
            }
          );
  
          if (scheduleResponse.status === 401) {
            handleLogout();
            return;
          }
  
          if (!scheduleResponse.ok)
            throw new Error("일정 데이터를 불러오지 못했습니다.");
          const scheduleData = await scheduleResponse.json();
          setSchedules(scheduleData.schedules);*/
      } catch (error) {
        console.error("데이터 로딩 오류:", error);
      }
    };

    fetchData();
    fetchLoggedInUser(); // 사용자 상태 업데이트
  }, []);

  const monthNames = [
    "1월",
    "2월",
    "3월",
    "4월",
    "5월",
    "6월",
    "7월",
    "8월",
    "9월",
    "10월",
    "11월",
    "12월",
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

      const selectedDateString = selectedDate.toISOString().split("T")[0];

      // 자신의 일정 가져오기
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/schedule/get_schedule?user_id=${user.id}&date=${selectedDateString}`
        );
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
          `${process.env.REACT_APP_API_URL}/schedule/get_other_users_schedule?user_id=${user.id}&date=${selectedDateString}`
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
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/schedule/delete-schedule/${scheduleId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // 토큰이 제대로 들어가는지 확인
          },
        }
      );

      if (response.ok) {
        handleDateClick(selectedDate.getDate()); // 삭제 후 일정 목록 새로고침
      } else {
      }
    } catch (error) {
      console.error("일정 삭제 오류:", error);
    }
  };

  const handleAddScheduleClick = () => {
    navigate("/add-schedule", { state: { selectedDate } });
  };

  // 로그인된 사용자 상태 변경
  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setUserStatus(newStatus);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/user/update_status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

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
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/get_logged_in_user`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

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
            <span>
              {user.name} ({user.position})
            </span>
          </div>
          <div className="status-container">
            <label htmlFor="status">상태 변경:</label>
            <select
              id="status"
              value={userStatus}
              onChange={handleStatusChange}
            >
              <option value="출근">출근</option>
              <option value="외근">외근</option>
              <option value="파견">파견</option>
              <option value="휴가">휴가</option>
            </select>
          </div>
        </div>
        <div className="calendar-navigation">
          <button onClick={handlePrevMonth} className="nav-button">
            {"<"}
          </button>
          <h2 className="calendar-title">
            {currentYear}년 {monthNames[currentMonth]}
          </h2>
          <button onClick={handleNextMonth} className="nav-button">
            {">"}
          </button>
        </div>
        <div className="calendar-days-header">
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
            <div key={day} className="day-header">
              {day}
            </div>
          ))}
        </div>
        <div className="calendar-days">
          {calendarDays.map((day, index) => {
            const key = day
              ? `${currentYear}-${currentMonth}-${day}`
              : `empty-${index}`;
            return (
              <div
                key={key}
                className={`calendar-day ${day ? "active" : ""} ${
                  isToday(day) ? "today" : ""
                } ${isSelected(day) ? "selected" : ""}`}
                onClick={() => handleDateClick(day)}
              >
                {day}
                {day &&
                  userSchedule.some(
                    (schedule) =>
                      new Date(schedule.start_date).getDate() === day
                  ) && (
                    <div
                      className={`status-circle ${getStatusClass(
                        userSchedule.find(
                          (schedule) =>
                            new Date(schedule.start_date).getDate() === day
                        )?.status
                      )}`}
                    ></div>
                  )}
              </div>
            );
          })}
        </div>

        {selectedDate && (
          <div className="schedule-area">
            <div className="selected-date-info">
              <h3>{selectedDate.toLocaleDateString()}</h3>
            </div>

            <div className="add-schedule-container">
              <button
                className="button add-schedule-button"
                onClick={handleAddScheduleClick}
              >
                일정 추가
              </button>
            </div>

            <div className="schedule-section">
              <h4>내 일정</h4>
              <ul className="schedule-list">
                {userSchedule.length > 0 ? (
                  userSchedule.map((schedule) => (
                    <li
                      key={schedule.id}
                      className="schedule-item"
                      onClick={() => handleScheduleClick(schedule)}
                    >
                      <div className="schedule-content">
                        <span
                          className="status-icon"
                          style={{
                            backgroundColor: getStatusClass(schedule.status),
                          }}
                        ></span>
                        <span className="task-name">{schedule.task}</span>
                      </div>
                      <div className="button-group">
                        <button
                          className="edit-button icon-button"
                          onClick={() => handleEditSchedule(schedule)}
                          title="수정"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="delete-button icon-button"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          title="삭제"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="empty-schedule">일정이 없습니다.</li>
                )}
              </ul>
            </div>

            <div className="schedule-section">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <h4 style={{ margin: 0 }}>전체 일정</h4>
                {"\u00A0 "}
                {/* 제목의 기본 마진을 제거 */}
                {/* 부서별 보기 버튼 */}
                <select
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
                </select>
              </div>
              <ul className="schedule-list">
                {(() => {
                  // 1. 선택한 부서 필터링
                  const departmentUserIds = users
                    .filter(
                      (user) =>
                        selectedDepartment === "" ||
                        user.department === selectedDepartment
                    )
                    .map((user) => user.id);

                  // 2. 걸쳐 있는 월의 일정 표시하기 위한 필터
                  const filtered = otherUsersSchedule
                    .filter((schedule) => {
                      console.log("schedule : ", schedule);
                      const startDate = new Date(schedule.start_date);
                      const endDate = new Date(schedule.end_date);

                      return (
                        departmentUserIds.includes(schedule.user_id) &&
                        startDate <=
                          new Date(currentYear, currentMonth + 1, 0) && // 해당 월의 마지막 날 이하
                        endDate >= new Date(currentYear, currentMonth, 1) // 해당 월의 첫날 이상
                      );
                    })
                    .sort(
                      (a, b) => new Date(a.start_date) - new Date(b.start_date)
                    );

                  if (filtered.length === 0) {
                    return (
                      <li className="empty-schedule">
                        선택한 부서에 이 날짜의 일정이 없습니다.
                      </li>
                    );
                  }

                  return filtered.map((schedule) => {
                    const user = users.find((u) => u.id === schedule.user_id);
                    const userName = user ? user.name : "알 수 없음";
                    const formatDate = (dateString) =>
                      new Date(dateString)
                        .toISOString()
                        .slice(2, 10)
                        .replace(/-/g, ".");
                    return (
                      <li key={schedule.id} className="schedule-item">
                        <span
                          className="status-icon"
                          style={{
                            backgroundColor: getStatusClass(schedule.status),
                          }}
                        ></span>
                        {userName} {": \u00A0"}
                        <span className="task-name">{schedule.task}</span>
                        <span> {formatDate(schedule.start_date)}</span>
                        {"\u00A0"} ~ {"\u00A0"}
                        <span> {formatDate(schedule.end_date)}</span>
                      </li>
                    );
                  });
                })()}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
