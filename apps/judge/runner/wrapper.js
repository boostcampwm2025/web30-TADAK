const fs = require('node:fs');
const vm = require('node:vm');

/**
 * wrapper.js (Memory Measurement Version)
 */
function main() {
  const solutionPath = process.argv[2];
  const userCode = fs.readFileSync(solutionPath, 'utf8');

  const context = {
    console,
    process,
    Buffer,
    setTimeout,
    clearTimeout,
  };
  vm.createContext(context);

  try {
    vm.runInContext(userCode, context);
    const solution = context.solution;

    if (typeof solution !== 'function') {
      process.stderr.write('Error: solution function missing\n');
      process.exit(1);
    }

    const input = fs.readFileSync(0, 'utf8');

    // 실행 전 메모리 측정은 큰 의미가 없으므로
    // 실행 완료 직후의 heapUsed를 측정합니다.
    const result = solution(input);
    const memoryUsage = process.memoryUsage().heapUsed;

    // 표준 출력으로 결과 전송
    if (result !== undefined) {
      process.stdout.write(String(result));
    }

    // 메모리 정보 구분자를 붙여서 마지막에 전송
    process.stdout.write(`\n---METRIC---\n${memoryUsage}`);
  } catch (err) {
    process.stderr.write(err.stack || err.message);
    process.exit(1);
  }
}

main();
