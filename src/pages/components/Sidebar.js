import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMenu } from "react-icons/fi"; // ✅ 햄버거 아이콘
import {
  FaCalendarAlt,
  FaClipboardList,
  FaUsers,
  FaUser,
  FaProjectDiagram,
  FaTools,
  FaUserShield,
  FaSignOutAlt,
} from "react-icons/fa"; // ✅ 추가 아이콘
import "./Sidebar.css";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const [userid, setUserid] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setUserid(user?.id);
    setIsAdmin(user?.role_id === "AD_ADMIN");
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

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
      {/* ✅ 햄버거 버튼 */}
      <button className="hamburger-btn" onClick={toggleSidebar}>
        <FiMenu size={28} color="#333" />
      </button>

      {/* ✅ 오버레이 (사이드바 외부 클릭 시 닫힘) */}
      {isOpen && <div className="overlay" onClick={closeSidebar}></div>}

      {/* ✅ 사이드바 */}
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <ul className="menu">
          <li>
            <Link to="/calendar">
              <FaCalendarAlt className="menu-icon" /> 달력
            </Link>
          </li>
          <li>
            <Link to="/notice-list">
              <FaClipboardList className="menu-icon" /> 공지사항
            </Link>
          </li>
          <li>
            <Link to="/projects">
              <FaProjectDiagram className="menu-icon" /> 프로젝트
            </Link>
          </li>
          <li>
            <Link to="/employee">
              <FaUsers className="menu-icon" /> 직원
            </Link>
          </li>
          <li>
            <Link to={`/user-details?user_id=${userid}`}>
              <FaUser className="menu-icon" /> 내 정보
            </Link>
          </li>
          <li>
            <Link to="/situation_control">
              <FaTools className="menu-icon" /> 현황 관리
            </Link>
          </li>
          {isAdmin && (
            <li>
              <a href="#" onClick={handleManagerClick}>
                <FaUserShield className="menu-icon" /> 관리자
              </a>
            </li>
          )}
        </ul>

        {/* ✅ 로그아웃 버튼 */}
        <div className="logout-section">
          <Link to="/" onClick={handleLogout} className="logout-link">
            로그아웃
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
