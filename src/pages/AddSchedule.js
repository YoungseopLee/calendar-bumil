import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './AddSchedule.css';

const API_URL = process.env.REACT_APP_API_URL;

const AddSchedule = () => {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [newTask, setNewTask] = useState("");
    const [status, setStatus] = useState("준비 중");
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.state && location.state.selectedDate) {
            const date = location.state.selectedDate;
            const formattedDate = formatDateForInput(date);
            setStartDate(formattedDate);
            setEndDate(formattedDate);
        }
    }, [location.state]);

    const formatDateForInput = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}년 ${month}월 ${day}일`;
    };

    // 날짜를 YYYY-MM-DD 형식으로 변환하고 하루를 뺍니다.
    const adjustDate = (dateString) => {
        const date = new Date(dateString);
        date.setDate(date.getDate() - 1); // 데이터베이스에 저장하기 전에 하루를 뺍니다.
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleAddTask = async () => {
        if (newTask.trim() && startDate && endDate) {
            setLoading(true);
            setError("");

            // `localStorage`에서 `user` 정보를 가져옵니다.
            const user = JSON.parse(localStorage.getItem('user'));
            const token = localStorage.getItem('token');

            if (!user || !token) {
                alert('로그인 상태가 아닙니다.');
                setLoading(false);
                return;
            }

            const task = {
                start: adjustDate(startDate),
                end: adjustDate(endDate),
                task: newTask,
                status,
                user_id: user.id // 로그인된 사용자 ID
            };

            try {
                const response = await axios.post(
                    `${API_URL}/api/add-schedule`, 
                    task, 
                    {
                        headers: {
                            Authorization: `Bearer ${token}` // Authorization 헤더에 JWT 토큰 포함
                        }
                    }
                );

                if (response.status === 200) {
                    const addedTask = response.data;  // 서버에서 반환된 추가된 일정
                    setTasks((prevTasks) => [...prevTasks, addedTask]);
                    setNewTask("");
                    setLoading(false);
                    alert('할 일이 추가되었습니다!');
                    navigate("/calendar");
                }
            } catch (err) {
                setError('할 일을 추가하는 데 실패했습니다.');
                setLoading(false);
                console.error("Error adding schedule:", err);
            }
        } else {
            alert('모든 필드를 채워주세요.');
        }
    };

    const handleBack = () => {
        navigate("/calendar");
    };

    return (
        <div className='add-schedule-body'>
            <div className="add-schedule-page">
                <div className="add-schedule">
                    <h1 className="add-schedule__title">사원 일정 관리 추가</h1>

                    <div className="add-schedule__date-container">
                        <div className="add-schedule__date-field">
                            <label htmlFor="start-date" className="add-schedule__date-label">시작 날짜</label>
                            <input
                                type="date"
                                id="start-date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="add-schedule__date-input"
                            />
                        </div>
                        <div className="add-schedule__date-field">
                            <label htmlFor="end-date" className="add-schedule__date-label">종료 날짜</label>
                            <input
                                type="date"
                                id="end-date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="add-schedule__date-input"
                            />
                        </div>
                    </div>

                    <div className="add-schedule__todo-container">
                        <h2 className="add-schedule__todo-title">계획 입력</h2>
                        <div className="add-schedule__todo-fields">
                            <input
                                type="text"
                                id="new-task"
                                value={newTask}
                                onChange={(e) => setNewTask(e.target.value)}
                                placeholder="새로운 할 일을 입력하세요"
                                className="add-schedule__todo-input"
                            />
                            <div className="add-schedule__status-container">
                                <label htmlFor="status" className="add-schedule__status-label"></label>
                                <select
                                    id="status"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="add-schedule__select"
                                    style={{ width: '40%' }} 
                                >
                                    <option value="준비 중">준비 중</option>
                                    <option value="진행 중">진행 중</option>
                                    <option value="완료">완료</option>
                                </select>
                            </div>
                        </div>

                        <div className="add-schedule__button-container">
                            <button onClick={handleAddTask} className="add-schedule__button">
                                {loading ? '로딩 중...' : '추가하기'}
                            </button>
                            <button onClick={handleBack} className="add-schedule__button add-schedule__button--back">
                                돌아가기
                            </button>
                        </div>

                        {error && <div className="add-schedule__error-message">{error}</div>}
                    </div>

                    <div className="add-schedule__todo-list">
                        <ul>
                            {tasks.map((task, index) => (
                                <li key={index} className="add-schedule__todo-item">
                                    <strong>{formatDate(task.start)} ~ {formatDate(task.end)}:</strong> {task.task} <em>({task.status})</em>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddSchedule;
