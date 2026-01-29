import * as fs from 'fs';
import * as path from 'path';

import { JudgeReader } from '../../src/judge/judge.reader';

jest.mock('fs');

describe('JudgeReader - 파일 읽기', () => {
  let reader: JudgeReader;
  const mockFs = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    reader = new JudgeReader();
    jest.clearAllMocks();
  });

  describe('readMetadata', () => {
    it('메타데이터 파일을 정상적으로 읽어야 한다', () => {
      const submissionId = 'test-submission-1';
      const metadata = {
        problemId: '1',
        timeLimit: 1000,
        memoryLimit: 256,
        type: 'SUBMISSION' as const,
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(metadata));

      const result = reader.readMetadata(submissionId);

      expect(result).toEqual(metadata);
      expect(mockFs.existsSync).toHaveBeenCalledWith(
        expect.stringContaining(path.join('submissions', submissionId, 'meta.json')),
      );
    });

    it('메타데이터 파일이 없으면 에러를 던져야 한다', () => {
      const submissionId = 'invalid-submission';
      mockFs.existsSync.mockReturnValue(false);

      expect(() => reader.readMetadata(submissionId)).toThrow(
        `Metadata file not found for submission ${submissionId}`,
      );
    });
  });

  describe('loadTestcases', () => {
    it('SUBMISSION 타입의 테스트케이스를 로드해야 한다', () => {
      const problemId = '1';
      const testcases = [
        { id: 1, input: '1 2', output: '3' },
        { id: 2, input: '2 3', output: '5' },
      ];

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(testcases));

      const result = reader.loadTestcases(problemId, 'SUBMISSION');

      expect(result).toEqual(testcases);
      expect(mockFs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining(path.join('problems', problemId, 'submission.json')),
        'utf8',
      );
    });

    it('TEST 타입의 테스트케이스를 로드해야 한다', () => {
      const problemId = '2';
      const testcases = [{ id: 1, input: '5 5', output: '10' }];

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(testcases));

      const result = reader.loadTestcases(problemId, 'TEST');

      expect(result).toEqual(testcases);
      expect(mockFs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining(path.join('problems', problemId, 'test.json')),
        'utf8',
      );
    });

    it('testcases 필드를 가진 객체 형식을 처리해야 한다', () => {
      const problemId = '4';
      const data = {
        testcases: [
          { id: 1, input: '1', output: '1' },
          { id: 2, input: '2', output: '2' },
        ],
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(data));

      const result = reader.loadTestcases(problemId, 'SUBMISSION');

      expect(result).toEqual(data.testcases);
    });

    it('테스트케이스 파일이 없으면 에러를 던져야 한다', () => {
      const problemId = '999';
      mockFs.existsSync.mockReturnValue(false);

      expect(() => reader.loadTestcases(problemId, 'SUBMISSION')).toThrow(
        `Testcase file not found for problem ${problemId}`,
      );
    });
  });

  describe('hasOutputFile', () => {
    it('출력 파일이 존재하면 true를 반환해야 한다', () => {
      const submissionId = 'test-submission-1';
      const index = 0;

      mockFs.existsSync.mockReturnValue(true);

      const result = reader.hasOutputFile(submissionId, index);

      expect(result).toBe(true);
      expect(mockFs.existsSync).toHaveBeenCalledWith(
        expect.stringContaining(path.join('submissions', submissionId, `output_${index}.json`)),
      );
    });

    it('출력 파일이 없으면 false를 반환해야 한다', () => {
      const submissionId = 'test-submission-2';
      const index = 5;

      mockFs.existsSync.mockReturnValue(false);

      const result = reader.hasOutputFile(submissionId, index);

      expect(result).toBe(false);
    });
  });

  describe('readOutputFile', () => {
    it('출력 파일을 정상적으로 읽어야 한다', () => {
      const submissionId = 'test-submission-1';
      const index = 0;
      const outputResult = {
        output: '3',
        time: 100,
        memory: 2048,
        status: 'ACCEPTED' as const,
      };

      mockFs.readFileSync.mockReturnValue(JSON.stringify(outputResult));

      const result = reader.readOutputFile(submissionId, index);

      expect(result).toEqual(outputResult);
      expect(mockFs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining(path.join('submissions', submissionId, `output_${index}.json`)),
        'utf8',
      );
    });

    it('RUNTIME_ERROR 상태를 올바르게 읽어야 한다', () => {
      const submissionId = 'test-submission-2';
      const index = 1;
      const outputResult = {
        output: 'error message',
        time: 50,
        memory: 1024,
        status: 'RUNTIME_ERROR' as const,
      };

      mockFs.readFileSync.mockReturnValue(JSON.stringify(outputResult));

      const result = reader.readOutputFile(submissionId, index);

      expect(result).toEqual(outputResult);
      expect(result.status).toBe('RUNTIME_ERROR');
    });
  });
});
