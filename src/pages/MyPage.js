import React, { useState, useEffect } from "react";
import Sidebar from "../pages/Sidebar";
import "./MyPage.css";

const MyPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiUrl = process.env.REACT_APP_API_URL || "http://3.38.20.237";

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("로그인이 필요합니다.");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`${apiUrl}/get_logged_in_user`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(
            errData.message || "사용자 정보를 가져오는데 실패했습니다."
          );
        }
        const data = await response.json();
        setUser(data.user);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [apiUrl]);

  if (loading) return <div className="mypage-container">로딩 중...</div>;
  if (error) return <div className="mypage-container">{error}</div>;

  return (
    <div className="mypage-container">
      <Sidebar />
      <BackButton />
      <header className="mypage-header">
        <Sidebar />
      </header>
      <section className="user-info">
        <h2>{user.name}님의 정보</h2>
        <p>
          <strong>직급:</strong> {user.position}
        </p>
        <p>
          <strong>부서:</strong> {user.department}
        </p>
        <p>
          <strong>이메일:</strong> {user.email}
        </p>
        <p>
          <strong>전화번호:</strong> {user.phone_number}
        </p>
        <p>
          <strong>상태:</strong> {user.status}
        </p>
      </section>
    </div>
  );
};

export default MyPage;
