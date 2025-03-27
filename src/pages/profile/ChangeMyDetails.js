import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../../utils/useAuth";
import { authFetch } from "../../utils/authFetch";
import Select from "react-select";
import "./ChangeMyDetails.css";

const ChangeMyDetails = () => {
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;
  const accessToken = localStorage.getItem("access_token");

  const [formData, setFormData] = useState({
    username: "",
    position: "",
    department_name: "",
    team_name: "",
    phone: "",
    role_id: "",
    squid_test: "",
    mbti: "",
  });

  const [loading, setLoading] = useState(true); // 데이터 로딩 상태
  const [user, setUser] = useState({
    id: "",
    name: "",
    position: "",
    department_name: "",
    team_name: "",
    role_id: "",
    squid_test: "",
    mbti: "",
  }); //로그인한 사용자 정보
  const { getUserInfo, checkAuth, handleLogout } = useAuth();

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // 1. 사용자 정보 가져오기
        const userInfo = await fetchUserInfo();

        // 2. 모든 데이터 병렬로 가져오기
        await Promise.all([fetchFormData(userInfo.id)]);
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
  const fetchFormData = async (userId) => {
    if (!userId) return;

    try {
      const response = await authFetch(
        `${apiUrl}/user/get_user?user_id=${userId}`,
        {
          method: "GET",
          "Content-Type": "application/json",
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!response.ok)
        throw new Error("유저 데이터를 가져오는 데 실패했습니다.");

      const data = await response.json();
      setFormData({
        username: data.user.name,
        position: data.user.position,
        department_name: data.user.department_name,
        team_name: data.user.team_name,
        phone: data.user.phone_number,
        role_id: data.user.role_id,
        squid_test: data.user.squid_test,
        mbti: data.user.mbti,
      });

      setUser({
        ...data.user,
        department_name: data.user.department_name,
        team_name: data.user.team_name,
      });
    } catch (error) {
      console.error("유저 데이터 불러오기 오류:", error);
      alert("유저 데이터를 불러오는데 실패했습니다.");
    }
  };

  // 입력 필드 변경 핸들러
  const handleChange = (e, fieldName) => {
    if (fieldName) {
      // react-select에서 선택한 경우
      setFormData((prev) => ({ ...prev, [fieldName]: e.value }));
    } else {
      // 일반 input 변경 처리
      const { name, value } = e.target;
      if (name === "phone") {
        setFormData((prev) => ({ ...prev, phone: formatPhoneNumber(value) }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    }
  };

  // 유저 정보 수정 요청 함수
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await authFetch(`${apiUrl}/admin/update_user`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          id: user.id,
          username: formData.username,
          position: formData.position,
          department_name: formData.department_name,
          team_name: formData.team_name,
          phone: formData.phone,
          role_id: formData.role_id,
          squid_test: formData.squid_test,
          mbti: formData.mbti,
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

  //존재하는 16개의 오징어 옵션들
  const squidOptions = [
    { value: "깐깐징어", label: "깐깐징어" },
    { value: "쿨한징어", label: "쿨한징어" },
    { value: "야망징어", label: "야망징어" },
    { value: "솔플징어", label: "솔플징어" },
    { value: "어쩔징어", label: "어쩔징어" },
    { value: "돌격징어", label: "돌격징어" },
    { value: "순둥징어", label: "순둥징어" },
    { value: "눈치징어", label: "눈치징어" },
    { value: "깐부징어", label: "깐부징어" },
    { value: "몽글징어", label: "몽글징어" },
    { value: "센스징어", label: "센스징어" },
    { value: "팔랑징어", label: "팔랑징어" },
    { value: "예민징어", label: "예민징어" },
    { value: "꿀잼징어", label: "꿀잼징어" },
    { value: "쌀쌀징어", label: "쌀쌀징어" },
    { value: "대장징어", label: "대장징어" },
  ];

  const mbtiOptions = [
    { value: "ISTJ", label: "ISTJ - 청렴결백한 관리자" },
    { value: "ISFJ", label: "ISFJ - 용감한 수호자" },
    { value: "INFJ", label: "INFJ - 선의의 옹호자" },
    { value: "INTJ", label: "INTJ - 전략가" },
    { value: "ISTP", label: "ISTP - 만능 재주꾼" },
    { value: "ISFP", label: "ISFP - 호기심 많은 예술가" },
    { value: "INFP", label: "INFP - 열정적인 중재자" },
    { value: "INTP", label: "INTP - 사색하는 이론가" },
    { value: "ESTP", label: "ESTP - 활동적인 모험가" },
    { value: "ESFP", label: "ESFP - 사교적인 연예인" },
    { value: "ENFP", label: "ENFP - 열정적인 사회 혁신가" },
    { value: "ENTP", label: "ENTP - 창의적인 발명가" },
    { value: "ESTJ", label: "ESTJ - 확고한 관리자" },
    { value: "ESFJ", label: "ESFJ - 사교적인 돌봄자" },
    { value: "ENFJ", label: "ENFJ - 인류애적인 리더" },
    { value: "ENTJ", label: "ENTJ - 대담한 지도자" },
  ];

  if (loading) return <LoadingSpinner />;

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
              {user?.team_name
                ? `${user.department_name} - ${user.team_name}`
                : user.department_name}
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
          <div className="change-user-edit-form-group"></div>
          <div className="change-user-edit-form-group">
            <label>MBTI</label>
            <Select
              name="mbti"
              options={mbtiOptions}
              placeholder="MBTI를 선택하세요"
              className="change-user-squid-input"
              value={mbtiOptions.find(
                (option) => option.value === formData.mbti
              )} // 현재 선택된 값 유지
              onChange={(selectedOption) =>
                handleChange(selectedOption, "mbti")
              }
            />
          </div>
          <label>징어</label>
          <Select
            name="squid_test"
            options={squidOptions}
            placeholder="징어를 선택하세요"
            className="change-user-squid-input"
            value={squidOptions.find(
              (option) => option.value === formData.squid_test
            )} // 현재 선택된 값 유지
            onChange={(selectedOption) =>
              handleChange(selectedOption, "squid_test")
            }
          />
          <div>
            <a
              className="change-user-squid-test-link"
              href="https://poomang.com/t/squid_test?from_detail=True"
              target="_blank"
              rel="noopener noreferrer"
            >
              당신의 징어가 궁금하다면?
            </a>
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
