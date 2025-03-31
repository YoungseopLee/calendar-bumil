import { useNavigate } from "react-router-dom";
import "./AddInquiryButton.css"; 
import { FaPlus } from "react-icons/fa";
import AddInquiryButton from "./AddInquiryButton";
/**
 * 📌 프로젝트 추가 버튼 컴포넌트
 *  - 프로젝트 추가 페이지로 이동하는 버튼
    - useNavigate 훅을 사용하여 페이지 이동
 */

function AddProjectButton() {
  const navigate = useNavigate();

  return (
    <div className="back-button-container">
      <button className="back-button" onClick={() => navigate("/inquiry-create")}>
        <FaPlus />
      </button>{" "}
      {/* 문의사항 추가 페이지로 이동 */}
    </div>
  );
}

export default AddProjectButton;
