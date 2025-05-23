import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import FloatingButton from "../components/FloatingButton";
import BackButton from "../components/BackButton";
import EmployeeBackButton from "../employee/EmployeeBackButton";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { useAuth } from "../../utils/useAuth";
import { authFetch } from "../../utils/authFetch";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import { followCursor } from "tippy.js";
import { MdSettings } from "react-icons/md";
import { FaUsers } from "react-icons/fa";
import "./UserDetails.css";
import {
  FaOctopusDeploy,
  FaPhone,
  FaEnvelope,
  FaCircle,
  FaUserTie,
  FaBuilding,
  FaUserCircle,
} from "react-icons/fa";
import { AiFillHeart } from "react-icons/ai";

const UserDetails = () => {
  const [user, setUser] = useState(null); // 이 페이지에서만 프로필 유저 정보
  const [userprojects, setUserProjects] = useState([]); // 유저의 프로젝트 데이터 추가
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusList, setStatusList] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [isTableView, setIsTableView] = useState(false); // 추가: 표 형태 전환 상태
  const [showSquidImage, setShowSquidImage] = useState(false);

  const apiUrl = process.env.REACT_APP_API_URL;
  const accessToken = localStorage.getItem("access_token");

  const navigate = useNavigate();
  const location = useLocation();

  const user_id = new URLSearchParams(location.search).get("user_id");
  const [loggedInUser, setLoggedInUser] = useState({
    id: "",
    name: "",
    position: "",
    department: "",
    role_id: "",
  }); //로그인한 사용자 정보
  const { getUserInfo, checkAuth, handleLogout } = useAuth();

  // 로그인한 사용자 정보 가져오기 및 권한 확인 후 권한 없으면 로그아웃 시키기
  // 다른 함수에선 다 User 이지만, 여기선 겹치기 때문에 loggedInUser 사용
  // 디테일 페이지에서 내정보 페이지로 가면 다시 표시할 수 있도록 user_id를 의존성으로 사용
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // 1. 사용자 정보 가져오기
        const userInfo = await fetchLoggedInUserInfo();

        // 2. 모든 데이터 병렬로 가져오기
        await Promise.all([
          fetchUserData(), // 사용자 정보
          fetchUserProjectData(), // 사용자 프로젝트 정보
          fetchStatusList(), // 상태 목록
        ]);
      } catch (error) {
        //console.error("데이터 로딩 오류:", error);
      }
      setLoading(false); // 로딩 완료
    };
    fetchAllData();
  }, [user_id]);

  // 로그인한 사용자 정보 가져오는 함수
  const fetchLoggedInUserInfo = async () => {
    const userInfo = await getUserInfo();
    setLoggedInUser(userInfo);
    return userInfo;
  };

  // 프로필 정보 가져오는 함수
  const fetchUserData = async () => {
    if (!accessToken) {
      setError("로그인이 필요합니다.");
      setLoading(false);
      return;
    }

    try {
      // 사용자 정보 가져오기
      const userResponse = await authFetch(
        `${apiUrl}/user/get_user?user_id=${user_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
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
    } catch (err) {
      setError(err.message);
    }
  };

  // 사용자가 참여한 프로젝트 데이터 가져오는 함수
  const fetchUserProjectData = async () => {
    if (!accessToken) {
      setError("로그인이 필요합니다.");
      setLoading(false);
      return;
    }

    try {
      // 사용자 정보 가져오기
      const userResponse = await authFetch(
        `${apiUrl}/project/get_user_and_projects?user_id=${user_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
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
    } catch (err) {
      setError(err.message);
    }
  };

  // 상태 목록 가져오는 함수
  const fetchStatusList = async () => {
    try {
      const response = await authFetch(`${apiUrl}/status/get_status_list`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) throw new Error("상태 목록을 가져오지 못했습니다.");
      const data = await response.json();
      setStatusList(data.statuses); // [{ id: 1, comment: "HQ" }, ...]
    } catch (err) {
      //console.error("상태 목록 오류:", err);
    }
  };

  const getStatusComment = (statusId) => {
    const statusObj = statusList.find((s) => s.id === statusId);
    return statusObj ? statusObj.comment : "알 수 없음";
  };

  const getSquidTestImage = (squidTest) => {
    if (!squidTest) return null;
    return require(`../../squid_img/${squidTest.replace("징어", "")}.png`);
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

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage />;

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
    const navigate = useNavigate(); // 네비게이션 훅 사용

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
                  event.stopPropagation(); // 부모 요소의 클릭 이벤트 방지
                  navigate(
                    `/project-details?project_code=${project.project_code}`
                  );
                }}
                style={{ cursor: "pointer" }} // 마우스 커서 변경 (클릭 가능한 요소임을 강조) // ✅ 클릭 가능한 스타일 적용
              >
                <Tippy
                  content={project.project_name}
                  placement="top"
                  plugins={[followCursor]}
                  followCursor="horizontal"
                  arrow={true}
                  popperOptions={{
                    modifiers: [
                      {
                        name: "preventOverflow",
                        options: { boundary: "window" },
                      },
                    ],
                  }}
                >
                  <span className="user-details-project-name">
                    {project.project_name}
                  </span>
                </Tippy>
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
        <Sidebar user={loggedInUser} />
        <FloatingButton>
          <BackButton />
          <EmployeeBackButton />
        </FloatingButton>
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
            <MdSettings
              className="userdetail-edit-button"
              onClick={() => navigate("/change-my-details")}
            ></MdSettings>
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
              {user.team_name
                ? `${user.department_name} - ${user.team_name}`
                : user.department_name}
            </p>
            <p>
              <FaPhone className="icon" />
              {user.phone_number}
            </p>
            <p>
              <FaEnvelope className="icon" />
              {user.id}
            </p>
            {user.mbti !== null && (
              <p>
                <AiFillHeart className="icon" />
                {user.mbti}
              </p>
            )}
            {user.squid_test && (
              <p onMouseEnter={() => setShowSquidImage(true)}>
                <FaOctopusDeploy className="icon" />
                {user.squid_test}
              </p>
            )}
            {/* 이미지가 보일 때만 화면 중앙에 표시 */}
            {showSquidImage && (
              <>
                <div
                  className="squid-overlay"
                  onMouseDown={() => setShowSquidImage(false)}
                ></div>
                <div
                  className="squid-image-container"
                  onMouseLeave={() => setShowSquidImage(false)}
                >
                  <img
                    src={getSquidTestImage(user.squid_test)}
                    alt={user.squid_test}
                    className="squid-image"
                  />
                </div>
              </>
            )}
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
            <label className="user-details-checkbox-label" htmlFor="project-checkbox">표로 보기</label>
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
        {/* 차트 방식 or 표 방식 선택 */}
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
