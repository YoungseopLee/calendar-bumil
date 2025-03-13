import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const useAuth = (requiredRole = null) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // 사용자 정보를 가져오는 함수 (다른 컴포넌트에서 사용)
  const getUserInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/auth/get_logged_in_user`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("세션이 만료되었습니다.");
        }
        throw new Error("사용자 정보를 가져오는데 실패했습니다.");
      }

      const data = await response.json();
      console.log("useAuth/로그인한 사용자 정보: ", data.user);
      return data.user;

    } catch (error) {
      console.error("사용자 정보 조회 실패:", error);
      handleLogout();
      return null;
    }
  };

  // 초기 인증 체크
  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("로그인이 필요합니다.");
      }

      const user = await getUserInfo();
      if (!user) {
        throw new Error("사용자 정보를 가져올 수 없습니다.");
      }

      // 권한 체크
      if (requiredRole && user.role_id !== requiredRole) {
        throw new Error("접근 권한이 없습니다.");
      }

      setLoading(false);

    } catch (error) {
      setError(error.message);
      alert(error.message);
      handleLogout();
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return { loading, error, handleLogout, getUserInfo };
};