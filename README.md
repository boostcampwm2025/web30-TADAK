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

## 📖 프로젝트 소개 (Introduction)

> **"코딩도 E-Sports가 될 수 있다!"**

**TADAK(타닥)** 은 혼자서 외롭게 풀던 알고리즘 문제 풀이를 **실시간 경쟁 게임**으로 재해석한 웹 서비스입니다.

키보드 타건음 "타닥타닥"에서 영감을 받아, 실시간으로 상대방과 코딩 대결을 펼치는 긴장감 넘치는 경험을 제공합니다.

- **개발 기간:** 2024.12.08 ~ 2025.02.06 (2주 MVP / N주 고도화)
- **배포 주소:** https://www.tadak.site/

<br>

## 📌 목차

- [프로젝트 소개](#-프로젝트-소개-introduction)
- [핵심 기능](##-핵심-기능-key-features)
- [인프라](##-인프라-infra-architecture)
- [기술 스택](##-기술-스택-tech-stack)
- [시스템 아키텍처](##-시스템-아키텍처-architecture)
- [설계 문서](##-설계-문서-design-docs)
- [기술적 도전](##-기술적-도전-technical-challenges)
- [베타 테스트](##-베타-테스트-및-사용성-개선-usability-improvement)
- [실행 방법](##-실행-방법-getting-started)
- [AI 활용 로그](##-ai-활용-로그-ai-usage)
- [팀 소개](##-web30---port30)

<br>

## ✨ 핵심 기능 (Key Features)

TADAK의 주요 기능들을 실제 구동 화면으로 확인해보세요.

> 💡 **촬영 환경 안내**
>
> 시연 영상은 두 사용자의 실시간 상호작용을 한 화면에 담기 위해 **반응형 뷰(창 모드)** 로 촬영되었습니다.
> 실제 PC 환경에서는 더 넓고 쾌적한 UI를 경험하실 수 있습니다. 짧은 GIF에 다 담지 못한 현장감은 직접 플레이하며 느껴보세요!

<br>

### 🎮 긴장감 넘치는 실시간 매칭

> 레이팅 기반의 공정한 매칭 시스템을 제공합니다. 매칭 성공 시 심장을 울리는 사운드와 함께 5초 카운트다운 후 배틀이 시작됩니다.

<table>
  <tr align="center">
    <td><strong>비슷한 실력대의 상대방과 매칭 성공</strong></td>
  </tr>
  <tr align="center">
    <td>
      <img src="https://github.com/user-attachments/assets/00ab85b3-338a-4fa5-bbe1-f9cddf4fbf5f" alt="매칭 성공" />
    </td>
  </tr>
</table>

<br>

### ⚔️ 실시간 1:1 배틀 & 즉각적인 피드백

> 동일한 알고리즘 문제를 두고 펼치는 치열한 승부!
> 상대방의 풀이 현황(테스트케이스 통과)이 실시간으로 중계되어 긴장감을 더하고, 제출 즉시 이어지는 화려한 채점 애니메이션으로 문제 해결의 짜릿한 손맛을 제공합니다.

<table>
  <tr align="center">
    <td><strong>긴장감을 더해주는 상대방의 풀이 현황</strong></td>
  </tr>
  <tr align="center">
    <td>
      <img src="https://github.com/user-attachments/assets/104c9dcb-2d2c-48c0-8b2f-f8f3b6077eef" alt="1대1 배틀" />
    </td>
  </tr>
</table>

<br>

### 👀 다함께 즐기는 관전 모드

> 진행 중인 고수들의 배틀을 실시간으로 관전할 수 있습니다. 양쪽 플레이어의 코드를 실시간으로 확인하며 채팅으로 소통할 수 있습니다.

<table>
  <tr align="center">
    <td><strong>채팅으로 소통하며 다함께 즐기는 실시간 배틀 직관</strong></td>
  </tr>
  <tr align="center">
    <td>
      <img src="https://github.com/user-attachments/assets/c64f843d-e49f-4f30-a0a6-4f3f716cd5e2" alt="관전 모드" />
    </td>
  </tr>
</table>

<br>

### 🛡️ 클린한 승부를 위한 부정행위 방지

> 실력으로만 승부하는 진정한 E-Sports 문화를 지향합니다.
> 외부 코드 붙여넣기(Paste) 방지 및 브라우저 이탈 감지 시스템을 통해 오직 자신의 코딩 실력으로만 경쟁할 수 있는 환경을 제공합니다.

<table>
  <tr align="center">
    <td><strong>오직 실력으로 승부하는 공정한 경쟁 환경</strong></td>
  </tr>
  <tr align="center">
    <td>
      <img src="https://github.com/user-attachments/assets/5492d173-0b24-4860-a28a-46d40c35110d" alt="부정 행위 방지" />
    </td>
  </tr>
</table>

<br>

### 📈 결과 분석 및 코드 복기

> 단순한 승패 확인을 넘어 성장의 기회를 제공합니다. 레이팅 변동을 그래프로 확인하고, 상대방이 작성한 코드를 상세히 리뷰하며 더 나은 풀이 방법을 학습할 수 있습니다.

<table>
  <tr align="center">
    <td><strong>승패 확인부터 코드 복기까지, 완벽한 배틀의 마무리</strong></td>
  </tr>
  <tr align="center">
    <td>
      <img src="https://github.com/user-attachments/assets/e8d63740-47b5-418f-93c8-9c049a9de914" alt="결과 페이지" />
    </td>
  </tr>
</table>

<br>

## 인프라 (Infra Architecture)

<img width="4214" height="3034" alt="image" src="https://github.com/user-attachments/assets/3c789aae-fba8-45af-a082-ee2132b23f1f" />

<br>

### 채점 서버 아키텍처 (Judge Flow)

<img width="4960" height="2820" alt="image" src="https://github.com/user-attachments/assets/1febd26c-c4ea-43e0-8e3d-88820c406fd2" />

<br>

## 🛠 기술 스택 (Tech Stack)

| 분류             | 기술 (Stack)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| :--------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**     | ![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white) ![Zustand](https://img.shields.io/badge/Zustand-443E38?logo=zustand&logoColor=white) ![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?logo=socket.io&logoColor=white) |
| **Backend**      | ![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) ![TypeORM](https://img.shields.io/badge/TypeORM-FE0853?style=flat&logoColor=white) ![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?logo=socket.io&logoColor=white) ![BullMQ](https://img.shields.io/badge/BullMQ-131417?style=flat&logoColor=white)                                                                                                |
| **Database**     | ![MySQL](https://img.shields.io/badge/MySQL-4479A1?logo=mysql&logoColor=white) ![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)                                                                                                                                                                                                                                                                                                                                                                                 |
| **Infra/DevOps** | ![NCP](https://img.shields.io/badge/NCP_Cloud-03C75A?logo=naver&logoColor=white) ![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white) ![Docker Compose](https://img.shields.io/badge/Docker_Compose-2496ED?logo=docker&logoColor=white) ![Nginx](https://img.shields.io/badge/Nginx-009639?logo=nginx&logoColor=white)                                                                                                                                                                                           |
| **External API** | ![GitHub](https://img.shields.io/badge/GitHub_OAuth-181717?logo=github&logoColor=white)                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

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

| 문서 종류         | 설명                     | 링크                                                                                                                                  |
| :---------------- | :----------------------- | :------------------------------------------------------------------------------------------------------------------------------------ |
| **User Scenario** | 사용자 흐름 및 기능 명세 | [위키 바로가기](https://github.com/boostcampwm2025/web30-TADAK/wiki/%EC%82%AC%EC%9A%A9%EC%9E%90-%EC%8B%9C%EB%82%98%EB%A6%AC%EC%98%A4) |
| **API Docs**      | API 명세서 (Notion)      | [API 문서 보기](https://www.notion.so/2cb19e920f6080259073dee8a45be4a0?source=copy_link)                                              |
| **ER Diagram**    | 데이터베이스 구조도      | [ERD 보기](https://github.com/boostcampwm2025/web30-TADAK/wiki/ERD)                                                                   |
| **Figma**         | 와이어프레임 및 디자인   | [Figma 보기](https://www.figma.com/design/LOLxiJhuADZiIfZIBgd5m6/PORT-30?node-id=0-1&t=CyOqnJrTxrZL8Coy-1)                            |

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

### 5. 새로고침/재접속 시 소켓 상태 복구

- SPA에서 새로고침 시 소켓 연결이 끊기면서 상태가 사라지는 문제 발생
- 세션 저장(`resumeSession`) + 소켓 재연결 시 재입장 로직 추가
- 기존 참가자/관전자 정보 복구로 일관된 실시간 상태 유지

### 6. 뒤로가기/이탈로 인한 정보 손실 방지

- React Router useBlocker를 활용해 배틀 중 뒤로가기 방지
- 의도치 않은 이탈 시 서버와 상태 불일치를 줄이기 위해 `leaveRoom`, `leaveBattle`, `sendBeacon` 기반 정리 로직 추가
- 배틀 중간 이탈로 인한 유령 유저/관전자 수 불일치 문제 해결

<br>

## 🧪 베타 테스트 및 사용성 개선 (Usability Improvement)

> 실제 사용자를 대상으로 베타 테스트를 진행하며 받은 피드백을 바탕으로 서비스를 개선했습니다.

설문 결과는 GitHub Releases(버전별 릴리즈 노트)에 정리했습니다.

- 링크: https://github.com/boostcampwm2025/web30-TADAK/releases

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

# 3. Docker Compose로 실행 (.env.dev 적용)
docker compose --env-file .env.dev -f docker-compose.dev.yml up --build -d

# 4. 접속
# Frontend: http://localhost:5173
# API Server: http://localhost:3000
# Judge Server: http://localhost:4000
```

### .env.example (직접 생성)

```
# MySQL 설정
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=web30
MYSQL_USER=web30
MYSQL_PASSWORD=web30

# 백엔드 API 환경변수
DB_HOST=mysql
DB_PORT=3306
DB_USERNAME=web30
DB_PASSWORD=web30
DB_DATABASE=web30

# Redis 설정
REDIS_HOST=redis
REDIS_PORT=6379

# Judge Docker 경로
# JUDGE_HOST_PATH:
# - 호스트에서 실제 judge-data가 있는 "절대 경로"를 입력합니다.
# - 비워두면 내부적으로 현재 프로젝트 기준 경로를 사용합니다.

# ✅ macOS / Linux 예시
# JUDGE_HOST_PATH=/Users/yourname/path/to/web30-boostcamp/judge-data

# ✅ Windows (WSL) 예시
# JUDGE_HOST_PATH=/mnt/c/Users/yourname/path/to/web30-boostcamp/judge-data

# ✅ Windows (Docker Desktop + PowerShell) 예시
# JUDGE_HOST_PATH=C:\Users\yourname\path\to\web30-boostcamp\judge-data

JUDGE_HOST_PATH=
JUDGE_VOLUME=/judge-data

# cleanup 옵션
JUDGE_DISABLE_CLEANUP=false

# 비워두면 JUDGE_HOST_PATH 기준으로 자동 계산됩니다.
JUDGE_PROBLEMS_PATH=
JUDGE_SUBMISSIONS_PATH=

# 서버 설정
PORT=3000

# 프론트엔드 환경변수
VITE_API_URL=http://localhost:3000

# 인증 (JWT)
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/return
```

### 로컬 개발 (Docker 없이)

```bash
# 의존성 설치
pnpm install

# DB/Redis만 docker로 실행
docker compose --env-file .env.dev -f docker-compose.dev.yml up -d mysql redis

# 개발 서버 실행
pnpm run dev
```

<br>

## 🤖 AI 활용 로그 (AI Usage)

개발 효율성을 높이기 위해 생성형 AI를 적극적으로 활용했습니다.

- **설계 검증:** BullMQ + Redis Pub/Sub 구조의 병렬 처리 흐름과 확장성 검토
- **보안/격리 검토:** Docker 실행 옵션(--network none, --memory 등) 안전성 및 권한 분리 검증
- **실시간 기능 디버깅:** 소켓 재접속, 관전자 입장, 실시간 인원 수 동기화 문제 원인 분석
- **UI/UX 개선:** 반응형 코드 에디터/관전 UI 구조 개선 방향 논의
- **문서화 지원:** README, PR 템플릿, 이슈 정리 등 문서 구조 초안 작성 및 개선

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
