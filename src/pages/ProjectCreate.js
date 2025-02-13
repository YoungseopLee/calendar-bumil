import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import "./ProjectCreate.css";

const ProjectCreate = () => {
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL || "http://3.38.20.237";

  // ✅ 프로젝트 입력 상태 관리 (기본값 포함)
  const [formData, setFormData] = useState({
    project_code: "", // 프로젝트 코드
    project_name: "", // 프로젝트명
    category: "", // 카테고리
    status: "", // 상태
    business_start_date: "", // 사업 시작일
    business_end_date: "", // 사업 종료일
    customer: "", // 고객
    supplier: "", // 공급처
    person_in_charge: "", // 담당자
    contact_number: "", // 연락처
    sales_representative: "", // 영업대표
    project_pm: "", // 프로젝트 PM
    project_manager: "", // 프로젝트 관리자
    business_details_and_notes: "", // 사업 내용 및 특이사항
    changes: "", // 변경사항
    group_name: "", // 그룹명
  });

  const [error, setError] = useState(null);

  // ✅ 입력값 변경 핸들러
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ 프로젝트 추가 API 호출
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // ✅ 필수 입력값 검증 (입력되지 않은 값이 있으면 경고)
    if (
      !formData.project_code ||
      !formData.category ||
      !formData.status ||
      !formData.business_start_date ||
      !formData.business_end_date ||
      !formData.project_name ||
      !formData.project_pm
    ) {
      setError("⚠️ 필수 입력값을 모두 입력해주세요.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await fetch(`${apiUrl}/project/add_project`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorMessage = await response.json();
        throw new Error(
          errorMessage.message || "프로젝트 생성에 실패했습니다."
        );
      }

      alert("프로젝트가 성공적으로 생성되었습니다!");
      navigate("/projects"); // ✅ 프로젝트 목록으로 이동
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="app">
      <Sidebar />
      <div className="project-create-container">
        <h2 className="title">프로젝트 생성</h2>
        {error && <p className="error-message">⚠️ {error}</p>}

        <form onSubmit={handleSubmit} className="project-form">
          <div className="form-row">
            <label>프로젝트 코드:</label>
            <input
              type="text"
              name="project_code"
              value={formData.project_code}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <label>프로젝트명:</label>
            <input
              type="text"
              name="project_name"
              value={formData.project_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <label>카테고리:</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">선택하세요</option>
              <option value="구축 인프라">구축 인프라</option>
              <option value="구축 SW">구축 SW</option>
              <option value="유지보수 인프라">유지보수 인프라</option>
              <option value="유지보수 SW">유지보수 SW</option>
              <option value="연구과제">연구과제</option>
            </select>
          </div>

          <div className="form-row">
            <label>상태:</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
            >
              <option value="">선택하세요</option>
              <option value="제안">제안</option>
              <option value="진행 중">진행 중</option>
              <option value="완료">완료</option>
            </select>
          </div>

          <div className="form-row">
            <label>사업 기간:</label>
            <div className="date-container">
              <input
                type="date"
                name="business_start_date"
                value={formData.business_start_date}
                onChange={handleChange}
                required
              />
              <span className="date-separator">~</span>
              <input
                type="date"
                name="business_end_date"
                value={formData.business_end_date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <label>고객:</label>
            <input
              type="text"
              name="customer"
              value={formData.customer}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <label>공급처:</label>
            <input
              type="text"
              name="supplier"
              value={formData.supplier}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <label>담당자:</label>
            <input
              type="text"
              name="person_in_charge"
              value={formData.person_in_charge}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <label>연락처:</label>
            <input
              type="text"
              name="contact_number"
              value={formData.contact_number}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <label>영업대표:</label>
            <input
              type="text"
              name="sales_representative"
              value={formData.sales_representative}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <label>PM:</label>
            <input
              type="text"
              name="project_pm"
              value={formData.project_pm}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <label>비고:</label>
            <textarea
              name="business_details_and_notes"
              value={formData.business_details_and_notes}
              onChange={handleChange}
            />
          </div>

          <div className="button-container">
            <button type="submit" className="save-button">
              프로젝트 생성
            </button>
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate("/projects")}
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectCreate;
