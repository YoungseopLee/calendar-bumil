export const authFetch = async (url, options = {}) => {
  let accessToken = localStorage.getItem("access_token");

  let response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${accessToken}`,
    },
  });

  // 서버가 새 access token을 헤더로 내려주면 업데이트
  const newAccessTokenFromHeader = response.headers.get("X-New-Access-Token");
  if (newAccessTokenFromHeader) {
    localStorage.setItem("access_token", newAccessTokenFromHeader);
  }

  // 만약 401이 반환되면 => 이미 토큰 검증 실패거나 refresh 만료
  if (response.status === 401) {
    logoutFunc(); // 바로 로그아웃 시키고 리다이렉트
  }

  return response;
};

// 강제 로그아웃 함수
export const logoutFunc = async () => {
  const accessToken = localStorage.getItem("access_token");

  if (accessToken) {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      console.error("로그아웃 API 호출 중 오류:", error);
    }
  }

// accessToken만 제거
localStorage.removeItem("access_token");

// sessionStorage에서 필요한 항목만 제거 (예: 세션 만료 후 제거)
sessionStorage.clear();

// 리다이렉트
window.location.replace("/");
};
