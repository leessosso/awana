# Awana LMS (Learning Management System)

Awana 교회 교육 프로그램을 위한 학습 관리 시스템입니다. 학생 관리, 출석 체크, 핸드북 진행 상황 추적 등의 기능을 제공합니다.

## 🔥 주요 기능

- **학생 관리**: 학생 등록, 임시 배정, 담당 선생님 관리
- **출석 관리**: 일일 출석 체크 및 통계
- **핸드북 추적**: Sparks/Cubbies/T&T/Journey/Trek 프로그램 진행 상황
- **게임 타임**: 팀별 게임 활동 관리
- **팀 활동 점수**: 팀 활동 점수 기록 및 집계
- **보고서**: 출석/진행 현황 보고서
- **실시간 데이터 정리**: 만료된 임시 배정 자동 정리 (매일 새벽 2시)
- **반응형 디자인**: 모바일/태블릿/데스크톱 완벽 지원

## 📋 프로젝트 표준 (다중 브랜치 아키텍처)

이 저장소는 **main 브랜치를 템플릿**으로 하는 다중 브랜치 아키텍처를 사용합니다. 각 브랜치는 독립적인 프로젝트를 나타내며, 공통된 기술 표준을 따릅니다.

### 📚 중요 문서
- **[.cursor/skills/](./.cursor/skills/)** - 프로젝트 로컬 Cursor Skills (AI 자동 참조)
  - [`composition-patterns/SKILL.md`](./.cursor/skills/composition-patterns/SKILL.md) - 컴포넌트 설계/조합 패턴
  - [`react-best-practices/SKILL.md`](./.cursor/skills/react-best-practices/SKILL.md) - React/Next.js 베스트 프랙티스
  - [`react-view-transitions/SKILL.md`](./.cursor/skills/react-view-transitions/SKILL.md) - 전환 애니메이션 패턴
  - [`web-design-guidelines/SKILL.md`](./.cursor/skills/web-design-guidelines/SKILL.md) - 웹 UI/UX 점검 가이드

### 🌿 브랜치 구조
- `main` - 템플릿 브랜치 (수정하지 마세요)
- `feat/project-name/*` - 기능 개발 브랜치
- `init/project-name/*` - 프로젝트 초기화 브랜치
- `fix/project-name/*` - 버그 수정 브랜치

### 🎨 기술 스택 표준
- **UI**: shadcn/ui + Tailwind CSS
- **프레임워크**: React 19 + TypeScript
- **상태관리**: Zustand
- **라우팅**: React Router v6
- **빌드**: Vite
- **백엔드**: Firebase (Firestore, Auth, Functions)

## 목차
- [🔥 주요 기능](#-주요-기능)
- [🚀 빠른 시작](#-빠른-시작)
- [🗃️ 데이터 정리 시스템](#️-데이터-정리-시스템)
- [👩‍🏫 선생님 구조 마이그레이션](#-선생님-구조-마이그레이션)
- [📁 파일 구조](#-파일-구조)
- [🛠️ 문제 해결 가이드](#️-문제-해결-가이드)

## 🚀 빠른 시작

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정
npm run setup:env
# 또는 .env.example을 복사하여 .env 파일 생성
cp .env.example .env
# .env 파일을 열어 Firebase 설정 정보 입력

# 3. 개발 서버 실행
npm run dev
```

### 📝 환경 변수 설정

`.env` 파일에 다음 정보를 입력하세요:

**필수 설정:**
- `VITE_FIREBASE_API_KEY`: Firebase API Key
- `VITE_FIREBASE_AUTH_DOMAIN`: Firebase Auth Domain
- `VITE_FIREBASE_PROJECT_ID`: Firebase Project ID
- `VITE_FIREBASE_STORAGE_BUCKET`: Firebase Storage Bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Firebase Messaging Sender ID
- `VITE_FIREBASE_APP_ID`: Firebase App ID
- `VITE_FIREBASE_MEASUREMENT_ID`: Firebase Measurement ID

**테스트 모드 (선택적):**
로컬 개발 시 자동 로그인을 사용하려면:
```env
VITE_SKIP_AUTH=true
VITE_TEST_EMAIL=test@example.com
VITE_TEST_PASSWORD=your_test_password
```

### 🔧 초기 설정 (필수)

Awana LMS를 사용하기 위해서는 Firebase 설정이 필요합니다:

1. **Firebase 프로젝트 생성**
2. **Firebase Admin SDK 키 생성**
3. **GitHub Secrets 설정** (자동 정리 기능용)

## 🗃️ 데이터 정리 시스템

Awana LMS는 **만료된 임시 배정 데이터를 자동으로 정리**하는 시스템을 제공합니다.

### 자동 정리 기능

- **실시간 정리**: 학생 데이터를 조회할 때마다 만료된 임시 배정 자동 정리
- **예약 정리**: 매일 새벽 2시(KST)에 GitHub Actions로 전체 데이터 정리
- **수동 정리**: GitHub Actions `workflow_dispatch` 또는 로컬 실행 가능

### 설정 방법

#### 1. Firebase Admin SDK 키 생성

```bash
# Firebase Console → 프로젝트 설정 → 서비스 계정 → 새 개인 키 생성
# 생성된 JSON 파일을 scripts/serviceAccountKey.json으로 저장
```

#### 2. GitHub Secrets 설정

GitHub 저장소 -> Settings -> Secrets and variables -> Actions -> New repository secret

**자동 정리용 Secret:**
```
FIREBASE_SERVICE_ACCOUNT_KEY = [서비스 계정 키 JSON 내용 전체]
```

> Spark 플랜에서는 Functions 배포 없이 GitHub Actions 스케줄 방식으로 운영합니다.

**테스트 모드용 Secrets (선택적):**
배포 환경에서 자동 로그인을 사용하려면 다음을 추가하세요:
```
VITE_SKIP_AUTH = true
VITE_TEST_EMAIL = [테스트용 이메일 주소]
VITE_TEST_PASSWORD = [테스트용 비밀번호]
```

> ⚠️ **보안 주의사항**: 
> - 테스트용 계정 정보는 실제 프로덕션 계정과 분리된 테스트 계정을 사용하세요
> - 테스트가 끝나면 `VITE_SKIP_AUTH`를 제거하거나 `false`로 설정하세요

#### 3. 수동 정리 실행

```bash
# 로컬 실행
node scripts/cleanup-expired-temp-assignments.js

# 또는 GitHub Actions에서 수동 실행
# Actions -> Cleanup Expired Temp Assignments -> Run workflow
```

### 작동 방식

1. **실시간 정리**: `studentService.getStudentsByChurch()` 호출 시 자동 정리
2. **예약 정리**: `.github/workflows/cleanup-expired-temp-assignments.yml` 스케줄이 매일 실행
3. **안전 처리**: 배치 작업으로 대량 데이터 안전하게 처리

### 모니터링

- 콘솔 로그에서 정리된 데이터 수 확인 가능
- GitHub Actions 실행 결과에서 상세 로그 확인
- Firebase Console에서 데이터 변경사항 확인

## 👩‍🏫 선생님 구조 마이그레이션

선생님 구조를 다음 기준으로 정리할 때 사용합니다.

- 직책: `head_teacher(담임)`, `assistant(보조)`, `operations_teacher(운영)`
- 레거시 직책 자동 변환:
  - `admin_teacher` -> `operations_teacher`
  - `club_leader` -> `head_teacher`
- 보조 선생님의 소속 담임은 `headTeacherId`로 관리
- 학생의 `assignedTeacherId`가 보조 선생님을 가리키는 경우, 소속 담임으로 자동 재배정

### 실행 전 준비

```bash
# 서비스 계정 키 파일 준비
# Firebase Console > 프로젝트 설정 > 서비스 계정 > 새 개인 키 생성
# 저장 경로: scripts/serviceAccountKey.json
```

### 1) 사전 점검 (DRY RUN)

```bash
npm run migrate:teacher-roles
```

상세 로그가 필요하면:

```bash
npm run migrate:teacher-roles -- --verbose
```

### 2) 실제 반영

```bash
npm run migrate:teacher-roles -- --apply
```

### 주의사항

- `--apply` 없이 실행하면 실제 데이터는 변경되지 않습니다.
- 경고 목록(`소속 담임 없음`, `담임 계정 미존재` 등)은 수동 보정 후 재실행하세요.
- 반영 전 Firestore 백업을 권장합니다.

## 📁 파일 구조

```
awana/
├── src/
│   ├── components/
│   │   ├── auth/              # 인증 관련 컴포넌트
│   │   ├── content/           # 콘텐츠 표시 컴포넌트
│   │   ├── data-visualization/ # 테이블, 차트 등 데이터 시각화
│   │   ├── forms/             # 폼 관련 컴포넌트
│   │   ├── layout/            # 네비게이션, 푸터 등 레이아웃
│   │   ├── students/          # 학생 관련 컴포넌트
│   │   └── ui/                # 범용 UI 컴포넌트 (Button, Card 등)
│   ├── pages/
│   │   ├── attendance/        # 출석 관리
│   │   ├── auth/              # 로그인/인증
│   │   ├── game-time/         # 게임 타임
│   │   ├── handbook/          # 핸드북 추적
│   │   ├── reports/           # 보고서
│   │   ├── students/          # 학생 관리
│   │   └── team-activity/     # 팀 활동 점수
│   ├── services/              # Firebase 서비스 레이어
│   ├── store/                 # Zustand 전역 상태
│   ├── contexts/              # React Context (ThemeContext 등)
│   ├── hooks/                 # 커스텀 훅
│   ├── models/                # 타입/인터페이스 정의
│   ├── routes/                # React Router 라우트 정의
│   ├── i18n/                  # 다국어 (ko/en)
│   ├── analytics/             # 분석 도구 연동
│   ├── styles/                # Tailwind 전역 스타일
│   └── utils/                 # 유틸리티 함수
├── functions/                 # Firebase Cloud Functions
├── scripts/                   # 마이그레이션/관리 스크립트
├── docs/                      # GitHub Pages 배포 산출물
├── .github/workflows/         # CI/CD (배포, 데이터 정리)
├── .cursor/skills/            # 프로젝트 로컬 Cursor Skills
├── tailwind.config.js
├── vite.config.ts
└── firebase.json
```

## 🚀 배포

```bash
# 프로덕션 빌드 후 GitHub Pages 배포
npm run deploy
```

빌드 산출물은 `docs/` 폴더로 이동되어 GitHub Pages(`awana-lms` 브랜치)로 자동 배포됩니다.

## 🛠️ 문제 해결 가이드

### 빌드 오류
```bash
# TypeScript / 린트 오류
npm run lint

# 의존성 문제
rm -rf node_modules package-lock.json
npm install
```

### 테마 적용 안됨
- `src/styles/global.css`의 CSS 변수 확인
- 브라우저 캐시 클리어 (Ctrl+F5)
- `npm run dev` 재시작

### 이미지 로드 실패
- `public/` 폴더에 이미지 배치
- 경로: `/images/filename.png`

### 다국어 적용 안됨
- `src/i18n/locales/` 파일 확인
- 브라우저 언어 설정 확인

### 추가 리소스
- [React 공식 문서](https://react.dev)
- [Tailwind CSS 가이드](https://tailwindcss.com/docs)
- [Vite 문서](https://vitejs.dev)
- [Firebase 문서](https://firebase.google.com/docs)
