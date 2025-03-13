import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./NoticeList.css";
import { Link } from "react-router-dom";

/**
 * 📌  NoticeList - 공지사항 목록을 보여주는 컴포넌트
 *
 * ✅ 주요 기능:
 * - 공지사항 목록 조회 (GET /notice/get_all_notice)
 *
 *
 * ✅ UI (또는 Component) 구조:
 * - NoticeList (공지사항 목록)
 *
 */

const NoticeList = () => {
  const [notices, setNotices] = useState([]); // 공지사항 목록
  const [loading, setLoading] = useState(true); // 데이터 로딩 상태
  const [error, setError] = useState(null); // 에러 메세지

  const apiUrl = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();

  // 로그인한 사용자 정보 (localStorage에서 불러옴)
  const user = JSON.parse(localStorage.getItem("user"));

  // 🔄 **1. 로그인한 사용자 정보 확인**
  useEffect(() => {
    fetchLoggedInUser();
    if (!user) {
      alert("로그인된 사용자 정보가 없습니다. 로그인해주세요.");
      navigate("/");
      return;
    }
  }, []);

  // 🔄 ** 2. 공지사항 목록 조회 **
  useEffect(() => {
    fetchNotices();
  }, []);

  // 현재 로그인한 사용자의 정보를 API에서 가져옴
  // 사용자 정보가 없거나 세션이 만료되었을 경우 자동 로그아웃 처리
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
        setLoading(false);
      } else {
        console.error("사용자 정보 불러오기 실패");
      }
    } catch (error) {
      console.error("로그인 사용자 정보 불러오기 실패:", error);
    }
  };

  // 로그아웃 함수 - 세션이 만료되었을 경우 사용자 정보를 삭제하고 로그인 페이지로 이동
  const handleLogout = () => {
    alert("세션이 만료되었습니다. 다시 로그인해주세요.");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // 공지사항 목록 조회 API 호출
  const fetchNotices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/notice/get_notice_list`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("공지사항 목록을 불러오지 못했습니다.");
      }

      const data = await response.json();
      console.log("get_notice_list: ", data);
      setNotices(data.notices);
    } catch (err) {
      console.error("공지사항 목록 조회 오류:", err);
      setError("공지사항을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 날짜 포맷팅 함수 추가
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  // 로딩 중 또는 에러 시 화면에 표시할 메세지
  if (loading) return <p>데이터를 불러오는 중...</p>;
  if (error) return <p>오류 발생: {error}</p>;

  return (
    <div className="notice-list-app">
      <Sidebar />
      <div className="notice-list-container">
        <div className="notice-header">
          <h2 className="notice-list-title">공지사항</h2>
          {user?.role_id === "AD_ADMIN" && (
            <button onClick={() => navigate("/notice-create")}>작성하기</button>
          )}
        </div>
        <div className="notice-list-list">
          {notices.length === 0 ? (
            <div className="notice-list-empty">등록된 공지사항이 없습니다.</div>
          ) : (
            notices.map((notice) => (
              <div key={notice.id} className="notice-list-item">
                <Link to={`/notice-details/${notice.id}`}>{notice.title}</Link>
                <div className="notice-list-info">
                  <span className="notice-list-author">
                    {notice.created_by_name || "관리자"}
                  </span>
                  <span className="notice-list-date">
                    {formatDate(notice.created_at)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NoticeList;
