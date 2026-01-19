# Web30 - PORT:30

<p align="center">
  📝 <a href="https://www.notion.so/web30-2c319e920f6080b2908dfb28ba83275a?source=copy_link">팀 노션</a> &nbsp;|&nbsp;
  🎨 <a href="https://www.figma.com/board/AKXDZaAymXKSg5XShewk1A/%ED%85%8C%EC%98%A4%EC%9D%98-%EC%8A%A4%ED%94%84%EB%A6%B0%ED%8A%B8-%ED%85%9C%ED%94%8C%EB%A6%BF--web30-?node-id=0-1&t=epjZ5ONDNW74eWT7-1">피그잼</a> &nbsp;|&nbsp;
  📚 <a href="https://github.com/boostcampwm2025/web30-boostcamp/wiki">위키</a> &nbsp;|&nbsp;
  📋 <a href="https://github.com/orgs/boostcampwm2025/projects/224">백로그</a>
</p>

## 👥 팀원

| [J029\_김다연](https://github.com/dyeon-dev)                                              | [J074\_김채영](https://github.com/cchaeyoung)                                               | [J213\_이준섭](https://github.com/SubJeeLee)                                                | [J278\_최효진](https://github.com/eeekeee)                                                  |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
|                                                                                           |                                                                                             |                                                                                             |                                                                                             |
| <img src="https://avatars.githubusercontent.com/u/93921784?v=4" width="130" height="130"> | <img src ="https://avatars.githubusercontent.com/u/123921311?v=4" width="130" height="130"> | <img src ="https://avatars.githubusercontent.com/u/176148148?v=4" width="130" height="130"> | <img src ="https://avatars.githubusercontent.com/u/144501864?v=4" width="130" height="130"> |

<br>

# ⌨️ TADAK (타닥)

> **"코딩은 E-Sports다!"**
> 실시간 1:1 알고리즘 배틀 플랫폼

## 📖 프로젝트 소개 (Introduction)

**TADAK(타닥)** 은 혼자서 외롭게 풀던 알고리즘 문제 풀이를 **실시간 경쟁 게임**으로 재해석한 웹 서비스입니다.

키보드 타건음 "타닥타닥"에서 영감을 받아, 실시간으로 상대방과 코딩 대결을 펼치는 긴장감 넘치는 경험을 제공합니다.

- **개발 기간:** 2024.12.08 ~ 2025.02.06 (2주 MVP / N주 고도화)
- **배포 주소:** https://www.tadak.site/

## ✨ 핵심 기능 (Key Features)

### 🎮 실시간 1:1 매칭

- 레이팅 기반 공정한 매칭 시스템
- 대기 시간에 따른 레이팅 범위 자동 확장
- 매칭 성공 시 5초 카운트다운 후 배틀 시작

### ⚔️ 실시간 코딩 배틀

- 동일한 알고리즘 문제를 실시간으로 경쟁
- 테스트케이스별 채점 결과 실시간 확인
- 상대방 진행 상황 실시간 표시

### 👀 관전 모드

- 진행 중인 배틀 실시간 관전
- 양쪽 플레이어의 코드 실시간 확인
- 관전자 채팅 시스템

### 🏆 티어 & 레이팅 시스템

- 브론즈 ~ 마스터 티어
- 승패에 따른 레이팅 변동
- 승률 및 전적 기록

## 🛠 기술 스택 (Tech Stack)

| 분류             | 기술                                                             |
| :--------------- | :--------------------------------------------------------------- |
| **Frontend**     | React, TypeScript, Vite, Tailwind CSS, Zustand, Socket.IO Client |
| **Backend**      | NestJS, TypeScript, TypeORM, Socket.IO, BullMQ                   |
| **Database**     | MySQL, Redis                                                     |
| **Infra/DevOps** | NCP, Docker, Docker Compose, Nginx                               |
| **External API** | GitHub OAuth                                                     |

## 🏗 시스템 아키텍처 (Architecture)

### 주요 컴포넌트

| 컴포넌트             | 역할                                      |
| -------------------- | ----------------------------------------- |
| **API Server**       | REST API, WebSocket, 매칭 로직, 세션 관리 |
| **Judge Server**     | 제출 큐 처리, 채점 결과 수집, 결과 발행   |
| **Runner Container** | 격리된 환경에서 유저 코드 실행            |
| **Redis**            | 세션, 매칭 큐, Pub/Sub, 메시지 큐         |
| **MySQL**            | 유저, 문제, 제출 기록 영구 저장           |

## 🔥 기술적 도전 (Technical Challenges)

### 1. BullMQ를 활용한 비동기 채점 처리

- API 서버와 Judge 서버 간 작업 분리
- 채점 실패 시 자동 재시도 메커니즘
- 다중 Judge 서버로 수평 확장 가능

### 2. Redis Pub/Sub 실시간 결과 전달

- 테스트케이스별 채점 결과 실시간 스트리밍
- Judge → API → Client 이벤트 파이프라인
- 낮은 지연시간으로 즉각적인 피드백

### 3. Docker 기반 안전한 코드 실행

- 컨테이너 격리로 시스템 보안 확보
- CPU/메모리 제한으로 리소스 관리
- 네트워크 차단으로 외부 접근 방지

### 4. 채점 서버 분리 및 확장성

- 관심사 분리로 독립적 스케일링
- Replicas 설정으로 동시 채점 처리량 증가
- 장애 격리로 서비스 안정성 확보

## 💻 실행 방법 (Getting Started)

### 사전 요구사항

- Docker & Docker Compose
- Node.js 22+
- pnpm

### 개발 환경 실행

```bash
# 1. 저장소 클론
git clone https://github.com/boostcampwm2025/web30-TADAK.git
cd web30-TADAK

# 2. 환경 변수 설정
cp .env.dev.example .env.dev

# 3. Docker Compose로 실행
docker-compose -f docker-compose.dev.yml up --build

# 4. 접속
# Frontend: http://localhost:5173
# API Server: http://localhost:3000
# Judge Server: http://localhost:4000
```

### 로컬 개발 (Docker 없이)

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm run dev
```
