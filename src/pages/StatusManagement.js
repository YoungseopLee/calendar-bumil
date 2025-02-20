import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import "./StatusManagement.css";

const StatusManagement = () => {
  const [statuses, setStatuses] = useState([]);
  const [newStatus, setNewStatus] = useState("");
  const [newComment, setNewComment] = useState("");

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
      <h2>상태 관리</h2>
      <div className="status-list">
        {statuses.map((s) => (
          <div key={s.id} className="status-item">
            <span>
              {s.id} ({s.comment})
            </span>
            <button onClick={() => handleDeleteStatus(s.id)}>삭제</button>
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
        <button onClick={handleAddStatus}>상태 추가</button>
      </div>
    </div>
  );
};

export default StatusManagement;
