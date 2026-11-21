# cERS — 에이전트 작업 안내

이 저장소의 규칙입니다. 자세한 내용은 `README.md`, `docs/development.md`, `docs/demo-mode.md`, `docs/ci-docker.md`, `CHANGELOG.md`에 있습니다.

## 1. 프로젝트 개요

- 금융기관·관리자용 부동산 전자등기 관리 웹 애플리케이션의 프론트엔드입니다(cERS = core Electronic Registration System). 진행이 중단된 프로토타입을 정리한 포트폴리오 프로젝트로, 백엔드 없이 목업 API로 동작합니다.
- 화면 축(웹 하나에 역할별 경로): 금융기관(`/financial`) · 관리자(`/admin`) · 법무대리인(`/lawyer`, 미구현이며 남은 일은 진행하지 않기로 함)
- 운영(데모): https://ers-ryushin01.vercel.app/ (로그인 화면에서 사용자 유형을 고르고 버튼만 누름) · Storybook: `/storybook`

## 2. 기술 스택과 구조

- Next.js 15(App Router, 레거시 유지), React 19, TypeScript 5.7, TanStack Query 5, jotai, axios, js-cookie, Tailwind CSS 3, antd(파일 업로드), swiper, react-datepicker, react-daum-postcode(주소검색), Pretendard(`pretendard` 패키지, CDN 없음), Storybook 10
- 구조(FSD 아님, 그대로 유지): `src/app`(라우트: `admin`, `financial`, `lawyer`), `components`(화면별·공통, 옆에 `*.stories.tsx`), `constants`, `hooks`, `mocks`(데모 목업 데이터·axios 어댑터), `services`(공통 axios 인스턴스), `stores`(jotai), `styles`, `types`, `utils`, `middleware.ts`(사용자 유형별 접근 경로 제어)
- 단위 테스트(`*.test.ts(x)`)와 스토리는 대상 파일과 같은 폴더에 둡니다. FSD는 새 프로젝트의 기준이며 cERS 코드는 옮기지 않습니다.

## 3. 설치·개발 명령

- Node.js 22(`.nvmrc`), pnpm 9(`packageManager`, `corepack enable pnpm`)
- `pnpm install` → `pnpm dev`(https://localhost:4000, `--experimental-https` 자체 서명 인증서) / `pnpm storybook`(:6006)
- 환경 변수(이름만): `NEXT_PUBLIC_DEMO_MODE`(`false`이면 실제 API, 미지정 시 데모), `NEXT_PUBLIC_APP_URI`, `NEXT_PUBLIC_ADMIN_URI`, `NEXT_PUBLIC_API_URI`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_STORYBOOK_URL`. 실제 모드 값은 `.env.local` 또는 `.env.development`·`.env.production`(Docker)에 두며 커밋하지 않습니다.
- Docker: `docker/development`, `docker/production`의 Dockerfile(`docs/ci-docker.md`)

## 4. 검사·테스트 명령

| 명령                                  | 내용                                                             |
| ------------------------------------- | ---------------------------------------------------------------- |
| `pnpm lint`                           | ESLint(경고 0, import 정렬)                                      |
| `pnpm format:check`                   | Prettier(`*.md` 제외)                                            |
| `pnpm typecheck`                      | `tsc --noEmit`                                                   |
| `pnpm test` / `pnpm test:coverage`    | 단위(Vitest + Testing Library, fast-check)                       |
| `pnpm test:storybook`                 | 모든 스토리를 Chromium에서 렌더링하고 axe                        |
| `pnpm build`                          | Storybook을 `public/storybook`에 빌드한 뒤 앱 빌드(데모 모드)    |
| `pnpm test:e2e`                       | 프로덕션 빌드 E2E(폭별 넘침, axe, 키보드, 조작 크기, 업무 흐름, 오프라인). 포트 기본 4100, 겹치면 `E2E_PORT` |
| `pnpm screenshots`                    | README 스크린샷 다시 찍기(먼저 `build`)                          |

- CI(`.github/workflows/ci.yml`): `check` 작업(install → lint → format:check → typecheck → test → Playwright 설치 → test:storybook → build → test:e2e)과 `docker` 작업(운영 이미지 빌드 후 `/`와 `/storybook/index.html` 응답 확인)
- pre-commit(husky): 스테이징 파일 lint-staged(eslint --fix, prettier) → `pnpm typecheck` → `pnpm test`
- 개발 서버와 E2E·빌드가 같은 `.next`를 쓰므로 개발 서버를 켠 채 빌드하거나 E2E를 돌리지 않습니다. 화면을 추가하면 `e2e/helpers.ts`의 `PAGES`에 넣습니다.
- 오프라인: 외부 요청 없이 모든 화면이 떠야 합니다(`e2e/offline.spec.ts`가 localhost 밖 요청을 모두 막고 확인). 글꼴은 CDN 대신 `pretendard` 패키지, 다음 우편번호 스크립트를 못 불러오면 주소검색 모달이 예시 주소로 대신합니다. 외부 스크립트·CDN을 새로 쓰지 않습니다.
- 테스트 원칙(Testing Library): 구현 세부가 아니라 사용자가 보는 동작을 검사하고, 요소는 역할·이름(`getByRole`)으로 찾습니다. 단위·컴포넌트는 Vitest + React Testing Library(jsdom), 스토리는 Vitest 브라우저 모드(`@storybook/addon-vitest`, a11y 애드온), 화면 흐름은 Playwright E2E, 접근성은 axe(`@axe-core/playwright`, Storybook a11y)로 검사합니다. 버그를 고치면 고치기 전에 실패하는 테스트를 함께 넣습니다.

## 5. 코드 스타일

- Prettier(`.prettierrc.json`): 너비 100, 큰따옴표, 세미콜론, trailing comma all, CSS는 들여쓰기 4. 문서(`*.md`)는 손으로 맞춘 표 때문에 Prettier에서 제외합니다.
- import 순서(`simple-import-sort`): `react` → `next` → 외부 패키지 → 내부 alias(`@components` 등) → 상대 경로 → `import type` → CSS, 그룹 사이 빈 줄. `tsconfig.json`에 alias를 더하면 `eslint.config.mjs`의 `INTERNAL_ALIASES`에도 더합니다.
- 공통 부품 사용: 화면 크기는 `useResponsive`, 탭은 `TabGroup`, 하나를 고르는 버튼 묶음은 `ButtonGroup`(`aria-pressed`), 대화상자 초점은 `useDialog`, 표는 `TableHead`·`BodyCell`·`InfoTableSection`, 사유 모달은 `ProcessReasonModal`, 금액은 `utils/amountUtil`, 중복 제출은 `useSubmitLock`, 저장 요청은 `mutate(데이터)`로 직접 넘깁니다. 로그인 정보는 `AUTH_STORAGE_KEY`, 그 밖의 저장소 키는 `src/constants/storage.ts`에 둡니다.
- 접근성(WCAG 2.2·KWCAG 2.2, WAI-ARIA 1.2): 네이티브 HTML 우선, 역할을 주면 키보드 동작까지 구현, 텍스트 대비 4.5:1, 모든 기능 키보드 가능·초점 표시, 누를 수 있는 컨트롤 24×24px 이상(권장 44, 못 키우면 `::after`로 영역만 넓힘), 보이는 라벨이 없는 `Select`·`InputField`는 `ariaLabel`, `IconButton`은 이름 필수, 오류는 `aria-describedby`로 연결하고 초점 이동, 바뀌는 안내는 `role="status"`. 숨긴 입력은 `display: none`이 아니라 `sr-only`. axe 통과가 KWCAG 준수는 아니므로 새 화면은 직접 점검합니다. 자동 검사는 `eslint-config-next`(`next/core-web-vitals`)에 든 jsx-a11y 규칙과 axe(Storybook·Playwright)이며, 표준과 다른 점으로 jsx-a11y recommended 전체는 켜지 않았습니다.
- 테스트는 실행 PC의 시간대와 무관하게 같은 결과가 나오게 쓰고, 서버 코드 테스트는 맨 위에 `// @vitest-environment node`를 적습니다.
- TypeScript strict(`tsconfig.json`의 `"strict": true`)를 유지하고 `any`·`as` 단언·`@ts-ignore`를 피합니다.

## 6. Git·PR

- 흐름: GitHub Flow. `main`에 직접 커밋·푸시하지 않고, 최신 `main`에서 브랜치를 만들어 PR로만 병합합니다. PR은 목적 하나로 작게 만들고 본문에 무엇·왜·검사 결과를 적습니다.
- 브랜치 이름: `feat/…`, `fix/…`, `refactor/…`, `docs/…`, `test/…`, `chore/…`, `release/…`
- 커밋 메시지: Conventional Commits `<타입>: <한국어 요약>`, 타입은 `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `style`, `chore`, `ci`, `build`. 호환이 깨지면 본문에 `BREAKING CHANGE:`를 적습니다.
  - 실제 예) `feat: 관리자 감사기록 조회 화면 추가`, `docs: 감사기록 문서·백엔드 API 계약 추가 (v2.5.0)`, 리뷰 반영은 `fix: … (리뷰 반영)`. PR 제목은 `feat: 관리자 감사기록 조회 (v2.5.0)`처럼 씁니다.
  - 표준과 다른 점: 커밋을 기능·문서로 나누고, 버전은 `v`를 붙여 `(vX.Y.Z)`로 문서 커밋과 PR 제목에 붙입니다.
- 기여자는 ryushin01만 남깁니다(2026-11-21 사용자 결정). 커밋 작성자는 항상 `ryushin0 <141554987+ryushin01@users.noreply.github.com>`이고, 이 저장소는 백엔드 코드가 없어 `Co-Authored-By` 줄을 넣지 않습니다.
  - GitHub Actions가 커밋하는 워크플로는 작성자를 ryushin01로 설정합니다(`github-actions[bot]` 금지).
  - Dependabot PR은 그대로 병합하지 않습니다. 변경 내역을 확인하고 같은 변경을 ryushin01 커밋으로 다시 만들어 병합합니다(병합 커밋 작성자가 dependabot이 되지 않게).
- 버전: Semantic Versioning(주.부.수). 기능·수정 PR은 `package.json`의 `version`과 README의 version 배지를 함께 맞춥니다. 문서만 바뀐 PR은 버전을 올리지 않습니다. API를 바꾸면 `docs/backend-api.md` 계약도 고칩니다.
- 변경 기록: `CHANGELOG.md`(제목 "버전 기록")는 표 형식으로, 맨 위 행에 `| vX.Y.Z | YYYY.MM.DD. | **제목**<br>- 내용 | N/A |`를 더합니다. 표준(Keep a Changelog)과 다른 점: 절 대신 표 한 행에 적고, `[Unreleased]`와 추가·변경·수정·제거 구분이 없습니다.
- 병합은 merge commit. CI(두 작업 모두)가 통과하면 바로 병합하고 CodeRabbit 리뷰는 기다리지 않습니다(이미 달린 맞는 지적은 반영).

## 7. 배포·릴리스

- Vercel 프로젝트 `ers`. `main`에 병합하면 자동 배포되고, 다른 브랜치와 PR 미리보기는 끕니다(`vercel.json`의 `git.deploymentEnabled`). 운영 이미지는 Docker(standalone)로도 빌드합니다.
- 데모 모드: 기본으로 켜져 있습니다(`NEXT_PUBLIC_DEMO_MODE`를 `false`로 주지 않는 한). 로그인은 API 없이 세션에만 저장하고, API는 목업 어댑터(`src/mocks/adapter.ts`)가 응답하며, 변경은 `sessionStorage`에 남아 탭을 닫으면 초기화됩니다. 입장은 로그인 화면에서 사용자 유형(금융기관·관리자)을 고르고 **로그인**을 누릅니다.
- 릴리스: 태그·GitHub 릴리스 `vX.Y.Z`(제목도 같음), 대상은 병합 커밋 전체 SHA, 본문은 CHANGELOG 행의 내용(굵은 제목 + `-` 목록).
- 릴리스 뒤 백업 `bash ~/Documents/Archive/Backup/backup.sh`, 보관함 `cERS 고도화 계획.md`에 진행 기록, 소개가 바뀌면 프로필 `ryushin01/ryushin01` README 표 갱신.

## 8. 보안·주의사항

- 절대 금지: 비밀값을 `NEXT_PUBLIC_*`에 넣기(클라이언트 번들에 들어감), `.env*` 파일 커밋, `eslint-disable`·`--no-verify`로 검사·pre-commit 우회, `main` 직접 푸시.
- 먼저 묻기: 새 런타임 의존성 추가, 빌드 설정(`next.config.ts`·`vercel.json`·Dockerfile·CI) 변경.
- CI·배포·릴리스 상태는 명령 결과(`gh run`, `gh release`, `curl`)로 확인한 뒤에만 말합니다.
- 데모에 실제 API 주소나 유료 키를 넣지 않습니다. 목업 데이터에는 고객사 정보·연락처·로고·실제 문서를 넣지 않고 예시 값만 씁니다.
- **Next.js 15 유지(레거시):** Next.js 16으로 올리지 않습니다. 사용자 유형별 접근 제어는 Next.js 15의 `src/middleware.ts`로 두고 16의 `proxy.ts`로 바꾸지 않습니다. `next`와 `eslint-config-next`는 같은 15.x로 맞추고 15 계열의 보안 패치만 받습니다(Dependabot도 메이저 제안 안 함). 15 계열 보안 패치가 끊기면 사용자와 상의해 업그레이드를 계획합니다. 경위: v2.1.0에서 16으로 올렸다가 v2.2.0에서 되돌림.
- 그 밖의 고정: `axios` 정확한 버전, `@types/node` 22.x(실행 환경 Node 22), Dependabot은 같은 메이저 안의 패치·마이너만, 출시 14일 지난 버전만 제안합니다.
- 엑셀(CSV) 내보내기의 수식 주입 방지(`=`·`+`·`-`·`@`·탭·CR·LF로 시작하는 값 앞에 `'`)를 유지합니다.

## 9. 공통 규칙

규칙은 3계층입니다. 1층 전역(`~/.claude/CLAUDE.md`, OpenCode는 `~/.config/opencode/AGENTS.md`로 같은 파일) → 2층 ryushin01 공통(`~/Documents/GitHub/CLAUDE.md`, Claude Code만 읽음) → 3층 이 파일. 충돌하면 이 파일이 우선합니다. 2층을 읽지 못하는 도구를 위해 핵심을 아래에 요약합니다.

- 답변·커밋·PR·문서는 한국어로 씁니다.
- 허락을 묻지 않고 끝까지 진행한 뒤 결과를 한 번에 보고합니다(비용·비밀값·디자인 결정·되돌릴 수 없는 공개 행동은 보고만).
- 사용자의 진행 중인 작업을 보호합니다. 로컬에 커밋하지 않은 변경이 있으면 `git worktree add`로 따로 작업하고 끝나면 지웁니다.
- 다른 세션에 보내는 공지는 ryushin01 그룹 세션에만 보냅니다.
