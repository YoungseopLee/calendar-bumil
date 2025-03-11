import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../pages/Sidebar";
import BackButton from "./BackButton";
import "./UserDetails.css";
import {
  FaPhone,
  FaEnvelope,
  FaCircle,
  FaUserTie,
  FaBuilding,
  FaUserCircle,
} from "react-icons/fa"; // 아이콘 추가

const UserDetails = () => {
  const [user, setUser] = useState(null);
  const [userprojects, setUserProjects] = useState([]); // 유저의 프로젝트 데이터 추가
  const [loading, setLoading] = useState(true);
  const [statusList, setStatusList] = useState([]);
  const [error, setError] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [isTableView, setIsTableView] = useState(false); // ✅ 추가: 표 형태 전환 상태

  const apiUrl = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();
  const location = useLocation();

  const user_id = new URLSearchParams(location.search).get("user_id");
  const loggedInUser = JSON.parse(localStorage.getItem("user")); // 본인 정보 수정을 위해 로그인한 유저의 정보 가져오기

  // 사용자 정보 가져오기
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("로그인이 필요합니다.");
        setLoading(false);
        return;
      }

      try {
        // 사용자 정보 가져오기
        const userResponse = await fetch(
          `${apiUrl}/user/get_user?user_id=${user_id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!userResponse.ok) {
          const errData = await userResponse.json();
          throw new Error(
            errData.message || "사용자 정보를 가져오는 데 실패했습니다."
          );
        }

        const userData = await userResponse.json();
        setUser(userData.user);
        console.log("userData : ", userData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user_id]);

  // 사용자가 참여한 프로젝트 데이터 가져오기
  useEffect(() => {
    const fetchUserProjectData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("로그인이 필요합니다.");
        setLoading(false);
        return;
      }

      try {
        // 사용자 정보 가져오기
        const userResponse = await fetch(
          `${apiUrl}/project/get_user_and_projects?user_id=${user_id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!userResponse.ok) {
          const errData = await userResponse.json();
          throw new Error(
            errData.message || "사용자 정보를 가져오는 데 실패했습니다."
          );
        }

        const userprojectData = await userResponse.json();
        setUserProjects(userprojectData.participants);
        console.log("userprojectData : ", userprojectData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProjectData();
  }, [user_id, apiUrl]);

  useEffect(() => {
    const fetchStatusList = async () => {
      try {
        const response = await fetch(`${apiUrl}/status/get_status_list`);
        if (!response.ok) throw new Error("상태 목록을 가져오지 못했습니다.");
        const data = await response.json();
        setStatusList(data.statuses); // [{ id: 1, comment: "HQ" }, ...]
      } catch (err) {
        console.error("상태 목록 오류:", err);
      }
    };

    fetchStatusList();
  }, [apiUrl]);

  const getStatusComment = (statusId) => {
    const statusObj = statusList.find((s) => s.id === statusId);
    return statusObj ? statusObj.comment : "알 수 없음";
  };

  const getMonthStatus = (start, end) => {
    const months = Array(12).fill(""); // 1월~12월 배열
    const startDate = new Date(start);
    const endDate = new Date(end);

    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(startDate.getFullYear(), i, 1);
      if (monthDate >= startDate && monthDate <= endDate) {
        months[i] = "O";
      }
    }
    return months;
  };

  const filteredProjects = userprojects.filter((project) => {
    const projectStartYear = new Date(project.start_date).getFullYear();
    const projectEndYear = new Date(project.end_date).getFullYear();

    // is_delete_yn이 "Y"인 프로젝트 제외
    // ✅ 프로젝트가 선택한 연도(`year`)에 걸쳐 있으면 포함
    return (
      projectStartYear <= year &&
      projectEndYear >= year &&
      project.is_delete_yn !== "Y"
    );
  });

  if (loading || !user)
    return <div className="userdetail-container">로딩 중...</div>;
  //유저가 로딩되지 않을 때 로딩 중 표시 로직이 꼬이는 경우가 있어 !user 추가함
  if (error) return <div className="userdetail-container">{error}</div>;

  const ChartView = ({ filteredProjects }) => {
    return (
      <div className="project-chart">
        {filteredProjects.map((project) => {
          const startDate = new Date(project.start_date);
          const endDate = new Date(project.end_date);

          if (isNaN(startDate) || isNaN(endDate)) {
            return null;
          }

          const startYear = startDate.getFullYear();
          const endYear = endDate.getFullYear();
          const months = [];

          // 월 데이터를 저장하기 위한 로직 수정
          for (let year = startYear; year <= endYear; year++) {
            let start = year === startYear ? startDate.getMonth() : 0; // 시작 연도의 시작 월
            let end = year === endYear ? endDate.getMonth() : 11; // 종료 연도의 종료 월

            for (let month = start; month <= end; month++) {
              months.push(year * 100 + month); // 월을 '연도월' 형식으로 저장
            }
          }

          return (
            <div key={project.id} className="project-chart-row">
              <div
                className="project-chart-title"
                onClick={() =>
                  navigate(
                    `/project-details?project_code=${project.project_code}`
                  )
                }
              >
                {project.project_name}
              </div>
              <div className="project-chart-months">
                {Array.from({ length: 12 }, (_, idx) => {
                  // 선택한 연도의 idx월이 months 배열에 있는지 확인
                  const isHighlighted = months.includes(year * 100 + idx); // 선택한 연도의 월을 체크
                  return (
                    <span
                      key={idx}
                      className={`project-month ${
                        isHighlighted ? "highlighted" : ""
                      }`}
                    >
                      {idx + 1}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const TableView = ({ filteredProjects }) => {
    const navigate = useNavigate(); // ✅ 네비게이션 훅 사용

    return (
      <table className="project-user-table">
        <thead>
          <tr>
            <th>프로젝트명</th>
            <th>시작일</th>
            <th>종료일</th>
          </tr>
        </thead>
        <tbody>
          {filteredProjects.map((project) => (
            <tr key={project.id}>
              <td
                onClick={(event) => {
                  event.stopPropagation(); // ✅ 부모 요소의 클릭 이벤트 방지
                  navigate(
                    `/project-details?project_code=${project.project_code}`
                  );
                }}
                style={{ cursor: "pointer" }} // ✅ 마우스 커서 변경 (클릭 가능한 요소임을 강조) // ✅ 클릭 가능한 스타일 적용
              >
                {project.project_name}
              </td>
              <td>{new Date(project.start_date).toLocaleDateString()}</td>
              <td>{new Date(project.end_date).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="userdetail-page">
      <header className="userdetail-header">
        <Sidebar />
        <BackButton />
      </header>
      <div className="userdetail-container">
        <div className="userdetail-icon-name-section">
          <div className="userdetail-left-section">
            {/* 프로필 아이콘 추가 */}
            <div className="userdetail-icon-section">
              <FaUserCircle className="user-icon" />
            </div>

            {/* 사용자 이름 */}
            <div className="userdetail-name-section">
              <h2>{user.name}</h2>
            </div>
          </div>

          {/* 본인 정보 수정 버튼(id가 같지 않으면 안뜸) */}
          {loggedInUser.id === user.id && (
            <button className="userdetail-edit-button" onClick={() => navigate('/change-my-details')}>내 정보 수정</button>
          )}
        </div>

        {/* 사용자 정보 */}
        <div className="userdetail-content">
          <div className="userdetail-details">
            <p>
              <FaCircle
                className={`status-icon ${
                  getStatusComment(user.status) === "본사"
                    ? "online"
                    : "offline"
                }`}
              />
              {getStatusComment(user.status)}
            </p>
            <p>
              <FaUserTie className="icon" />
              {user.position}
            </p>
            <p>
              <FaBuilding className="icon" />
              {user.department}
            </p>
            <p>
              <FaPhone className="icon" />
              {user.phone_number}
            </p>
            <p>
              <FaEnvelope className="icon" />
              {user.id}
            </p>
          </div>
        </div>
      </div>

      <div className="divider"></div>

      <div className="userdetail-projects">
        <div className="project-header">
          <h3>참여한 프로젝트</h3>
          <div className="project-checkbox">
            <input
              type="checkbox"
              id="project-checkbox"
              checked={isTableView}
              onChange={() => setIsTableView(!isTableView)}
            />
            <label htmlFor="project-checkbox">표로 보기</label>
          </div>
        </div>
        <div className="year-selector">
          <button className="year-button" onClick={() => setYear(year - 1)}>
            ◀
          </button>
          <span className="year-text">{year}년</span>
          <button className="year-button" onClick={() => setYear(year + 1)}>
            ▶
          </button>
        </div>
        {/* ✅ 차트 방식 or 표 방식 선택 */}
        {/* 차트와 표를 조건에 따라 표시 */}
        {isTableView ? (
          <TableView filteredProjects={filteredProjects} />
        ) : (
          <ChartView filteredProjects={filteredProjects} />
        )}
      </div>
    </div>
  );
};

export default UserDetails;
