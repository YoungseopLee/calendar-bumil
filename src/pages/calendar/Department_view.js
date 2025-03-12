import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import BackButton from "../components/BackButton";
import "./Calendar.css";

const Department_view = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]); // 필터링된 일정
  const [users, setUsers] = useState([]); // 직원 목록
  const [userStatus, setUserStatus] = useState("");
  const navigate = useNavigate();

  // 로그인한 사용자 정보 가져오기 (localStorage에서 가져오기)
  const user = JSON.parse(localStorage.getItem("user"));
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

        // 2. 일정 가져오기
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
        setSchedules(scheduleData.schedules);
      } catch (error) {
        console.error("데이터 로딩 오류:", error);
      }
    };

    fetchData();
    fetchLoggedInUser(); // 사용자 상태 업데이트
  }, []);

  // 선택한 부서의 직원 일정 필터링 및 정렬
  useEffect(() => {
    if (!selectedDepartment) {
      setFilteredSchedules(schedules);
      return;
    }

    const departmentUserIds = users
      .filter((user) => user.department === selectedDepartment)
      .map((user) => user.id);

    const filtered = schedules
      .filter((schedule) => departmentUserIds.includes(schedule.user_id))
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

    setFilteredSchedules(filtered);
  }, [selectedDepartment, schedules, users]);
  // 상태 변경

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
        handleLogout();
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

  const groupedSchedules = new Map();
  filteredSchedules.forEach((schedule) => {
    const date = new Date(schedule.start_date);
    const yearMonth = `${date.getFullYear()}년 ${monthNames[date.getMonth()]}`;
    if (!groupedSchedules.has(yearMonth)) {
      groupedSchedules.set(yearMonth, []);
    }
    groupedSchedules.get(yearMonth).push(schedule);
  });

  return (
    <div className="Department_view-page">
      <Sidebar />
      <BackButton />
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
        <div className="schedule-area">
          <div className="schedule-section">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
              }}
            >
              <h4 style={{ margin: 5, whiteSpace: "nowrap" }}>일정 목록</h4>
              <div style={{ marginTop: "10px", width: "100%" }}>
                <select
                  className="department-view-dropdown"
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
                const filtered = schedules
                  .filter((schedule) => {
                    const startDate = new Date(schedule.start_date);
                    const endDate = new Date(schedule.end_date);

                    return (
                      departmentUserIds.includes(schedule.user_id) &&
                      ((startDate.getFullYear() === currentYear &&
                        startDate.getMonth() === currentMonth) ||
                        (endDate.getFullYear() === currentYear &&
                          endDate.getMonth() === currentMonth) ||
                        (startDate <
                          new Date(currentYear, currentMonth + 1, 1) &&
                          endDate >= new Date(currentYear, currentMonth, 1)))
                    );
                  })
                  .sort(
                    (a, b) => new Date(a.start_date) - new Date(b.start_date)
                  );

                if (filtered.length === 0) {
                  return (
                    <li className="empty-schedule">
                      선택한 부서에 이번 달 일정이 없습니다.
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
      </div>
    </div>
  );
};

export default Department_view;
