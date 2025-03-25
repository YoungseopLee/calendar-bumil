import React from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import "./LoadingSpinner.css"; // 같은 CSS 안에서 관리해도 충분함!

const ErrorMessage = ({ message = "알 수 없는 오류가 발생했습니다." }) => {
  return (
    <div className="error-container">
      <FaExclamationTriangle className="error-icon" />
      <p>{message}</p>
    </div>
  );
};

export default ErrorMessage;
