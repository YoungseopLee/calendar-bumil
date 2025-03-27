import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../utils/useAuth";
import { authFetch } from "../../utils/authFetch";
import LoadingSpinner from "../components/LoadingSpinner";
import Select from "react-select";
import "./ChooseSquidPage.css";

const ChooseSquidPage = () => {
  const [loading, setLoading] = useState(true); // 데이터 로딩 상태 관리 (true: 로딩 중)
  const [formData, setFormData] = useState({
    mbti: "",
    squid_test: "",
  });
  const [choosesquidStatus, setchoosesquidStatus] = useState("");
  const [errors, setErrors] = useState({});

  const apiUrl = process.env.REACT_APP_API_URL;
  const accessToken = localStorage.getItem("access_token");

  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const { getUserInfo } = useAuth();

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

  //존재하는 16개의 MBTI 옵션들
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

  // 로그인한 사용자 정보 가져오기 (api로 가져오기)
  useEffect(() => {
    const fetchUserInfo = async () => {
      const userInfo = await getUserInfo();
      setUser(userInfo);
      setLoading(false); // 로딩 완료
    };
    fetchUserInfo();
  }, []);

  const handleChange = (e, fieldName) => {
    if (fieldName) {
      // react-select에서 선택한 경우
      setFormData((prev) => ({ ...prev, [fieldName]: e.value }));
    } else {
      // 일반 input 변경 처리
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

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
          squid_test: formData.squid_test,
          mbti: formData.mbti,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setchoosesquidStatus("징어 선택이 완료되었습니다!");
        alert("징어 선택 성공!");
        navigate("/calendar");
      } else {
        setchoosesquidStatus(data.message);
      }
    } catch (error) {
      console.error("Change error:", error);
      setchoosesquidStatus("오류로 인해 징어 선택에 실패했습니다.");
    }
  };

  const goToCalendarPage = () => {
    navigate("/calendar");
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="choosesquid-body">
      <div className="choosesquid-container">
        <h2>당신의 징어를 선택해주세요</h2>
        <form onSubmit={handleSubmit}>
          <div className="choosesquid-form-group">
            <label>징어</label>
            <Select
              name="squid_test"
              options={squidOptions}
              placeholder="징어를 선택하세요"
              className="choosesquid-squid-input"
              value={squidOptions.find(
                (option) => option.value === formData.squid_test
              )} // 현재 선택된 값 유지
              onChange={(selectedOption) =>
                handleChange(selectedOption, "squid_test")
              }
            />
            <div>
              <a
                className="choosesquid-squid-test-link"
                href="https://poomang.com/t/squid_test?from_detail=True"
                target="_blank"
                rel="noopener noreferrer"
              >
                당신의 징어가 궁금하다면?
              </a>
            </div>
          </div>
          <div className="choosesquid-form-group">
            <label>MBTI</label>
            <Select
              name="mbti"
              options={mbtiOptions}
              placeholder="MBTI를 선택하세요"
              className="choosesquid-squid-input"
              value={mbtiOptions.find(
                (option) => option.value === formData.mbti
              )} // 현재 선택된 값 유지
              onChange={(selectedOption) =>
                handleChange(selectedOption, "mbti")
              }
            />
          </div>
          <div className="choosesquid-button-container">
            <button type="submit" className="choosesquid-button">
              저장
            </button>
            <button
              type="button"
              className="cancle-button"
              onClick={goToCalendarPage}
            >
              취소
            </button>
          </div>
        </form>
        {choosesquidStatus && (
          <div className="message">{choosesquidStatus}</div>
        )}
        <h4>내 정보 페이지에서 다시 바꿀 수 있습니다.</h4>
      </div>
    </div>
  );
};

export default ChooseSquidPage;
