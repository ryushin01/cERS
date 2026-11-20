/* 통계 지표 (건수는 그 기간에 일어난 일) */
export type StatisticsValues = {
  /* 의뢰 건수 (의뢰일 기준) */
  rqstCnt: number;
  /* 접수완료·접수반려·진행취소 건수 (그 상태가 된 날 기준) */
  cmptCnt: number;
  rtunCnt: number;
  cnclCnt: number;
  /* 반려율(%) = 접수반려 ÷ (접수완료 + 접수반려). 분모가 0이면 null */
  rtunRate: number | null;
  /* 평균 처리 일수 = 의뢰일부터 접수완료일까지 (접수완료 건). 없으면 null */
  avgProcDays: number | null;
};

export type StatisticsPeriod = StatisticsValues & {
  /* 이 행의 기간 (조회 기간 안으로 잘림, YYYY-MM-DD) */
  fromDate: string;
  toDate: string;
};

export type StatisticsData = {
  fromDate: string;
  toDate: string;
  unit: "DAY" | "WEEK" | "MONTH";
  summary: StatisticsValues;
  periodList: StatisticsPeriod[];
};
