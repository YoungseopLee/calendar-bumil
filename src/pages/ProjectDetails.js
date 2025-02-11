import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { FaEdit, FaTrash } from "react-icons/fa";
import "./ProjectDetails.css";

const ProjectDetails = () => {
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

  useEffect(() => {
    fetchLoggedInUser();

    if (!user) {
      alert("로그인된 사용자 정보가 없습니다. 로그인해주세요.");
      navigate("/");
      return;
    }
  }, []);

  useEffect(() => {
    if (projectCode) {
      fetchData();
    }
  }, [projectCode]); // 프로젝트 코드가 변경될 때마다 fetchData 실행


  //prject 업데이트 확인
  useEffect(() => {
    console.log("Project 업데이트됨:", Project);
  }, [Project]); // Project가 변경될 때마다 실행
  

  useEffect(() => {
    if (loggedInUserId) {
      fetchEmployees();
    }
  }, [loggedInUserId]);

  const fetchData = async () => {
    setLoading(true); // 로딩 시작
    try {
      // 프로젝트 정보 가져오기
      /*const projectResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/project`
      );
      if (!projectResponse.ok)
        throw new Error("프로젝트 정보를 불러오지 못했습니다.");
      const projectData = await projectResponse.json();*/

      const dummyData = {
        Category: "유지보수",
        Status: "수행",
        Project_Code: "20250122_00004",
        Business_Start_Date: "2025-01-01",
        Business_End_Date: "2025-12-31",
        Project_Name: "유지보수 인프라 대진정보통신(주) - 국가정보자원관리원 대구센터",
        Customer: "대진정보통신(주)",
        Supplier: "대진정보통신(주)",
        Person_in_Charge: "최치후 부장",
        Contact_Number: "054-1234-1234",
        Expected_Invoice_Date: "2025-01-01",
        Expected_Payment_Date: "2025-01-01",
        Sales_Representative: "홍**",
        Project_PM: "최**",
        Project_Manager: "-",
        Project_Participant: "조**, 김**",
        Business_Details_and_Notes: "📌 사용인장: 1번 도장",
        Changes: "-",
      };

      //setProject(projectData);
      setProject(dummyData);
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

  return (
    <div className="app">
      <Sidebar />
      <div className="project-container">
        <h2 className="project-title">프로젝트 상세정보(품의서)</h2>
        <h3 className="section-title">🔹 사업개요</h3>

        <table className="project-table">
          <tbody>
            <tr>
              <th>구분</th>
              <td>{Project?.Category}</td>
            </tr>
            <tr>
              <th>진행 상황</th>
              <td>{Project?.Status}</td>
            </tr>
            <tr>
              <th>프로젝트 코드</th>
              <td>{Project?.Project_Code}</td>
            </tr>
            <tr>
              <th>사업기간</th>
              <td>{Project?.Business_Start_Date} ~ {Project?.Business_End_Date}</td>
            </tr>
            <tr>
              <th>프로젝트 명</th>
              <td>{Project?.Project_Name}</td>
            </tr>
            <tr>
              <th>매출처</th>
              <td>{Project?.Customer}</td>
            </tr>
            <tr>
              <th>납품처</th>
              <td>{Project?.Supplier}</td>
            </tr>
            <tr>
              <th>담당자</th>
              <td>{Project?.Person_in_Charge}</td>
            </tr>
            <tr>
              <th>연락처</th>
              <td>{Project?.Contact_Number}</td>
            </tr>
            <tr>
              <th>청구예정일</th>
              <td>{Project?.Expected_Invoice_Date}</td>
            </tr>
            <tr>
              <th>수금예정일</th>
              <td>{Project?.Expected_Payment_Date}</td>
            </tr>
            <tr>
              <th>영업대표</th>
              <td>{Project?.Sales_Representative}</td>
            </tr>
            <tr>
              <th>수행PM</th>
              <td>{Project?.Project_PM}</td>
            </tr>
            <tr>
              <th>프로젝트 관리자</th>
              <td>{Project?.Project_Manager}</td>
            </tr>
            <tr>
              <th>프로젝트 참여자</th>
              <td>{Project?.Project_Participant}</td>
            </tr>
            <tr>
              <th>사업내용 및 특이사항</th>
              <td>{Project?.Business_Details_and_Notes}</td>
            </tr>
            <tr>
              <th>변경사항</th>
              <td>{Project?.Changes}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default ProjectDetails;
