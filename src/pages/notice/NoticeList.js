import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import { followCursor } from "tippy.js";
import "./NoticeList.css";
import { Link } from "react-router-dom";
import { FaPlus } from "react-icons/fa";
import { IoSearchOutline } from "react-icons/io5";

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
  const [filteredNotices, setFilteredNotices] = useState([]); // 필터링된 공지사항 목록
  const [loading, setLoading] = useState(true); // 데이터 로딩 상태
  const [error, setError] = useState(null); // 에러 메세지
  const [searchField, setSearchField] = useState("title");
  const [searchText, setSearchText] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const noticesPerPage = 10;

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
      setNotices(data.notices);
      setFilteredNotices(data.notices);
    } catch (err) {
      console.error("공지사항 목록 조회 오류:", err);
      setError("공지사항을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 검색 및 필터링 로직
  const filterNotices = (notice) => {
    if (!searchText) return true;
    const value = notice[searchField]?.toLowerCase() || "";
    return value.includes(searchText.toLowerCase());
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

  const searchFieldLabelMap = {
    title: "제목",
    content: "내용",
    created_by_name: "작성자",
  };

  // 페이지네이션 계산
  const filteredNoticesList = filteredNotices.filter(filterNotices);
  const totalPages = Math.ceil(filteredNoticesList.length / noticesPerPage);
  const indexOfLastNotice = currentPage * noticesPerPage;
  const indexOfFirstNotice = indexOfLastNotice - noticesPerPage;
  const currentNotices = filteredNoticesList.slice(
    indexOfFirstNotice,
    indexOfLastNotice
  );

  // 페이지 변경 핸들러
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // 로딩 중 또는 에러 시 화면에 표시할 메세지
  if (loading) return <p>데이터를 불러오는 중...</p>;
  if (error) return <p>오류 발생: {error}</p>;

  return (
    <div className="notice-list-app">
      <Sidebar />
      <div className="notice-list-container">
        <div className="notice-header">
          <h1 className="notice-list-title">공지사항</h1>
          <div className="notice-list-create-button-container">
            {user?.role_id === "AD_ADMIN" && (
              <button
                className="notice-list-create-button"
                onClick={() => navigate("/notice-create")}
              >
                <FaPlus />
              </button>
            )}
          </div>
        </div>

        <div className="notice-search-icon-container">
          <div className="notice-search-container">
            <select
              className="notice-search-dropdown"
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
            >
              <option value="title">제목</option>
              <option value="content">내용</option>
              <option value="created_by_name">작성자</option>
            </select>

            <input
              type="text"
              className="notice-search-input"
              placeholder={`${searchFieldLabelMap[searchField]}를 입력하세요.`}
              onChange={(e) => setSearchText(e.target.value.trim())}
              value={searchText}
            />
          </div>
          <IoSearchOutline className="notice-search-icon" />
        </div>

        <div className="notice-list-list">
          {currentNotices.length === 0 ? (
            <div className="notice-list-empty">등록된 공지사항이 없습니다.</div>
          ) : (
            currentNotices.map((notice) => (
              <div key={notice.id} className="notice-list-item">
                <Tippy
                  content={notice.title}
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
                  <Link to={`/notice-details/${notice.id}`}>
                    {notice.title}
                  </Link>
                </Tippy>
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

        {/* 페이지네이션 */}
        <div className="pagination">
          <button onClick={goToPreviousPage} disabled={currentPage === 1}>
            이전
          </button>
          <span>
            {currentPage} / {totalPages}
          </span>
          <button onClick={goToNextPage} disabled={currentPage === totalPages}>
            다음
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoticeList;
