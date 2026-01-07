import type { MatchingCancelRequest, MatchingStartRequest } from '@shared/types/matching';

import { axiosInstance } from './axios';

// 매칭 시작 API
// @param payload - userId와 socketId
export const startMatching = async (payload: MatchingStartRequest) => {
  const response = await axiosInstance.post('/api/matching/join', payload);
  return response.data;
};

// 매칭 취소 API
// @param payload - userId
export const cancelMatching = async (payload: MatchingCancelRequest) => {
  const response = await axiosInstance.post('/api/matching/cancel', payload);
  return response.data;
};
