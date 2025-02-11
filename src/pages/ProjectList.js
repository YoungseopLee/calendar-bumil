import React, { useState, useEffect, useRef } from "react";
import ProjectCard from "./ProjectCard";
import "./ProjectList.css";

const ProjectList = ({ projects }) => {
  const [displayedProjects, setDisplayedProjects] = useState([]);
  const [loadedCount, setLoadedCount] = useState(5); // 처음 5개만 로드
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
            setLoadedCount((prev) => prev + 5); // 5개씩 추가 로드
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
        <ProjectCard key={project.id} project={project} />
      ))}
      <div ref={observerRef} className="h-10"></div>
      {loading && <p className="loading-text">로딩 중...</p>}
    </div>
  );
};

export default ProjectList;