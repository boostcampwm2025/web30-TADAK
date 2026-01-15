export type TestcaseStatus =
  | 'ACCEPTED'
  | 'WRONG_ANSWER'
  | 'TIME_LIMIT_EXCEEDED'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'OUTPUT_LIMIT_EXCEEDED'
  | 'RUNTIME_ERROR'
  | 'COMPILE_ERROR'
  | 'INTERNAL_ERROR';

// 각 테스트케이스 결과 전송 (실시간)
export interface TestcaseUpdateMessage {
  type: 'TESTCASE_UPDATE';
  submissionId: number;
  testcase: {
    index: number;
    status: TestcaseStatus;
    time: number;
    memory: number;
  };
  progress: {
    completed: number; // 지금까지 실행 완료된 개수
    passed: number; // 지금까지 통과한 개수
    total: number;
  };
}

// 최종 결과
export interface FinalResultMessage {
  type: 'FINAL_RESULT';
  submissionId: number;
  status: TestcaseStatus;
  result: {
    passed: number;
    total: number;
    time: number; // 최대 시간
    memory: number; // 최대 메모리
  };
}

// Pub/Sub 메시지 Union Type
export type PubSubMessage = TestcaseUpdateMessage | FinalResultMessage;
