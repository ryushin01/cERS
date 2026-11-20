import { API_ADMIN_AUDIT } from "@constants/api-path";
import { adminURI } from "@constants/env";
import { axiosBasicInstance } from "@services";

/*
 * 감사 기록 목록 조회 (관리자)
 * - 기간은 YYYYMMDD, 빈 값이면 제한 없음. 의뢰번호·처리자는 포함 검색
 * - 응답 data: { auditList: AuditLogItem[], totalElements, totalPages } (최근 기록이 앞)
 */
export const getAuditList = ({
  fromDate,
  toDate,
  searchRqstNo,
  searchMembNm,
  pageNum,
  pageSize,
}: {
  fromDate: string;
  toDate: string;
  searchRqstNo: string;
  searchMembNm: string;
  pageNum: number;
  pageSize: number;
}) =>
  axiosBasicInstance(`${API_ADMIN_AUDIT}/list`, {
    baseURL: adminURI,
    params: { fromDate, toDate, searchRqstNo, searchMembNm, pageNum, pageSize },
  }).then((response) => response.data);
