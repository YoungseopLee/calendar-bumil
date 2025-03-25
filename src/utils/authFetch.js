export const authFetch = async (url, options = {}) => {
  let accessToken = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");

  let response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${accessToken}`,
      "X-Refresh-Token": refreshToken,
    },
  });

  // 응답 헤더에 새 토큰이 있으면 바로 저장
  const newAccessTokenFromHeader = response.headers.get("X-New-Access-Token");
  if (newAccessTokenFromHeader) {
    // console.log("서버에서 새로운 액세스 토큰을 헤더로 제공함.");
    localStorage.setItem("access_token", newAccessTokenFromHeader);
  }

  if (response.status === 401) {
    const newAccessToken = await refreshAccessTokenFunc();
    if (newAccessToken) {
      accessToken = newAccessToken;

      response = await fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${accessToken}`,
          "X-Refresh-Token": refreshToken,
        },
      });
    } else {
      logoutFunc();
    }
  }

  return response;
};

// Refresh Token을 사용해 새로운 Access Token 요청
export const refreshAccessTokenFunc = async () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const refreshToken = localStorage.getItem("refresh_token");

  if (!refreshToken) {
    // console.warn("Refresh Token 만료됨! 다시 로그인 필요");
    return null;
  }

  try {
    // console.log("Refresh Token을 사용해 Access Token 갱신 요청...");
    const response = await fetch(`${apiUrl}/auth/refresh_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Refresh-Token": refreshToken,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      // console.error("Refresh Token 만료! 다시 로그인 필요");
      return null;
    }

    const newAccessTokenFromHeader = response.headers.get("X-New-Access-Token");
    if (newAccessTokenFromHeader) {
      localStorage.setItem("access_token", newAccessTokenFromHeader);
      return newAccessTokenFromHeader;
    }

    const data = await response.json();
    if (data.access_token) {
      localStorage.setItem("access_token", data.access_token);
      return data.access_token;
    }

    return null;
  } catch (error) {
    // console.error("Refresh Token 오류:", error);
    return null;
  }
};

// 강제 로그아웃 함수
export const logoutFunc = () => {
  // console.warn("로그아웃 실행됨: 토큰 삭제 및 리디렉트");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  window.location.href = "/"; // 강제 로그아웃
};
