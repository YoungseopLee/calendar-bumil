import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // 관리자 여부 상태
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    console.log("localstorage user: ", user);
    if (user && user.role_id === "AD_ADMIN") {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleManagerClick = () => {
    if (isAdmin) {
      navigate("/manager");
    } else {
      alert("관리자만 접근 가능한 페이지입니다.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="app-body">
      <button className="hamburger-btn" onClick={toggleSidebar}>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
      </button>
      {isOpen && (
        <div className="sidebar">
          <ul className="menu">
            {isAdmin && (
              <li>
                <a href="#" onClick={handleManagerClick}>
                  관리자
                </a>
              </li>
            )}
            <li>
              <Link to="/projects">프로젝트</Link>
            </li>
            <li>
              <Link to="/employee">직원</Link>
            </li>
            <li>
              <Link to="/calendar">달력</Link>
            </li>
            <li>
              <Link to="/mypage">내 정보</Link>
            </li>
            <li>
              <Link to="/" onClick={handleLogout} className="logout-link">
                로그아웃
              </Link>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
