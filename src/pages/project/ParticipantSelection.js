import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import Select from "react-select";
import "./ParticipantSelection.css";

const ParticipantSelection = ({ participants, setParticipants, projectStartDate, projectEndDate }) => {
  const apiUrl = process.env.REACT_APP_API_URL || "http://3.38.20.237";

  const [users, setUsers] = useState([]); // 사용자 목록
  const [selectedParticipants, setSelectedParticipants] = useState([]); // ✅ 즉시 추가되는 리스트

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${apiUrl}/user/get_users`);
        if (response.ok) {
          const data = await response.json();
          setUsers(
            data.users.map((user) => ({
              value: user.id,
              label: `${user.id} - ${user.name} (${user.department})`,
            }))
          );
        }
      } catch (error) {
        //console.error("❌ 사용자 데이터를 불러오지 못했습니다.", error);
      }
    };
    fetchUsers();
  }, [apiUrl]);

  /**
   * 🔹 사용자 선택 시 `selectedParticipants`에 즉시 추가
   */
  const handleUserSelect = (selectedUser) => {
    if (!selectedUser) return;

    if (!selectedParticipants.some((p) => p.id === selectedUser.value)) {
      const newParticipant = {
        id: selectedUser.value,
        name: selectedUser.label.split(" - ")[1].split(" (")[0], // 이름 추출
        department: selectedUser.label.split(" (")[1].replace(")", ""), // 부서 추출
        participant_start_date: projectStartDate, 
        participant_end_date: projectEndDate, 
      };

      setSelectedParticipants([...selectedParticipants, newParticipant]);

      // ✅ users 목록에서 제거
      setUsers(users.filter((user) => user.value !== selectedUser.value));
    }
  };

  /**
   * 🔹 참여자의 시작일/종료일을 변경하는 함수
   */
  const handleParticipantDateChange = (userId, field, value) => {
    setSelectedParticipants(
      selectedParticipants.map((participant) =>
        participant.id === userId ? { ...participant, [field]: value } : participant
      )
    );
  };

  /**
   * 🔹 최종 참여자 확정 (프로젝트 추가 버튼 클릭 시)
   */
  const handleConfirmParticipants = () => {
    if (selectedParticipants.length === 0) return;

    const newParticipants = selectedParticipants.filter(
      (p) => !participants.some((existing) => existing.id === p.id)
    );

    setParticipants([...participants, ...newParticipants]);

    setSelectedParticipants([]); // ✅ 선택 목록 초기화
  };

  /**
   * 🔹 임시 추가된 참여자 삭제
   */
  const handleRemoveParticipant = (userId) => {
    setSelectedParticipants(selectedParticipants.filter((participant) => participant.id !== userId));

    // ✅ 제거된 사용자를 다시 users 목록에 추가
    const removedUser = selectedParticipants.find((user) => user.id === userId);
    if (removedUser) {
      setUsers([...users, { value: removedUser.id, label: `${removedUser.id} - ${removedUser.name} (${removedUser.department})` }]);
    }
  };

  /**
   * 🔹 확정된 참여자 삭제 (확정된 `participants`에서 삭제)
   */
  const handleRemoveConfirmedParticipant = (userId) => {
    setParticipants(participants.filter((participant) => participant.id !== userId));

    // ✅ 제거된 사용자를 다시 users 목록에 추가
    const removedUser = participants.find((user) => user.id === userId);
    if (removedUser) {
      setUsers([...users, { value: removedUser.id, label: `${removedUser.id} - ${removedUser.name} (${removedUser.department})` }]);
    }
  };

  return (
    <div className="form-section">
      <h3>👥 프로젝트 참여자</h3>
      
      {/* ✅ 사용자 선택 (누르면 자동 추가) */}
      <Select
        className="react-select-container"
        classNamePrefix="react-select"
        options={users}
        onChange={handleUserSelect}
        isSearchable={true}
        placeholder="참여자 선택"
      />

      {/* ✅ 즉시 추가된 사용자 목록 (날짜 입력 가능) */}
      {selectedParticipants.length > 0 && (
        <ul className="participant-list">
          {selectedParticipants.map((user) => (
            <li key={user.id}>
              {user.name} ({user.department})
              <input
                type="date"
                className="small-date-input"
                value={user.participant_start_date}
                onChange={(e) => handleParticipantDateChange(user.id, "participant_start_date", e.target.value)}
              />
              <input
                type="date"
                className="small-date-input"
                value={user.participant_end_date}
                onChange={(e) => handleParticipantDateChange(user.id, "participant_end_date", e.target.value)}
              />
              <button type="button" className="remove-button" onClick={() => handleRemoveParticipant(user.id)}>
                <FaTimes />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ✅ 프로젝트 추가 버튼 (한 번에 추가) */}
      <button type="button" className="confirm-button" onClick={handleConfirmParticipants}>
        프로젝트에 추가
      </button>

      {/* ✅ 확정된 참여자 목록 (삭제 가능) */}
      <h4>📌 확정된 참여자</h4>
      <ul className="participant-list">
        {participants.length > 0 ? (
          participants.map((user) => (
            <li key={user.id}>
              {user.name} ({user.department})
              <span>📅 {user.participant_start_date} ~ {user.participant_end_date}</span>
              <button type="button" className="remove-button" onClick={() => handleRemoveConfirmedParticipant(user.id)}>
                <FaTimes />
              </button>
            </li>
          ))
        ) : (
          <p>아직 확정된 참여자가 없습니다.</p>
        )}
      </ul>
    </div>
  );
};

export default ParticipantSelection;