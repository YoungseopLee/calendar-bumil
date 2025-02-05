import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // useNavigate 추가
import "./Sidebar.css";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // 사이드바 열기/닫기 토글
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // 관리자 페이지 접근 처리
  const handleManagerClick = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.is_admin) {
      navigate("/manager"); // 관리자면 /manager 페이지로 이동
    } else {
      alert("관리자만 접근 가능한 페이지입니다."); // 관리자가 아니면 경고창
    }
  };

  // 로그아웃 처리
  const handleLogout = () => {
    // 로컬 스토리지에서 사용자 정보 및 토큰 제거
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    // JWT 토큰 만료 처리: 토큰을 명시적으로 만료시키기 위한 처리
    // 여기서는 사실상 토큰을 삭제하는 방식으로 처리하고 있습니다.

    // 로그인 페이지로 리디렉션
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
            {/* Manager 메뉴 클릭 시 handleManagerClick 함수 호출 */}
            <li>
              <a href="#" onClick={handleManagerClick}>Manager</a>
            </li>
            <li>
              <Link to="/employee">Employee</Link>
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
