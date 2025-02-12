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

  const apiUrl = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();
  const location = useLocation();

  const projectCode = new URLSearchParams(location.search).get("project_code");

  // 로그인한 사용자 정보 가져오기 (localStorage에서 가져오기)
  const user = JSON.parse(localStorage.getItem("user"));

  //필드 매핑(프로젝트 요소가 추가되면 여기서 매핑해줘야 함)
  const fieldMappings = {
    Category: "구분",
    Status: "진행 상황",
    Project_Code: "프로젝트 코드",
    Business_Start_Date: "사업 시작일",
    Business_End_Date: "사업 종료일",
    Group_Name: "그룹 명",
    Project_Name: "프로젝트 명",
    Customer: "매출처",
    Supplier: "납품처",
    Person_in_Charge: "담당자",
    Contact_Number: "연락처",
    Expected_Invoice_Date: "청구 예정일",
    Expected_Payment_Date: "수금 예정일",
    Sales_Representative: "영업대표",
    Project_PM: "수행 PM",
    Project_Manager: "프로젝트 관리자",
    Project_Participant: "프로젝트 참여자",
    Business_Details_and_Notes: "사업 내용 및 특이사항",
    Changes: "변경사항"
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
      fetchData();
    }
  }, [projectCode]);


  //prject 업데이트 확인
  useEffect(() => {
    console.log("Project 업데이트됨:", Project);
  }, [Project]); // Project가 변경될 때마다 실행
  
  //수정 시 프로젝트 인원 상태 표시에 필요한 인원 목록 데이터 불러오기
  useEffect(() => {
    if (loggedInUserId) {
      fetchEmployees();
    }
  }, [loggedInUserId]);

  const fetchData = async () => {
    setLoading(true); // 로딩 시작
    try {
      const response = await fetch(
        `${apiUrl}/project/get_project_details?project_code=${projectCode}`
      );
      if (!response.ok) {
        throw new Error("프로젝트 상세정보를 불러오지 못했습니다.");
      }
      const data = await response.json();

      setProject(data);

    } catch (error) {
      console.error("데이터 로딩 오류:", error);
      setError(error.message);
    } finally {
      setLoading(false); // 로딩 종료
    }
  };

  //로그인 유저 확인 함수
  const fetchLoggedInUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("사용자 인증 정보가 없습니다.");

      const response = await fetch(`${apiUrl}/auth/get_logged_in_user`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok)
        throw new Error("로그인 사용자 정보를 가져오는 데 실패했습니다.");
        
      const data = await response.json();
      setLoggedInUserId(data.user.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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

  const handleEditClick = () =>{
    navigate("/project-edit");
  }

  const ProjectTable = ({ data }) => {
    return (
      <table className="project-table">
        <tbody>
          {Object.entries(data).map(([key, value]) => (
            <tr key={key}>
              <th>{fieldMappings[key] || key}</th>
              <td>{value}</td>
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
          <button onClick={handleEditClick} className="EditProjectButton">
            프로젝트 수정
          </button>
        </div>
        <h3 className="section-title">🔹 사업개요</h3>

        <ProjectTable data={Project} />

        <h3 className="section-title">🔹 인력</h3>
        <table className="project-table">
          <tbody>
            <tr>
              <th>이름</th>
              <td>{Project?.Project_Participant}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectEdit;
