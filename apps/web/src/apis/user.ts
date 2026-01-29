import type { TierType } from '@shared/types/user';

import { axiosInstance } from './axios';

export const api = axiosInstance;

export interface UserProfile {
  id: string;
  username: string;
  avatarUrl: string;
  currentRoomId?: string | null;
  tier: { tier: TierType; division: number };
  rating: number;
  wins: number;
  losses: number;
  draws: number;
}

export const getUserProfile = async () => {
  const response = await api.get<UserProfile>('/users/me');
  return response.data;
};
