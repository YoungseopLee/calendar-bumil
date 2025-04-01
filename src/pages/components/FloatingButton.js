import { useState } from "react";
import "./FloatingButton.css";
import { FaPlus, FaTimes } from "react-icons/fa";

const FloatingButton = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="floating-button-container">
      {/* 메인 플로팅 버튼 */}
      <button
        className="floating-main-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <FaTimes /> : <FaPlus />}
      </button>

      {/* 펼쳐질 버튼들 */}
      <div className={`floating-buttons ${isOpen ? "open" : ""}`}>
        {children}
      </div>
    </div>
  );
};

export default FloatingButton;
