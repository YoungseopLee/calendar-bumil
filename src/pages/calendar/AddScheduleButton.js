import { useNavigate } from "react-router-dom";
import "./AddScheduleButton.css";
import { FaPlus } from "react-icons/fa";

function AddScheduleButton({ selectedDate }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/add-schedule", {
      state: { selectedDate },
    });
  };

  return (
    <div className="add_schedule_button_container">
      <button className="add_schedule_button" onClick={handleClick}>
        <FaPlus />
      </button>
    </div>
  );
}

export default AddScheduleButton;
