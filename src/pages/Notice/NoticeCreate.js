import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./NoticeCreate.css";

/**
  * 📌  NoticeCreate - 공지사항 생성을 위한 컴포넌트
  * 
  * ✅ 주요 기능:
  * - 공지사항 생성 (POST /notice/create_notice)
  * 
  * 
  * ✅ UI (또는 Component) 구조:
  * - NoticeCreate (공지사항 생성)
  * 
*/

const NoticeCreate = () => {
  const [loading, setLoading] = useState(true); // 데이터 로딩 상태
  const [error, setError] = useState(null); // 에러 메세지

  const apiUrl = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();

  // 로그인한 사용자 정보 (localStorage에서 불러옴)
  const user = JSON.parse(localStorage.getItem("user"));

  /**
   * ✅ 프로젝트 생성 폼의 상태 관리
   * - 초기값 설정 (배열 형태 필드 포함)
   */
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    user_id: user.id,
  });

  // 🔄 **1. 로그인한 사용자 정보 확인 및 권한 체크**
  useEffect(() => {
    fetchLoggedInUser();
    if (!user) {
      alert("로그인된 사용자 정보가 없습니다. 로그인해주세요.");
      navigate("/");
      return;
    }
    // ✅ 어드민, PR 권한 체크
    if (user.role_id !== "AD_ADMIN" && user.role_id !== "PR_ADMIN") {
      alert("관리자 권한이 없습니다.");
      navigate("/");
      return;
    }
  }, []);

  // 🔄 ** 2. 공지사항 목록 조회 **
  useEffect(() => {
    //fetchNotices();
  }, []); 

  // ✅ 현재 로그인한 사용자의 정보를 API에서 가져옴
  // ✅ 사용자 정보가 없거나 세션이 만료되었을 경우 자동 로그아웃 처리
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

  // ✅ 로그아웃 함수 - 세션이 만료되었을 경우 사용자 정보를 삭제하고 로그인 페이지로 이동
  const handleLogout = () => {
    alert("세션이 만료되었습니다. 다시 로그인해주세요.");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.title || !formData.content) {
      setError("⚠️ 필수 입력값을 모두 입력해주세요.");
      return;
    }
    createNotice();
  };

  // ✅ 공지사항 생성 API 호출
  const createNotice = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await fetch(`${apiUrl}/notice/create_notice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        throw new Error("공지사항 생성을 실패했습니다.");
        }
      alert("✅ 공지사항이 성공적으로 생성되었습니다!");
      navigate("/notice");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  // ✅ 로딩 중 또는 에러 시 화면에 표시할 메세지
  if (loading) return <p>데이터를 불러오는 중...</p>;
  if (error) return <p>오류 발생: {error}</p>;

  return (
    <div className="app">
      <Sidebar />
      <div className="notice-container">
        <h2 className="notice-title">공지사항 생성</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">제목</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="content">내용</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit">공지사항 생성</button>
        </form>
      </div>
    </div>

  );
}

export default NoticeCreate;
