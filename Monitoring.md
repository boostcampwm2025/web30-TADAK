# 서버 모니터링 설정 가이드

## 개요

Docker 컨테이너의 CPU, Memory, Network 사용량을 실시간으로 모니터링하기 위한 설정입니다.

**구성 요소:**

- **Prometheus**: 메트릭 수집 및 저장
- **Grafana**: 대시보드 시각화
- **cAdvisor**: Docker 컨테이너 메트릭 수집

## 아키텍처

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  cAdvisor   │────▶│ Prometheus  │────▶│   Grafana   │
│  (수집기)    │     │  (저장소)    │     │  (시각화)    │
└─────────────┘     └─────────────┘     └─────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────┐
│              Docker Containers                       │
│  ┌─────┐ ┌─────┐ ┌───────┐ ┌───────┐ ┌─────┐       │
│  │ API │ │ Web │ │ Judge │ │ MySQL │ │Redis│       │
│  └─────┘ └─────┘ └───────┘ └───────┘ └─────┘       │
└─────────────────────────────────────────────────────┘
```

## 실행 방법

### 1. 컨테이너 실행

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 2. 접속 URL

| 서비스      | URL                   | 용도             |
| ----------- | --------------------- | ---------------- |
| **Grafana** | http://localhost:3001 | 대시보드 (메인)  |
| Prometheus  | http://localhost:9090 | 쿼리 테스트      |
| cAdvisor    | http://localhost:8080 | 원시 데이터 확인 |

### 3. Grafana 로그인

- **ID**: `admin`
- **Password**: `admin`

## Grafana 사용법

### 대시보드 확인

1. Grafana 접속 (http://localhost:3001)
2. 좌측 메뉴 → **Dashboards**
3. **Docker Containers** 클릭

### 대시보드 패널 설명

| 패널          | 설명                     |
| ------------- | ------------------------ |
| CPU Usage (%) | 각 컨테이너의 CPU 사용률 |
| Memory Usage  | 메모리 사용량 (bytes)    |
| Network I/O   | 네트워크 송수신량        |
| Current CPU   | 현재 CPU 사용률 게이지   |

### 시간 범위 조절

- 우측 상단에서 시간 범위 선택 (Last 5 minutes, Last 15 minutes 등)
- 자동 새로고침: 5초 간격

## 부하 테스트와 함께 사용

### 테스트 시나리오

1. Grafana 대시보드를 브라우저에 열어둠
2. 터미널에서 k6 부하 테스트 실행:
   ```bash
   cd k6
   k6 run -e PRESET=large submission-load-test.js
   ```
3. Grafana에서 실시간으로 리소스 변화 확인

### 확인 포인트

- **API 서버**: 요청 처리 시 CPU 상승
- **Judge 서버**: 채점 시 CPU 급등
- **MySQL**: 쿼리 처리 시 CPU/Memory 변화
- **Redis**: 캐시 작업 시 Memory 변화

## 파일 구조

```
monitoring/
├── prometheus.yml                 # Prometheus 설정
└── grafana/
    └── provisioning/
        ├── datasources/
        │   └── datasource.yml     # Prometheus 데이터소스 자동 등록
        └── dashboards/
            ├── dashboard.yml      # 대시보드 프로비저닝 설정
            └── docker-containers.json  # Docker 컨테이너 대시보드
```

## 알려진 제한사항

### Windows (Docker Desktop)

- cAdvisor가 컨테이너 **이름(name)** 라벨을 수집하지 못함
- 대시보드에 컨테이너 ID로 표시됨 (긴 해시값)
- **해결책**: 그래프 변화로 어떤 컨테이너인지 유추 가능

### macOS / Linux

- 컨테이너 이름이 정상적으로 표시됨
- 라벨 기반 필터링 가능

## 트러블슈팅

### Grafana에서 "No data" 표시

1. Prometheus 확인: http://localhost:9090
2. 쿼리 테스트:
   ```
   container_cpu_usage_seconds_total{id=~"/docker/.+"}
   ```
3. 결과가 나오면 Grafana 대시보드 새로고침

### 컨테이너가 안 보임

```bash
# 컨테이너 상태 확인
docker ps

# cAdvisor 로그 확인
docker logs web30-cadvisor-1
```

## 참고

- [Prometheus 공식 문서](https://prometheus.io/docs/)
- [Grafana 공식 문서](https://grafana.com/docs/)
- [cAdvisor GitHub](https://github.com/google/cadvisor)
