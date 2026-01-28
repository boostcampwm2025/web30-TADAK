import { axiosInstance } from './axios';

export const api = axiosInstance;

export interface UserProfile {
  id: string;
  username: string;
  avatarUrl: string;
  currentRoomId?: string | null;
}

export const getUserProfile = async () => {
  const response = await api.get<UserProfile>('/users/me');
  return response.data;
};
