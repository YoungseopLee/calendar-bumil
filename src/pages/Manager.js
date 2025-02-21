import React from "react";
import { useNavigate } from "react-router-dom";
import "./Manager.css";
import Sidebar from "./Sidebar";

const Manager = () => {
  const navigate = useNavigate();

  // 상태 관리 페이지 이동
  const goToStatusManagement = () => {
    navigate("/status-management");
  };

  // 역할 관리 페이지 이동
  const goToRoleManagement = () => {
    navigate("/user-roles-management");
  };

  return (
    <div className="manager-page">
      <Sidebar />
      <div className="manager-content">
        <h1 className="manager-title">관리자 페이지</h1>

        {/* 카드 컨테이너: 세로 정렬 */}
        <div className="card-container">
          <div className="manager-card" onClick={goToStatusManagement}>
            <h2>상태 관리</h2>
            <p>사원의 근무 상태를 관리할 수 있습니다.</p>
            <button className="manage-button">이동</button>
          </div>

          <div className="manager-card" onClick={goToRoleManagement}>
            <h2>역할 관리</h2>
            <p>사원의 역할 (관리자, 일반 사용자 등)을 관리할 수 있습니다.</p>
            <button className="manage-button">이동</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Manager;