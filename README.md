# Awana LMS (Learning Management System)

Awana 교회 교육 프로그램을 위한 학습 관리 시스템입니다. 학생 관리, 출석 체크, 핸드북 진행 상황 추적 등의 기능을 제공합니다.

## 🔥 주요 기능

- **학생 관리**: 학생 등록, 임시 배정, 담당 선생님 관리
- **출석 관리**: 일일 출석 체크 및 통계
- **핸드북 추적**: Sparks/Cubbies/T&T/Journey/Trek 프로그램 진행 상황
- **실시간 데이터 정리**: 만료된 임시 배정 자동 정리 (매일 새벽 2시)
- **반응형 디자인**: 모바일/태블릿/데스크톱 완벽 지원

## 📋 프로젝트 표준 (다중 브랜치 아키텍처)

이 저장소는 **main 브랜치를 템플릿**으로 하는 다중 브랜치 아키텍처를 사용합니다. 각 브랜치는 독립적인 프로젝트를 나타내며, 공통된 기술 표준을 따릅니다.

### 📚 중요 문서
- **[.cursorrules](./.cursorrules)** - 모든 프로젝트 표준 및 규칙 (Cursor AI 자동 적용)
- **[.cursor/rules/](./.cursor/rules/)** - 프로젝트 구성 및 코드 구현 가이드
  - `component-development.md` - 컴포넌트 개발 가이드
  - `firebase-setup.md` - Firebase 설정
  - `analytics-*.md` - 분석 도구 설정 가이드
  - 기타 프로젝트 구성 문서들

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

### 🚀 새 프로젝트 시작하기

```bash
# 1. main 브랜치에서 새 브랜치 생성
git checkout -b init/your-project/setup

# 2. 환경변수 설정
npm run setup:env

# 3. 개발 시작
npm install
npm run dev
```

## 목차
- [🔥 주요 기능](#-주요-기능)
- [🚀 빠른 시작](#-빠른-시작)
- [🗃️ 데이터 정리 시스템](#️-데이터-정리-시스템)
- [📋 프로젝트 표준](#-프로젝트-표준)
- [파일 구조](#파일-구조)
- [🎨 테마 변경 가이드](#-테마-변경-가이드)
- [🧩 컴포넌트 개발 가이드](#-컴포넌트-개발-가이드)
- [🛠️ 문제 해결 가이드](#️-문제-해결-가이드)

> 💡 **새 컴포넌트를 만들기 전에 [.cursor/rules/component-development.md](./.cursor/rules/component-development.md)를 먼저 읽어주세요!**

## 주요 특징

- Tailwind CSS 12 컬럼 기반 반응형 레이아웃
- 홈, 서비스 소개, 제품 소개, 포트폴리오, 데이터 애널리틱스 등 기본 페이지 템플릿 내장
- 체계적으로 분류된 재사용 가능한 컴포넌트 라이브러리:
  - **UI 컴포넌트**: Button, Card, Input, Badge, Alert 등 범용 UI 요소
  - **Content 컴포넌트**: Hero, FeatureCard, Testimonial, PricingCard 등 콘텐츠 요소
  - **Form 컴포넌트**: ContactForm, SearchForm 등 폼 관련 요소
  - **Data Visualization**: TanStack Table 기반 테이블 및 Recharts 기반 차트
  - **Layout 컴포넌트**: Navigation, Footer 등 레이아웃 요소
- **실시간 테마 시스템**: 라이트/다크 모드 + 8가지 색상 테마 (블루, 그린, 퍼플, 오렌지, 로즈, 에메랄드, 레드, 인디고)
- CSS 커스텀 프로퍼티 기반 동적 테마 전환
- React Router 기반 페이지 전환 구조

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
- **예약 정리**: 매일 새벽 2시(KST)에 GitHub Actions를 통해 전체 데이터 정리
- **수동 정리**: 필요시 직접 실행 가능

### 설정 방법

#### 1. Firebase Admin SDK 키 생성

```bash
# Firebase Console → 프로젝트 설정 → 서비스 계정 → 새 개인 키 생성
# 생성된 JSON 파일을 scripts/serviceAccountKey.json으로 저장
```

#### 2. GitHub Secrets 설정

GitHub 저장소 → Settings → Secrets and variables → Actions → New repository secret

**필수 Secrets (Firebase 설정):**
```
VITE_FIREBASE_API_KEY = [Firebase API Key]
VITE_FIREBASE_AUTH_DOMAIN = [Firebase Auth Domain]
VITE_FIREBASE_PROJECT_ID = [Firebase Project ID]
VITE_FIREBASE_STORAGE_BUCKET = [Firebase Storage Bucket]
VITE_FIREBASE_MESSAGING_SENDER_ID = [Firebase Messaging Sender ID]
VITE_FIREBASE_APP_ID = [Firebase App ID]
VITE_FIREBASE_MEASUREMENT_ID = [Firebase Measurement ID]
```

**자동 정리용 Secrets:**
```
FIREBASE_SERVICE_ACCOUNT_KEY = [서비스 계정 키 JSON 내용 전체]
```

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
# Firebase Admin SDK 설치
npm install firebase-admin

# 정리 스크립트 실행
node scripts/cleanup-expired-temp-assignments.js
```

### 작동 방식

1. **실시간 정리**: `studentService.getStudentsByChurch()` 호출 시 자동 정리
2. **예약 정리**: `.github/workflows/cleanup-expired-temp-assignments.yml`에 따라 매일 실행
3. **안전 처리**: 배치 작업으로 대량 데이터 안전하게 처리

### 모니터링

- 콘솔 로그에서 정리된 데이터 수 확인 가능
- GitHub Actions 실행 결과에서 상세 로그 확인
- Firebase Console에서 데이터 변경사항 확인

## 파일 구조

```
src/
  components/
    layout/                # 네비게이션, 푸터 등 레이아웃 컴포넌트
    data-visualization/    # 테이블, 차트 등 데이터 시각화 컴포넌트
    ui/                    # 범용 UI 컴포넌트 (Button, Card, Input 등)
    content/               # 콘텐츠 표시 컴포넌트 (Hero, FeatureCard 등)
    forms/                 # 폼 관련 컴포넌트 (ContactForm, SearchForm 등)
  routes/                  # React Router 라우트 정의
  styles/                  # Tailwind 전역 스타일 및 유틸리티
  templates/
    home/                  # 홈 랜딩 템플릿 (Hero, 서비스, 후기 등)
    service/               # 서비스 소개 페이지 템플릿
    product/               # 제품 소개 페이지 템플릿
    portfolio/             # 포트폴리오 페이지 템플릿
    analytics/             # 데이터 애널리틱스 페이지 템플릿

tailwind.config.js         # Tailwind 커스텀 테마 및 플러그인 설정
```

## 🎨 테마 변경 가이드

### 실시간 테마 미리보기

홈페이지에서 **테마 선택기**를 통해 즉시 테마를 변경하고 미리볼 수 있습니다.

#### 사용 가능한 테마 옵션:
- **모드**: 라이트 모드 ☀️ / 다크 모드 🌙
- **색상**: 블루, 그린, 퍼플, 오렌지, 로즈, 에메랄드, 레드, 인디고 (8가지)

### 테마 변경 방법

#### 방법 1: 기본 색상 변경 (가장 간단)
```typescript
// src/contexts/ThemeContext.tsx
defaultThemeColor = 'green' // 원하는 색상으로 변경
```

#### 방법 2: 브랜드 색상 적용 (추천)
```css
/* src/styles/global.css */
:root {
  --color-primary: 255 107 53; /* RGB 값으로 브랜드 색상 적용 */
}
```

#### 방법 3: 새로운 색상 테마 추가
```css
/* src/styles/global.css 에 추가 */
:root[data-theme-color="brand"] {
  --color-primary: [R] [G] [B]; /* RGB 값 */
}
```
```typescript
// src/contexts/ThemeContext.tsx 타입에 추가
type ThemeColor = 'blue' | 'green' | ... | 'brand'
```
```typescript
// src/components/ui/ThemeSelector.tsx 옵션에 추가
{ value: 'brand', label: '브랜드', color: '#your-color' }
```

### 고급 테마 커스터마이징

#### CSS 변수 전체 목록:
```css
--color-primary: 메인 브랜드 색상
--color-primary-foreground: 텍스트 색상 (primary 위)
--color-secondary: 보조 색상
--color-background: 배경색
--color-foreground: 기본 텍스트 색상
--color-muted: 부드러운 배경색
--color-accent: 강조 색상
--color-border: 테두리 색상
```

#### 색상 변환 도구:
HEX → RGB 변환: `#FF6B35` → `255 107 53`

### 📱 반응형 디자인

모든 테마 변경사항은 자동으로 반응형으로 적용됩니다:
- 모바일부터 데스크톱까지 모든 디바이스에서 완벽하게 동작
- Tailwind의 반응형 유틸리티를 활용해 손쉽게 레이아웃 조정 가능
- 다크 모드에서 자동 색상 조정 및 접근성 유지

## 🚀 권장 워크플로우

### 1. 프로젝트 초기 세팅
```bash
npm install
npm run dev
```

### 2. 템플릿 선택 및 테마 설정
- **템플릿 선택**: 고객 업종과 목적에 따라 `templates/`에서 가장 근접한 페이지 선택
- **실시간 테마 미리보기**: 홈페이지 테마 선택기로 즉시 색상과 모드 테스트
  - 8가지 색상 테마 (블루, 그린, 퍼플, 오렌지, 로즈, 에메랄드, 레드, 인디고)
  - 라이트/다크 모드 실시간 전환

### 3. 테마 커스터마이징
- **브랜드 색상 적용**: `src/styles/global.css`에서 CSS 변수 수정
- **콘텐츠 교체**: 섹션 컴포넌트 내 문구, 이미지, CTA 변경
- **페이지 구성**: 필요에 따라 섹션 추가/제거

#### 콘텐츠 교체 상세 가이드

##### 텍스트 변경
```typescript
// src/i18n/locales/ko.json 또는 en.json
{
  "hero": {
    "headline": "고객사 서비스로 변경",
    "description": "새로운 설명문구 작성"
  }
}
```

##### 이미지 변경
```tsx
// 템플릿 파일에서 이미지 경로 변경
<img src="/images/customer-logo.png" alt="고객사 로고" />
```

##### CTA 버튼 변경
```tsx
// 섹션 컴포넌트에서 링크 변경
<a href="https://customer-site.com" className="btn-primary">
  고객사 사이트 방문
</a>
```

### 4. 고급 기능 추가 (선택사항)
- **분석 도구 설정**: GA, Clarity 등 설정 (초보자 가이드 참고)
- **다국어 지원**: `src/i18n/locales/`에서 언어 추가
- **새 컴포넌트 개발**: `src/components/`에 추가
  - 📖 **중요**: [.cursor/rules/component-development.md](./.cursor/rules/component-development.md) 참고 (상세 가이드)

### 5. 최종 QA 및 배포
- **반응형 확인**: 모바일/태블릿/데스크톱 테스트
- **접근성 체크**: 색상 대비, 키보드 내비게이션
- **빌드 및 배포**: `npm run build`로 프로덕션 빌드

#### 배포 가이드
```bash
# 프로덕션 빌드 생성
npm run build

# 로컬에서 빌드 결과 미리보기
npm run preview

# 배포 옵션들:
# 1. Netlify 드래그 앤 드롭
# 2. Vercel CLI: npx vercel
# 3. AWS S3 + CloudFront
# 4. 일반 웹 호스팅에 dist 폴더 업로드
```

## 📋 주문 제작 실전 예시

### 예시 1: 식당 웹사이트 제작
```
요구사항: 파스타 전문점, 빨간색 브랜드 컬러, 이탈리아어 메뉴 소개

1. 테마 변경: 레드 테마 선택
2. 콘텐츠 교체:
   - 로고: /images/pasta-logo.png
   - 메뉴: 이탈리아어 텍스트 추가
   - 영업시간: 섹션에 추가
3. 페이지: 홈, 메뉴, 예약, 연락처
4. 결과: 2시간 내 완성
```

## 🧩 컴포넌트 개발 가이드

> 📖 **상세 가이드는 [.cursor/rules/component-development.md](./.cursor/rules/component-development.md)를 참고하세요.**

### 빠른 요약

이 프로젝트는 **`data-theme="dark"` 속성 기반의 CSS 변수 테마 시스템**을 사용합니다.
**Tailwind의 `dark:` 클래스는 작동하지 않으므로** 하드코딩된 색상을 사용하지 마세요.

**✅ 올바른 방법:**
```tsx
<div className="bg-card text-card-foreground">
  {/* CSS 변수 기반 클래스 사용 */}
</div>
```

**❌ 피해야 할 방법:**
```tsx
<div className="bg-white dark:bg-gray-900">
  {/* 작동하지 않습니다! */}
</div>
```

자세한 내용, 예시 코드, 체크리스트는 [.cursor/rules/component-development.md](./.cursor/rules/component-development.md)를 확인하세요.

### 예시 2: 스타트업 랜딩페이지
```
요구사항: SaaS 제품, 그린 브랜드 컬러, 영어/한국어 지원

1. 템플릿: Analytics 템플릿 선택
2. 테마: 그린 + 다크 모드 기본
3. 다국어: en.json/ko.json 편집
4. 분석 도구: GA + Clarity 설정
5. 결과: 3시간 내 완성
```

### 예시 3: 포트폴리오 사이트
```
요구사항: 디자이너 포트폴리오, 퍼플 테마, 갤러리 위주

1. 템플릿: Portfolio 템플릿 선택
2. 테마: 퍼플 색상 적용
3. 콘텐츠: 프로젝트 갤러리 교체
4. 추가 섹션: Contact Form 추가
5. 결과: 1.5시간 내 완성
```

## 🛠️ 문제 해결 가이드

### 빌드 오류
```bash
# TypeScript 오류
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
- [TypeScript 핸드북](https://typescriptlang.org/docs)

## 🔮 향후 확장 아이디어

### 현재 지원 기능
- ✅ **다국어 지원**: React i18next 기반 완전한 다국어 시스템
- ✅ **분석 도구**: Google Analytics + Microsoft Clarity 통합
- ✅ **테마 시스템**: 8가지 색상 + 라이트/다크 모드

### 추가 확장 가능 항목
- **컴포넌트 라이브러리 확장**: Form, FAQ, Pricing 등 섹션 추가
- **개발 도구**: Storybook을 통한 컴포넌트 문서화 및 시각적 테스트
- **자동화**: 템플릿 선택 및 프리뷰 자동화를 위한 CLI/스크립트
- **고급 기능**: 대시보드 템플릿 및 실시간 데이터 연동
- **애니메이션**: 차트 애니메이션 및 마이크로 인터랙션 개선
