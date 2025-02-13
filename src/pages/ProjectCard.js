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
  const statusClass = `status-${(project.status || "").replace(/\s/g, "")}`;

  // ✅ 날짜 형식 변환 (오류 방지)
  const formatDate = (dateString) => {
    if (!dateString) return "날짜 없음"; // ✅ 빈 값 처리
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "날짜 없음" : date.toISOString().split("T")[0];
  };

  return (
    <div className="project-card" onClick={handleCardClick}>
      <h2 className="project-title">{project.name || "프로젝트명 없음"}</h2>
      <p className="project-code">
        <strong>프로젝트 코드:</strong> {project.code || "없음"}
      </p>
      <p className="project-group">
        <strong>그룹명:</strong> {project.group || "없음"}
      </p>
      <p className="project-owner">
        <strong>영업대표:</strong> {project.owner || "없음"}
      </p>
      <p className="project-pm">
        <strong>PM:</strong> {project.pm || "없음"}
      </p>
      <p className="project-period">
        <strong>기간:</strong> {formatDate(project.startDate)} ~ {formatDate(project.endDate)}
      </p>
      <span className={`project-status ${statusClass}`}>{project.status || "상태 없음"}</span>
    </div>
  );
};

export default ProjectCard;