import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMenu } from "react-icons/fi"; // ✅ 심플한 햄버거 아이콘
import "./Sidebar.css";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const [userid, setUserid] = useState(null); // 마이페이지 구현을 위한 유저 아이디 State 

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setUserid(user.id); //userid에 로컬스토리지의 로그인한 유저의 아이디인 user.id 저장
    if (user && user.role_id === "AD_ADMIN") {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
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
      {/* ✅ 햄버거 아이콘 버튼 */}
      <button className="hamburger-btn" onClick={toggleSidebar}>
        <FiMenu size={28} color="#333" />
      </button>

      {/* 오버레이 (사이드바 외부 클릭 시 닫힘) */}
      {isOpen && <div className="overlay" onClick={closeSidebar}></div>}

      {/* ✅ 사이드바 메뉴 */}
      {isOpen && (
        <div className="sidebar">
          <ul className="menu">
            <li>
              <Link to="/projects">프로젝트</Link>
            </li>
            <li>
              <Link to="/calendar">달력</Link>
            </li>
            <li>
              <Link to="/employee">직원</Link>
            </li>
            <li>
              <Link to={`/user-details?user_id=${userid}`}>내 정보</Link>
            </li>
            <li>
              <Link to="/situation_control">현황 관리</Link>
            </li>
            {isAdmin && (
              <li>
                <a href="#" onClick={handleManagerClick}>
                  관리자
                </a>
              </li>
            )}
          </ul>

          {/* ✅ 로그아웃 버튼 하단 고정 */}
          <div className="logout-section">
            <Link to="/" onClick={handleLogout} className="logout-link">
              로그아웃
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
