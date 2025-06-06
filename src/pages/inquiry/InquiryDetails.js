import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useParams } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { useAuth } from "../../utils/useAuth";
import { authFetch } from "../../utils/authFetch";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { BsPen, BsPencilSquare, BsTrash, BsTrash3 } from "react-icons/bs";
import "./InquiryDetails.css";

const InquiryDetails = () => {
  const [loading, setLoading] = useState(true); // 데이터 로딩 상태
  const [error, setError] = useState(null); // 에러 메세지
  const [inquiry, setInquiry] = useState(null);
  const [responseContent, setResponseContent] = useState("");
  const [status, setStatus] = useState("대기중");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const apiUrl = process.env.REACT_APP_API_URL;
  const accessToken = localStorage.getItem("access_token");

  const navigate = useNavigate();

  const { id } = useParams();

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
        await fetchInquiry();
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

  const fetchInquiry = async () => {
    try {
      setLoading(true);
      const response = await authFetch(`${apiUrl}/inquiry/get_inquiry/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("문의사항을 불러오지 못했습니다.");
      }
      const data = await response.json();
      setInquiry(data.inquiry);

      // 기존 답변과 상태 설정
      if (data.inquiry.response_content) {
        setResponseContent(data.inquiry.response_content);
      }
      if (data.inquiry.status) {
        setStatus(data.inquiry.status);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInquiry = async (id) => {
    const confirmDelete = window.confirm(
      "정말로 이 문의사항을을 삭제하시겠습니까?"
    );
    if (!confirmDelete) return;
    try {
      const response = await authFetch(
        `${apiUrl}/inquiry/delete_inquiry/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ updated_by: user.id }),
        }
      );
      if (!response.ok) {
        throw new Error("문의사항을 삭제하지 못했습니다.");
      }
      alert("문의사항이 삭제되었습니다.");
      navigate("/inquiry-list");
    } catch (err) {
      setError(err.message);
    }
  };

  // 답변 등록 및 수정 함수
  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    if (!responseContent.trim()) {
      alert("답변 내용을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authFetch(
        `${apiUrl}/inquiry/respond_inquiry/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            response_content: responseContent,
            status: status,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("답변을 등록하지 못했습니다.");
      }

      alert("답변이 등록되었습니다.");
      fetchInquiry(); // 답변 등록 후 데이터 새로고침
    } catch (err) {
      setError(err.message);
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  //권한 확인 함수(수정/삭제 버튼)
  const canModifyInquiry = () => {
    if (!inquiry || !user) return false;
    return user.name === inquiry.created_by || user.role_id === "AD_ADMIN";
  };

  // ✅ 로딩 중 또는 에러 시 화면에 표시할 메세지
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage />;

  return (
    <div>
      <Sidebar user={user} />
      <div className="inquiry-detail-container">
        <div className="inquiry-detail-header">
          <span
            className="inquiry-detail-inquiry"
            onClick={() => navigate("/inquiry-list")}
          >
            문의사항
          </span>
          <button
            className="inquiry-detail-backspace-button"
            onClick={() => navigate("/inquiry-list")}
          >
            목록
          </button>
        </div>
        <h1 className="inquiry-detail-title">{inquiry.title}</h1>
        <div className="inquiry-detail-meta">
          <span>{inquiry.created_by}</span>
          <div className="inquiry-detail-date">
            <span>
              {new Date(inquiry.created_at).toLocaleString("ko-KR", {
                timeZone: "Asia/Seoul",
              })}
            </span>
            <span className="inquiry-status">
              상태: {inquiry.status || "대기중"}
            </span>
          </div>
        </div>

        <div
          className="inquiry-detail-content"
          dangerouslySetInnerHTML={{ __html: inquiry.content }}
        ></div>
        {canModifyInquiry() && (
          <>
            <div className="inquiry-details-button-group">
              <BsPencilSquare
                className="inquiry-details-edit-button"
                onClick={() => navigate(`/inquiry-edit/${id}`)}
              >
                수정
              </BsPencilSquare>
              <BsTrash3
                className="inquiry-details-delete-button"
                onClick={() => handleDeleteInquiry(id)}
              >
                삭제
              </BsTrash3>
            </div>
          </>
        )}
        {/* 답변 내용 표시 영역 */}
        {inquiry.response_content && (
          <div className="inquiry-response-area">
            <h3>관리자 답변</h3>
            <div className="inquiry-response-meta">
              <span>{inquiry.response_by}</span>
              <span>
                {new Date(inquiry.response_at).toLocaleString("ko-KR", {
                  timeZone: "Asia/Seoul",
                })}
              </span>
            </div>
            <div
              className="inquiry-response-content"
              dangerouslySetInnerHTML={{ __html: inquiry.response_content }}
            ></div>
          </div>
        )}

        {/* 관리자 답변 폼 */}
        {user?.role_id === "AD_ADMIN" && (
          <div className="inquiry-admin-response-form">
            <h3>관리자 답변 {inquiry.response_content ? "수정" : "등록"}</h3>
            <form onSubmit={handleSubmitResponse}>
              <div className="form-group">
                <label htmlFor="responseContent">답변 내용:</label>
                <textarea
                  id="responseContent"
                  rows="5"
                  value={responseContent}
                  onChange={(e) => setResponseContent(e.target.value)}
                  placeholder="답변 내용을 입력하세요"
                  required
                ></textarea>
              </div>
              <div className="submit-response-button-container">
                <button
                  type="submit"
                  className="submit-response-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "처리 중..." : "답변 등록"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "3px",
            cursor: "pointer",
          }}
        ></div>
      </div>
    </div>
  );
};

export default InquiryDetails;
