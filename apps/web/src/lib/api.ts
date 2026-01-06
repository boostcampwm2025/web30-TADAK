const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const refreshAccessToken = async () => {
  // HttpOnly Cookie를 사용하므로 credentials: 'include' 옵션을 통해 쿠키를 자동으로 전송
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include', // 쿠키 전송을 위해 필수
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();
  return data.accessToken as string;
};

export const logout = async () => {
  try {
    await fetchWithAuth(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
    });
  } finally {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  }
};

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('accessToken');
  const headers = {
    ...options.headers,
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    try {
      // 401 발생 시 토큰 갱신 시도
      const newAccessToken = await refreshAccessToken();

      // 갱신 성공 시 스토리지 업데이트 (AccessToken만)
      localStorage.setItem('accessToken', newAccessToken);

      // 새로운 토큰으로 헤더 재설정 후 요청 재시도
      const newHeaders = {
        ...options.headers,
        Authorization: `Bearer ${newAccessToken}`,
        'Content-Type': 'application/json',
      };

      response = await fetch(url, { ...options, headers: newHeaders });

      // 재시도 요청도 실패하면 에러 페이지로 이동 (무한 루프 방지)
      if (response.status === 401) {
        window.location.href = '/error';
      }
    } catch {
      // 토큰 갱신 실패 (리프레시 토큰 만료 등) 시 에러 페이지로 이동
      // 스토리지 비우기 등 추가 처리가 필요할 수 있음
      localStorage.removeItem('accessToken');
      // Cookie는 클라이언트에서 지울 수 없으므로 서버 로그아웃 필요 (추후 구현)
      window.location.href = '/error';
    }
  }

  return response;
};
