const fs = require('node:fs');
const vm = require('node:vm');

/**
 * wrapper.js
 * 유저가 작성한 solution.js를 불러와서 'solution' 함수를 찾아 실행합니다.
 * 더 이상 유저가 module.exports를 작성할 필요가 없도록 개선된 버전입니다.
 */
function main() {
  const solutionPath = process.argv[2];

  if (!solutionPath) {
    process.exit(1);
  }

  // 1. 유저 코드 읽기
  let userCode;
  try {
    userCode = fs.readFileSync(solutionPath, 'utf8');
  } catch (err) {
    process.stderr.write(`[Wrapper] Failed to read solution file: ${err.message}\n`);
    process.exit(1);
  }

  // 2. VM(가상 머신) 환경 설정
  // 유저 코드가 실행될 격리된 컨텍스트를 만듭니다.
  const context = {
    console, // 디버깅용 로그 허용
    process, // 기본적인 프로세스 객체 허용
    Buffer,
    setTimeout,
    clearTimeout,
    // 필요 시 여기에 더 많은 전역 객체를 주입할 수 있습니다.
  };
  vm.createContext(context);

  try {
    // 유저 코드를 실행합니다. 이때 전역 범위에 solution 함수가 선언됩니다.
    vm.runInContext(userCode, context);

    // 실행 후 컨텍스트에서 'solution'이라는 이름의 함수를 찾습니다.
    const solution = context.solution;

    if (typeof solution !== 'function') {
      process.stderr.write('[Wrapper] function solution(input) { ... } 이 정의되지 않았습니다.\n');
      process.exit(1);
    }

    // 3. 입력 읽기 (stdin)
    const input = fs.readFileSync(0, 'utf8');

    // 4. 함수 실행 및 결과 출력
    const result = solution(input);

    // 결과가 있으면 표준 출력(stdout)으로 내보냄
    if (result !== undefined) {
      process.stdout.write(String(result));
    }
  } catch (err) {
    // 실행 중 발생한 에러 처리 (Runtime Error)
    process.stderr.write(`[Wrapper] Runtime Error: ${err.stack || err.message}\n`);
    process.exit(1);
  }
}

main();
