import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import { followCursor } from "tippy.js";
import "./InquiryList.css";
import { Link } from "react-router-dom";
import { FaPlus } from "react-icons/fa";
import { IoSearchOutline } from "react-icons/io5";
import { useAuth } from "../../utils/useAuth";
import { authFetch } from "../../utils/authFetch";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import AddInquiryButton from "./AddInquiryButton";

/**
 * 📌  InquiryList - 문의사항 목록을 보여주는 컴포넌트
 * 
 * ✅ 주요 기능:
 * - 문의사항 목록 조회 (GET /inquiry/get_all_inquiry)
 * 
 * ✅ UI (또는 Component) 구조:
 * - InquiryList (문의사항 목록)
 * 
 */

const InquiryList = () => {
  const [Inquiries, setInquirys] = useState([]); // 문의사항 목록
  const [filteredInquirys, setFilteredInquirys] = useState([]); // 필터링된 문의사항 목록
  const [loading, setLoading] = useState(true); // 데이터 로딩 상태
  const [error, setError] = useState(null); // 에러 메세지
  const [searchField, setSearchField] = useState("title");
  const [searchText, setSearchText] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const InquiriesPerPage = 10;

  const apiUrl = process.env.REACT_APP_API_URL;

  const accessToken = localStorage.getItem("access_token");
  const navigate = useNavigate();

  //로그인한 사용자 정보
  const [user, setUser] = useState({
    id: "",
    name: "",
    position: "",
    department: "",
    role_id: "",
  }); //로그인한 사용자 정보
  const { getUserInfo } = useAuth();

  // 전체 데이터 가져오기
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // 1. 사용자 정보 가져오기
        const userInfo = await fetchUserInfo();

        //2. 문의사항 가져오기
        await fetchInquirys();
      } catch (error) {
        console.error("데이터 로딩 오류:", error);
      }
      setLoading(false); // 로딩 완료
    };

    fetchAllData();
  }, []);

  // 로그인한 사용자 정보 가져오는 함수
  const fetchUserInfo = async () => {
    const userInfo = await getUserInfo();
    setUser(userInfo);
    return userInfo;
  };

  // 문의사항 목록 조회 API 호출
  const fetchInquirys = async () => {
    try {
      setLoading(true);
      const response = await authFetch(`${apiUrl}/inquiry/get_all_inquiries`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("문의사항 목록을 불러오지 못했습니다.");
      }

      const data = await response.json();
      setInquirys(data.inquiries);
      setFilteredInquirys(data.inquiries);
    } catch (err) {
      console.error("문의사항 목록 조회 오류:", err);
      setError("문의사항을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 검색 및 필터링 로직
  const filterInquirys = (inquiry) => {
    if (!searchText) return true;
    const value = inquiry[searchField]?.toLowerCase() || "";
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
  const filteredInquirysList = filteredInquirys.filter(filterInquirys);
  const totalPages = Math.ceil(filteredInquirysList.length / InquiriesPerPage);
  const indexOfLastInquiry = currentPage * InquiriesPerPage;
  const indexOfFirstInquiry = indexOfLastInquiry - InquiriesPerPage;
  const currentInquirys = filteredInquirysList.slice(
    indexOfFirstInquiry,
    indexOfLastInquiry
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
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage />;

  return (
    <div className="inquiry-list-app-body">
      <Sidebar user={user} />
      <div className="inquiry-list-container">
        <div className="inquiry-header">
          <h1 className="inquiry-list-title">문의사항</h1>
        </div>

        <div className="inquiry-search-icon-container">
          <div className="inquiry-search-container">
            <select
              className="inquiry-search-dropdown"
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
            >
              <option value="title">제목</option>
              <option value="content">내용</option>
              <option value="created_by_name">작성자</option>
            </select>

            <input
              type="text"
              className="inquiry-search-input"
              placeholder={`${searchFieldLabelMap[searchField]}를 입력하세요.`}
              onChange={(e) => setSearchText(e.target.value)}
              value={searchText}
            />
          </div>
          <IoSearchOutline className="inquiry-search-icon" />
        </div>

        <div className="inquiry-list-list">
          {currentInquirys.length === 0 ? (
            <div className="inquiry-list-empty">등록된 문의사항이 없습니다.</div>
          ) : (
            currentInquirys.map((inquiry) => (
              <div key={inquiry.id} className="inquiry-list-item">
                <Tippy
                  content={inquiry.title}
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
                  <Link to={`/inquiry-details/${inquiry.id}`}>
                    {inquiry.title}
                  </Link>
                </Tippy>
                <div className="inquiry-list-info">
                  <span className="inquiry-list-author">
                    {inquiry.created_by_name || "관리자"}
                  </span>
                  <span className="inquiry-list-date">
                    {formatDate(inquiry.created_at)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 문의사항 추가 버튼 */}
        <div className="inquiry-list-create-button-container">
          <AddInquiryButton />
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

export default InquiryList;
