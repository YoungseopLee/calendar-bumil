import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { FaEdit, FaTrash } from "react-icons/fa";
import "./ProjectDetails.css";

const ProjectDetails = () => {
  const [employees, setEmployees] = useState([]);
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [Project, setProject] = useState(null); // 이 페이지에 표시할 프로젝트 정보(projectCode로 불러옴)
  const [loading, setLoading] = useState(true); // 로딩 상태 표시
  const [error, setError] = useState(null); // 에러 메시지

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

  // 프로젝트 코드가 변경될 때 마다 fetchProjectDetails실행
  useEffect(() => {
    if (projectCode) {
      fetchProjectDetails();
    }
  }, [projectCode]);

  //Employee 업데이트 확인
  useEffect(() => {
    console.log("Employees 업데이트됨:", employees);
  }, [employees]); // Project가 변경될 때마다 실행

  //프로젝트 인원 상태 표시에 필요한 인원 목록 데이터 불러오기
  useEffect(() => {
    fetchEmployees();
  }, []);

  //로그아웃 처리 함수
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

      //더미데이터 삽입
      /*
      const dummyData = {
        category: "유지보수",
        status: "수행",
        project_code: "20250122_00004",
        business_start_date: "Wed, 1 Jan 2025 00:00:00 GMT",
        business_end_date: "Wed, 31 Dec 2025 00:00:00 GMT",
        group_name: "그룹명 A",
        project_name:
          "유지보수 인프라 대진정보통신(주) - 국가정보자원관리원 대구센터",
        customer: "대진정보통신(주)",
        supplier: "대진정보통신(주)",
        person_in_charge: "최치후 부장",
        contact_number: "054-1234-1234",
        sales_representative: "조우성",
        project_pm: "조우성",
        project_manager: "-",
        project_participant: "조우성, 이영섭",
        business_details_and_notes: "📌 사용인장: 1번 도장",
        changes: "변경사항입니다",
      };
      setProject(dummyData);
      */
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
      console.log("fetchEmployees");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>데이터를 불러오는 중...</p>;
  if (error) return <p>오류 발생: {error}</p>;

  const handleEditClick = () => {
    navigate(`/project-edit?project_code=${projectCode}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date)) return dateString; // 날짜가 아니면 변환하지 않음
    return date.toISOString().split("T")[0]; // 'YYYY-MM-DD' 형식으로 변환
  };

  const ProjectTable = ({ project }) => {
    return (
      <table className="project-table">
        <tbody>
          {Object.entries(fieldMappings) // 필드 매핑 순서대로 반복
            .filter(([key]) => key in project) // 필드 매핑에 있는 요소만 표시
            .map(([key, label]) => (
              <tr key={key}>
                <th>{label}</th>
                <td>
                  {
                    ["date", "ed_at"].some((substr) => key.includes(substr))
                      ? formatDate(project[key])
                      : project[key]
                    /*date, at을 포함하면 formatDate를 실행하여 YYYY-MM-DD로 변환함*/
                  }
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    );
  };

  const ParticipantsTable = ({ assignedUsersIds, employees }) => {
    if (
      !assignedUsersIds ||
      (Array.isArray(assignedUsersIds) && assignedUsersIds.length === 0)
    ) {
      return <p>참여 인원이 없습니다.</p>;
    }

    // assignedUsersIds가 배열이면 그대로 사용, 문자열이면 split 처리
    const participantIds = Array.isArray(assignedUsersIds)
      ? assignedUsersIds
      : assignedUsersIds.split(",").filter((id) => id.trim() !== "");

    const matchedParticipants = participantIds.map((userId) => {
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
            <th>삭제</th>
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

  return (
    <div className="app">
      <Sidebar />
      <div className="project-container">
        <div className="edit-button-container">
          <h2 className="project-title">프로젝트 상세정보(품의서)</h2>
          {user.roleId != "USR_GENERAL" && ( //로그인 유저의 roleId를 보고 수정 버튼 표시 판정
            <button onClick={handleEditClick} className="EditProjectButton">
              프로젝트 수정
            </button>
          )}
        </div>
        <h3 className="section-title">🔹 사업개요</h3>

        {Project ? (
          <ProjectTable project={Project} />
        ) : (
          <p>데이터를 불러오는 중...</p>
        )}

        <h3 className="section-title">🔹 인력</h3>
        <ParticipantsTable
          assignedUsersIds={Project?.assigned_user_ids
            ?.split(",")
            .filter((id) => id.trim() !== "")}
          employees={employees}
        />
      </div>
    </div>
  );
};
export default ProjectDetails;
