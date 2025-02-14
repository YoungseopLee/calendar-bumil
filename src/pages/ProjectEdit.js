import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { FaEdit, FaTrash } from "react-icons/fa";
import "./ProjectDetails.css";

const ProjectEdit = () => {
  const [employees, setEmployees] = useState([]);
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [Project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(""); // 저장 메시지

  const apiUrl = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();
  const location = useLocation();

  const projectCode = new URLSearchParams(location.search).get("project_code");

  // 로그인한 사용자 정보 가져오기 (localStorage에서 가져오기)
  const user = JSON.parse(localStorage.getItem("user"));

  //필드 매핑(표시해야 할 프로젝트 요소가 추가되면 여기서 매핑해줘야 함, 그래야 표에 표시됨)
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

  // 사용자 로그인 확인
  useEffect(() => {
    fetchLoggedInUser();

    if (!user) {
      alert("로그인된 사용자 정보가 없습니다. 로그인해주세요.");
      navigate("/");
      return;
    }
  }, []);

  // 프로젝트 코드가 변경될 때 마다 fetchData 실행
  useEffect(() => {
    if (projectCode) {
      fetchProjectDetails();
    }
  }, [projectCode]);

  //project 업데이트 확인
  useEffect(() => {
    console.log("Project 업데이트됨:", Project);
  }, [Project]); // Project가 변경될 때마다 실행

  //Employee 업데이트 확인
  useEffect(() => {
    console.log("Employees 업데이트됨:", employees);
  }, [employees]); // Project가 변경될 때마다 실행

  //프로젝트 인원 표시에 필요한 인원 목록 데이터 불러오기
  useEffect(() => {
      fetchEmployees();
  }, []);

  //수정 시 프로젝트 인원 상태 표시에 필요한 인원 목록 데이터 불러오기
  useEffect(() => {
    if (loggedInUserId) {
      fetchEmployees();
    }
  }, [loggedInUserId]);

  const handleLogout = () => {
    alert("세션이 만료되었습니다. 다시 로그인해주세요.");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  //프로젝트 상세정보 받아오는 API 사용하는 함수
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
      // 응답이 { project: { ... } } 형태라면:
      console.log("project response : ", data);
      setProject(data.project);

      /*//더미데이터 삽입
      const dummyData = {
        category: "유지보수",
        status: "수행",
        project_code: "20250122_00004",
        business_start_date: "2025-01-01",
        business_end_date: "2025-12-31",
        group_name: "그룹명 A",
        project_name:
          "유지보수 인프라 대진정보통신(주) - 국가정보자원관리원 대구센터",
        customer: "대진정보통신(주)",
        supplier: "대진정보통신(주)",
        person_in_charge: "최치후 부장",
        contact_number: "054-1234-1234",
        Sales_representative: "조우성",
        project_pm: "조우성",
        project_manager: "-",
        project_participant: "조우성, 이영섭",
        business_details_and_notes: "📌 사용인장: 1번 도장",
        cchanges: "변경사항입니다",
      };
      setProject(dummyData);*/
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  //로그인 유저 확인 함수
  const fetchLoggedInUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/get_logged_in_user`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        handleLogout(); // 401 응답 시 자동 로그아웃 처리
        return;
      }

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("user", JSON.stringify(data.user)); // 최신 상태 업데이트
      } else {
        console.error("사용자 정보 불러오기 실패");
      }
    } catch (error) {
      console.error("로그인 사용자 정보 불러오기 실패:", error);
    }
  };

  //사용자 목록 데이터 가져오기(프로젝트 인원 상태 표시에 필요함)
  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${apiUrl}/user/get_users`);
      if (!response.ok)
        throw new Error("사용자 데이터를 가져오는 데 실패했습니다.");

      const data = await response.json();
      setEmployees(data.users);

      const uniqueDepartments = Array.from(
        new Set(data.users.map((emp) => emp.department))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>데이터를 불러오는 중...</p>;
  if (error) return <p>오류 발생: {error}</p>;

  // 입력값 변경 시 상태 업데이트
  const handleChange = (key, value) => {
    setProject((prevProject) => ({
      ...prevProject,
      [key]: value,
    }));
  };

  // 화면에 표시할 때만 "Thu, 27 Feb 2025 00:00:00 GMT" → "2025-02-27" 변환
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toISOString().split("T")[0];
  };


  const ParticipantsTable = ({ assignedUsersIds, employees }) => {
    if (!assignedUsersIds || assignedUsersIds.length === 0) {
      return <p>참여 인원이 없습니다.</p>;
    }
  // 참여자 ID 목록을 직원 데이터와 매칭
  const matchedParticipants = assignedUsersIds.map((userId) => {
    const employee = employees.find((emp) => emp.id === userId);
    return {
      id: userId,
      name: employee ? employee.name : "정보 없음",
      department: employee ? employee.department : "정보 없음",
      phone: employee ? employee.phone_number : "정보 없음",
      status: employee ? employee.status : "정보 없음",
    };
  });
  
    return (
      <table className="project-table">
        <thead>
          <tr>
            <th>부서</th>
            <th>이름</th>
            <th>전화번호</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {matchedParticipants.map((participant) => (
            <tr key={participant.id}>
              <td>{participant.department}</td>
              <td>{participant.name}</td>
              <td>{participant.phone}</td>
              <td>{participant.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // 수정된 데이터 저장 API 호출
  const handleSave = async () => {
    try {
      // API에서 YYYY-MM-DD를 받아서 사용하기 때문에 값을 바꿔줌
      const projectToSave = {
        ...Project,
        business_start_date: formatDate(Project.business_start_date),
        business_end_date: formatDate(Project.business_end_date) 
      };

      const response = await fetch(`${apiUrl}/project/edit_project`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(projectToSave),// 수정된 데이터를 서버에 전송
      });

      if (!response.ok) {
        throw new Error("프로젝트 업데이트 실패");
      }

      setMessage("프로젝트가 성공적으로 저장되었습니다!");
      navigate(`/project-details?project_code=${projectCode}`)

    } catch (err) {
      setMessage("저장 중 오류 발생: " + err.message);
    }
  };

  return (
    <div className="app">
      <Sidebar />
      <div className="project-container">
        <div className="edit-button-container">
          <h2 className="project-title">프로젝트 수정</h2>
        </div>
        <h3 className="section-title">🔹 사업개요</h3>

        <table className="project-table">
          <tbody>
            {Object.entries(fieldMappings).map(([key, label]) =>
              Project && Project[key] !== undefined ? (
                <tr key={key}>
                  <th>{label}</th>
                  <td>
                    {key === "project_code" ? 
                    ( // 🔹 project_code는 수정 불가능하게 표시 *html변조 공격에 취약할수도
                      <span>{Project[key]}</span>
                    ) : key === "business_start_date" || key === "business_end_date" ? (
                      // 🔹 사업 시작일 & 종료일을 달력 입력으로 변경
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

        <h3 className="section-title">🔹 인력</h3>
        
        <ParticipantsTable assignedUsersIds={Project?.assigned_user_ids?.split(",").map(Number)} employees={employees} />

        {message && <p className="message">{message}</p>}

        <button onClick={handleSave} className="edit-save-button">
          저장
        </button>
      </div>
    </div>
  );
};

export default ProjectEdit;
