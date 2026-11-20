/* 관리자 감사 기록 한 줄 (누가·언제·무엇을 바꿨는지) */
export type AuditLogItem = {
  seq: string;
  /* 처리 일시 (YYYY-MM-DD HH:mm:ss) */
  crtDtm: string;
  /* 처리자 */
  crtMembNm: string;
  rqstNo: string;
  /* 작업 (의뢰 등록, 상태 변경 등) */
  actnNm: string;
  /* 바뀌기 전·후 상태 (의뢰 등록은 이전 상태 없음) */
  bfrStatNm: string;
  aftStatNm: string;
  /* 사유 (보완요청·반려·진행취소 사유, 일괄 배정 등) */
  rsnCnts: string;
};
