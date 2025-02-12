import React, { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa"; 
import ProjectList from "./ProjectList";
import Sidebar from "./Sidebar";
import "./ProjectPage.css";

const ProjectPage = () => {
  const [projects, setProjects] = useState([]);
  const [startFilter, setStartFilter] = useState("");
  const [endFilter, setEndFilter] = useState("");
  const [appliedStart, setAppliedStart] = useState("");
  const [appliedEnd, setAppliedEnd] = useState("");
  const [searchCategory, setSearchCategory] = useState("projectName"); // 검색 기준
  const [searchQuery, setSearchQuery] = useState(""); // 검색 값
  const [selectedStatus, setSelectedStatus] = useState(""); // ✅ 선택된 상태 저장

  // ✅ 더미 데이터 생성 함수
  const generateDummyProjects = (count) => {
    const groups = ["구축 인프라", "구축 SW", "유지보수 인프라", "유지보수 SW", "연구과제"];
    const statuses = ["제안", "진행 중", "완료"];
    const salesReps = ["김영수", "박진우", "이민정", "최동영", "서정교"];
    const pmList = ["주성호", "이현재", "최영철", "이종우", "한지민"];

    return Array.from({ length: count }, (_, index) => {
      const startDate = new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 180) + 1);

      return {
        id: index + 1,
        code: `2025${String(index + 1).padStart(4, "0")}`,
        name: `프로젝트 ${index + 1}`,
        group: groups[Math.floor(Math.random() * groups.length)],
        owner: salesReps[Math.floor(Math.random() * salesReps.length)],
        pm: pmList[Math.floor(Math.random() * pmList.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      };
    });
  };

  // ✅ 더미 데이터 설정
  useEffect(() => {
    if (projects.length === 0) {
      setProjects(generateDummyProjects(150)); // 150개 생성
    }
  }, [projects]);

  // ✅ API 호출 (주석 처리하여 더미 데이터로 테스트 가능)
  // const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
  // useEffect(() => {
  //   const fetchProjects = async () => {
  //     try {
  //       const response = await fetch(`${apiUrl}/project/get_all_project`);
  //       if (response.ok) {
  //         const data = await response.json();
  //         const transformedProjects = data.projects.map((proj) => ({
  //           id: proj.Project_Code,
  //           code: proj.Project_Code,
  //           name: proj.Project_Name,
  //           group: proj.Group_Name,
  //           owner: proj.Sales_Representative,
  //           pm: proj.Project_PM,
  //           status: proj.Status,
  //           startDate: proj.Business_Start_Date,
  //           endDate: proj.Business_End_Date,
  //         }));
  //         setProjects(transformedProjects);
  //       } else {
  //         console.error("프로젝트 데이터를 불러오지 못했습니다.");
  //       }
  //     } catch (error) {
  //       console.error("프로젝트 데이터 로딩 오류:", error);
  //     }
  //   };

  //   fetchProjects();
  // }, [apiUrl]);

  // ✅ 검색 버튼을 클릭해야 필터 적용됨
  const applyFilters = () => {
    setAppliedStart(startFilter);
    setAppliedEnd(endFilter);
  };

  // ✅ 상태 필터 버튼 클릭 시 선택 상태 변경
  const handleStatusClick = (status) => {
    setSelectedStatus(status === selectedStatus ? "" : status); // 동일한 버튼 클릭 시 해제
  };

  // ✅ 프로젝트 필터링 로직 (검색 + 상태 필터링 추가)
  const filteredProjects = projects.filter((project) => {
    const projectStart = new Date(project.startDate);
    const projectEnd = new Date(project.endDate);
    const filterStart = appliedStart ? new Date(appliedStart) : null;
    const filterEnd = appliedEnd ? new Date(appliedEnd) : null;

    const matchesSearch =
      searchCategory === "projectName"
        ? project.name.includes(searchQuery)
        : searchCategory === "owner"
        ? project.owner.includes(searchQuery)
        : searchCategory === "pm"
        ? project.pm.includes(searchQuery)
        : project.code.includes(searchQuery);
        

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
      <div className="content">
        <div className="projectPage-box">
          <h1 className="title">프로젝트 목록</h1>

          {/* ✅ 검색 UI */}
          <div className="search-container">
            <select
              className="search-category"
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
            >
              <option value="code">프로젝트 코드</option>
              <option value="projectName">프로젝트 명</option>
              <option value="owner">영업대표</option>
              <option value="pm">PM</option>
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

          {/* ✅ 필터 UI */}
          <div className="filter-container">
            <input
              type="date"
              className="date-filter"
              value={startFilter}
              onChange={(e) => setStartFilter(e.target.value)}
            />
            <span className="date-separator">~</span>
            <input
              type="date"
              className="date-filter"
              value={endFilter}
              onChange={(e) => setEndFilter(e.target.value)}
            />
            <button className="filter-button" onClick={applyFilters}>
              <FaSearch />
            </button>
          </div>

          {/* ✅ 토글 버튼 UI */}
          <div className="status-toggle-container">
            {["제안", "진행 중", "완료"].map((status) => (
              <button
                key={status}
                className={`status-toggle ${selectedStatus === status ? "active" : ""}`}
                onClick={() => handleStatusClick(status)}
              >
                {status}
              </button>
            ))}
          </div>

          {/* ✅ 프로젝트 목록 출력 */}
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