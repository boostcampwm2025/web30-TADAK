const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

// --- 환경 설정 (Configuration) ---
// 배포 환경(Docker)에서는 볼륨 마운트된 경로를 사용합니다.
// 로컬 개발 환경에서는 프로젝트 루트의 'judge-data' 폴더를 바라봅니다.
const IS_DOCKER = process.env.IS_DOCKER === 'true';

// Docker 환경:
// /app/data -> 호스트의 judge-data (읽기 전용, 문제 정보)
// /app/output -> 호스트의 judge-data/submissions/{id} (읽기/쓰기, 제출물 및 결과)
const BASE_DIR = IS_DOCKER ? '/app' : path.resolve(__dirname, '../../../judge-data');

// 로컬 개발 시 Docker 마운트 동작을 흉내내기 위한 경로 조정
const submissionId = process.argv[2];
if (!IS_DOCKER && !submissionId) {
  console.error('Usage: node run.js <submissionId>');
  process.exit(1);
}

// DATA_DIR: 문제 정보("problems")가 위치한 경로
// Docker: /app/data
// Local: judge-data
const DATA_DIR = IS_DOCKER ? path.join(BASE_DIR, 'data') : BASE_DIR;

// OUTPUT_DIR: 유저 코드("solution.js")가 있고 실행 결과를 저장할 경로
// Docker: /app/output (이미 특정 제출물 폴더로 마운트됨)
// Local: judge-data/submissions/{id} (직접 경로를 찾아가야 함)
const OUTPUT_DIR = IS_DOCKER
  ? path.join(BASE_DIR, 'output')
  : path.join(BASE_DIR, 'submissions', submissionId);

// --- 폴더 자동 생성 (Directory Preparation) ---
// 실행 결과를 저장할 폴더가 없으면 자동으로 생성합니다.
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log(`[Runner] Starting... (ID: ${submissionId || 'Mounted Volume'})`);
  console.log(`[Runner] Environment: ${IS_DOCKER ? 'Docker' : 'Local Host'}`);

  // 1. 메타 데이터 로드 (Load Metadata)
  // problemId(문제번호), timeLimit(시간제한), memoryLimit(메모리제한), type(제출타입)
  const metaPath = path.join(OUTPUT_DIR, 'meta.json');

  if (!fs.existsSync(metaPath)) {
    console.error(`[Error] Meta file not found: ${metaPath}`);
    console.error(`[Debug] Looked in: ${OUTPUT_DIR}`);
    process.exit(1);
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  const problemId = meta.problemId;
  const timeLimit = meta.timeLimit || 2000; // 기본값 2초
  const memoryLimit = meta.memoryLimit || 256; // 기본값 256MB
  const type = meta.type || 'SUBMISSION'; // 'TEST'(테스트실행) 또는 'SUBMISSION'(정답제출)

  console.log(
    `[Runner] Problem: ${problemId}, Type: ${type}, TimeLimit: ${timeLimit}ms, memoryLimit: ${memoryLimit}MB `,
  );

  // 2. 테스트 케이스 로드 (Load Test Cases)
  // Docker: /app/data/problems/{id}/[test|submission].json
  const problemPath = path.join(DATA_DIR, 'problems', String(problemId));
  // 타입에 따라 예제용('test.json') 또는 채점용('submission.json') 선택
  const casesFileName = type === 'TEST' ? 'test.json' : 'submission.json';
  const casesPath = path.join(problemPath, casesFileName);

  if (!fs.existsSync(casesPath)) {
    console.error(`[Error] Cases file not found: ${casesPath}`);
    process.exit(1);
  }

  console.log(`[Runner] Loading cases from: ${casesFileName}`);

  const testCases = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
  const solutionFile = path.join(OUTPUT_DIR, 'solution.js');

  if (!fs.existsSync(solutionFile)) {
    console.error(`[Error] Solution file not found: ${solutionFile}`);
    process.exit(1);
  }

  // 3. 테스트 케이스별 실행 (Execute User Code)
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`[Runner] Running Case #${i + 1} (ID: ${testCase.id})...`);

    // 개별 케이스 실행
    const result = await runTestCase(solutionFile, testCase.input, timeLimit, memoryLimit);

    // 4. 실행 결과 파일 저장 (Save Results)
    // stdout에서 메트릭 정보 분리
    const parts = result.stdout.split('\n---METRIC---\n');
    const rawOutput = parts[0];
    const usedMemory = parts[1] ? parseInt(parts[1], 10) : 0;

    const caseResult = {
      output: rawOutput,
      time: result.time,
      memory: Math.round((usedMemory / 1024 / 1024) * 100) / 100, // Byte -> MB 변환 (소수점 2자리)
    };

    fs.writeFileSync(
      path.join(OUTPUT_DIR, `output_${i}.json`),
      JSON.stringify(caseResult, null, 2),
    );

    // 표준 에러(stderr)가 있다면 저장 -> error_{i}.txt
    if (result.stderr) {
      fs.writeFileSync(path.join(OUTPUT_DIR, `error_${i}.txt`), result.stderr);
    }

    // 진행 상황 로깅
    console.log(`  -> Status: ${result.status}, Time: ${result.time}ms`);
  }

  console.log('[Runner] All cases completed.');
}

/**
 * 유저 코드를 자식 프로세스로 실행하는 함수
 * @param {string} solutionFile - 실행할 파일 경로
 * @param {string} input - 테스트 케이스 입력값
 * @param {number} timeLimit - 시간 제한 (ms)
 * @param {number} memoryLimit - 메모리 제한 (MB)
 */
function runTestCase(solutionFile, input, timeLimit, memoryLimit) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let status = 'PENDING';

    // 자식 프로세스 생성 (spawn)
    // node --max-old-space-size={Limit} wrapper.js solution.js
    const wrapperPath = IS_DOCKER ? '/runner/wrapper.js' : path.join(__dirname, 'wrapper.js');
    const child = spawn(
      'node',
      [
        `--max-old-space-size=${memoryLimit}`, // V8 메모리 제한 옵션
        wrapperPath,
        solutionFile,
      ],
      {
        stdio: ['pipe', 'pipe', 'pipe'], // 다시 pipe로 복구
      },
    );

    let stdoutBuffer = '';
    let stderrBuffer = '';

    // 시간 초과(Time Limit Exceeded) 감시 타이머
    const timer = setTimeout(() => {
      if (child.exitCode === null) {
        child.kill('SIGKILL'); // 강제 종료
        status = 'TIME_LIMIT_EXCEEDED';
      }
    }, timeLimit);

    // stdout(표준 출력) 수집
    child.stdout.on('data', (data) => {
      stdoutBuffer += data.toString();
      // 출력 제한(Output Limit Exceeded) 안전 장치: 1MB 초과 시 종료
      if (stdoutBuffer.length > 1024 * 1024) {
        child.kill('SIGKILL');
        status = 'OUTPUT_LIMIT_EXCEEDED';
      }
    });

    // stderr(표준 에러) 수집
    if (child.stderr) {
      child.stderr.on('data', (data) => {
        stderrBuffer += data.toString();
      });
    }

    // stdin(표준 입력)에 테스트 케이스 주입
    child.stdin.write(input);
    child.stdin.end(); // 입력 끝 알림

    // 프로세스 종료 처리
    child.on('close', (code) => {
      clearTimeout(timer); // 타이머 해제
      const endTime = Date.now();
      const time = endTime - startTime;

      // 다른 상태(TLE, OLE 등)가 아니고 정상 종료된 경우
      if (status === 'PENDING') {
        if (code === 0) {
          status = 'ACCEPTED';
        } else {
          status = 'RUNTIME_ERROR';
        }
      }

      resolve({
        status,
        time,
        stdout: stdoutBuffer,
        stderr: stderrBuffer,
        exitCode: code,
      });
    });

    // 실행 실패 처리 (예: node 명령어를 못 찾음)
    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        status: 'INTERNAL_ERROR',
        time: 0,
        stdout: '',
        stderr: err.message,
        exitCode: -1,
      });
    });
  });
}

main().catch((err) => {
  console.error('[Runner] Fatal Error:', err);
  process.exit(1);
});
