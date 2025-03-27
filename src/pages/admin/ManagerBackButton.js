import { useNavigate } from "react-router-dom";
import { MdAdminPanelSettings } from "react-icons/md";
import "./ManagerBackButton.css";

function ManagerBackButton() {
  const navigate = useNavigate();

  return (
    <div className="back-button-container">
      <button className="back-button" onClick={() => navigate("/manager")}>
        <MdAdminPanelSettings />
      </button>{" "}
    </div>
  );
}

export default ManagerBackButton;
