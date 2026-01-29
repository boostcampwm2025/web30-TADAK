export type SubmissionJobType = 'SUBMISSION' | 'TEST';

export interface SubmissionJobPayload {
  submissionId: string;
  problemId: string;
  code: string;
  language: string;
  type: SubmissionJobType;
  userId?: string;
  battleId?: string;
  socketId?: string;
}

export function parseSubmissionJobPayload(payload: unknown): SubmissionJobPayload {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Job payload must be an object.');
  }

  const data = payload as Record<string, unknown>;
  const type = parseJobType(data.type);
  const problemId = parseNonEmptyString(data.problemId, 'problemId');
  const submissionId = parseNonEmptyString(data.submissionId, 'submissionId');
  const code = parseNonEmptyString(data.code, 'code');
  const language = parseNonEmptyString(data.language, 'language');

  return {
    submissionId,
    problemId,
    code,
    language,
    type,
    userId: parseOptionalString(data.userId, 'userId'),
    battleId: parseOptionalString(data.battleId, 'battleId'),
    socketId: parseOptionalString(data.socketId, 'socketId'),
  };
}

function parseJobType(value: unknown): SubmissionJobType {
  if (value !== 'SUBMISSION' && value !== 'TEST') {
    throw new Error('"type" must be either "SUBMISSION" or "TEST".');
  }

  return value;
}

function parseNonEmptyString(value: unknown, field: string): string {
  // 숫자인 경우 문자열로 변환
  const normalizedValue = typeof value === 'number' ? String(value) : value;

  if (typeof normalizedValue !== 'string' || normalizedValue.trim().length === 0) {
    throw new Error(`"${field}" must be a non-empty string or a number.`);
  }

  return normalizedValue;
}

function parseOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`"${field}" must be a non-empty string if provided.`);
  }

  return value;
}
