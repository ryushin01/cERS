/* 관리자 배정관리 - 목록 항목 */
export type AssignListItem = {
  statNm: string;
  statCd: string;
  rqstNo: string;
  execDt: string;
  clientNm: string;
  clientMembNo: string;
  bndNm: string;
  bndBizNo: string;
  dbtrNm: string;
  crtDtm: string;
  mtchDtm: string;
};

/* 관리자 배정관리 - 일괄 배정 결과 */
export type BulkAssignResult = {
  successList: string[];
  failList: { rqstNo: string; reason: string }[];
};

/* 관리자 배정관리 - 전자등기 신규 등록 폼 */
export type AssignCreateForm = {
  rqstNo: string;
  execDt: string;
  bndBizNo: string;
  dbtrNm: string;
  lotnumAddr: string;
  rdnmAddr: string;
  realeCd: string;
  lotnumAddrCd: string;
  bldg: string;
  unit: string;
  unqRgstrNo: string;
  bndMaxAmt: number;
  seDt: string;
  lgagMembNo: string;
  lgagDlvrCnts: string;
};

/* 관리자 배정관리 - 배정 상세 폼 (대출실행일·사업자번호는 수정 대상 아님) */
export type AssignDetailForm = Omit<AssignCreateForm, "execDt" | "bndBizNo">;
