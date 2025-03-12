import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Manager.css";
import Sidebar from "../components/Sidebar";

const Manager = () => {
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

  // 상태 관리 페이지 이동
  const goToStatusManagement = () => {
    navigate("/status-management");
  };

  // 역할 관리 페이지 이동
  const goToRoleManagement = () => {
    navigate("/user-roles-management");
  };

  // 유저 추가 페이지 이동
  const goToAddUserPage = () => {
    navigate("/add-user");
  };

  // 유저 추가 페이지 이동
  const goToEditUserPage = () => {
    navigate("/manage-user");
  };

  // 유저 비밀번호 초기화 페이지 이동
  const goToResetUserPage = () => {
    navigate("/reset-user");
  };

  // 유저 비밀번호 초기화 페이지 이동
  const goToLoginLogPage = () => {
    navigate("/login_log");
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
            <p>유저의 상태 리스트 항목을 관리할 수 있습니다.</p>
            <button className="manage-button">이동</button>
          </div>

          <div className="manager-card" onClick={goToRoleManagement}>
            <h2>역할 관리</h2>
            <p>유저의 역할 (관리자, 일반 사용자 등)을 관리할 수 있습니다.</p>
            <button className="manage-button">이동</button>
          </div>

          <div className="manager-card" onClick={goToAddUserPage}>
            <h2>유저 추가</h2>
            <p>유저를 추가할 수 있습니다.</p>
            <button className="manage-button">이동</button>
          </div>

          <div className="manager-card" onClick={goToEditUserPage}>
            <h2>유저 관리</h2>
            <p>특정 유저의 정보를 수정 및 삭제를 할 수 있습니다.</p>
            <button className="manage-button">이동</button>
          </div>

          <div className="manager-card" onClick={goToResetUserPage}>
            <h2>유저 비밀번호 초기화</h2>
            <p>특정 유저의 비밀번호를 초기화할 수 있습니다.</p>
            <button className="manage-button">이동</button>
          </div>

          <div className="manager-card" onClick={goToLoginLogPage}>
            <h2>로그인 로그 조회</h2>
            <p>유저의 로그인 로그를 조회할 수 있는 페이지입니다.</p>
            <button className="manage-button">이동</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Manager;
