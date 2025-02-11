import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // 관리자 여부 상태 추가
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.is_admin) {
      setIsAdmin(true); // 어드민이면 true 설정
    }
  }, []);

  // 사이드바 열기/닫기 토글
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // 관리자 페이지 접근 처리
  const handleManagerClick = () => {
    if (isAdmin) {
      navigate("/manager");
    } else {
      alert("관리자만 접근 가능한 페이지입니다.");
    }
  };

  // 로그아웃 처리
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="app-body">
      {/* 햄버거 메뉴 버튼 */}
      <button className="hamburger-btn" onClick={toggleSidebar}>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
      </button>

      {/* 사이드바 */}
      {isOpen && (
        <div className="sidebar">
          <ul className="menu">
            {/* 관리자(어드민)만 Manager 메뉴 보이도록 조건부 렌더링 */}
            {isAdmin && (
              <li>
                <a href="#" onClick={handleManagerClick}>
                  Manager
                </a>
              </li>
            )}
            <li>
              <Link to="/projects">Project</Link>
            </li>
            <li>
              <Link to="/employee">Employee</Link>
            </li>
            <li>
              <Link to="/mypage">MyPage</Link>
            </li>
            <li>
              <Link to="/" onClick={handleLogout} className="logout-link">
                Logout
              </Link>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
