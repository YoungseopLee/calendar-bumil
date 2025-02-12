import React, { useState, useEffect } from "react";
import ProjectList from "./ProjectList";
import Sidebar from "./Sidebar";
import "./ProjectPage.css";

const ProjectPage = () => {
  const [projects, setProjects] = useState([]);
  const [startFilter, setStartFilter] = useState(""); // 시작하는 기간
  const [endFilter, setEndFilter] = useState(""); // 끝나는 기간
  const [appliedStart, setAppliedStart] = useState(""); // 적용된 필터 (검색 버튼 클릭 후)
  const [appliedEnd, setAppliedEnd] = useState(""); // 적용된 필터 (검색 버튼 클릭 후)

  useEffect(() => {
    if (projects.length === 0) {
      const generateDummyProjects = (count) => {
        const groups = ["구축 인프라", "구축 SW", "유지보수 인프라", "유지보수 SW", "연구과제"];
        const statuses = ["제안", "진행 중", "완료"];
        const salesReps = ["김영수", "박진우", "이민정", "최동영", "서정교"];
        const pmList = ["주성호", "이현재", "최영철", "이종우", "한지민"];

        return Array.from({ length: count }, (_, index) => {
          const startDate = new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 180) + 1); // 최대 6개월 차이

          return {
            id: index + 1,
            code: `2025${String(index + 1).padStart(4, "0")}`,
            name: `프로젝트 ${index + 1}`,
            group: groups[Math.floor(Math.random() * groups.length)],
            owner: salesReps[Math.floor(Math.random() * salesReps.length)],
            pm: pmList[Math.floor(Math.random() * pmList.length)],
            status: statuses[Math.floor(Math.random() * statuses.length)],
            startDate: startDate.toISOString().split("T")[0], // YYYY-MM-DD 형식
            endDate: endDate.toISOString().split("T")[0], // YYYY-MM-DD 형식
          };
        });
      };

      setProjects(generateDummyProjects(50));
    }
  }, [projects]);

  // ✅ 검색 버튼을 눌러야 적용되도록 설정
  const applyFilters = () => {
    setAppliedStart(startFilter);
    setAppliedEnd(endFilter);
  };

  // 🔍 필터링 로직 (검색 버튼 클릭 시만 적용)
  const filteredProjects = projects.filter((project) => {
    const projectStart = new Date(project.startDate);
    const projectEnd = new Date(project.endDate);

    const filterStart = appliedStart ? new Date(appliedStart) : null;
    const filterEnd = appliedEnd ? new Date(appliedEnd) : null;

    // ✅ 개선된 필터링 로직 (검색 버튼을 누른 후 적용)
    return (!filterStart || projectEnd >= filterStart) &&
           (!filterEnd || projectStart <= filterEnd);
  });

  return (
    <div className="project-page">
      <Sidebar />
      <div className="content">
        <div className="box">
          <h1 className="title">프로젝트 목록</h1>

          {/* ✅ 필터 UI */}
          <div className="filter-container">
            {/* <label>시작 날짜:</label> */}
            <input
              type="date"
              className="date-filter"
              value={startFilter}
              onChange={(e) => setStartFilter(e.target.value)}
            />

            <span className="date-separator">~</span>

            {/* <label>종료 날짜:</label> */}
            <input
              type="date"
              className="date-filter"
              value={endFilter}
              onChange={(e) => setEndFilter(e.target.value)}
            />

            <button className="filter-button" onClick={applyFilters}>
              검색
            </button>
          </div>

          {/* ✅ 현재 적용된 필터링 표시 */}
          {appliedStart && appliedEnd && (
            <p className="filter-info">
              기간 내 진행중인 프로젝트: <strong>{appliedStart} ~ {appliedEnd}</strong>
            </p>
          )}

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