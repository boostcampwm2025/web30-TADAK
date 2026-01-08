import type { Battle } from '@shared/types/battle';

import { axiosInstance } from './axios';

// 활성 배틀 목록 조회 API
export const getActiveBattles = async (): Promise<Battle[]> => {
  const response = await axiosInstance.get('/battles');
  return response.data;
};
