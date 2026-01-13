export type SubmissionJobType = 'SUBMISSION' | 'TEST';

export interface SubmissionJobPayload {
  submissionId: number | null;
  problemId: number;
  code: string;
  language: string;
  type: SubmissionJobType;
  userId?: string;
  socketId?: string;
}

export function parseSubmissionJobPayload(payload: unknown): SubmissionJobPayload {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Job payload must be an object.');
  }

  const data = payload as Record<string, unknown>;
  const type = parseJobType(data.type);
  const problemId = parsePositiveNumber(data.problemId, 'problemId');
  const code = parseNonEmptyString(data.code, 'code');
  const language = parseNonEmptyString(data.language, 'language');
  const submissionId = parseNullableNumber(data.submissionId, 'submissionId');

  if (type === 'SUBMISSION' && submissionId === null) {
    throw new Error('"submissionId" is required for SUBMISSION jobs.');
  }

  return {
    submissionId,
    problemId,
    code,
    language,
    type,
    userId: parseOptionalString(data.userId, 'userId'),
    socketId: parseOptionalString(data.socketId, 'socketId'),
  };
}

function parseJobType(value: unknown): SubmissionJobType {
  if (value !== 'SUBMISSION' && value !== 'TEST') {
    throw new Error('"type" must be either "SUBMISSION" or "TEST".');
  }

  return value;
}

function parsePositiveNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error(`"${field}" must be a positive number.`);
  }

  return value;
}

function parseNullableNumber(value: unknown, field: string): number | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error(`"${field}" must be a positive number or null.`);
  }

  return value;
}

function parseNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`"${field}" must be a non-empty string.`);
  }

  return value;
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
