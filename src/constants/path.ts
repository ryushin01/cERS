// 금융기관
const FI = "financial";

// 관리자
const AD = "admin";

// 법무대리인
const LA = "lawyer";

const HOME = "home";

const NOTICE = "notice";

const REQUEST_LIST = "request-list";

const REQUEST = "request";

const STATUS_INQUIRY = "status-inquiry";

const ASSIGN = "assign";

const REGISTRATION = "registration";

const CREATE = "create";

const DETAIL = "detail";

const ACCEPTANCE = "acceptance";

// 로그인
export const LOGIN_PATH = "/";

// 금융기관
export const FI_PATH = `/${FI}`;

// 금융기관 > 홈
export const FI_HOME = `/${FI}/${HOME}`;

// 금융기관 > 공지사항
export const FI_NOTICE = `/${FI}/${HOME}/${NOTICE}`;

// 금융기관 > 의뢰목록
export const FI_REQUEST_LIST = `/${FI}/${REQUEST_LIST}`;

// 금융기관 > 전자등기 의뢰
export const FI_REQUEST = `/${FI}/${REQUEST_LIST}/${REQUEST}`;

// 금융기관 > 현황조회
export const FI_STATUS_INQUIRY = `/${FI}/${STATUS_INQUIRY}`;

// 관리자
export const AD_PATH = `/${AD}`;

// 관리자 > 배정관리
export const AD_ASSIGN = `/${AD}/${ASSIGN}`;

// 관리자 > 배정관리 > 전자등기 신규등록
export const AD_ASSIGN_CREATE = `/${AD}/${ASSIGN}/${ASSIGN}-${CREATE}`;

// 관리자 > 배정관리 > 배정
export const AD_ASSIGN_DETAIL = `/${AD}/${ASSIGN}/${ASSIGN}-${DETAIL}`;

// 관리자 > 등기관리
export const AD_REGISTRATION = `/${AD}/${REGISTRATION}`;

// 관리자 > 등기관리 > 등기관리 상세
export const AD_REGISTRATION_DETAIL = `/${AD}/${REGISTRATION}/${REGISTRATION}-${DETAIL}`;

// 관리자 > 등기관리 > 승인
export const AD_REGISTRATION_ACCEPTANCE = `/${AD}/${REGISTRATION}/${REGISTRATION}-${ACCEPTANCE}`;

// 법무대리인
export const LA_PATH = `/${LA}`;

// Storybook (컴포넌트 문서). 빌드 결과물(public/storybook)을 앱과 함께 정적 파일로 배포합니다.
export const STORYBOOK_PATH = "/storybook";

// Storybook 소개 문서. 경로까지 지정해야 Storybook이 기록(history)을 더 쌓지 않아 뒤로 가기 한 번에 돌아옵니다.
const STORYBOOK_INTRO = `${STORYBOOK_PATH}/index.html?path=/docs/소개--docs`;

// Storybook 바로 가기 주소
// - 다른 주소에 배포한 Storybook을 쓰려면 NEXT_PUBLIC_STORYBOOK_URL로 지정합니다.
// - 개발 서버(pnpm dev)에는 빌드 결과물이 없으므로 Storybook 개발 서버(pnpm storybook)로 연결합니다.
export const STORYBOOK_URL =
  process.env.NEXT_PUBLIC_STORYBOOK_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:6006" : STORYBOOK_INTRO);
