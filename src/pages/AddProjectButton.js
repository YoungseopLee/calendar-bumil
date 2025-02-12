import { useNavigate } from 'react-router-dom';
import './BackButton.css'; // 기존 스타일 재사용

function AddProjectButton() {
    const navigate = useNavigate();

    return (
        <div className="back-button-container">
            <button className="back-button" onClick={() => navigate('/add-project')}>➕</button> {/* 프로젝트 추가 페이지로 이동 */}
        </div>
    );
}

export default AddProjectButton;