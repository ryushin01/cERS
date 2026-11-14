/* 등기 진행상태 */
export const PROC_STAT_CD = {
  REQUEST: "00", // 등기의뢰
  SUPPLEMENT: "10", // 보완필요
  MATCH: "20", // 배정완료
  EXECUTION: "30", // 대출실행
  REVIEWING: "40", // 접수검토중
  RETURN: "50", // 접수반려
  COMPLET: "60", // 접수완료
  CANCEL: "70", // 진행취소
  HOLD: "80", // 진행보류
} as const;

/* 첨부파일 코드 */
export const ATTC_FIL_CD = {
  REGISTRATION_DATA: "01", // 등기자료
  REGISTRATION_RECEIPT: "02", // 등기접수증
  BIZ_REGI_CERTIFICATE: "03", // 사업자등록증
  NOTI_ATTACHED_FILE: "04", // 공지사항 첨부파일
  MEMBER_REGI_APPLICATION: "05", // 회원등록 신청서
  PROFILE_IMAGE: "06", // 프로필 이미지
} as const;

// 관할법원코드
export const JUDT_COURT_CD = "JUDT_COURT_CD";

// 부동산구분 코드
export const REALE_CD = "REALE_CD";

// 보완요청 사유
export const SPPL_REQ_GB_CD = "SPPL_REQ_GB_CD";

// 진행취소 사유
export const PROC_CLS_GB_CD = "PROC_CLS_GB_CD";

// 반려 사유
export const RTUN_GB_CD = "RTUN_GB_CD";

// 등기소
export const REGR_CD = "REGR_CD";
