import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Manager.css";
import Sidebar from "../components/Sidebar";
import FloatingButton from "../components/FloatingButton";
import ManagerBackButton from "../components/BackButton";
import ScrollToTopButton2 from "../components/ScrollToTopButton2";
import { useAuth } from "../../utils/useAuth";
import LoadingSpinner from "../components/LoadingSpinner";

const Manager = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true); // 데이터 로딩 상태 관리 (true: 로딩 중)
  const [user, setUser] = useState({
    id: "",
    name: "",
    position: "",
    department: "",
    role_id: "",
  }); //로그인한 사용자 정보
  const { getUserInfo, checkAuth, handleLogout } = useAuth();

  // 로그인한 사용자 정보 가져오기 및 권한 확인 후 권한 없으면 로그아웃 시키기
  useEffect(() => {
    const fetchUserInfo = async () => {
      const userInfo = await getUserInfo();
      setUser(userInfo);

      const isAuthorized = checkAuth(userInfo?.role_id, ["AD_ADMIN"]); // 권한 확인하고 맞으면 true, 아니면 false 반환
      if (!isAuthorized) {
        console.error("관리자 권한이 없습니다.");
        handleLogout();
        return;
      }
      setLoading(false); // 로딩 완료
    };
    fetchUserInfo();
  }, []);

  // 상태 관리 페이지 이동
  const goToStatusManagement = () => {
    navigate("/manage-status");
  };

  // 역할 관리 페이지 이동
  const goToRoleManagement = () => {
    navigate("/user-roles-management");
  };

  // 유저 추가 페이지 이동
  const goToAddUserPage = () => {
    navigate("/add-user");
  };

  // 유저 관리 페이지 이동
  const goToUserManagePage = () => {
    navigate("/manage-user");
  };

  // 유저 비밀번호 초기화 페이지 이동
  const goToResetUserPage = () => {
    navigate("/reset-user");
  };

  // 유저 로그인 로그 페이지 이동
  const goToLoginLogPage = () => {
    navigate("/login-log");
  };

  // 부서 관리 페이지 이동
  const goToDepartmentManagePage = () => {
    navigate("/manage-department");
  };

  // 유저 접속 로그 페이지 이동
  const goToLastLoginLogPage = () => {
    navigate("/last-login-log");
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="manager-page">
      <Sidebar user={user} />
      <FloatingButton>
        <ScrollToTopButton2 />
        <ManagerBackButton />
      </FloatingButton>
      <div className="manager-content">
        <h1 className="manager-title">관리자 페이지</h1>

        {/* 카드 컨테이너: 세로 정렬 */}
        <div className="card-container">
          <div className="manager-card">
            <h2>유저 추가</h2>
            <p>유저를 추가할 수 있습니다.</p>
            <button className="manage-button" onClick={goToAddUserPage}>
              이동
            </button>
          </div>

          <div className="manager-card">
            <h2>유저 관리</h2>
            <p>특정 유저의 정보를 수정 및 삭제를 할 수 있습니다.</p>
            <button className="manage-button" onClick={goToUserManagePage}>
              이동
            </button>
          </div>

          <div className="manager-card">
            <h2>유저 비밀번호 초기화</h2>
            <p>특정 유저의 비밀번호를 초기화할 수 있습니다.</p>
            <button className="manage-button" onClick={goToResetUserPage}>
              이동
            </button>
          </div>

          <div className="manager-card">
            <h2>역할 관리</h2>
            <p>유저의 역할 (관리자, 일반 사용자 등)을 관리할 수 있습니다.</p>
            <button className="manage-button" onClick={goToRoleManagement}>
              이동
            </button>
          </div>

          <div className="manager-card">
            <h2>부서 관리</h2>
            <p>부서를 추가, 수정, 삭제할 수 있는 페이지입니다.</p>
            <button
              className="manage-button"
              onClick={goToDepartmentManagePage}
            >
              이동
            </button>
          </div>

          <div className="manager-card">
            <h2>상태 관리</h2>
            <p>유저의 상태 리스트 항목을 관리할 수 있습니다.</p>
            <button className="manage-button" onClick={goToStatusManagement}>
              이동
            </button>
          </div>

          <div className="manager-card">
            <h2>접속 기록 조회</h2>
            <p>유저의 마지막 접속 기록을 조회할 수 있는 페이지입니다.</p>
            <button className="manage-button" onClick={goToLastLoginLogPage}>
              이동
            </button>
          </div>

          <div className="manager-card">
            <h2>로그인 기록 조회</h2>
            <p>유저의 로그인 기록을 조회할 수 있는 페이지입니다.</p>
            <button className="manage-button" onClick={goToLoginLogPage}>
              이동
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Manager;
