import { API_ADMIN_MATCH, API_COMM_SEQUENCE } from "@constants/api-path";
import { adminURI } from "@constants/env";
import { axiosBasicInstance } from "@services";

/* 배정관리 목록 조회 */
export const getSupplimentListData = ({
  searchRqstNo,
  tabSelection,
  sortOrder,
  pageNum,
  pageSize,
}: {
  searchRqstNo: string;
  tabSelection: string;
  sortOrder: string;
  pageNum: number;
  pageSize: number;
}) =>
  axiosBasicInstance(`${API_ADMIN_MATCH}/list`, {
    baseURL: adminURI,
    params: { searchRqstNo, tabSelection, sortOrder, pageNum, pageSize },
  }).then((response) => response.data);

/* 배정 등록정보 조회 */
export const getSupplimentData = (rqstNo: string) =>
  axiosBasicInstance(`${API_ADMIN_MATCH}/${encodeURIComponent(rqstNo)}`, {
    baseURL: adminURI,
  }).then((response) => response.data);

// 전자등기 신규등록 > 의뢰번호 조회
export const getRqstNoData = () =>
  axiosBasicInstance(API_COMM_SEQUENCE, { params: { sequence: "RQST_NO" } }).then(
    (response) => response.data,
  );

/*
 * 일괄 배정: 고른 의뢰들에 법무대리인 한 명을 지정합니다.
 * 응답 data: { successList: 배정된 의뢰번호[], failList: { rqstNo, reason }[] }
 * 배정 정보(채무자·주소·채권최고액·설정약정일·등기고유번호)가 빠졌거나 이미 처리된 의뢰는 서버가 실패로 돌려줍니다.
 */
export const patchBulkAssign = (body: { rqstNoList: string[]; lgagMembNo: string }) =>
  axiosBasicInstance
    .patch(`${API_ADMIN_MATCH}/bulk`, body, { baseURL: adminURI })
    .then((response) => response.data);

// 배정 신규등록
export const postCreateAssign = (form: FormData) =>
  axiosBasicInstance.post(`${API_ADMIN_MATCH}`, form, {
    baseURL: adminURI,
    headers: { "Content-Type": "multipart/form-data" },
  });
