import React from "react";
import { useNavigate } from "react-router-dom";
import "./Manager.css";
import Sidebar from "./Sidebar";

const Manager = () => {
  const navigate = useNavigate();

  const goToStatusManagement = () => {
    navigate("/status-management");
  };

  return (
    <div className="manager-page">
      <Sidebar />
      <div className="manager-title">상태 관리</div>
      <button
        className="status-management-button"
        onClick={goToStatusManagement}
      >
        상태 관리 페이지로 이동
      </button>
    </div>
  );
};

export default Manager;
