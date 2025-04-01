import Sidebar from "../components/Sidebar";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../utils/useAuth";
import { authFetch } from "../../utils/authFetch";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "./InquiryEdit.css";

const InquiryEdit = () => {
  const [loading, setLoading] = useState(true); // 데이터 로딩 상태
  const [error, setError] = useState(null); // 에러 메세지

  const [inquiry, setInquiry] = useState(null);

  const apiUrl = process.env.REACT_APP_API_URL;
  const accessToken = localStorage.getItem("access_token");

  const navigate = useNavigate();

  const { id } = useParams();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    user_id: "",
    private_yn:"",
  });

  //로그인한 사용자 정보
  const [user, setUser] = useState({
    id: "",
    name: "",
    position: "",
    department: "",
    role_id: "",
  }); //로그인한 사용자 정보
  const { getUserInfo, checkAuth, handleLogout } = useAuth();

  // 전체 데이터 가져오기
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const userInfo = await fetchUserInfo();
        const inquiryData = await fetchInquirys();
  
        // console.log("userInfo: ", userInfo);
        // console.log("inquiry: ", inquiryData);

        const isAuthor = userInfo.name === inquiryData.created_by; 
        const isAdmin = userInfo.role_id === "AD_ADMIN";
  
        // console.log("isAuthor: ", isAuthor);
        // console.log("isAdmin: ", isAdmin);

        if (!isAuthor && !isAdmin) {
          alert("수정 권한이 없습니다.");
          navigate("/inquiry-list");
          return;
        }
  
      } catch (error) {
        console.error("데이터 로딩 오류:", error);
      }
      setLoading(false);
    };
    
    fetchAllData();
  }, []);

  // 로그인한 사용자 정보 가져오는 함수
  const fetchUserInfo = async () => {
    const userInfo = await getUserInfo();
    setUser(userInfo);
    return userInfo;
  };

  useEffect(() => {
    if (inquiry) {
      setFormData({
        title: inquiry.title,
        content: inquiry.content,
        user_id: user.id,
        private_yn:inquiry.private_yn,
      });
    }
  }, [inquiry, user.id]);

  const fetchInquirys = async () => {
    try {
      setLoading(true);
      const response = await authFetch(`${apiUrl}/inquiry/get_inquiry/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("문의사항을 불러오지 못했습니다.");
      }
      const data = await response.json();
      setInquiry(data.inquiry);
      return data.inquiry; // ✅ 추가
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (value, name) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    // console.log("문의사항 제목, 내용:", formData.title, formData.content);
    if (!formData.title || !formData.content) {
      setError("필수 입력값을 모두 입력해주세요.");
      return;
    }
    updateInquiry();
  };

  const updateInquiry = async () => {
    try {
      const response = await authFetch(`${apiUrl}/inquiry/update_inquiry/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        throw new Error("문의사항 수정을 실패했습니다.");
      }
      alert("문의사항이 수정되었습니다.");
      navigate("/inquiry-list");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const modules = {
    toolbar: [
      [{ header: "1" }, { header: "2" }, { font: [] }],
      [{ size: ["small", false, "large", "huge"] }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      ["bold", "italic", "underline"],
      ["link"],
    ],
  };

  const formats = [
    "header",
    "font",
    "size",
    "list",
    "align",
    "bold",
    "italic",
    "underline",
    "link",
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage />;

  return (
    <div>
      <Sidebar user={user} />
      <div className="inquiry-edit-container">
        <h2>문의사항 수정</h2>

        <form onSubmit={handleSubmit}>
          <div className="inquiry-edit-form-group">
            <label htmlFor="title">제목</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={(e) => handleChange(e.target.value, e.target.name)}
              required
            />
          </div>
          <ReactQuill
            value={formData.content}
            onChange={(value) => handleChange(value, "content")}
            modules={modules}
            formats={formats}
            theme="snow"
            style={{ height: "100%" }}
          />
          <div className="private-checkbox-group">
            <label className="private-checkbox" htmlFor="private_yn">
              <input
                type="checkbox"
                id="private_yn"
                name="private_yn"
                checked={formData.private_yn === "Y"}
                onChange={(e) =>
                  handleChange(e.target.checked ? "Y" : "N", "private_yn")
                }
              />
              비공개 여부
            </label>
          </div>
          <div className="inquiry-edit-button-group">
            <button className="inquiry-edit-button" type="submit">
              저장
            </button>
            <button
              className="inquiry-edit-cancel-button"
              type="button"
              onClick={() => navigate("/inquiry-list")}
            >
              목록
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InquiryEdit;
