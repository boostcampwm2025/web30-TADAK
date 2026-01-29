import type { SubmissionDetail } from '@shared/types/submission';
import type { SubmissionHistoryItem } from '@shared/types/user';

import { axiosInstance } from './axios';

export type SubmissionRequest = {
  problemId: string;
  code: string;
  language: string;
  battleId?: string;
};

export type SubmissionResponse = {
  submissionId: string | number;
  status: string;
  message?: string;
};

export const createSubmission = async (payload: SubmissionRequest, socketId: string) => {
  const response = await axiosInstance.post<SubmissionResponse>('/submissions', payload, {
    headers: {
      'x-socket-id': socketId,
    },
  });
  return response.data;
};

export const createDryRun = async (payload: SubmissionRequest, socketId: string) => {
  const response = await axiosInstance.post<SubmissionResponse | void>(
    '/submissions/dry-run',
    payload,
    {
      headers: {
        'x-socket-id': socketId,
      },
    },
  );
  return response.data;
};

export const getMySubmissions = async () => {
  const response = await axiosInstance.get<SubmissionHistoryItem[]>('/users/me/submissions');
  return response.data;
};

export const getSubmissionDetail = async (submissionId: string) => {
  const response = await axiosInstance.get<SubmissionDetail>(`/submissions/${submissionId}`);
  return response.data;
};
