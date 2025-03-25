import React from "react";
import { FaSpinner } from "react-icons/fa";
import "./LoadingSpinner.css";

const LoadingSpinner = () => {
  return (
    <div className="spinner-container">
      <FaSpinner className="spinner-icon" />
    </div>
  );
};

export default LoadingSpinner;
