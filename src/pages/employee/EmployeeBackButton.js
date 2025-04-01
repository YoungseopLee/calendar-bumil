import { useNavigate } from "react-router-dom";
import { FaUsers } from "react-icons/fa";
import "./EmployeeBackButton.css";

function EmployeeBackButton() {
  const navigate = useNavigate();

  return (
    <div className="employee-back-button-container">
      <button
        className="employee-back-button"
        onClick={() => navigate("/employee")}
      >
        <FaUsers />
      </button>{" "}
    </div>
  );
}

export default EmployeeBackButton;
