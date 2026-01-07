import { axiosInstance } from './axios';

export const api = axiosInstance;

export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } finally {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  }
};
