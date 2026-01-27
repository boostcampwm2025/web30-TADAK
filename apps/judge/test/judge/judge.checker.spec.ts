import { JudgeChecker } from '../../src/judge/judge.checker';

describe('JudgeChecker - 정답 비교 로직', () => {
  let checker: JudgeChecker;

  beforeEach(() => {
    checker = new JudgeChecker();
  });

  describe('normalize - 문자열 정규화', () => {
    it('앞뒤 공백을 제거해야 한다', () => {
      expect(checker.normalize('  hello  ')).toBe('hello');
      expect(checker.normalize('\n\nhello\n\n')).toBe('hello');
    });

    it('Windows 개행(\\r\\n)을 Unix 개행(\\n)으로 변환해야 한다', () => {
      expect(checker.normalize('hello\r\nworld')).toBe('hello\nworld');
    });

    it('Old Mac 개행(\\r)을 Unix 개행(\\n)으로 변환해야 한다', () => {
      expect(checker.normalize('hello\rworld')).toBe('hello\nworld');
    });

    it('빈 문자열을 처리해야 한다', () => {
      expect(checker.normalize('')).toBe('');
      expect(checker.normalize('   ')).toBe('');
    });
  });

  describe('compare - 정답 판별', () => {
    it('동일한 문자열이면 true를 반환해야 한다', () => {
      expect(checker.compare('hello', 'hello')).toBe(true);
      expect(checker.compare('123', '123')).toBe(true);
    });

    it('다른 문자열이면 false를 반환해야 한다', () => {
      expect(checker.compare('hello', 'world')).toBe(false);
      expect(checker.compare('123', '456')).toBe(false);
    });

    it('공백이 다르더라도 정규화 후 같으면 true를 반환해야 한다', () => {
      expect(checker.compare('  hello  ', 'hello')).toBe(true);
      expect(checker.compare('hello\n', 'hello')).toBe(true);
    });

    it('개행 문자가 다르더라도 정규화 후 같으면 true를 반환해야 한다', () => {
      expect(checker.compare('hello\r\nworld', 'hello\nworld')).toBe(true);
      expect(checker.compare('hello\rworld', 'hello\nworld')).toBe(true);
    });

    it('console.log("YES") 정답 판별', () => {
      const userOutput = 'YES\r\n'; // Windows에서 실행된 결과
      const expectedOutput = 'YES';

      expect(checker.compare(userOutput, expectedOutput)).toBe(true);
    });

    it('덧셈 문제 정답 판별', () => {
      const userOutput = '3\n'; // Unix 개행
      const expectedOutput = '3';

      expect(checker.compare(userOutput, expectedOutput)).toBe(true);
    });

    it('오답 판별', () => {
      const userOutput = '5';
      const expectedOutput = '3';

      expect(checker.compare(userOutput, expectedOutput)).toBe(false);
    });
  });
});
