import React, { useState, useEffect } from "react";
import ProjectList from "./ProjectList";
import Sidebar from "./Sidebar";
import "./ProjectPage.css";

const generateDummyProjects = (count) => {
  const statuses = ["진행 중", "완료", "보류"];
  const owners = ["Admin", "PM", "User"];
  const membersList = ["User1", "User2", "User3", "User4", "User5"];

  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: `Project ${index + 1}`,
    owner: owners[Math.floor(Math.random() * owners.length)],
    members: membersList.sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 3) + 1),
    status: statuses[Math.floor(Math.random() * statuses.length)],
  }));
};

const ProjectPage = () => {
  const [projects, setProjects] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const dummyProjects = generateDummyProjects(50);
    setProjects(dummyProjects);
  }, []);

  // 🔍 검색 필터링 함수
  const filteredProjects = projects.filter((project) => {
    const searchLower = searchText.toLowerCase();
    return (
      project.name.toLowerCase().includes(searchLower) ||  // 프로젝트 이름 검색
      project.owner.toLowerCase().includes(searchLower) || // 소유자 검색
      project.status.toLowerCase().includes(searchLower) || // 상태 검색
      project.members.some(member => member.toLowerCase().includes(searchLower)) // 멤버 검색
    );
  });

  return (
    <div className={`project-page ${isSidebarOpen ? "sidebar-open" : ""}`}>
      <Sidebar />
      <div className="content">
        <div className="box">
          <h1 className="title">프로젝트 목록</h1>
          <input
            type="text"
            className="search-input"
            placeholder="검색 (이름, 소유자, 상태, 멤버)"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
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