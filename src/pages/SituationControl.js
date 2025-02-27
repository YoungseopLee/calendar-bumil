import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../pages/Sidebar";
import BackButton from "./BackButton";
import "./SituationControl.css";
import { FaSearch } from "react-icons/fa";

const SituationControls = () => {
  const [projects, setProjects] = useState([]); // 프로젝트 데이터 추가
  const [users, setUsers] = useState([]); // 사용자 목록 데이터 추가
  const [userprojects, setUserProjects] = useState([]); // 유저의 프로젝트 데이터 추가
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [isTableView, setIsTableView] = useState(false); // ✅ 추가: 표 형태 전환 상태
  const [searchQueryProject, setSearchQueryProject] = useState("");
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchQueryUser, setSearchQueryUser] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  //const [searchCategory, setSearchCategory] = useState("projectName"); // ✅ 검색 카테고리 추가 시 사용
  const [effectiveUsers, setEffectiveUsers] = useState([]); //프로젝트만 선택했을 시 보여줄 유저목록
  const [startFilter, setStartFilter] = useState("");
  const [endFilter, setEndFilter] = useState("");
  const [appliedStart, setAppliedStart] = useState("");
  const [appliedEnd, setAppliedEnd] = useState("");

  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const navigate = useNavigate();
  // 로그인한 사용자 정보 (localStorage에 저장된 최신 정보)
  const user = JSON.parse(localStorage.getItem("user"));
  // 로그인한 사용자 정보 체크
  useEffect(() => {
    fetchLoggedInUser();
    if (!user) {
      alert("로그인된 사용자 정보가 없습니다. 로그인해주세요.");
      navigate("/");
      return;
    }
  }, []);

  // 로그인한 사용자 정보 API 호출
  const fetchLoggedInUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/auth/get_logged_in_user`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        console.error("사용자 정보 불러오기 실패");
      }
    } catch (error) {
      console.error("로그인 사용자 정보 불러오기 실패:", error);
    }
  };

  // 로그아웃 함수
  const handleLogout = () => {
    alert("세션이 만료되었습니다. 다시 로그인해주세요.");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  //검색을 위해서 사용자 목록과 프로젝트 목록을 가져오는 API 호출
  useEffect(() => {
    const fetchUsersAndProjects = async () => {
      try {
        const response = await fetch(`${apiUrl}/user/get_users`);
        if (!response.ok) throw new Error("사용자 데이터를 불러오지 못했습니다.");
        const data = await response.json();
        setUsers(data.users);
      } catch (err) {
        console.error("🚨 사용자 목록 불러오기 오류:", err);
      }
    };
  
    const fetchProjects = async () => {
      try {
        const response = await fetch(`${apiUrl}/project/get_all_project`);
        if (!response.ok) throw new Error("프로젝트 데이터를 불러오지 못했습니다.");
        const data = await response.json();

        setProjects(data.projects);
      } catch (error) {
        console.error("🚨 프로젝트 목록 불러오기 오류:", error);
      }
    };
  
    fetchProjects();
    fetchUsersAndProjects();
  }, [apiUrl]); // ✅ apiUrl이 변경될 때만 실행 (userIdToNameMap 의존성 제거)
  
  useEffect(() => {
    console.log("projects: ", projects);
  }, [projects]);
  useEffect(() => {
    console.log("users: ", users);
  }, [users]);
  useEffect(() => {
    console.log("selectedProjects: ", selectedProjects);
  }, [selectedProjects]);
  useEffect(() => {
    console.log("selectedUsers: ", selectedUsers);
  }, [selectedUsers]);

  // 사용자가 선택한 유저들의 프로젝트 데이터 가져오기, 선택 안했으면 effectiveUsers로 프로젝트의 모든 유저
  useEffect(() => {
    const fetchUserProjectData = async () => {
      if (!effectiveUsers || effectiveUsers.length === 0) {
        setUserProjects([]);
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setError("로그인이 필요합니다.");
        setLoading(false);
        return;
      }
      console.log("effectiveUsers : ", effectiveUsers);
      try {
        // 선택된 사용자들의 프로젝트 정보 요청을 병렬 실행
        const responses = await Promise.all(
          effectiveUsers.map(async (user) => {
            const response = await fetch(
              `${apiUrl}/project/get_user_and_projects?user_id=${user.id}`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (!response.ok) {
              const errData = await response.json();
              throw new Error(errData.message || "사용자 정보를 가져오는 데 실패했습니다.");
            }

            return response.json();
          })
        );

        // 여러 사용자 프로젝트 데이터 병합
        const allProjects = responses.flatMap((data) => data.participants || []);
        setUserProjects(allProjects);
        console.log("allProjects : ", allProjects);
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProjectData();
  }, [effectiveUsers, apiUrl]); // effectiveUsers가 변경될 때마다 실행

  // 검색한 프로젝트 필터링
  useEffect(() => {
    if (searchQueryProject.trim() === "") {
      setFilteredProjects([]); // 검색어가 없을 경우 필터링된 프로젝트를 비웁니다.
    } else {
      // 선택된 프로젝트를 제외한 프로젝트만 필터링
      setFilteredProjects(
        projects.filter((proj) =>
          (proj.project_name || "")
            .toLowerCase()
            .includes(searchQueryProject.toLowerCase()) &&
          !selectedProjects.some((selectedProj) => selectedProj.project_code === proj.project_code) // 선택된 프로젝트는 제외
        )
      );
    }
  }, [searchQueryProject, projects, selectedProjects]);

  // 검색 후 선택한 프로젝트 처리
  const selectProject = (project) => {
    if (!selectedProjects.some((p) => p.project_code === project.project_code  )) {
      setSelectedProjects([...selectedProjects, project]);
    }
    setSearchQueryProject("");
    setFilteredProjects([]);
  };

  // 선택한 프로젝트 리스트에서 삭제
  const handleRemoveProject = (projectCode) => {
    setSelectedProjects(selectedProjects.filter((proj) => proj.project_code !== projectCode));
  };

  // 검색한 유저 필터링
  useEffect(() => {
    if (searchQueryUser.trim() === "") {
      setFilteredUsers([]); // 검색어가 없을 경우 필터링된 프로젝트를 비웁니다.
    } else {
      // 선택된 프로젝트를 제외한 프로젝트만 필터링
      setFilteredUsers(
        users.filter((userdata) =>
          (userdata.name || "")
            .toLowerCase()
            .includes(searchQueryUser.toLowerCase()) &&
          !selectedUsers.some((selectedProj) => selectedProj.name === userdata.name) // 선택된 프로젝트는 제외
        )
      );
    }
  }, [searchQueryUser, users, selectedUsers]);

  // selectedProjects나 selectedUsers가 변경될 때마다 effectiveUsers 계산
  useEffect(() => {
    if (selectedUsers.length > 0) {
      // 사용자가 직접 선택한 경우, 선택된 사용자를 그대로 사용
      setEffectiveUsers(selectedUsers);
    } else if (selectedProjects.length > 0) {
      // 프로젝트만 선택한 경우, 해당 프로젝트에 할당된 모든 사용자 ID 가져오기
      const assignedUserIds = selectedProjects.flatMap(
        project => project.assigned_user_ids || []
      );
      
      // 중복 제거
      const uniqueUserIds = [...new Set(assignedUserIds)];
      
      // ID에 해당하는 사용자 정보 찾기
      const projectUsers = uniqueUserIds
        .map(id => users.find(user => user.id === id))
        .filter(user => user !== undefined); // undefined 필터링
      
      setEffectiveUsers(projectUsers);
    } else {
      // 아무것도 선택되지 않은 경우
      setEffectiveUsers([]);
    }
  }, [selectedProjects, selectedUsers, users]);

  // 검색 후 선택한 유저 처리
  const selectUser = (user) => {
    if (!selectedUsers.some((u) => u.id === user.id  )) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setSearchQueryUser("");
    setFilteredUsers([]);
  };

  // 선택한 유저 리스트에서 삭제
  const handleRemoveUser = (id) => {
    setSelectedUsers(selectedUsers.filter((userdata) => userdata.id !== id));
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

  const applyFilters = () => {
    setAppliedStart(startFilter);
    setAppliedEnd(endFilter);
  };

  const dateFilteredProjects = userprojects.filter(project => {
    const projectStartYear = new Date(project.start_date).getFullYear();
    const projectEndYear = new Date(project.end_date).getFullYear();
  
    // ✅ 프로젝트가 선택한 연도(`year`)에 걸쳐 있고, 삭제되지 않은 프로젝트인지 확인
    const isWithinYear = projectStartYear <= year && projectEndYear >= year && project.is_delete_yn !== "Y";
  
    // ✅ selectedProjects가 비어 있으면 모든 프로젝트 포함, 아니라면 선택한 프로젝트만 포함
    const isSelected = selectedProjects.length === 0 || selectedProjects.some(selected => selected.project_code === project.project_code);
    
    return isWithinYear && isSelected;
  });
  
  if (loading) return <div className="userdetail-container">로딩 중...</div>;
  if (error) return <div className="userdetail-container">{error}</div>;

  const ChartView = ({ dateFilteredProjects }) => {
    // 프로젝트별로 참가자들을 그룹화 (project_code 별)
    const groupedProjects = dateFilteredProjects.reduce((acc, project) => {
      if (!acc[project.project_code]) {
        acc[project.project_code] = [];
      }
      acc[project.project_code].push(project);
      return acc;
    }, {});
  
    const getUserName = (userId) => {
      const user = users.find(user => user.id === userId); // users 배열에서 userId에 맞는 유저 찾기
      return user ? user.name : "Unknown"; // 유저가 있으면 name, 없으면 "Unknown"
    };

    return (
      <div className="project-chart">
        {Object.keys(groupedProjects).map((projectCode) => {
          const projects = groupedProjects[projectCode];
          const project = projects[0]; // 프로젝트 정보를 첫 번째 프로젝트에서 가져옴
          const startDate = new Date(project.start_date);
          const endDate = new Date(project.end_date);
  
          if (isNaN(startDate) || isNaN(endDate)) {
            return null;
          }
  
          const startYear = startDate.getFullYear();
          const endYear = endDate.getFullYear();
          const months = [];
  
          // 월 데이터를 저장하기 위한 로직
          for (let year = startYear; year <= endYear; year++) {
            let start = year === startYear ? startDate.getMonth() : 0; // 시작 연도의 시작 월
            let end = year === endYear ? endDate.getMonth() : 11; // 종료 연도의 종료 월
  
            for (let month = start; month <= end; month++) {
              months.push(year * 100 + month); // 월을 '연도월' 형식으로 저장
            }
          }
  
          // 각 참가자별로 표시하기
          const usersParticipation = projects.reduce((acc, project) => {
            const user = project.user_id; // 참가자 ID
            const startDate = new Date(project.start_date);
            const endDate = new Date(project.end_date);

            // 해당 참가자의 참여 월 계산
            const userMonths = [];
            for (let year = startDate.getFullYear(); year <= endDate.getFullYear(); year++) {
              let start = year === startDate.getFullYear() ? startDate.getMonth() : 0; // 시작 월
              let end = year === endDate.getFullYear() ? endDate.getMonth() : 11; // 종료 월
  
              for (let month = start; month <= end; month++) {
                userMonths.push(year * 100 + month); // '연도월' 형식으로 저장
              }
            }
  
            // 각 참가자별로 참여 월 데이터를 저장
            if (!acc[user]) {
              acc[user] = [];
            }
            acc[user] = [...acc[user], ...userMonths];
            return acc;
          }, {});
  
          return (
            <div key={projectCode} className="project-chart-row">
              <div
                className="project-chart-title"
                onClick={() => navigate(`/project-details?project_code=${projectCode}`)}
              >
                {project.project_name}
              </div>
  
              {/* 참가자별로 차트 표시 */}
              {Object.keys(usersParticipation).map((userId) => {
                const userMonths = usersParticipation[userId]; // 해당 참가자의 참여 월
                return (
                  <div key={userId} className="project-chart-user">
                    <div className="project-chart-months">
                      {/* 사람 이름을 표시 */}
                      <span className="project-chart-user-name" onClick={(event) => {
                          event.stopPropagation(); // 부모 요소의 클릭 이벤트 방지
                          navigate(`/user-details?user_id=${userId}`); // 클릭 시 user_details로 네비게이션
                        }}
                        style={{ cursor: "pointer" }} // 마우스 커서 변경 (클릭 가능한 요소임을 강조)
                      >
                        {`${getUserName(userId)}`}
                      </span>
                      {Array.from({ length: 12 }, (_, idx) => {
                        const isHighlighted = userMonths.includes(year * 100 + idx); // 해당 월에 참여했으면 하이라이트
                        return (
                          <span
                            key={idx}
                            className={`project-month ${isHighlighted ? 'highlighted' : ''}`}
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
        })}
      </div>
    );
  };
  
  const TableView = ({ dateFilteredProjects }) => {
    const navigate = useNavigate(); // ✅ 네비게이션 훅 사용

    // ✅ user_id에 해당하는 user_name 찾기
    const getUserName = (userId) => {
      const user = users.find((u) => u.id === userId);
      return user ? user.name : "알 수 없음"; // 만약 user_id가 users에 없으면 "알 수 없음" 표시
    };

    return (
      <table className="project-user-table">
        <thead>
          <tr>
            <th>참여자</th>
            <th>프로젝트명</th>
            <th>시작일</th>
            <th>종료일</th>
          </tr>
        </thead>
        <tbody>
          {dateFilteredProjects.map((project) => (
            <tr key={project.id}>
              <td
                onClick={(event) => {
                  event.stopPropagation(); // ✅ 부모 요소의 클릭 이벤트 방지
                  navigate(`/user-details?user_id=${project.user_id}`);
                }}
                style={{ cursor: "pointer" }} // ✅ 마우스 커서 변경 (클릭 가능한 요소임을 강조) // ✅ 클릭 가능한 스타일 적용
              >
                {getUserName(project.user_id)}
              </td>
              <td
                onClick={(event) => {
                  event.stopPropagation(); // ✅ 부모 요소의 클릭 이벤트 방지
                  navigate(`/project-details?project_code=${project.project_code}`);
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
    <div className="SituationControl-page">
      <header className="SituationControl-header">
        <Sidebar />
        <BackButton />
      </header>
      <div className="SituationControl-search-container">
        <div className="search-project-container">
          {/*<select
            className="search-category"
            value={searchCategory}
            onChange={(e) => setSearchCategory(e.target.value)}
          >
            <option value="code">프로젝트 코드</option>
            <option value="projectName">프로젝트 명</option>
          </select>*/}
          <h3
            className="search-project-category"
          >
            프로젝트 명
          </h3>
          <input
            type="text"
            className="search-input"
            placeholder="검색어 입력"
            value={searchQueryProject}
            onChange={(e) => setSearchQueryProject(e.target.value)}
          />
          <button className="filter-button" onClick={applyFilters}>
            <FaSearch />
          </button>
          {filteredProjects.length > 0 && (
            <ul className="autocomplete-project-list">
              {filteredProjects.map((proj) => (
                <li key={proj.project_code} onClick={() => selectProject(proj)}>
                  {proj.project_name}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="selected-projects">
          {selectedProjects.map((proj) => (
            <div key={proj.project_code} className="selected-project-box">
              <span className="project-name">{proj.project_name}</span>
              <button
                className="remove-project"
                onClick={() => handleRemoveProject(proj.project_code)}
              >
                X
              </button>
            </div>
          ))}
        </div>

        <div className="search-user-container">
          <h3
            className="search-user-category"
          >
            참가자 이름
          </h3>
          <input
            type="text"
            className="search-input"
            placeholder="검색어 입력"
            value={searchQueryUser}
            onChange={(e) => setSearchQueryUser(e.target.value)}
          />
          <button className="filter-button" onClick={applyFilters}>
            <FaSearch />
          </button>
          {filteredUsers.length > 0 && (
            <ul className="autocomplete-user-list">
              {filteredUsers.map((userdata) => (
                <li key={userdata.id} onClick={() => selectUser(userdata)}>
                  {userdata.name}-{userdata.position}-{userdata.id}-{userdata.department}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="selected-users">
          {selectedUsers.map((userdata) => (
            <div key={userdata.id} className="selected-user-box">
              <span className="user-name">
                {userdata.name}-{userdata.position}-{userdata.id}-{userdata.department}
              </span>
              <button
                className="remove-user"
                onClick={() => handleRemoveUser(userdata.id)}
              >
                X
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="SituationControl-projects">
        <div className="project-header">
          <h3>현황 목록</h3>
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
        <button className="year-button" onClick={() => setYear(year - 1)}>◀</button>
          <span className="year-text">{year}년</span>
          <button className="year-button" onClick={() => setYear(year + 1)}>▶</button>
        </div>
        {/* ✅ 차트 방식 or 표 방식 선택 */}
        {/* 차트와 표를 조건에 따라 표시 */}
        {isTableView ? (
          <TableView dateFilteredProjects={dateFilteredProjects} />
        ) : (
          <ChartView dateFilteredProjects={dateFilteredProjects} />
        )}
      </div>
    </div>
  );
};

export default SituationControls;
