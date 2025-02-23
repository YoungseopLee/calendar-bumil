import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import "./StatusManagement.css";

const StatusManagement = () => {
  const [statuses, setStatuses] = useState([]);
  const [newStatus, setNewStatus] = useState("");
  const [newComment, setNewComment] = useState("");

  const navigate = useNavigate();
  // 로그인한 사용자 정보 (localStorage에 저장된 최신 정보)
  const user = JSON.parse(localStorage.getItem("user"));
  const apiUrl = process.env.REACT_APP_API_URL;
  
  // 로그인한 사용자 정보 최신화 및 어드민 여부 체크
  useEffect(() => {
    fetchLoggedInUser();
    if (!user) {
      alert("로그인된 사용자 정보가 없습니다. 로그인해주세요.");
      navigate("/");
      return;
    }

    if (user.role_id !== "AD_ADMIN") {
      alert("관리자 권한이 없습니다.");
      navigate("/");
      return;
    }
    
  }, []);

  // 로그인한 사용자 정보 API 호출
  const fetchLoggedInUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/auth/get_logged_in_user`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        console.error("사용자 정보 불러오기 실패");
      }
    } catch (error) {
      console.error("로그인 사용자 정보 불러오기 실패:", error);
    }
  };

  // 로그아웃 함수
  const handleLogout = () => {
    alert("세션이 만료되었습니다. 다시 로그인해주세요.");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/status/get_all_status`
      );
      if (response.ok) {
        const data = await response.json();
        setStatuses(data.statuses);
      } else {
        alert("상태 목록을 불러오지 못했습니다.");
      }
    } catch (error) {
      console.error("상태 목록 로드 오류:", error);
    }
  };

  const handleAddStatus = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/status/add_status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, comment: newComment }),
        }
      );
      if (response.ok) {
        alert("상태가 추가되었습니다.");
        setNewStatus("");
        setNewComment("");
        fetchStatuses();
      } else {
        alert("상태 추가에 실패했습니다.");
      }
    } catch (error) {
      console.error("상태 추가 오류:", error);
    }
  };

  const handleDeleteStatus = async (statusId) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/status/delete_status/${statusId}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        alert("상태가 삭제되었습니다.");
        fetchStatuses();
      } else {
        alert("상태 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("상태 삭제 오류:", error);
    }
  };

  return (
    <div className="status-management">
      <Sidebar />
      <h2 className="status-title">상태 관리</h2>
      <div className="status-list">
        {statuses.map((s) => (
          <div key={s.id} className="status-item">
            <span>
              {s.id} ({s.comment})
            </span>
            <button onClick={() => handleDeleteStatus(s.id)} className="reject-button">삭제</button>
          </div>
        ))}
      </div>
      <div className="add-status">
        <input
          type="text"
          placeholder="새 상태"
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
        />
        <input
          type="text"
          placeholder="상태 설명"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <button onClick={handleAddStatus} className="approve-button">상태 추가</button>
      </div>
    </div>
  );
};

export default StatusManagement;
