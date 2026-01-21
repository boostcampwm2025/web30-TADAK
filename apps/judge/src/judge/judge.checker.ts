import { Injectable } from '@nestjs/common';

@Injectable()
export class JudgeChecker {
  compare(actual: string, expected: string): boolean {
    return this.normalize(actual) === this.normalize(expected);
  }

  // 문자열 정규화
  normalize(str: string): string {
    return str
      .trim()
      .replace(/\r\n/g, '\n') // Windows 개행 → Unix 개행
      .replace(/\r/g, '\n'); // Old Mac 개행 → Unix 개행
  }
}
