/* 브라우저 저장소 키. 같은 키를 읽고 쓰는 화면이 여러 곳이라 한곳에 둡니다. (로그인 정보 키는 stores/authStore의 AUTH_STORAGE_KEY) */

/** 헤더 검색에서 찾은 의뢰번호. 금융기관 현황조회 화면이 읽고 지웁니다. (sessionStorage) */
export const BANK_SEARCH_RQSTNO_KEY = "bank-rqstno";

/** 헤더 검색에서 찾은 의뢰번호. 관리자 등기관리 화면이 읽고 지웁니다. (sessionStorage) */
export const ADMIN_SEARCH_RQSTNO_KEY = "admin-rqstno";

/** '아이디 저장'을 고른 사용자의 아이디 (localStorage) */
export const SAVED_USER_ID_KEY = "userId";
