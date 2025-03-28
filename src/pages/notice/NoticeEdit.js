import Sidebar from "../components/Sidebar";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../utils/useAuth";
import { authFetch } from "../../utils/authFetch";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "./NoticeEdit.css";

const NoticeEdit = () => {
  const [loading, setLoading] = useState(true); // 데이터 로딩 상태
  const [error, setError] = useState(null); // 에러 메세지

  const [notice, setNotice] = useState(null);

  const apiUrl = process.env.REACT_APP_API_URL;
  const accessToken = localStorage.getItem("access_token");

  const navigate = useNavigate();

  const { id } = useParams();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    user_id: "",
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
        // 1. 사용자 정보 가져오기
        const userInfo = await fetchUserInfo();

        //2. 공지사항 가져오기
        await fetchNotices();

        //3. 권한 확인
        const isAuthorized = checkAuth(userInfo?.role_id, ["AD_ADMIN"]); // 권한 확인하고 맞으면 true, 아니면 false 반환
        if (!isAuthorized) {
          console.error("관리자 권한이 없습니다.");
          handleLogout();
          return;
        }
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

  useEffect(() => {
    if (notice) {
      setFormData({
        title: notice.title,
        content: notice.content,
        user_id: user.id,
      });
    }
  }, [notice, user.id]);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const response = await authFetch(`${apiUrl}/notice/get_notice/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("공지사항을 불러오지 못했습니다.");
      }
      const data = await response.json();
      console.log("data: ", data.notice);
      setNotice(data.notice);
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
    //console.log("공지사항 제목, 내용:", formData.title, formData.content);
    if (!formData.title || !formData.content) {
      setError("필수 입력값을 모두 입력해주세요.");
      return;
    }
    updateNotice();
  };

  const updateNotice = async () => {
    try {
      const response = await authFetch(`${apiUrl}/notice/update_notice/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        throw new Error("공지사항 수정을 실패했습니다.");
      }
      alert("공지사항이 수정되었습니다.");
      navigate("/notice-list");
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
      <div className="notice-edit-container">
        <h2>공지사항 수정</h2>

        <form onSubmit={handleSubmit}>
          <div className="notice-edit-form-group">
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
          <div className="notice-edit-button-group">
            <button className="notice-edit-button" type="submit">
              저장
            </button>
            <button
              className="notice-edit-cancel-button"
              type="button"
              onClick={() => navigate("/notice-list")}
            >
              목록
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoticeEdit;
