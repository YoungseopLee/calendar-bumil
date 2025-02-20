import React, { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import ProjectList from "./ProjectList";
import Sidebar from "./Sidebar";
import AddProjectButton from "./AddProjectButton";  // ✅ 프로젝트 생성 버튼 추가
import "./ProjectPage.css";

const ProjectPage = () => {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);  
  const [userIdToNameMap, setUserIdToNameMap] = useState({});  
  const [roleId, setRoleId] = useState("");  // ✅ roleId 상태 추가
  const [searchCategory, setSearchCategory] = useState("projectName");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [startFilter, setStartFilter] = useState("");
  const [endFilter, setEndFilter] = useState("");
  const [appliedStart, setAppliedStart] = useState("");
  const [appliedEnd, setAppliedEnd] = useState("");

  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // ✅ 로그인한 사용자의 roleId 가져오기
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
          console.log("📌 로그인 사용자 정보:", data);
          console.log("📌 설정된 roleId:", data.user?.role_id); // ✅ roleId 로그 확인
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

  // ✅ 사용자 데이터 가져오기 (ID → 이름 변환용)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${apiUrl}/user/get_users`);
        if (!response.ok) throw new Error("사용자 데이터를 불러오지 못했습니다.");
        const data = await response.json();
        setUsers(data.users);

        const idToNameMapping = {};
        data.users.forEach(user => {
          idToNameMapping[user.id] = user.name;
        });

        console.log("📌 ID → 이름 매핑:", idToNameMapping);
        setUserIdToNameMap(idToNameMapping);
      } catch (err) {
        console.error("사용자 목록 불러오기 오류:", err);
      }
    };

    fetchUsers();
  }, [apiUrl]);

  // ✅ 프로젝트 데이터 가져오기
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(`${apiUrl}/project/get_all_project`);
        if (!response.ok) throw new Error("프로젝트 데이터를 불러오지 못했습니다.");
        const data = await response.json();
        if (!data.projects) return;

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
            ? proj.assigned_user_ids.map(id => userIdToNameMap[id] || id) 
            : []
        }));

        console.log("📌 변환된 프로젝트 데이터:", transformedProjects);
        setProjects(transformedProjects);
      } catch (error) {
        console.error("🚨 프로젝트 데이터 로딩 오류:", error);
      }
    };

    if (Object.keys(userIdToNameMap).length > 0) {  
      fetchProjects();
    }
  }, [apiUrl, userIdToNameMap]);

  // ✅ 검색 버튼을 클릭해야 필터 적용됨
  const applyFilters = () => {
    setAppliedStart(startFilter);
    setAppliedEnd(endFilter);
  };

  // ✅ 상태 필터 버튼 클릭 시 선택 상태 변경
  const handleStatusClick = (status) => {
    setSelectedStatus(status === selectedStatus ? "" : status);
  };

  // ✅ 프로젝트 필터링 로직
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
          project.participantNames.some(name => name.includes(searchQuery))
        : searchCategory === "salesRep"
        ? project.owner.includes(searchQuery)
        : searchCategory === "projectPM"
        ? project.pm.includes(searchQuery)
        : searchCategory === "participants"
        ? project.participantNames.some(name => name.includes(searchQuery))
        : false;

    const matchesStatus = selectedStatus ? project.status === selectedStatus : true;

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
      
      {/* ✅ roleId에 따라 생성 버튼 표시 */}
      {["AD_ADMIN", "USR_GENERAL", "PR_ADMIN"].includes(roleId) && <AddProjectButton />}
      
      <div className="content">
        <div className="projectPage-box">
          <h1 className="title">프로젝트 목록</h1>

          <div className="search-container">
            <select className="search-category" value={searchCategory} onChange={(e) => setSearchCategory(e.target.value)}>
              <option value="code">프로젝트 코드</option>
              <option value="projectName">프로젝트 명</option>
              <option value="allParticipants">참여인력 (전체)</option>
              <option value="salesRep">영업대표</option>
              <option value="projectPM">프로젝트 PM</option>
              <option value="participants">프로젝트 참여자</option>
            </select>
            <input type="text" className="search-input" placeholder="검색어 입력" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <button className="filter-button" onClick={applyFilters}>
              <FaSearch />
            </button>
          </div>

          {filteredProjects.length > 0 ? <ProjectList projects={filteredProjects} /> : <p className="no-results">검색 결과가 없습니다.</p>}
        </div>
      </div>
    </div>
  );
};

export default ProjectPage;