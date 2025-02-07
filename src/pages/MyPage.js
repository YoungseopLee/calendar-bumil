import React, { useState, useEffect } from "react";
import Sidebar from "../pages/Sidebar";
import BackButton from "./BackButton";
import "./MyPage.css";
import {
  FaPhone,
  FaEnvelope,
  FaCircle,
  FaUserTie,
  FaBuilding,
  FaUserCircle,
} from "react-icons/fa"; // 아이콘 추가

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
        const response = await fetch(`${apiUrl}/auth/get_logged_in_user`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
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
    <div className="mypage-page">
      <header className="mypage-header">
        <Sidebar />
        <BackButton />
      </header>
      <div className="mypage-container">
        {/* 프로필 아이콘 추가 */}
        <div className="mypage-profile-icon">
          <FaUserCircle className="user-icon" />
        </div>

        {/* 사용자 이름 */}
        <div className="mypage-header-section">
          <h2>{user.name}</h2>
        </div>

        {/* 사용자 정보 */}
        <div className="mypage-content">
          <div className="mypage-details">
            <p>
              <FaUserTie className="icon" />
              {user.position}
            </p>
            <p>
              <FaBuilding className="icon" />
              {user.department}
            </p>
            <p>
              <FaCircle
                className={`status-icon ${
                  user.status === "출근" ? "online" : "offline"
                }`}
              />
              {user.status}
            </p>
            <p>
              <FaPhone className="icon" />
              {user.phone_number}
            </p>
            <p>
              <FaEnvelope className="icon" />
              {user.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPage;
