// Manager.js
import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import "./Manager.css";
import BackButton from "./BackButton";

const Manager = () => {
  const [pendingUsers, setPendingUsers] = useState([]);

  useEffect(() => {
    const fetchPendingUsers = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/get_pending_users`
        );
        if (response.ok) {
          const data = await response.json();
          setPendingUsers(data.users);
        } else {
          alert("승인 대기 중인 사용자 목록을 불러오는 데 실패했습니다.");
        }
      } catch (error) {
        console.error("Error fetching pending users:", error);
        alert("승인 대기 중인 사용자 목록을 불러오는 중 오류가 발생했습니다.");
      }
    };

    fetchPendingUsers();
  }, []);

  const handleApprove = async (userId) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/approve_user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (response.ok) {
        setPendingUsers(pendingUsers.filter((user) => user.id !== userId));
        alert("사용자가 승인되었습니다.");
      } else {
        alert("사용자 승인에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error approving user:", error);
      alert("사용자 승인 중 오류가 발생했습니다.");
    }
  };

  const handleReject = async (userId) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/reject_user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (response.ok) {
        setPendingUsers(pendingUsers.filter((user) => user.id !== userId));
        alert("사용자가 거절되었습니다.");
      } else {
        alert("사용자 거절에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error rejecting user:", error);
      alert("사용자 거절 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="manager-page">
      <Sidebar />
      <BackButton />
      <div className="manager-content">
        <h2>회원가입 승인 관리</h2>
        <table className="pending-users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>이름</th>
              <th>직급</th>
              <th>부서</th>
              <th>이메일</th>
              <th>전화번호</th>
              <th>승인</th>
              <th>거절</th>
            </tr>
          </thead>
          <tbody>
            {pendingUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.position}</td>
                <td>{user.department}</td>
                <td>{user.email}</td>
                <td>{user.phone_number}</td>
                <td>
                  <button
                    className="button approve-button"
                    onClick={() => handleApprove(user.id)}
                  >
                    승인
                  </button>
                </td>
                <td>
                  <button
                    className="button reject-button"
                    onClick={() => handleReject(user.id)}
                  >
                    거절
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Manager;
