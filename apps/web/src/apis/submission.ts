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
