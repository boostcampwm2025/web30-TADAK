import type { BattleResultResponse } from '@shared/types/battle';
import type { BattleHistoryItem } from '@shared/types/user';

import { axiosInstance } from './axios';

// 배틀 결과 조회 API
export const getBattleResult = async (battleId: string) => {
  const response = await axiosInstance.get<BattleResultResponse>(`/battles/${battleId}/result`);
  return response.data;
};

export const getMyBattles = async () => {
  const response = await axiosInstance.get<BattleHistoryItem[]>('/users/me/battles');
  return response.data;
};
