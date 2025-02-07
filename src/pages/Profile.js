import React, { useState } from "react";
import "./Profile.css"; // 스타일 파일 import
import { FaCircle, FaPhone, FaEnvelope } from "react-icons/fa"; // 아이콘 추가

const Profile = () => {
  const [status, setStatus] = useState("온라인"); // 상태 값 (온라인 / 오프라인)

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* 위쪽 파란색 영역 */}
        <div className="profile-header">
          {/* 로고 추가 가능 */}
        </div>

        {/* 아래쪽 정보 영역 */}
        <div className="profile-content">
          <div className="profile-name">MICHAL JOHN</div>
          <div className="profile-role">Graphic Designer</div>

          {/* 상태 및 연락처 정보 (이름 첫 글자 기준 정렬) */}
          <div className="profile-details">
            {/* 상태 표시 */}
            <div className="profile-status">
              <FaCircle className={`status-icon ${status === "온라인" ? "online" : "offline"}`} />
              {status}
            </div>

            {/* 연락처 정보 */}
            <div className="profile-info">
              <FaPhone className="icon" /> +25 123 4567 89002
            </div>
            <div className="profile-info">
              <FaEnvelope className="icon" /> email@mail.com
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;