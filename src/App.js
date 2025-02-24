import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Calendar from "./pages/Calendar";
import Manager from "./pages/Manager";
import StatusManagement from "./pages/StatusManagement";
import AddSchedule from "./pages/AddSchedule";
import Employee from "./pages/Employee";
import EditSchedule from "./pages/EditSchedule";
import MyPage from "./pages/MyPage";
import Department_view from "./pages/Department-view";
import Profile from "./pages/Profile";
import ProjectDetails from "./pages/ProjectDetails";
import ProjectPage from "./pages/ProjectPage"; // 추가
import ProjectEdit from "./pages/ProjectEdit";
import ProjectCreate from "./pages/ProjectCreate";
import ChangePWPage from "./pages/ChangePWPage";
import UserDetails from "./pages/UserDetails";
import UserRolesManagement from "./pages/UserRolesManagement";
import SituationControl from "./pages/SituationControl";

function App() {
  return (
    <Router>
      <Routes>
        {/* 로그인 페이지 */}
        <Route path="/" element={<LoginPage />} />
        {/* 회원가입 페이지 */}
        <Route path="/signup" element={<SignupPage />} />
        {/* Calendar 페이지 */}
        <Route path="/calendar" element={<Calendar />} />
        {/* 일정 추가 페이지 */}
        <Route path="/add-schedule" element={<AddSchedule />} />
        {/* 어드민 페이지 */}
        <Route path="/manager" element={<Manager />} />
        {/* 유저의 권한을 변경하는 페이지 (UserRolesManagement)*/}
        <Route path="/user-roles-management" element={<UserRolesManagement />} />
        {/* 상태 CRUD 페이지 */}
        <Route path="/status-management" element={<StatusManagement />} />
        {/* 사원 페이지 */}
        <Route path="/employee" element={<Employee />} />
        {/* 일정 수정 페이지 */}
        <Route path="/edit-schedule/:scheduleId" element={<EditSchedule />} />
        {/* 마이페이지 */}
        <Route path="/mypage" element={<MyPage />} />
        {/* 프로필 페이지 */}
        <Route path="/profile" element={<Profile />} />
        {/* 부서별 일정보기 페이지 */}
        <Route path="/department-view" element={<Department_view />} />
        {/* 프로젝트 페이지 */}
        <Route path="/projects" element={<ProjectPage />} />
        {/* 프로젝트 상세 페이지 */}
        <Route path="/project-details" element={<ProjectDetails />} />
        {/* 프로젝트 상세-수정 페이지 */}
        <Route path="/project-edit" element={<ProjectEdit />} />
        {/* 프로젝트 생성 */}
        <Route path="/add-project" element={<ProjectCreate />} />
        {/* 비밀번호 변경 페이지 */}
        <Route path="/change-pw" element={<ChangePWPage />} />
        {/* 사원원 상세 페이지 */}
        <Route path="/user-details" element={<UserDetails />} />
        {/* 현황 관리 페이지 */}
        <Route path="/SituationControl" element={<SituationControl />} />
      </Routes>
    </Router>
  );
}

export default App;
