import React, { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import ProjectList from "./ProjectList";
import Sidebar from "./Sidebar";
import AddProjectButton from "./AddProjectButton";
import "./ProjectPage.css";

/**
 * 📌 ProjectPage - 프로젝트 목록을 조회하고 필터링하는 페이지
 *
 * ✅ 주요 기능:
 *  - 프로젝트 목록 조회 (GET /project/get_all_project)
 *  - 사용자 목록 조회 (GET /user/get_users)
 *  - 검색 / 필터링 기능 (상태별, 날짜별, 텍스트 검색)
 *  - 권한(AD_ADMIN, PR_ADMIN) 확인 후 프로젝트 추가 버튼 표시
 *
 * ✅ UI(또는 Component) 구조:
 *  - ProjectPage (메인 페이지)
 *    ├── Sidebar (사이드바)
 *    ├── AddProjectButton (프로젝트 추가 버튼 - 관리자 전용)
 *    ├── ProjectList (프로젝트 목록)
 *    │      ├── ProjectCard (각 프로젝트 카드)
 */

const ProjectPage = () => {
  const [projects, setProjects] = useState([]); // 프로젝트 목록
  const [users, setUsers] = useState([]); // 사용자 목록
  const [userIdToNameMap, setUserIdToNameMap] = useState({}); // 사용자 ID-이름 매핑
  const [roleId, setRoleId] = useState(""); // 현재 로그인한 사용자의 권한

  // 검색 및 필터링 관련 상태
  const [searchCategory, setSearchCategory] = useState("projectName"); // 검색 카테고리
  const [searchQuery, setSearchQuery] = useState(""); // 검색어
  const [selectedStatus, setSelectedStatus] = useState([]); // 선택된 상태
  const [startFilter, setStartFilter] = useState(""); // 시작 날짜 필터
  const [endFilter, setEndFilter] = useState(""); // 종료 날짜 필터
  const [appliedStart, setAppliedStart] = useState(""); // 적용된 시작 날짜
  const [appliedEnd, setAppliedEnd] = useState(""); // 적용된 종료 날짜

  // 환경 변수에서 API URL 가져오기
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // 🔹 [1] 사용자 권한 조회
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("❌ 로그인 토큰이 없습니다.");
          return;
        }

        const response = await fetch(`${apiUrl}/auth/get_logged_in_user`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setRoleId(data.user?.role_id || "");
        } else {
          console.error("❌ 사용자 정보를 불러오지 못했습니다.");
        }
      } catch (error) {
        console.error("🚨 사용자 정보 로딩 오류:", error);
      }
    };

    fetchUserRole();
  }, [apiUrl]);


  // 🔹 [2] 사용자 목록 조회
  useEffect(() => {

    const fetchUsers = async () => {
      try {
        const response = await fetch(`${apiUrl}/user/get_users`);
        if (!response.ok) throw new Error("사용자 데이터를 불러오지 못했습니다.");
        const data = await response.json();
        setUsers(data.users);

        // 사용자 ID-이름 매핑 생성
        const idToNameMapping = {};
        data.users.forEach((user) => {
          idToNameMapping[user.id] = user.name;
        });

        setUserIdToNameMap(idToNameMapping);
      } catch (err) {
        console.error("사용자 목록 불러오기 오류:", err);
      }
    };

    fetchUsers();
  }, [apiUrl]);

  // 🔹 [3] 프로젝트 목록 조회
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(`${apiUrl}/project/get_all_project`);
        if (!response.ok) throw new Error("프로젝트 데이터를 불러오지 못했습니다.");
        const data = await response.json();
        if (!data.projects) return;

        // 프로젝트 데이터를 변환하여 상태에 저장
        const transformedProjects = data.projects.map((proj) => ({
          id: proj.project_code || "",
          code: proj.project_code || "",
          name: proj.project_name || "",
          group: proj.group_name || "",
          owner: proj.sales_representative || "",
          pm: proj.project_pm || "",
          status: proj.status || "",
          startDate: proj.business_start_date || "",
          endDate: proj.business_end_date || "",
          participantNames: proj.assigned_user_ids
            ? proj.assigned_user_ids.map((id) => userIdToNameMap[id] || id)
            : [],
        }));

        setProjects(transformedProjects);
      } catch (error) {
        console.error("🚨 프로젝트 데이터 로딩 오류:", error);
      }
    };

    if (Object.keys(userIdToNameMap).length > 0) {
      fetchProjects();
    }
  }, [apiUrl, userIdToNameMap]);

  // 날짜 필터 적용
  const applyFilters = () => {
    setAppliedStart(startFilter);
    setAppliedEnd(endFilter);
  };

  // 상태 필터 토글 (제안, 수행, 실주종료)
  const handleStatusClick = (status) => {
    if (selectedStatus.includes(status)) {
      // 이미 선택된 상태일 경우 제거
      setSelectedStatus(selectedStatus.filter((s) => s !== status));
    } else {
      // 선택되지 않은 상태일 경우 추가
      setSelectedStatus([...selectedStatus, status]);
    }
  };

  // 검색 및 필터링 적용된 프로젝트 목록 필터링
  const filteredProjects = projects.filter((project) => {
    const projectStart = new Date(project.startDate);
    const projectEnd = new Date(project.endDate);
    const filterStart = appliedStart ? new Date(appliedStart) : null;
    const filterEnd = appliedEnd ? new Date(appliedEnd) : null;


    const matchesSearch =
      searchCategory === "projectName"
        ? project.name.includes(searchQuery)
        : searchCategory === "code"
          ? project.code.includes(searchQuery)
          : searchCategory === "allParticipants"
            ? project.owner.includes(searchQuery) ||
            project.pm.includes(searchQuery) ||
            project.participantNames.some((name) => name.includes(searchQuery))
            : searchCategory === "salesRep"
              ? project.owner.includes(searchQuery)
              : searchCategory === "projectPM"
                ? project.pm.includes(searchQuery)
                : searchCategory === "participants"
                  ? project.participantNames.some((name) => name.includes(searchQuery))
                  : false;


    const matchesStatus =
      selectedStatus.length === 0 || selectedStatus.includes(project.status);

    return (
      (!filterStart || projectEnd >= filterStart) &&
      (!filterEnd || projectStart <= filterEnd) &&
      matchesSearch &&
      matchesStatus
    );
  });

  return (
    <div className="project-page">
      <Sidebar />
      {/* ✅ ADMIN 권한만 프로젝트 추가 버튼 표시 */}
      {roleId && ["AD_ADMIN", "PR_ADMIN"].includes(roleId) && <AddProjectButton />}
      <div className="content">
        <div className="projectPage-box">
          <div className="fixed-header">
            <h1 className="title">프로젝트 목록</h1>

            {/* 🔍 검색 필터 */}
            <div className="search-container">
              <select
                className="search-category"
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
              >
                <option value="code">프로젝트 코드</option>
                <option value="projectName">프로젝트 명</option>
                <option value="allParticipants">참여인력 (전체)</option>
                <option value="salesRep">영업대표</option>
                <option value="projectPM">프로젝트 PM</option>
                <option value="participants">프로젝트 참여자</option>
              </select>
              <input
                type="text"
                className="search-input"
                placeholder="검색어 입력"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="filter-button" onClick={applyFilters}>
                <FaSearch />
              </button>
            </div>

            {/* 📅 날짜 필터 */}
            <div className="filter-container">
              <input
                type="date"
                className="date-filter"
                value={startFilter}
                onChange={(e) => {
                  const newStart = e.target.value;
                  setStartFilter(newStart);

                  // 🚀 자동 조정: 시작 날짜가 종료 날짜보다 뒤라면 종료 날짜도 같이 변경
                  if (endFilter && new Date(newStart) > new Date(endFilter)) {
                    setEndFilter(newStart);
                  }
                }}
              />

              <input
                type="date"
                className="date-filter"
                value={endFilter}
                onChange={(e) => {
                  const newEnd = e.target.value;
                  setEndFilter(newEnd);

                  // 🚀 자동 조정: 종료 날짜가 시작 날짜보다 앞이라면 시작 날짜도 같이 변경
                  if (startFilter && new Date(startFilter) > new Date(newEnd)) {
                    setStartFilter(newEnd);
                  }
                }}
              />
              <button className="filter-button" onClick={applyFilters}>
                <FaSearch />
              </button>
            </div>

            {/* 상태 필터 */}
            <div className="status-toggle-container">
              {["제안", "수행", "실주종료"].map((status) => (
                <button
                  key={status}
                  className={`status-toggle ${selectedStatus.includes(status) ? "active" : ""}`}
                  onClick={() => handleStatusClick(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* 필터링 된 프로젝트 목록 */}
          {filteredProjects.length > 0 ? (
            <ProjectList projects={filteredProjects} />
          ) : (
            <p className="no-results">검색 결과가 없습니다.</p>
          )}
        </div>
      </div>
    </div>

  );
};

export default ProjectPage;