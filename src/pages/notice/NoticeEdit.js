import Sidebar from "../components/Sidebar";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "./NoticeEdit.css";

const NoticeEdit = () => {
  const [loading, setLoading] = useState(true); // 데이터 로딩 상태
  const [error, setError] = useState(null); // 에러 메세지

  const [notice, setNotice] = useState(null);

  const apiUrl = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const { id } = useParams();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    user_id: user.id,
  });

  useEffect(() => {
    fetchLoggedInUser();
    if (!user) {
      alert("로그인된 사용자 정보가 없습니다. 로그인해주세요.");
      navigate("/");
      return;
    }
    // ✅ 어드민, PR 권한 체크
    if (user.role_id !== "AD_ADMIN") {
      alert("관리자 권한이 없습니다.");
      navigate("/");
      return;
    }
    fetchNotices();
  }, []);

  useEffect(() => {
    if (notice) {
      setFormData({
        title: notice.title,
        content: notice.content,
        user_id: user.id,
      });
    }
  }, [notice, user.id]);

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

  const handleLogout = () => {
    alert("세션이 만료되었습니다. 다시 로그인해주세요.");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/notice/get_notice/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
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
    console.log("공지사항 제목, 내용:", formData.title, formData.content);
    if (!formData.title || !formData.content) {
      setError("⚠️ 필수 입력값을 모두 입력해주세요.");
      return;
    }
    updateNotice();
  };

  const updateNotice = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/notice/update_notice/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        throw new Error("공지사항 수정을 실패했습니다.");
      }
      alert("✅ 공지사항이 성공적으로 수정되었습니다!");
      navigate("/notice-list");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) return <p>데이터를 불러오는 중...</p>;
  if (error) return <p>오류 발생: {error}</p>;

  return (
    <div>
      <Sidebar />
      <div className="notice-create-container">
        <h2>공지사항 수정</h2>

        <form onSubmit={handleSubmit}>
          <div className="notice-create-form-group">
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
            style={{ height: "250px" }}
          />
          <button className="notice-create-button" type="submit">
            공지사항 수정
          </button>
        </form>
        <button
          className="notice-edit-cancel-button"
          onClick={() => navigate("/notice-list")}
        >
          취소
        </button>
      </div>
    </div>
  );
};

export default NoticeEdit;
