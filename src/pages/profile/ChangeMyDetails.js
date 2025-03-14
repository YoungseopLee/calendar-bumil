import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ChangeMyDetails.css";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../../utils/useAuth";

const ChangeMyDetails = () => {
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;

  const [formData, setFormData] = useState({
    username: "",
    position: "",
    department: "",
    phone: "",
    role_id: "",
  });

  const [loading, setLoading] = useState(true); // 데이터 로딩 상태
  const [user, setUser] = useState({id: "", name: "", position: "", department: "", role_id: ""}); //로그인한 사용자 정보
  const { getUserInfo, checkAuth, handleLogout } = useAuth();

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // 1. 사용자 정보 가져오기
        const userInfo = await fetchUserInfo();

        // 2. 모든 데이터 병렬로 가져오기
        await Promise.all([
          fetchFormData(userInfo.id), // 디코딩된 userId로 데이터 불러오기
        ]);
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

  // 전화번호 입력 시 자동으로 '-' 추가
  const formatPhoneNumber = (value) => {
    const onlyNumbers = value.replace(/\D/g, ""); // 숫자만 남기기

    if (onlyNumbers.length <= 3) {
      return onlyNumbers;
    } else if (onlyNumbers.length <= 7) {
      return `${onlyNumbers.slice(0, 3)}-${onlyNumbers.slice(3)}`;
    } else {
      return `${onlyNumbers.slice(0, 3)}-${onlyNumbers.slice(
        3,
        7
      )}-${onlyNumbers.slice(7, 11)}`;
    }
  };

  // 유저 데이터 불러오기 함수
  const fetchFormData = async (decodedId) => {
    if (!decodedId) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${apiUrl}/user/get_user?user_id=${decodedId}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok)
        throw new Error("유저 데이터를 가져오는 데 실패했습니다.");

      const data = await response.json();
      setFormData({
        username: data.user.name,
        position: data.user.position,
        department: data.user.department,
        phone: data.user.phone_number,
        role_id: data.user.role_id,
      });
    } catch (error) {
      console.error("유저 데이터 불러오기 오류:", error);
      alert("유저 데이터를 불러오는데 실패했습니다.");
    }
  };

  // 입력 필드 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;

    // 전화번호 필드일 경우 자동 포맷 적용 및 비밀번호 자동 생성
    if (name === "phone") {
      const formattedPhone = formatPhoneNumber(value);
      setFormData({
        ...formData,
        phone: formattedPhone,
      });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  // 유저 정보 수정 요청 함수
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/admin/update_user`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: user.id,
          username: formData.username,
          position: formData.position,
          department: formData.department,
          phone: formData.phone,
          role_id: formData.role_id,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`유저 정보 수정 실패: ${errorText}`);
      }

      alert("✅ 유저 정보가 성공적으로 수정되었습니다!");
      navigate(`/user-details?user_id=${user.id}`);
    } catch (error) {
      console.error("유저 수정 오류:", error);
      alert(`❌ 유저 수정에 실패했습니다. 오류: ${error.message}`);
    }
  };

  if (loading) return <div className="change-user-edit-body">로딩 중...</div>;

  return (
    <div className="change-user-edit-body">
      <Sidebar user={user} />
      <div className="change-user-edit-container">
        <h2 className="change-user-edit-title">내 정보 변경</h2>
        <form onSubmit={handleSubmit}>
          <div className="change-user-edit-form-group">
            <label>이름</label>
            <div className="change-user-info-text">{user?.name}</div>
          </div>
          <div className="change-user-edit-form-group">
            <label>부서</label>
            <div className="change-user-info-text">
              {user?.department}
            </div>
          </div>
          <div className="change-user-edit-form-group">
            <label>직급</label>
            <div className="change-user-info-text">{user?.position}</div>
          </div>
          <div className="change-user-edit-form-group">
            <label>전화번호</label>
            <input
              type="tel"
              name="phone"
              className="change-user-phone-input"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>
          <button
            type="button"
            className="change-user-change-pw-button"
            onClick={() => navigate("/change-pw")}
          >
            비밀번호 변경
          </button>

          <div className="change-user-edit-button-container">
            <button type="submit" className="change-user-edit-submit-button">
              저장
            </button>
            <button
              type="button"
              className="change-user-edit-cancel-button"
              onClick={() => window.history.back()}
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangeMyDetails;
