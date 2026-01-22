<p align="center">
  <img width="650" alt="TadakLogoGif" src="https://github.com/user-attachments/assets/1e97a5ca-c2d5-48b7-a919-1b0c0acfca7b" />
</p>

<p align="center">
  <sub>실시간 1:1 알고리즘 배틀 플랫폼</sub>
</p>

<p align="center">
  📝 <a href="https://www.notion.so/web30-2c319e920f6080b2908dfb28ba83275a?source=copy_link">팀 노션</a> &nbsp;|&nbsp;
  🎨 <a href="https://www.figma.com/board/AKXDZaAymXKSg5XShewk1A/%ED%85%8C%EC%98%A4%EC%9D%98-%EC%8A%A4%ED%94%84%EB%A6%B0%ED%8A%B8-%ED%85%9C%ED%94%8C%EB%A6%BF--web30-?node-id=0-1&t=epjZ5ONDNW74eWT7-1">피그잼</a> &nbsp;|&nbsp;
  📚 <a href="https://github.com/boostcampwm2025/web30-boostcamp/wiki">위키</a> &nbsp;|&nbsp;
  📋 <a href="https://github.com/orgs/boostcampwm2025/projects/224">백로그</a>
</p>

---

## 📖 프로젝트 소개 (Introduction)

> **"코딩도 E-Sports가 될 수 있다!"**

**TADAK(타닥)** 은 혼자서 외롭게 풀던 알고리즘 문제 풀이를 **실시간 경쟁 게임**으로 재해석한 웹 서비스입니다.

키보드 타건음 "타닥타닥"에서 영감을 받아, 실시간으로 상대방과 코딩 대결을 펼치는 긴장감 넘치는 경험을 제공합니다.

- **개발 기간:** 2024.12.08 ~ 2025.02.06 (2주 MVP / N주 고도화)
- **배포 주소:** https://www.tadak.site/

<br>

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

<br>

# Web30 - PORT:30

> 안녕하세요! 부스트캠프 웹·모바일 10기 WEB-30팀 **PORT:30**입니다.
>
> 저희는 “언제나 열려있는 30번 포트처럼 소통하고, 항구처럼 목표에 확실하게 정박하자"라는 의미를 담은 PORT: 30 팀입니다.

<br>

## 👥 팀원

|                       [J029\_김다연](https://github.com/dyeon-dev)                        |                       [J074\_김채영](https://github.com/cchaeyoung)                        |                        [J213\_이준섭](https://github.com/SubJeeLee)                        |                         [J278\_최효진](https://github.com/eeekeee)                         |
| :---------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------: |
| <img src="https://avatars.githubusercontent.com/u/93921784?v=4" width="130" height="130"> | <img src="https://avatars.githubusercontent.com/u/123921311?v=4" width="130" height="130"> | <img src="https://avatars.githubusercontent.com/u/176148148?v=4" width="130" height="130"> | <img src="https://avatars.githubusercontent.com/u/144501864?v=4" width="130" height="130"> |

<br>

## 🎯 목표 (Goals)

**Team Goal:** "근거 있는 기술 선택을 하는 개발자 되기"

**Project Goal:** 개발자들의 고립감을 해소하고, 코딩을 E-Sports처럼 즐길 수 있는 문화를 만든다.

## 🤝 협업 문화 (Ground Rules)

**Core Time:** 평일 10:00 ~ 18:00 집중 개발

**Communication:** 모르는 것은 10분 고민 후 바로 공유하기

**Process:** 매주 금요일 데모 데이 진행, 스크럼을 통한 매일의 이슈 공유

[👉 자세한 그라운드 룰 보러가기](https://github.com/boostcampwm2025/web30-TADAK/wiki/%EA%B7%B8%EB%9D%BC%EC%9A%B4%EB%93%9C%EB%A3%B0)

<br>

## 🛠 기술 스택 (Tech Stack)

| 분류             | 기술                                                             |
| :--------------- | :--------------------------------------------------------------- |
| **Frontend**     | React, TypeScript, Vite, Tailwind CSS, Zustand, Socket.IO Client |
| **Backend**      | NestJS, TypeScript, TypeORM, Socket.IO, BullMQ                   |
| **Database**     | MySQL, Redis                                                     |
| **Infra/DevOps** | NCP, Docker, Docker Compose, Nginx                               |
| **External API** | GitHub OAuth                                                     |

<br>

## 🏗 시스템 아키텍처 (Architecture)

### 주요 컴포넌트

| 컴포넌트             | 역할                                      |
| -------------------- | ----------------------------------------- |
| **API Server**       | REST API, WebSocket, 매칭 로직, 세션 관리 |
| **Judge Server**     | 제출 큐 처리, 채점 결과 수집, 결과 발행   |
| **Runner Container** | 격리된 환경에서 유저 코드 실행            |
| **Redis**            | 세션, 매칭 큐, Pub/Sub, 메시지 큐         |
| **MySQL**            | 유저, 문제, 제출 기록 영구 저장           |

<br>

## 📐 설계 문서 (Design Docs)

프로젝트의 상세 설계 내용은 아래 문서에서 확인하실 수 있습니다.

| 문서 종류         | 설명                      | 링크                                                                                                                         |
| :---------------- | :------------------------ | :--------------------------------------------------------------------------------------------------------------------------- |
| **User Scenario** | 사용자 흐름 및 기능 명세  | [위키 바로가기](https://github.com/boostcampwm2025/web30-TADAK/wiki/%EC%9C%A0%EC%A0%80-%EC%8B%9C%EB%82%98%EB%A6%AC%EC%98%A4) |
| **API Docs**      | API 명세서 (Swagger/Wiki) | [API 문서 보기](링크_입력_필요)                                                                                              |
| **ER Diagram**    | 데이터베이스 구조도       | [ERD 보기](링크_입력_필요)                                                                                                   |
| **Figma**         | 와이어프레임 및 디자인    | [Figma 보기](링크_입력_필요)                                                                                                 |

<br>

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

<br>

## 🧪 베타 테스트 및 사용성 개선 (Usability Improvement)

> 실제 사용자를 대상으로 베타 테스트를 진행하며 받은 피드백을 바탕으로 서비스를 개선했습니다.

추후 작성 예정

```
- **기간:** 2025.01.xx ~ 2025.01.xx
- **참여 인원:** xx명
- **주요 개선 사례:**
  - **(피드백)** "매칭 대기 시간이 지루하고 언제 잡힐지 모르겠다."
  - **(개선)** 대기 시간 경과에 따른 매칭 범위 확장 시각화 및 매칭 성공 시 사운드 알림 추가
  - **(결과)** 매칭 취소율 15% 감소
```

<br>

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

<br>

## 🤖 AI 활용 로그 (AI Usage)

개발 효율성을 높이기 위해 생성형 AI를 적극적으로 활용했습니다.

> 추후 작성 예정

- **설계 검증:** Redis Pub/Sub 구조의 확장성 시뮬레이션 및 검토
- **데이터 생성:** 테스트용 알고리즘 문제 및 더미 데이터 생성
- **트러블슈팅:** Docker 네트워크 격리 설정 시 발생하는 엣지 케이스 분석
- [👉 AI 활용 상세 로그 보러가기](위키_링크_입력)
