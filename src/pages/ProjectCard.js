import React from "react";
import { useNavigate } from "react-router-dom";
import "./ProjectCard.css";

const ProjectCard = ({ project }) => {
  const navigate = useNavigate();

  // ✅ 카드 클릭 시 상세페이지로 이동
  const handleCardClick = () => {
    navigate(`/project-details?project_code=${project.code}`);
  };

  // ✅ 상태 값에서 공백 제거 후 클래스 적용
  const statusClass = `status-${project.status.replace(/\s/g, "")}`;

  return (
    <div className="project-card" onClick={handleCardClick}>
      <h2 className="project-title">{project.name}</h2>
      <p className="project-code"><strong>프로젝트 코드:</strong> {project.code}</p>
      <p className="project-group"><strong>그룹명:</strong> {project.group}</p>
      <p className="project-owner"><strong>영업대표:</strong> {project.owner}</p>
      <p className="project-pm"><strong>PM:</strong> {project.pm}</p>
      <p className="project-period"><strong>기간:</strong> {project.startDate} ~ {project.endDate}</p>
      <span className={`project-status ${statusClass}`}>{project.status}</span>
    </div>
  );
};

export default ProjectCard;