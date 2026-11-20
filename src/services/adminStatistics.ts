import { API_ADMIN_STATISTICS } from "@constants/api-path";
import { adminURI } from "@constants/env";
import { axiosBasicInstance } from "@services";

/*
 * 기간별 처리 통계 조회 (관리자)
 * - 기간은 YYYYMMDD, 단위는 DAY(일별)·WEEK(주별, 월요일 시작)·MONTH(월별)
 * - 응답 data: StatisticsData (요약 + 단위별 행, 오래된 기간이 앞)
 */
export const getStatistics = ({
  fromDate,
  toDate,
  unit,
}: {
  fromDate: string;
  toDate: string;
  unit: "DAY" | "WEEK" | "MONTH";
}) =>
  axiosBasicInstance(API_ADMIN_STATISTICS, {
    baseURL: adminURI,
    params: { fromDate, toDate, unit },
  }).then((response) => response.data);
