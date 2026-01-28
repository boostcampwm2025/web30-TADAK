# k6 채점 시스템 부하 테스트 가이드

이 가이드는 채점 시스템의 성능 및 BullMQ 기반 비동기 처리의 안정성을 검증하기 위한 절차를 담고 있습니다.

## 1. 환경 설정 (Setup)

### k6 설치

- **macOS**: `brew install k6`
- **Windows**: `winget install k6 --source winget`
- **Linux**: [k6 공식 문서](https://grafana.com/oss/k6/) 참조

---

## 2. 인증 토큰 준비 (Authentication)

테스트 실행 전, 아래 API를 통해 테스트용 JWT 토큰을 발급받아 `k6/config.js`의 `TOKEN` 항목에 업데이트해야 합니다.

1. **토큰 발급 (Postman 또는 curl)**
   ```bash
   # API 호출을 통해 토큰 획득
   POST http://localhost:3000/api/auth/test-token
   ```
2. **`config.js`에 업데이트**

   ```js
   const TOKEN = 'accessToken'; // 여기에 업데이트!!!

   export const CONFIG = {
     // API 서버 주소
     BASE_URL: __ENV.BASE_URL || 'http://localhost:3000',

     // JWT 인증 토큰 (환경변수 또는 하드코딩)
     JWT_TOKEN: __ENV.JWT_TOKEN || TOKEN || 'PUT_YOUR_JWT_TOKEN_HERE',

     // 테스트할 문제 ID
     PROBLEM_ID: __ENV.PROBLEM_ID || 'beta_easy_1',

     // 테스트용 소켓 ID (실제 소켓 연결 없이 테스트용)
     SOCKET_ID: __ENV.SOCKET_ID || 'k6-load-test-socket',
   };
   ```

## 3. 테스트 실행

1. **기본 부하 테스트**

- 점진적으로 부하를 높여 시스템의 처리 한계를 확인합니다.

  ```bash
  # 최소 테스트
  k6 run -e PRESET=smoke submission-load-test.js

  # 소규모 테스트
  k6 run -e PRESET=small submission-load-test.js

  # 중규모 테스트
  k6 run -e PRESET=medium submission-load-test.js

  # 대규모 테스트
  k6 run -e PRESET=large submission-load-test.js

  # 전체 테스트
  k6 run -e PRESET=full submission-load-test.js
  ```

2. **고부하 동시성 테스트**

- 50명의 유저가 동시에 접속하는 상황을 확인합니다.
  ```bash
  k6 run concurrency-test.js
  ```

3. **스파이크 테스트**

- 순간적으로 트래픽이 폭증할 때 시스템 능력을 확인합니다.
  ```bash
  k6 run spike-test.js
  ```

## 4. 모니터링

> 정확한 테스트를 위해 리소스를 모니터링하고 큐를 초기화하는 것을 권장합니다.

- Windows
  ```bash
  .\monitor.ps1
  ```
- linux/macOS
  ```bash
  ./monitor.sh
  ```

**로그 파일**

- 모니터링을 하는 동안 로그 파일이 생성되며 실시간 기록 됩니다.
- `k6/logs/*.log`
