import React, { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa"; // 🔍 검색 아이콘 추가
import ProjectList from "./ProjectList";
import Sidebar from "./Sidebar";
import "./ProjectPage.css";

const ProjectPage = () => {
  const [projects, setProjects] = useState([]);
  const [startFilter, setStartFilter] = useState("");
  const [endFilter, setEndFilter] = useState("");
  const [appliedStart, setAppliedStart] = useState("");
  const [appliedEnd, setAppliedEnd] = useState("");

  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // ✅ 프로젝트 데이터 불러오기 (API 호출)
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(`${apiUrl}/project/get_all_project`);
        if (response.ok) {
          const data = await response.json();
          const transformedProjects = data.projects.map((proj) => ({
            id: proj.Project_Code,
            code: proj.Project_Code,
            name: proj.Project_Name,
            group: proj.Group_Name,
            owner: proj.Sales_Representative,
            pm: proj.Project_PM,
            status: proj.Status,
            startDate: proj.Business_Start_Date,
            endDate: proj.Business_End_Date,
          }));
          setProjects(transformedProjects);
        } else {
          console.error("프로젝트 데이터를 불러오지 못했습니다.");
        }
      } catch (error) {
        console.error("프로젝트 데이터 로딩 오류:", error);
      }
    };

    fetchProjects();
  }, [apiUrl]);

  // ✅ 검색 버튼을 클릭해야 필터 적용됨
  const applyFilters = () => {
    setAppliedStart(startFilter);
    setAppliedEnd(endFilter);
  };

  // ✅ 프로젝트 필터링 로직
  const filteredProjects = projects.filter((project) => {
    const projectStart = new Date(project.startDate);
    const projectEnd = new Date(project.endDate);
    const filterStart = appliedStart ? new Date(appliedStart) : null;
    const filterEnd = appliedEnd ? new Date(appliedEnd) : null;

    return (!filterStart || projectEnd >= filterStart) &&
           (!filterEnd || projectStart <= filterEnd);
  });

  return (
    <div className="project-page">
      <Sidebar />
      <div className="content">
        <div className="projectPage-box">
          <h1 className="title">프로젝트 목록</h1>

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

            {/* ✅ 검색 버튼을 아이콘으로 변경 */}
            <button className="filter-button" onClick={applyFilters}>
              <FaSearch />
            </button>
          </div>

          {/* ✅ 현재 적용된 필터 표시 */}
          {appliedStart && appliedEnd && (
            <p className="filter-info">
              기간 내 진행중인 프로젝트: <strong>{appliedStart} ~ {appliedEnd}</strong>
            </p>
          )}

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