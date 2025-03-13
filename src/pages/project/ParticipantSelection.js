import React, { useState, useEffect } from "react";
import { FaPlus, FaTimes } from "react-icons/fa";
import Select from "react-select";
import "./ParticipantSelection.css";

/**
 * 📌 ParticipantSelection - 프로젝트 참여자를 추가하고 관리하는 컴포넌트
 *
 * ✅ 주요 기능:
 *  - 사용자 목록을 조회하여 선택 가능 (`/user/get_users`)
 *  - 기존 참여자 목록을 조회 (`/project/get_participants`)
 *  - 선택한 사용자를 프로젝트 참여자로 추가
 *  - 참여자 목록에서 특정 사용자를 제거 가능
 *  - 참여자의 시작일 / 종료일을 설정 가능
 *
 * ✅ UI(또는 Component) 구조:
 *  - ParticipantSelection (메인 컴포넌트)
 *    ├── 사용자 목록 조회 (react-select)
 *    ├── 참여자 추가 버튼 (FaPlus)
 *    ├── 참여자 목록 리스트 (각 항목에 삭제 버튼 FaTimes)
 *    ├── 시작일 / 종료일 변경 가능 (input[type="date"])
 */

const ParticipantSelection = ({ participants, setParticipants, projectStartDate, projectEndDate }) => {
  // ✅ API URL 설정
  const apiUrl = process.env.REACT_APP_API_URL || "http://3.38.20.237";
  
  // ✅ 상태 관리
  const [users, setUsers] = useState([]); // 사용자 목록
  const [selectedUser, setSelectedUser] = useState(null); // 선택된 사용자

  // ✅ `participants`가 배열이 아닐 경우, 빈 배열로 설정 (예외 처리)
  const safeParticipants = Array.isArray(participants) ? participants : [];

  /**
   * 🔹 사용자 목록을 서버에서 가져오는 함수
   * - `/user/get_users` API 호출
   * - 사용자 ID, 이름, 부서를 포함하는 Select 옵션으로 변환
   */
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
  }, [apiUrl]); // ✅ `apiUrl`이 변경될 경우 재실행

  /**
   * 🔹 기존 참여자 목록을 서버에서 가져오는 함수
   * - `/project/get_participants` API 호출
   * - 참여자 목록을 `setParticipants` 상태로 저장
   */
  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const response = await fetch(`${apiUrl}/project/get_participants`);
        if (response.ok) {
          const data = await response.json();
          setParticipants(data.participants);
        }
      } catch (error) {
        console.error("❌ 참여자 데이터를 불러오지 못했습니다.", error);
      }
    };

    fetchParticipants();
  }, [apiUrl]);

  /**
   * 🔹 참여자를 추가하는 함수
   * - 선택한 사용자를 `participants` 배열에 추가
   * - 사용자 목록(`users`)에서 해당 사용자를 제거
   */
  const handleAddParticipant = () => {
    if (!selectedUser) return;

    if (!Array.isArray(safeParticipants)) {
      console.warn("⚠️ participants가 배열이 아닙니다. 빈 배열을 설정합니다.");
      setParticipants([]);
      return;
    }

    // ✅ 중복 추가 방지
    if (!safeParticipants.some((p) => p.id === selectedUser.value)) {
      setParticipants([
        ...safeParticipants,
        {
          id: selectedUser.value,
          name: selectedUser.label.split(" - ")[1].split(" (")[0], // 이름 추출
          department: selectedUser.label.split(" (")[1].replace(")", ""), // 부서 추출
          participant_start_date: projectStartDate, // 프로젝트 시작일로 기본 설정
          participant_end_date: projectEndDate, // 프로젝트 종료일로 기본 설정
        },
      ]);

      // ✅ 추가된 사용자를 users 리스트에서 제거
      setUsers(users.filter((user) => user.value !== selectedUser.value));
      setSelectedUser(null);
    }
  };

  /**
   * 🔹 참여자를 제거하는 함수
   * - `participants` 목록에서 해당 참여자를 제거
   * - 제거된 사용자를 다시 사용자 목록(`users`)에 추가
   */
  const handleRemoveParticipant = (userId) => {
    if (!Array.isArray(safeParticipants)) return;

    setParticipants(safeParticipants.filter((participant) => participant.id !== userId));

    // ✅ 제거된 사용자를 다시 사용자 목록에 추가
    const removedUser = safeParticipants.find((user) => user.id === userId);
    if (removedUser) {
      setUsers([
        ...users,
        { value: removedUser.id, label: `${removedUser.id} - ${removedUser.name} (${removedUser.department})` },
      ]);
    }
  };

  /**
   * 🔹 참여자의 시작일/종료일을 변경하는 함수
   */
  const handleParticipantDateChange = (userId, field, value) => {
    setParticipants(
      safeParticipants.map((participant) =>
        participant.id === userId ? { ...participant, [field]: value } : participant
      )
    );
  };

  return (
    <div className="form-section">
      <h3>👥 프로젝트 참여자</h3>
      
      {/* ✅ 사용자 선택 및 추가 버튼 */}
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

      {/* ✅ 참여자 목록 */}
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
          <p>현재 참여자가 없습니다.</p>
        )}
      </ul>
    </div>
  );
};

export default ParticipantSelection;