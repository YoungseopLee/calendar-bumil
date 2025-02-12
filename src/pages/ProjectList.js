import React, { useState, useEffect, useRef } from "react";
import ProjectCard from "./ProjectCard";
import "./ProjectList.css";

const ProjectList = ({ projects }) => {
  const [displayedProjects, setDisplayedProjects] = useState([]); // ✅ 현재 화면에 보여지는 프로젝트 목록
  const [loadedCount, setLoadedCount] = useState(5); // ✅ 초기 로딩 개수 (5개)
  const observerRef = useRef(null);
  const [loading, setLoading] = useState(false); // ✅ 로딩 상태

  // ✅ 프로젝트 데이터가 변경될 때마다 보여지는 목록 업데이트
  useEffect(() => {
    setDisplayedProjects(projects.slice(0, loadedCount));
  }, [projects, loadedCount]);

  // ✅ IntersectionObserver를 사용한 무한 스크롤 로직
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && loadedCount < projects.length) {
          setLoading(true);
          setTimeout(() => {
            setLoadedCount((prev) => prev + 5); // ✅ 5개씩 추가 로드
            setLoading(false);
          }, 1000);
        }
      },
      { threshold: 1.0 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect(); // ✅ 컴포넌트 언마운트 시 옵저버 해제
  }, [loadedCount, projects]);

  return (
    <div className="project-list">
      {/* ✅ 개별 프로젝트 카드 렌더링 (클릭 이벤트는 ProjectCard 내부에서 처리) */}
      {displayedProjects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
      
      {/* ✅ 스크롤 감지를 위한 빈 div */}
      <div ref={observerRef} className="h-10"></div>

      {/* ✅ 로딩 중 메시지 */}
      {loading && <p className="loading-text">로딩 중...</p>}
    </div>
  );
};

export default ProjectList;