import React, { useState, useEffect, useRef } from "react";
import ProjectCard from "./ProjectCard";
import "./ProjectList.css";

const ProjectList = ({ projects }) => {
  const [displayedProjects, setDisplayedProjects] = useState([]);
  const [loadedCount, setLoadedCount] = useState(5);
  const observerRef = useRef(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDisplayedProjects(projects.slice(0, loadedCount));
  }, [projects, loadedCount]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && loadedCount < projects.length) {
          setLoading(true);
          setTimeout(() => {
            setLoadedCount((prev) => prev + 5);
            setLoading(false);
          }, 1000);
        }
      },
      { threshold: 1.0 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [loadedCount, projects]);

  return (
    <div className="project-list">
      {displayedProjects.map((project) => (
        <ProjectCard key={project.id} project={project} /> // ✅ 클릭 이벤트는 ProjectCard에서 처리
      ))}
      <div ref={observerRef} className="h-10"></div>
      {loading && <p className="loading-text">로딩 중...</p>}
    </div>
  );
};

export default ProjectList;