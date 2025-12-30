# Docker 사용 가이드

## 개발 환경 실행

```bash
# 1. 환경 변수 설정
cp .env.dev.example .env.dev

# 2. Docker 실행 (빌드 + 백그라운드)
docker compose -f docker-compose.dev.yml up --build -d

# 3. 로그 확인
docker compose -f docker-compose.dev.yml logs -f

# 4. 종료
docker compose -f docker-compose.dev.yml down
```

### 서비스 접속

- **프론트엔드**: http://localhost:5173
- **백엔드 API**: http://localhost:3000
- **Swagger 문서**: http://localhost:3000/api-docs

## 프로덕션 환경 실행

```bash
# 1. 환경 변수 설정
cp .env.production.example .env.production
# .env.production 파일을 열어 실제 비밀번호로 수정

# 2. Docker 실행
docker compose -f docker-compose.prod.yml up --build -d
or
docker compose -p web30-prod -f docker-compose.prod.yml up -d

# 3. 종료
docker compose -f docker-compose.prod.yml down
```

```bash
# redis 데이터 초기화
# 1. 종료
docker compose -f docker-compose.prod.yml down redis
# 2. redis 빌드
docker compose -f docker-compose.prod.yml build redis
# 3. redis 재기동
docker compose -f docker-compose.prod.yml up -d redis

```

## 주요 명령어

```bash
# 컨테이너 상태 확인
docker compose -f docker-compose.dev.yml ps

# 데이터베이스 초기화 (볼륨 삭제)
docker compose -f docker-compose.dev.yml down -v

# MySQL 접속
docker compose -f docker-compose.dev.yml exec mysql mysql -u web30 -p

# Redis 접속
docker compose -f docker-compose.dev.yml exec redis redis-cli
```

## 참고사항

- **Hot Reload**: 개발 환경에서 파일 변경 시 자동 반영 (Web: HMR, API: watch mode)
- **의존성 추가 시**: 컨테이너 재빌드 필요 (`--build` 옵션 사용)
- **멀티 스테이지 빌드**: `target` 옵션으로 개발/프로덕션 환경 분리
