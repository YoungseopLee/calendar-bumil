import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../utils/useAuth";
import { authFetch } from "../../utils/authFetch";
import Sidebar from "../components/Sidebar";
import Tippy from "@tippyjs/react";
import ManagerBackButton from "./ManagerBackButton";
import LoadingSpinner from "../components/LoadingSpinner";
import "tippy.js/dist/tippy.css";
import { followCursor } from "tippy.js";
import "./LastLoginLogPage.css";

const LastLoginLogPage = () => {
  const [users, setUsers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [searchField, setSearchField] = useState("name");

  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;
  const accessToken = localStorage.getItem("access_token");

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({
    id: "",
    name: "",
    position: "",
    department: "",
    role_id: "",
  });
  const { getUserInfo, checkAuth, handleLogout } = useAuth();

  useEffect(() => {
    const fetchUserInfo = async () => {
      const userInfo = await getUserInfo();
      setUser(userInfo);

      const isAuthorized = checkAuth(userInfo?.role_id, ["AD_ADMIN"]);
      if (!isAuthorized) {
        console.error("관리자 권한이 없습니다.");
        handleLogout();
        return;
      }
      setLoading(false);
    };
    fetchUserInfo();
  }, []);

  useEffect(() => {
    fetchLastLoginUsers();
  }, []);

  const fetchLastLoginUsers = async () => {
    try {
      const response = await authFetch(`${apiUrl}/auth/get_last_login_logs`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok)
        throw new Error("마지막 접속 기록을 가져오는 데 실패했습니다.");

      const data = await response.json();
      if (!data.users || !Array.isArray(data.users)) {
        console.error("API 응답에 users 배열이 없습니다.");
        setUsers([]);
        return;
      }
      setUsers(data.users);
    } catch (error) {
      console.error("마지막 접속 기록 불러오기 오류:", error);
    }
  };

  const filterUsers = (u) => {
    if (!searchText) return true;

    const value = u[searchField]?.toLowerCase() || "";
    return value.includes(searchText.trim().toLowerCase());
  };

  const searchFieldLabelMap = {
    name: "이름",
    position: "직급",
  };

  // 한국 시간(KST)으로 변환하는 함수
  const formatKSTDate = (utcDateTime) => {
    if (!utcDateTime) return "기록 없음";
    const date = new Date(utcDateTime);
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Seoul",
    }).format(date);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="last-login-page">
      <Sidebar user={user} />
      <ManagerBackButton />
      <div className="last-login-box">
        <div className="last-login-list-container">
          <h2 className="last-login-title">마지막 접속 기록</h2>
          <div className="last-login-search-container">
            <select
              className="last-login-search-dropdown"
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
            >
              <option value="name">이름</option>
              <option value="position">직급</option>
            </select>

            <input
              type="text"
              className="last-login-search-input"
              placeholder={`${searchFieldLabelMap[searchField]}을 입력하세요.`}
              onChange={(e) => setSearchText(e.target.value)}
              value={searchText}
            />
          </div>

          <div className="last-login-index-bar">
            <span className="last-login-index-item">이름</span>
            <span className="last-login-index-item">직급</span>
            <span className="last-login-index-item">마지막 접속시간</span>
          </div>

          <ul className="last-login-list">
            {users.filter(filterUsers).map((u, index) => (
              <li key={index} className="last-login-item">
                <span className="last-login-column">{u.name}</span>
                <span className="last-login-column">{u.position}</span>
                <Tippy
                  content={
                    u.last_login_at
                      ? formatKSTDate(u.last_login_at)
                      : "기록 없음"
                  }
                  placement="top"
                  plugins={[followCursor]}
                  followCursor="horizontal"
                  arrow={true}
                  popperOptions={{
                    modifiers: [
                      {
                        name: "preventOverflow",
                        options: { boundary: "window" },
                      },
                    ],
                  }}
                >
                  <span className="last-login-column">
                    {u.last_login_at
                      ? formatKSTDate(u.last_login_at)
                      : "기록 없음"}
                  </span>
                </Tippy>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LastLoginLogPage;
