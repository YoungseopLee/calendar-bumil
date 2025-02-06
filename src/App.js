import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Calendar from './pages/Calendar';
import Manager from './pages/Manager';
import AddSchedule from './pages/AddSchedule';
import Employee from './pages/Employee';
import EditSchedule from './pages/EditSchedule';
import Department_view from './pages/Department_view';
import MyPage from './pages/MyPage';
import Department_view from './pages/Department-view';

function App() {
  return (
    <Router>
      <Routes>
        {/* 로그인 페이지 */}
        <Route path="/" element={<LoginPage />} />
        {/* 회원가입 페이지 */}
        <Route path="/signup" element={<SignupPage />} />
        {/* Calendar 페이지(메인) */}
        <Route path="/calendar" element={<Calendar />} />
        {/* 일정 추가 페이지(메인) */}
        <Route path="/addschedule" element={<AddSchedule />} />
        {/* 사이드바 (메인) */}
        <Route path="/Manager" element={<Manager />} />
        {/* 사원 페이지 */}
        <Route path="/employee" element={<Employee />} />
        {/* 일정 수정 페이지 */}
        <Route path="/edit-schedule/:scheduleId" element={<EditSchedule />} />
        {/* 부서별 일정 페이지 */}
        <Route path="/department-view" element={<Department_view />} />
        {/* 마이페이지 */}
        <Route path="/mypage" element={<MyPage />} />
        {/* 부서별 일정보기 페이지 */}
        <Route path="/department-view" element={<Department_view />} />
      </Routes>
    </Router>
  );
}

export default App;
