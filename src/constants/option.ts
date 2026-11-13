// 필터 테이블 > 기간 선택
export const PERIOD_OPTION = [
  {
    value: "EXEC",
    label: "대출실행일",
  },
  {
    value: "RQST",
    label: "의뢰일",
  },
];

export const PERIOD_EXPANDED_OPTION = [
  {
    value: "EXEC",
    label: "대출실행일",
  },
  {
    value: "RQST",
    label: "의뢰일",
  },
  {
    value: "STEF",
    label: "설정약정일",
  },
];

export const PERIOD_SORT_OPTION = [
  {
    value: "00",
    label: "의뢰일 순",
  },
  {
    value: "01",
    label: "대출실행일 순",
  },
];

export const NUMERIC_SORT_OPTION = [
  {
    value: "50",
    label: "50개씩 보기",
  },
  {
    value: "100",
    label: "100개씩 보기",
  },
];

export const LAND_LOT_OPTION = [
  {
    id: "lotnumAddrCd01",
    name: "lotnumAddrCd",
    value: "01",
    labelText: "동+호",
    disabled: false,
  },
  {
    id: "lotnumAddrCd02",
    name: "lotnumAddrCd",
    value: "02",
    labelText: "동",
    disabled: false,
  },
  {
    id: "lotnumAddrCd03",
    name: "lotnumAddrCd",
    value: "03",
    labelText: "호",
    disabled: false,
  },
  {
    id: "lotnumAddrCd04",
    name: "lotnumAddrCd",
    value: "04",
    labelText: "없음",
    disabled: false,
  },
];
