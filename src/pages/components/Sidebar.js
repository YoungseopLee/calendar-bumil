import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMenu } from "react-icons/fi";
import {
  FaCalendarAlt,
  FaClipboardList,
  FaUsers,
  FaUser,
  FaProjectDiagram,
  FaTools,
  FaUserShield,
  FaSignOutAlt,
} from "react-icons/fa";
import "./Sidebar.css";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(window.innerWidth > 1024);
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 1024);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const [userid, setUserid] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setUserid(user?.id);
    setIsAdmin(user?.role_id === "AD_ADMIN");

    // 반응형 화면 크기 체크
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsOpen(true); // 데스크탑에서는 항상 열림
        setIsTablet(false);
      } else if (window.innerWidth > 768) {
        setIsOpen(false); // 태블릿에서는 아이콘만 보이도록
        setIsTablet(true);
      } else {
        setIsOpen(false); // 모바일에서는 닫기
        setIsTablet(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => {
    if (window.innerWidth <= 768) {
      setIsOpen(false);
    }
  };

  const handleManagerClick = (e) => {
    e.preventDefault();
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
      {/* 모바일에서만 햄버거 버튼 보이기 */}
      {window.innerWidth <= 1024 && (
        <button className="hamburger-btn" onClick={toggleSidebar}>
          <FiMenu size={28} color="#333" />
        </button>
      )}

      {/* 사이드바 */}
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <ul className="menu">
          <li>
            <Link to="/calendar">
              <FaCalendarAlt className="menu-icon" /> {!isTablet && "달력"}
            </Link>
          </li>
          <li>
            <Link to="/notice-list">
              <FaClipboardList className="menu-icon" />{" "}
              {!isTablet && "공지사항"}
            </Link>
          </li>
          <li>
            <Link to="/projects">
              <FaProjectDiagram className="menu-icon" />{" "}
              {!isTablet && "프로젝트"}
            </Link>
          </li>
          <li>
            <Link to="/employee">
              <FaUsers className="menu-icon" /> {!isTablet && "직원"}
            </Link>
          </li>
          <li>
            <Link to={`/user-details?user_id=${userid}`}>
              <FaUser className="menu-icon" /> {!isTablet && "내 정보"}
            </Link>
          </li>
          <li>
            <Link to="/situation_control">
              <FaTools className="menu-icon" /> {!isTablet && "현황 관리"}
            </Link>
          </li>
          {isAdmin && (
            <li>
              <a href="#" onClick={handleManagerClick}>
                <FaUserShield className="menu-icon" /> {!isTablet && "관리자"}
              </a>
            </li>
          )}
        </ul>

        {/* 로그아웃 버튼 */}
        <div className="logout-section">
          <Link to="/" onClick={handleLogout} className="logout-link">
            <FaSignOutAlt className="menu-icon" /> {!isTablet && "로그아웃"}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
