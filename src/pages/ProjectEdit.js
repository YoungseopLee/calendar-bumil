import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Select from "react-select";
import "./ProjectDetails.css";

// date 문자열을 "YYYY-MM-DD" 형식으로 변환하는 함수
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? dateString : date.toISOString().split("T")[0];
};

const ProjectEdit = () => {
  const [employees, setEmployees] = useState([]);
  const [Project, setProject] = useState(null); // 프로젝트 정보 (project_code로 불러옴)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(""); // 저장 메시지
  const [selectedUser, setSelectedUser] = useState(null); // 추가할 유저 선택
  const [users, setUsers] = useState([]); // 참여 가능한 유저 목록

  const apiUrl = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();
  const location = useLocation();

  const projectCode = new URLSearchParams(location.search).get("project_code");

  // 로그인한 사용자 정보 (localStorage에 저장된 최신 정보)
  const user = JSON.parse(localStorage.getItem("user"));

  // 화면에 표시할 프로젝트 필드 매핑
  const fieldMappings = {
    project_code: "프로젝트 코드",
    project_name: "프로젝트 명",
    category: "카테고리",
    status: "상태",
    business_start_date: "사업 시작일",
    business_end_date: "사업 종료일",
    customer: "고객사",
    supplier: "공급 업체",
    person_in_charge: "담당자",
    contact_number: "연락처",
    sales_representative: "영업대표",
    project_pm: "수행 PM",
    changes: "비고",
  };

  // 로그인한 사용자 정보 최신화 및 체크
  useEffect(() => {
    fetchLoggedInUser();
    if (!user) {
      alert("로그인된 사용자 정보가 없습니다. 로그인해주세요.");
      navigate("/");
      return;
    }
  }, []);

  // 프로젝트 코드가 변경되면 상세정보 불러오기
  useEffect(() => {
    if (projectCode) {
      fetchProjectDetails();
    }
  }, [projectCode]);

  // employees 업데이트 확인 및 참여 가능한 유저 목록 업데이트
  useEffect(() => {
    console.log("Employees 업데이트됨:", employees);
    // 이미 할당된 유저 ID 목록(Set으로 변환)
    const assignedIds = new Set(
      Project?.assigned_user_ids
        ?.split(",")
        .map((id) => id.trim())
        .filter((id) => id !== "") || []
    );
    // employees 목록에서 이미 참여한 인원 제외
    const availableUsers = employees
      .filter((emp) => !assignedIds.has(emp.id))
      .map((emp) => ({
        value: emp.id,
        label: `${emp.id} - ${emp.name} (${emp.department})`,
      }));
    setUsers(availableUsers);
  }, [employees, Project?.assigned_user_ids]);

  // employees가 변경되면 로그 출력
  useEffect(() => {
    console.log("users 업데이트됨:", users);
  }, [users]);

  // 프로젝트 인원 표시에 필요한 employees 목록 불러오기
  useEffect(() => {
    fetchEmployees();
  }, []);

  // 로그아웃 함수
  const handleLogout = () => {
    alert("세션이 만료되었습니다. 다시 로그인해주세요.");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // 프로젝트 상세정보 API 호출
  const fetchProjectDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${apiUrl}/project/get_project_details?project_code=${projectCode}`
      );
      if (!response.ok) {
        throw new Error("프로젝트 상세정보를 불러오지 못했습니다.");
      }
      const data = await response.json();
      console.log("project response : ", data);
      setProject(data.project);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 로그인한 사용자 정보 API 호출
  const fetchLoggedInUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/auth/get_logged_in_user`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        console.error("사용자 정보 불러오기 실패");
      }
    } catch (error) {
      console.error("로그인 사용자 정보 불러오기 실패:", error);
    }
  };

  // employees 목록 API 호출
  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${apiUrl}/user/get_users`);
      if (!response.ok)
        throw new Error("사용자 데이터를 가져오는 데 실패했습니다.");
      const data = await response.json();
      setEmployees(data.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>데이터를 불러오는 중...</p>;
  if (error) return <p>오류 발생: {error}</p>;

  // 상위 필드 변경 핸들러 (프로젝트의 top-level 필드 업데이트)
  const handleChange = (key, value) => {
    setProject((prevProject) => ({
      ...prevProject,
      [key]: value,
    }));
  };

  // 참여자 날짜 업데이트 함수
  const handleParticipantDateChange = (participantId, field, value) => {
    setProject((prevProject) => ({
      ...prevProject,
      project_users: prevProject.project_users.map((participant) =>
        // participant.id를 기준으로 업데이트 (각 참여자마다 고유 ID 존재)
        participant.id === participantId
          ? { ...participant, [field]: value }
          : participant
      ),
    }));
  };

  // 참여자 제거 핸들러
  const handleRemoveParticipant = (participantId) => {
    setProject((prevProject) => {
      const updatedParticipants = prevProject.project_users.filter(
        (participant) => participant.id !== participantId
      );
      return {
        ...prevProject,
        project_users: updatedParticipants,
      };
    });
  };

  // 참여자 목록 표 컴포넌트
  const Projectuserstable = ({ project_users, employees }) => {
    if (!project_users || project_users.length === 0) {
      return <p>참여 인원이 없습니다.</p>;
    }

    // 참여자 정보 매칭
    const matchedParticipants = project_users.map((participant) => {
      const employee = employees.find(
        (emp) => emp.id.toString() === participant.user_id.toString()
      );
      return {
        id: participant.id,
        user_id: participant.user_id,
        name: employee ? employee.name : "정보 없음",
        department: employee ? employee.department : "정보 없음",
        phone: employee ? employee.phone_number : "정보 없음",
        status: employee ? employee.status : "정보 없음",
        start_date: participant.start_date,
        end_date: participant.end_date,
      };
    });

    return (
      <table className="project-table">
        <thead>
          <tr>
            <th>이름</th>
            <th>참여 시작일</th>
            <th>참여 종료일</th>
            <th>상태</th>
            <th>삭제</th>
          </tr>
        </thead>
        <tbody>
          {matchedParticipants.map((participant) => (
            <tr key={participant.id}>
              <td>{participant.name}</td>
              <td>
                <input
                  className="datebox"
                  type="date"
                  value={formatDate(participant.start_date)}
                  onChange={(e) =>
                    handleParticipantDateChange(
                      participant.id,
                      "start_date",
                      e.target.value
                    )
                  }
                />
              </td>
              <td>
                <input
                  className="datebox"
                  type="date"
                  value={formatDate(participant.end_date)}
                  onChange={(e) =>
                    handleParticipantDateChange(
                      participant.id,
                      "end_date",
                      e.target.value
                    )
                  }
                />
              </td>
              <td>{participant.status}</td>
              <td>
                <button
                  className="remove-button"
                  onClick={() => handleRemoveParticipant(participant.id)}
                >
                  ❌
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // 수정된 데이터 저장 API 호출
  const handleSave = async () => {
    try {
      // 상위 프로젝트 필드의 날짜 값은 "YYYY-MM-DD" 형식으로 변환
      const projectToSave = {
        ...Project,
        business_start_date: formatDate(Project.business_start_date),
        business_end_date: formatDate(Project.business_end_date),
        assigned_user_ids: Project.project_users.map((user) => user.user_id),
        // ✅ 'participants' 필드로 전송 (백엔드 요구사항)
        participants: Project.project_users.map((user) => ({
          user_id: user.user_id,
          start_date: user.start_date ? formatDate(user.start_date) : null,
          end_date: user.end_date ? formatDate(user.end_date) : null,
        })),
      };

      console.log("저장할 데이터:", JSON.stringify(projectToSave, null, 2));

      const response = await fetch(`${apiUrl}/project/edit_project`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(projectToSave),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Save error response:", errorData);
        throw new Error("프로젝트 업데이트 실패");
      }

      setMessage("프로젝트가 성공적으로 저장되었습니다!");
      navigate(`/project-details?project_code=${projectCode}`);
    } catch (err) {
      setMessage("저장 중 오류 발생: " + err.message);
      console.error("HandleSave error:", err);
    }
  };

  // 참여자 추가 핸들러
  const handleAddParticipant = () => {
    if (!selectedUser) {
      alert("추가할 참여자를 선택하세요.");
      return;
    }

    setProject((prevProject) => {
      const currentDate = new Date();
      const currentDateStr = currentDate.toISOString().split("T")[0];

      // 기존 project_users 배열 복사
      const updatedParticipants = [...prevProject.project_users];

      // 선택한 사용자 정보 찾기
      const newParticipant = employees.find(
        (emp) => emp.id === selectedUser.value
      );
      if (!newParticipant) {
        alert("선택한 사용자를 찾을 수 없습니다.");
        return prevProject;
      }

      // 중복 체크 후 추가
      if (
        !updatedParticipants.some((user) => user.user_id === newParticipant.id)
      ) {
        updatedParticipants.push({
          ...newParticipant,
          user_id: newParticipant.id,
          start_date: Project.business_start_date,
          end_date: Project.business_end_date,
        });
      } else {
        alert("이미 추가되어있습니다.");
      }

      return {
        ...prevProject,
        project_users: updatedParticipants,
      };
    });

    setSelectedUser(null);
  };

  // 프로젝트 삭제 핸들러
  const deleteProject = async (project_code) => {
    const confirmDelete = window.confirm(
      "정말로 이 프로젝트를 삭제하시겠습니까?"
    );
    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `${apiUrl}/project/delete_project/${project_code}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("프로젝트 삭제 실패");
      }

      const data = await response.json();
      console.log(data.message);
      alert(data.message);
      navigate("/projects");
    } catch (err) {
      console.error("Error:", err);
      alert("프로젝트 삭제에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div className="app">
      <Sidebar />
      <div className="project-container">
        <div className="edit-button-container">
          <h2 className="project-title">프로젝트 상세정보(품의서)</h2>
          <button
            onClick={() => navigate("/projects")}
            className="project-list-button"
          >
            목록
          </button>
        </div>
        <div className="edit-button-container">
          <h3 className="section-title">🔹 사업개요</h3>
        </div>

        <table className="project-table">
          <tbody>
            {Object.entries(fieldMappings).map(([key, label]) =>
              Project && Project[key] !== undefined ? (
                <tr key={key}>
                  <th>{label}</th>
                  <td>
                    {key === "project_code" ? (
                      <span>{Project[key]}</span>
                    ) : key === "business_start_date" ||
                      key === "business_end_date" ? (
                      <input
                        className="datebox"
                        type="date"
                        value={formatDate(Project[key])}
                        onChange={(e) => handleChange(key, e.target.value)}
                      />
                    ) : (
                      <textarea
                        value={Project[key]}
                        onChange={(e) => handleChange(key, e.target.value)}
                        rows="4"
                      />
                    )}
                  </td>
                </tr>
              ) : null
            )}
          </tbody>
        </table>

        <h3 className="section-title">🔹 인력&nbsp;&nbsp;&nbsp;</h3>
        <Projectuserstable
          project_users={Project?.project_users}
          employees={employees}
        />

        <div className="form-section">
          <h3>👥 프로젝트 참여자 추가</h3>
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
            <button
              type="button"
              className="add-button"
              onClick={handleAddParticipant}
            >
              +
            </button>
          </div>
        </div>

        {message && <p className="message">{message}</p>}

        <button onClick={handleSave} className="edit-save-button">
          저장
        </button>
        <button
          type="button"
          className="edit-cancel-button"
          onClick={() =>
            navigate(`/project-details?project_code=${Project.project_code}`)
          }
        >
          취소
        </button>
        <button
          className="edit-delete-button"
          onClick={() => deleteProject(Project.project_code)}
          disabled={loading}
        >
          {loading ? "삭제 중..." : "프로젝트 삭제"}
        </button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    </div>
  );
};

export default ProjectEdit;
