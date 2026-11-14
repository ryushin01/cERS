# 개발 가이드

## 요구 사항

- Node.js v22 (LTS) — 저장소의 `.nvmrc`에 지정되어 있습니다.
- nvm v0.40.1 이상
- pnpm v9 이상

## 설치 및 실행

```bash
// nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

// Node.js v22 (.nvmrc 기준)
nvm install
nvm use

// pnpm (Node.js 22에 포함된 corepack 사용)
corepack enable pnpm

// package
pnpm install

// run (https://localhost:4000)
pnpm run dev
```

> Next.js 15는 Node.js 18.18 이상, Storybook 10은 Node.js 20.19 이상이 필요합니다. 저장소 기준인 Node.js 22를 사용하세요.

> cERS는 레거시 시스템이라 Next.js 15(`src/middleware.ts`)에 머뭅니다. Next.js 16(`proxy.ts`)으로 올리지 않고 15 계열의 보안 패치만 받습니다(`CLAUDE.md`).

## 주요 스크립트

| 명령 | 설명 |
|---|---|
| `pnpm run dev` | 개발 서버 (HTTPS, 4000번 포트, 로컬 인증서 자동 생성) |
| `pnpm run build` | Storybook 빌드(`public/storybook`) 후 프로덕션 빌드 (`output: "standalone"`) |
| `pnpm run build:app` | Storybook 없이 앱만 빌드 |
| `pnpm run start` | 빌드 결과물 실행 |
| `pnpm run storybook` | Storybook 개발 서버 (`http://localhost:6006`) |
| `pnpm run build-storybook` | Storybook 정적 빌드 (`public/storybook`) |
| `pnpm run lint` | ESLint 검사 |
| `pnpm run lint:fix` | ESLint 자동 수정 (import 순서 정렬 포함) |
| `pnpm run format` | Prettier로 전체 파일 서식 정리 |
| `pnpm run format:check` | 서식이 맞는지만 확인 (CI에서 실행) |
| `pnpm run typecheck` | TypeScript 타입 검사 (`tsc --noEmit`) |
| `pnpm test` | 단위 테스트 (Vitest, jsdom) |
| `pnpm run test:watch` | 단위 테스트 감시 모드 (파일을 저장하면 다시 실행) |
| `pnpm run test:coverage` | 단위 테스트 커버리지 (터미널 요약과 `coverage/index.html`) |
| `pnpm run test:e2e` | E2E 테스트: 프로덕션 빌드를 실행해 실제 화면을 검사 (먼저 `pnpm run build` 필요, 처음 한 번 `pnpm exec playwright install chromium` 필요) |
| `pnpm run screenshots` | README 스크린샷 다시 찍기 (먼저 `pnpm run build` 필요) |
| `pnpm run test:storybook` | 스토리 테스트: 모든 스토리를 실제 브라우저(Chromium)에서 렌더링하고 접근성 검사 (처음 한 번 `pnpm exec playwright install chromium` 필요) |

## 프로젝트 구조

```
📦 project
├── 🗂️ .husky                                 // 커밋 전 검사 훅 (pre-commit)
├── 🗂️ .github/workflows                      // CI (lint·타입 검사·테스트·빌드, Docker 이미지 빌드)
├── 🗂️ .storybook                             // Storybook 설정 (main, preview, 도착 애니메이션)
├── 🗂️ docker                                 // 개발·운영 Dockerfile, docker-compose
├── 🗂️ e2e                                    // E2E 테스트 (실제 화면의 레이아웃·접근성·Storybook 흐름)
├── 🗂️ public
│ ├── 🗂️ icons                                // svg 아이콘 (logo: 헤더 로고)
│ ├── 🗂️ images                               // 이미지 파일 (logo: 앱 아이콘 PNG)
│ ├── 🗂️ storybook                            // Storybook 빌드 결과물 (빌드 시 생성, 저장소 미포함)
│ └── 🏙️ logo.svg                             // 파비콘 (cERS 심볼)
│
├── 🗂️ src
│ ├── 🗂️ app                                  // 라우팅 관련 파일
│ │   ├── 🗂️ admin                            // 관리자
│ │   │   ├── 🗂️ assign                       // 배정관리
│ │   │   │   ├── 🗂️ assign-create            // 전자등기 신규 등록
│ │   │   │   └── 🗂️ assign-detail
│ │   │   │       └── 🗂️ [rqstNo]             // 전자등기 배정(다이나믹 라우팅 기준: 의뢰번호)
│ │   │   │
│ │   │   ├── 🗂️ registration                 // 등기관리
│ │   │   │   ├── 🗂️ registration-acceptance
│ │   │   │   │   └── 🗂️ [rqstNo]             // 등기접수증 승인(다이나믹 라우팅 기준: 의뢰번호)
│ │   │   │   └── 🗂️ registration-detail
│ │   │   │       └── 🗂️ [rqstNo]             // 등기관리 상세(다이나믹 라우팅 기준: 의뢰번호)
│ │   │   │
│ │   │   ├── 🗂️ member                       // 회원관리 (미구현)
│ │   │   └── 🗂️ notice                       // 공지관리 (미구현)
│ │   │
│ │   ├── 🗂️ financial                        // 금융기관
│ │   │   ├── 🗂️ home                         // 홈
│ │   │   │   └── 🗂️ notice                   // 공지사항
│ │   │   │
│ │   │   ├── 🗂️ request-list                 // 의뢰목록
│ │   │   │   └── 🗂️ request                  // 전자등기 의뢰
│ │   │   │
│ │   │   └── 🗂️ status-inquiry               // (전자등기) 현황조회
│ │   │
│ │   └── 🗂️ lawyer                           // 법무대리인 (미구현)
│ │
│ ├── 🗂️ components                           // 공통·화면 컴포넌트 (각 컴포넌트 옆에 *.stories.tsx)
│ ├── 🗂️ constants                            // 공통 상수값 (경로, API 경로, 코드, 환경 변수, 데모 모드 설정)
│ ├── 🗂️ hooks                                // 공통 커스텀 훅
│ ├── 🗂️ mocks                                // 데모 모드 목업 데이터(data.ts)와 axios 어댑터(adapter.ts)
│ ├── 🗂️ services                             // 각종 API 요청 (공통 axios 인스턴스·인터셉터)
│ ├── 🗂️ stores                               // 전역 상태 관리 대상인 state (jotai)
│ ├── 🗂️ stories                              // 스토리 공통 도우미
│ ├── 🗂️ styles                               // 전역 및 모듈화된 스타일 파일
│ ├── 🗂️ types                                // 공용 타입 (common, file, home, assign)
│ ├── 🗂️ utils                                // 공통 유틸리티 함수
│ └── 📄 middleware.ts                        // 사용자 유형(membGbCd)별 접근 경로 제어
│
├── 📄 eslint.config.mjs                      // ESLint 설정 (import 정렬 규칙 포함)
├── 📄 tailwind.config.ts                     // 디자인 토큰(색상·z-index 등), 공통 클래스(_flex-center) 플러그인
├── 📄 vitest.config.mts                      // 단위 테스트 설정
└── 📄 vitest.setup.ts                        // 단위 테스트 공통 준비 (jest-dom matcher 등)

* 단위 테스트(*.test.ts(x))와 스토리(*.stories.tsx)는 대상 파일과 같은 폴더에 둡니다.
```

## 환경 변수

| 변수 | 설명 | 기본값 |
|---|---|---|
| `NEXT_PUBLIC_DEMO_MODE` | `false`이면 데모 모드를 끄고 실제 API를 사용합니다. | 미지정 시 데모 모드 |
| `NEXT_PUBLIC_APP_URI` | 금융기관/공통 API 서버 주소 (실제 모드) | - |
| `NEXT_PUBLIC_ADMIN_URI` | 관리자 API 서버 주소 (실제 모드) | - |
| `NEXT_PUBLIC_API_URI` | 외부 API 주소 (실제 모드) | - |
| `NEXT_PUBLIC_SITE_URL` | 배포 주소. 링크 공유 미리보기(OG) 이미지의 절대 URL에 사용 | `http://localhost:4000` |
| `NEXT_PUBLIC_STORYBOOK_URL` | 로그인 화면 **Storybook 바로 가기** 버튼의 이동 주소. Storybook을 다른 주소에 배포했을 때 지정 | 빌드: `/storybook` 소개 문서, 개발 서버: `http://localhost:6006` |

실제 모드에서는 `.env.local`(로컬) 또는 `.env.development` / `.env.production`(Docker 빌드)에 값을 설정합니다. `.env*` 파일은 저장소에 포함하지 않습니다.

## 규칙과 테스트

### 프론트엔드 기준

새 프로젝트의 프론트엔드 개발은 아래 기준을 따릅니다. 마크업·접근성·ARIA 기준은 cERS에도 적용합니다.

| 기준 | 내용 |
|---|---|
| 아키텍처 | [Feature-Sliced Design](https://feature-sliced.design) v2.1. 계층은 위에서부터 app → pages → widgets → features → entities → shared이고, 아래 계층만 import합니다. Next.js에서는 계층 이름을 `_app`·`_pages`로 쓰고, 라우트 파일은 `_pages`를 다시 내보내기만 합니다. |
| 마크업 | [HTML Living Standard](https://html.spec.whatwg.org). 요소를 의미에 맞게 쓰고 콘텐츠 모델을 지킵니다. (예: `button` 안에 대화형 요소 금지) |
| 접근성 | 한국형 웹 콘텐츠 접근성 지침(KWCAG) 2.2, KS X OT0003. 4원칙 14지침 33개 검사항목 |
| ARIA | [WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/)와 [ARIA 사용 규칙](https://www.w3.org/TR/using-aria/). 네이티브 HTML을 우선하고, 역할을 지정하면 키보드 동작까지 구현합니다. |

> **cERS 코드는 FSD 구조가 아니며, 그대로 유지합니다.** `src/components`가 화면별로 나뉘어 있고, 공통 컴포넌트 일부가 `services`·`stores`를 직접 사용합니다. FSD는 새 프로젝트의 기준입니다.
> 자동 검사(axe)를 통과했다고 KWCAG를 준수한다는 뜻은 아닙니다. axe는 33개 항목 중 일부만 확인할 수 있어, 새 화면은 항목별로 직접 점검합니다.

### import 순서와 커밋 전 검사

- import 순서는 ESLint 규칙(`eslint-plugin-simple-import-sort`)으로 정렬합니다. 순서는 `react` → `next` → 외부 패키지 → 내부 alias(`@components`, `@hooks` 등) → 상대 경로 → `import type` → CSS 순이고, 그룹 사이에는 빈 줄을 하나 둡니다.
- `tsconfig.json`에 alias를 추가하면 `eslint.config.mjs`의 `INTERNAL_ALIASES`에도 추가합니다. 그래야 외부 scoped 패키지(`@tanstack/...`)와 구분됩니다.
- 커밋할 때 husky의 pre-commit 훅이 스테이징된 파일에 `eslint --fix`와 `prettier --write`(lint-staged)를 실행하고, 이어서 프로젝트 전체 타입 검사와 단위 테스트를 실행합니다. 훅은 `pnpm install` 시 자동으로 등록됩니다.
- 코드 서식은 저장소의 Prettier 설정(`.prettierrc.json`)을 따릅니다: 큰따옴표, 세미콜론, 한 줄 100자, CSS는 4칸 들여쓰기. 문서(`*.md`)와 빌드 결과물은 제외합니다(`.prettierignore`).

### 코드 규칙

- 화면 크기 구분은 `useResponsive`를 사용합니다. `matchMedia`를 `useSyncExternalStore`로 읽기 때문에 브라우저에서 새로 그리는 화면은 첫 렌더링부터 맞는 레이아웃이 나옵니다. (첫 진입 시 서버 렌더링 결과는 PC 기준이며, 하이드레이션 직후 바뀝니다)
- 접근성: 탭은 `TabGroup`(WAI-ARIA 탭 패턴, ←/→/Home/End 이동), 여러 버튼 중 하나를 고르는 그룹은 `ButtonGroup`(`aria-pressed`)을 사용합니다. 보이는 라벨이 없는 `Select`·`InputField`는 `ariaLabel`을 지정하고, `IconButton`은 이름(`children`)이 필수입니다. 모달·드로어 같은 대화상자의 초점 관리는 `useDialog`를 사용합니다.

- 여러 CSS 파일에서 `@apply`로 쓰는 공통 클래스(`_flex-center`)는 `tailwind.config.ts`의 플러그인에 정의합니다. `globals.css`의 `@layer`에 두면 그 파일이 먼저 처리될 때만 다른 파일에서 `@apply`가 동작합니다.
- 금액 입력은 `utils/amountUtil`로 처리합니다: 원 단위 정수만(부호·소수점·문자 무시), 최대 15자리, 0원은 제출 불가. 저장 요청 버튼은 `useSubmitLock`으로 중복 제출을 막습니다.
- 저장 요청은 보낼 데이터를 `mutate(데이터)`로 직접 넘깁니다. (상태를 바꾼 직후 `mutate()`를 호출하고 `mutationFn`이 상태를 읽으면, 실행 시점에 따라 이전 값이 전송될 수 있음)
- 처리 사유(반려·진행취소·보완요청)에서 "기타"는 코드 `99`이고, 직접 입력한 문구를 보냅니다(`codeUtil.getReasonText`).
- 로그인 정보는 `sessionStorage`의 `AUTH_STORAGE_KEY`(`src/stores/authStore.ts`)에 둡니다. 저장·요청·로그아웃 모두 이 상수를 쓰고, 요청 인터셉터는 `readAccessToken()`으로 토큰을 읽습니다. 값이 손상되었으면 빈 토큰으로 보고 로그아웃 상태로 요청합니다.
- 다른 브라우저 저장소 키(헤더 검색 의뢰번호, 아이디 저장)는 `src/constants/storage.ts`에 둡니다. 화면에 문자열로 적지 않습니다.
- 목록 표의 머리 줄은 `TableHead`(칸 이름 배열), 글자만 든 칸은 `BodyCell`(`components/common/TableCell.tsx`)을 씁니다. 링크·버튼이 든 칸은 `td`를 직접 씁니다.
- "제목 + 항목/값" 표는 `InfoTableSection`을 씁니다. 제목 옆 버튼은 `actions`로 넘깁니다.
- 보완요청·진행취소처럼 사유를 골라 처리하는 모달은 `ProcessReasonModal`(`kind`)을 씁니다. "기타"(99)를 고르면 직접 입력합니다.
- 첨부 파일 수·전체 용량 검사는 `getAttachmentLimitMessage`(`utils/fileUtil.ts`)로 합니다.
- 탭 목록은 탭 이름과 조회 코드를 한 배열(`TABS`)에 두고, 탭 번호로 코드를 찾습니다. 탭 순서를 바꿀 때 코드가 어긋나지 않게 하기 위해서입니다.

### 단위 테스트

- Vitest + React Testing Library(jsdom)를 사용합니다. 설정은 `vitest.config.mts`, `vitest.setup.ts`입니다.
- 테스트 파일은 대상 파일 옆에 `*.test.ts(x)`로 둡니다. 예: `src/utils/pathUtil.ts` → `src/utils/pathUtil.test.ts`

| 종류 | 위치 | 내용 |
|---|---|---|
| 단위 | `utils`, `hooks`, `stores`, `components/button`, `components/modal`, `components/login` | 유틸 함수, 커스텀 훅(화면 크기 판단은 첫 렌더링부터 맞는지 포함), 토스트, Button, 모달 접근성, Storybook 바로 가기(전환 후 이동·중복 클릭·동작 줄이기·새 탭) |
| 라우팅 | `middleware.test.ts` | 사용자 유형별 접근 경로 리다이렉트, Storybook 경로 통과 |
| API 요청 | `services/services.test.ts` | services가 만드는 요청(메서드·주소·쿼리·본문). 검색어에 `&`·`#` 같은 문자가 있어도 그대로 전달되는지 |
| 데모 데이터 | `mocks/data.test.ts`, `mocks/adapter.test.ts` | 목업 데이터가 업무 규칙과 맞는지, 목업 API의 응답·상태 변경 |
| 화면 통합 | `components/**/Main.test.tsx` | 화면을 실제 데이터 흐름(TanStack Query → services → 목업 API)으로 렌더링해 목록·건수가 데이터와 같은지 |
| 폼 → 요청 내용 | `CreateForm`·`DetailForm`·`DesktopFileUploader`·`MobileFileUploader`·`RegistrationInformation`·`ReasonModals`(반려·진행취소) 테스트 | 폼에 입력하고 제출했을 때 서버로 가는 요청(JSON·첨부 파일)이 입력값과 정확히 같은지, 연속 클릭에도 한 번만 전송되는지 |
| 공통 동작 | `Pagination`·`TabGroup`·`LoginForm`·`HeaderRightArea`·`AccountLayer`·`DrawerContent`·`useLogout`·`useFileUpload` 테스트 | 페이지 이동, 탭 키보드 조작, 로그인, 헤더 의뢰번호 검색(Enter·버튼·없는 번호), 계정 메뉴 닫기와 초점, 비밀번호 변경, 로그아웃(데모·API·실패), 파일 개수·용량 제한 |
| 검색 조건 | `status-inquiry/List`·`admin/registration/FilterTable`·`admin/assign/Main` 테스트 | 의뢰번호·진행상태·접수번호·채무자·기간 검색과 초기화, 헤더 검색 후 재검색, 한 페이지 개수와 쪽수, 배정관리 탭 |
| 오류 화면 | `app/error.test.tsx` | 앱 전체 오류 화면의 다시 시도, 사용자 유형별 홈 이동 |
| 스토리 | 모든 `*.stories.tsx` (`pnpm run test:storybook`) | 스토리 254개를 실제 브라우저에서 렌더링, 접근성 위반(axe) 검사 (스토리의 첫 화면 기준이라 레이아웃 잘림은 잡지 못함) |
| E2E | `e2e/` (`pnpm run test:e2e`) | 아래 [E2E 테스트](#e2e-테스트) 참고 |
| 속성 기반 | `utils/amountUtil.test.ts`, `utils/dateUtil.test.ts` | [fast-check](https://fast-check.dev)로 임의 입력 수천 건을 생성해 금액·날짜 변환 규칙이 항상 지켜지는지 (예: 금액 표시 → 숫자 변환 시 원래 값, 모든 시간대에서 같은 날짜) |

- 오류 화면: 페이지별 `CustomErrorBoundary`가 먼저 받고, 그 바깥이나 바운더리가 없는 페이지의 오류는 `app/error.tsx`, 루트 레이아웃 오류는 `app/global-error.tsx`가 받습니다. 없는 주소는 `app/not-found.tsx`입니다.
- 화면 통합 테스트는 `src/test/renderWithProviders.tsx`(QueryClient·jotai Provider, PC 화면 `matchMedia`)를 쓰고, `next/navigation`은 테스트 파일에서 `vi.mock`으로 대신합니다.
- tsconfig의 alias를 그대로 쓸 수 있습니다(`vite-tsconfig-paths`).
- 서버 코드(`middleware.ts` 등)를 테스트할 때는 파일 맨 위에 `// @vitest-environment node`를 적습니다.
- 테스트는 실행하는 PC의 시간대와 상관없이 같은 결과가 나오도록 작성합니다. 날짜 유틸은 테스트 안에서 여러 시간대(`process.env.TZ`)로 바꿔 가며 확인합니다.

### E2E 테스트

스토리는 컴포넌트를 따로 렌더링하므로 실제 화면의 잘림·넘침을 잡지 못합니다. E2E 테스트는 프로덕션 빌드를 실행해 **실제 화면**을 Playwright(Chromium)로 검사합니다.

```bash
pnpm run build
pnpm run test:e2e
```

| 파일 | 내용 |
|---|---|
| `e2e/layout.spec.ts` | 폭 320~1920px 8단계에서 가로 넘침, 잘린 버튼·입력칸, 사라진 입력칸, 줄바꿈된 탭, 잘못된 요소 중첩, 잘린 표 글자(항목 이름은 375px 이상, 값은 1024px 이상), 모바일 헤더 로고 |
| `e2e/accessibility.spec.ts` | PC·태블릿·모바일 전 화면의 접근성(axe), 콘솔 오류, 요청 실패, 깨진 이미지. 모달·달력·계정 메뉴·드로어를 연 상태와 아코디언 열림 상태 |
| `e2e/keyboard.spec.ts` | 본문 바로가기, Tab 이동 시 초점 표시, 계정 메뉴·드로어 Esc 닫기와 초점 복귀, 의뢰번호 입력 |
| `e2e/flow.spec.ts` | 사용자 유형을 넘나드는 업무 흐름: 보완요청, 신규 의뢰 → 배정, 보완 후 재제출, 접수 → 승인 → 금융기관 반영, 헤더 의뢰번호 검색, 현황조회·등기관리 검색 |
| `e2e/storybook.spec.ts` | Storybook 바로 가기 전환·도착 애니메이션, 뒤로 가기, 로그인 상태 접근, 동작 줄이기 설정 |

- 화면을 추가하면 `e2e/helpers.ts`의 `PAGES`에 경로를 추가합니다.
- README의 스크린샷은 `pnpm run screenshots`로 다시 찍습니다. 먼저 `pnpm run build`가 필요하고, 결과는 `docs/images`에 저장됩니다. 평소 E2E에는 포함되지 않습니다. README의 이미지 목록이 스크립트(`e2e/readme.screenshots.ts`)와 다르면 실패합니다.
- 서버는 테스트가 자동으로 띄웁니다(4100번 포트). 코드를 바꾼 뒤에는 다시 빌드해야 반영됩니다.
- `pnpm run dev`와 같은 `.next` 폴더를 쓰므로, 개발 서버를 켠 채로 빌드하거나 E2E를 돌리지 않습니다.

## 접근성 미확인 항목

자동 검사와 코드 점검만 했으며, 다음은 아직 확인하지 못했습니다.

- 스크린 리더(VoiceOver, NVDA 등) 실사용 점검
- KWCAG 6.1.3 조작 가능: 공식 기준 수치와 대조 필요 (현재 표 안 링크 높이 19px, 라디오 20px)
- KWCAG 33개 항목 전체 수동 점검
