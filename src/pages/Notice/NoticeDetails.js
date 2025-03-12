import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./NoticeDetails.css";



const NoticeDetails = () => {
  const [loading, setLoading] = useState(false); // 데이터 로딩 상태
  const [error, setError] = useState(null); // 에러 메세지

  const apiUrl = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();

  // 로그인한 사용자 정보 (localStorage에서 불러옴)
  const user = JSON.parse(localStorage.getItem("user"));

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

//   const fetchNotices = async () => {
//     try {
//       const response = await fetch(`${apiUrl}/notice/get_all_notice`);
//       if (!response.ok) {
//         throw new Error("공지사항 목록을 불러오지 못했습니다.");
//       }
//       const data = await response.json();
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }
  

  // ✅ 로딩 중 또는 에러 시 화면에 표시할 메세지
  if (loading) return <p>데이터를 불러오는 중...</p>;
  if (error) return <p>오류 발생: {error}</p>;
  
  return (
    <div className=" notice-list">
      <h1>공지사항 상세페이지</h1>
    </div>
  );
}

export default NoticeDetails;
