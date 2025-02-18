import React, { useState, useEffect } from "react";
import Sidebar from "../pages/Sidebar";
import BackButton from "./BackButton";
import "./UserDetails.css";
import {
  FaPhone,
  FaEnvelope,
  FaCircle,
  FaUserTie,
  FaBuilding,
  FaUserCircle,
} from "react-icons/fa"; // 아이콘 추가

const UserDetails = () => {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]); // 프로젝트 데이터 추가
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());

  const apiUrl = process.env.REACT_APP_API_URL || "http://3.38.20.237";

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("로그인이 필요합니다.");
        setLoading(false);
        return;
      }

      try {
        // 사용자 정보 가져오기
        const userResponse = await fetch(`${apiUrl}/auth/get_logged_in_user`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!userResponse.ok) {
          const errData = await userResponse.json();
          throw new Error(errData.message || "사용자 정보를 가져오는 데 실패했습니다.");
        }

        const userData = await userResponse.json();
        setUser(userData.user);

        // 프로젝트 정보 가져오기
        /*const projectsResponse = await fetch(`${apiUrl}/projects/user_projects`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!projectsResponse.ok) {
          const errData = await projectsResponse.json();
          throw new Error(errData.message || "프로젝트 정보를 가져오는 데 실패했습니다.");
        }

        const projectsData = await projectsResponse.json();
        setProjects(projectsData.projects);
        */

        // 프로젝트 정보 가져오기 (API가 준비되지 않았으므로 임시 데이터 사용)
        const projectsData = [
          { id: 1, name: "프로젝트 A", start_date: "2024-02-10", end_date: "2024-05-20" },
          { id: 2, name: "프로젝트 B", start_date: "2024-06-01", end_date: "2024-12-31" }
        ];

        setProjects(projectsData);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [apiUrl]);

  const getMonthStatus = (start, end) => {
    const months = Array(12).fill(""); // 1월~12월 배열
    const startDate = new Date(start);
    const endDate = new Date(end);

    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(startDate.getFullYear(), i, 1);
      if (monthDate >= startDate && monthDate <= endDate) {
        months[i] = "O";
      }
    }
    return months;
  };

  const filteredProjects = projects.filter(project => {
    const projectYear = new Date(project.start_date).getFullYear();
    return projectYear === year;
  });

  if (loading) return <div className="userdetail-container">로딩 중...</div>;
  if (error) return <div className="userdetail-container">{error}</div>;

  return (
    <div className="userdetail-page">
      <header className="userdetail-header">
        <Sidebar />
        <BackButton />
      </header>
      <div className="userdetail-container">
        {/* 프로필 아이콘 추가 */}
        <div className="userdetail-profile-icon">
          <FaUserCircle className="user-icon" />
        </div>

        {/* 사용자 이름 */}
        <div className="userdetail-header-section">
          <h2>{user.name}</h2>
        </div>

        {/* 사용자 정보 */}
        <div className="userdetail-content">
          <div className="userdetail-details">
            <p>
              <FaUserTie className="icon" />
              {user.position}
            </p>
            <p>
              <FaBuilding className="icon" />
              {user.department}
            </p>
            <p>
              <FaCircle
                className={`status-icon ${user.status === "출근" ? "online" : "offline"}`}
              />
              {user.status}
            </p>
            <p>
              <FaPhone className="icon" />
              {user.phone_number}
            </p>
            <p>
              <FaEnvelope className="icon" />
              {user.id}
            </p>
          </div>
        </div>

        

      </div>

      <div className="userdetail-projects">
        <h3>참여한 프로젝트</h3>
        <div className="year-selector">
        <button className="year-button" onClick={() => setYear(year - 1)}>◀</button>
          <span className="year-text">{year}년</span>
          <button className="year-button" onClick={() => setYear(year + 1)}>▶</button>
        </div>
        <table className="project-table">
          <thead>
            <tr>
              {Array.from({ length: 12 }, (_, index) => (
                <th key={index + 1}>{index + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map((project) => {
              const startMonth = new Date(project.start_date).getMonth() + 1;
              const endMonth = new Date(project.end_date).getMonth() + 1;
              const colSpan = endMonth - startMonth + 1;

              return (
                <tr key={project.id}>
                  {Array.from({ length: 12 }, (_, idx) => {
                    if (idx + 1 === startMonth) {
                      return (
                        <td key={idx} colSpan={colSpan} className="project-cell">
                          {project.name}
                        </td>
                      );
                    } else if (idx + 1 > startMonth && idx + 1 <= endMonth) {
                      return null;
                    } else {
                      return <td key={idx}></td>;
                    }
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
    </div>
  );
};

export default UserDetails;
