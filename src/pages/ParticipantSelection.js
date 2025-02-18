import React, { useState, useEffect } from "react";
import { FaPlus, FaTimes } from "react-icons/fa";
import Select from "react-select";
import "./ParticipantSelection.css";

const ParticipantSelection = ({ participants, setParticipants, projectStartDate, projectEndDate }) => {
  const apiUrl = process.env.REACT_APP_API_URL || "http://3.38.20.237";
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  // ✅ participants가 배열인지 확인하고, 아니라면 빈 배열을 사용
  const safeParticipants = Array.isArray(participants) ? participants : [];

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
        console.error("❌ 사용자 데이터를 불러오지 못했습니다.", error);
      }
    };
  
    fetchUsers();
  }, [apiUrl]); // 🔥 더미 데이터 대신 API 호출 추가

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const response = await fetch(`${apiUrl}/project/get_participants`);
        if (response.ok) {
          const data = await response.json();
          setParticipants(data.participants); // ✅ DB에서 불러온 실제 데이터로 업데이트
        }
      } catch (error) {
        console.error("❌ 참여자 데이터를 불러오지 못했습니다.", error);
      }
    };
  
    fetchParticipants();
  }, [apiUrl]); // 🔥 더미 데이터 대신 API 호출 추가

  const handleAddParticipant = () => {
    if (!selectedUser) return;

    // ✅ `participants`가 배열인지 다시 한 번 확인
    if (!Array.isArray(safeParticipants)) {
      console.warn("⚠️ participants가 배열이 아닙니다. 빈 배열을 설정합니다.");
      setParticipants([]); 
      return;
    }

    if (!safeParticipants.some((p) => p.id === selectedUser.value)) {
      setParticipants([
        ...safeParticipants,
        {
          id: selectedUser.value,
          name: selectedUser.label.split(" - ")[1].split(" (")[0],
          department: selectedUser.label.split(" (")[1].replace(")", ""),
          participant_start_date: projectStartDate,
          participant_end_date: projectEndDate,
        },
      ]);

      setUsers(users.filter((user) => user.value !== selectedUser.value));
      setSelectedUser(null);
    }
  };

  const handleRemoveParticipant = (userId) => {
    if (!Array.isArray(safeParticipants)) return;

    setParticipants(safeParticipants.filter((participant) => participant.id !== userId));

    const removedUser = safeParticipants.find((user) => user.id === userId);
    if (removedUser) {
      setUsers([
        ...users,
        { value: removedUser.id, label: `${removedUser.id} - ${removedUser.name} (${removedUser.department})` },
      ]);
    }
  };

  const handleParticipantDateChange = (userId, field, value) => {
    setParticipants(safeParticipants.map((participant) =>
      participant.id === userId ? { ...participant, [field]: value } : participant
    ));
  };

  return (
    <div className="form-section">
      <h3>👥 프로젝트 참여자</h3>
      <div className="participant-container">
        <Select
          className="react-select-container"
          classNamePrefix="react-select"
          options={users}
          value={selectedUser}
          onChange={setSelectedUser}
          isSearchable={true}
          placeholder="참여자 선택"
        />
        <button type="button" className="add-button" onClick={handleAddParticipant}>
          <FaPlus />
        </button>
      </div>

      <ul className="participant-list">
        {safeParticipants.length > 0 ? (
          safeParticipants.map((user) => (
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
          ))
        ) : (
          <p></p>
        )}
      </ul>
    </div>
  );
};

export default ParticipantSelection;