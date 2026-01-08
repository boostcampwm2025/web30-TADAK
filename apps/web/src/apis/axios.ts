import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Axios Instance 생성
export const axiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true, // HttpOnly Cookie 전송을 위해 필수 (백엔드 credentials: true 필요)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  },
);

// Queue for concurrent refresh requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401 Unauthorized 발생 시 처리
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 이미 갱신 중이라면 큐에 넣고 대기
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              // 갱신이 끝나고 내 차례가 오면, 새 토큰으로 요청 재시도
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true; // 첫번째 에러가 Refresh Token 갱신 중임을 표시

      try {
        /** Refresh Token으로 Access Token 재발급 요청
        순환 참조 방지를 위해 axiosInstance 대신 별도 호출 혹은 fetch 사용
        여기선 credential 포함을 위해 fetch 사용
        */
        const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (!refreshResponse.ok) {
          throw new Error('Refresh failed');
        }

        const data = await refreshResponse.json();
        const newAccessToken = data.accessToken;

        localStorage.setItem('accessToken', newAccessToken);
        // 앞으로 보낼 모든 새로운 요청에 대해 토큰 설정
        axiosInstance.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

        // [큐 처리] 새로운 토큰으로 큐에 대기 중인 요청들 처리
        processQueue(null, newAccessToken);

        // [재시도] 첫 번째 요청도 새 토큰으로 다시 시도
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // [에러 처리] 갱신 실패 시 큐 정리 및 로그아웃
        processQueue(refreshError as Error, null);

        // 로그아웃 처리
        await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST' });
        localStorage.removeItem('accessToken');
        window.location.href = '/login';

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
