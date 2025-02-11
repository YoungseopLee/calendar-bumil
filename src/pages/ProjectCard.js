import React from "react";
import "./ProjectCard.css";

const ProjectCard = ({ project }) => {
  return (
    <div className="project-card">
      <div className="project-header">
        <span>{project.name}</span>
        <span className={`project-status status-${project.status.replace(/\s+/g, '')}`}>
          {project.status}
        </span>
      </div>
      <span>Owner: {project.owner}</span>
      <span>Members: {project.members.join(", ")}</span>
    </div>
  );
};

export default ProjectCard;