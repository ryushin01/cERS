import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";

import { PROC_STAT_CD } from "@constants/code";

import {
  changeStatus,
  COMMON_CODES,
  createDocumentSvg,
  createRegistration,
  dateFromToday,
  MEMBERS,
  MockRegistration,
  NOTICES,
  REGISTRATIONS,
  REQUEST_TAB_STATUS,
  saveDemoState,
} from "./data";

/**
 * @name mockAdapter
 * @description 데모 모드에서 axios 요청을 실제 서버 대신 처리하는 어댑터입니다.
 *              - 화면 코드는 그대로 두고, 공통 axios 인스턴스의 adapter만 교체합니다.
 *              - 등록되지 않은 API는 404로 응답해 기존 오류 처리 흐름을 그대로 따릅니다.
 *              - 데모 중 변경(진행보류 등)은 새로고침 전까지 메모리에만 유지됩니다.
 */

type Body = Record<string, unknown>;
type Handler = (params: URLSearchParams, match: RegExpMatchArray, body: Body) => unknown;
type Route = { method: string; pattern: RegExp; handler: Handler };

const RESPONSE_DELAY_MS = 250;

const ok = (data: unknown = null, msg = "정상 처리되었습니다.") => ({ code: "00", msg, data });

const paginate = <T>(list: T[], params: URLSearchParams) => {
  const pageNum = Math.max(Number(params.get("pageNum")) || 1, 1);
  const pageSize = Math.max(Number(params.get("pageSize")) || 10, 1);
  return {
    items: list.slice((pageNum - 1) * pageSize, pageNum * pageSize),
    totalElements: list.length,
    totalPages: Math.max(Math.ceil(list.length / pageSize), 1),
  };
};

const findRegistration = (rqstNo: string | null) =>
  REGISTRATIONS.find((item) => item.rqstNo === rqstNo);

/* 의뢰일 순(00) 또는 대출실행일 순(01), 최신이 앞 */
const sortBy = (list: MockRegistration[], sortOrder: string | null) => {
  const key = sortOrder === "01" ? "execDt" : "crtDtm";
  return [...list].sort((a, b) => b[key].localeCompare(a[key]));
};

/* 관리자 등기관리 탭 건수 */
const registrationStatistics = () => {
  const count = (statCd: string) => REGISTRATIONS.filter((item) => item.statCd === statCd).length;
  return {
    total: REGISTRATIONS.length,
    rqst: count(PROC_STAT_CD.REQUEST) + count(PROC_STAT_CD.SUPPLEMENT),
    mtchCmpt: count(PROC_STAT_CD.MATCH),
    loanExec: count(PROC_STAT_CD.EXECUTION),
    rqstProg: count(PROC_STAT_CD.REVIEWING),
    rqstRtun: count(PROC_STAT_CD.RETURN),
    rqstCmpt: count(PROC_STAT_CD.COMPLET),
    progHold: count(PROC_STAT_CD.HOLD),
    progCncl: count(PROC_STAT_CD.CANCEL),
  };
};

/* 등기관리 상세의 문서 목록 */
const documentList = (item: MockRegistration) => [
  { kind: "등기자료", crtMembNm: item.clientNm, crtDtm: item.crtDtm },
  ...(item.acptNo
    ? [
        {
          kind: "등기접수증",
          crtMembNm: item.lgagMembNm || "데모 법무법인",
          crtDtm: item.acptRptDtm,
        },
      ]
    : []),
];

/* 화면 폼은 날짜를 YYYYMMDD로 보내므로, 목업 데이터 형식(YYYY-MM-DD)으로 맞춤 */
const toDashedDate = (value: unknown) => {
  const date = String(value ?? "");
  return /^\d{8}$/.test(date)
    ? `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`
    : date;
};

/*
 * 감사 기록: 모든 의뢰의 진행 이력을 "누가·언제·무엇을" 한 줄씩으로 펼칩니다. (최근이 앞)
 * 진행 이력은 최근 이력이 앞이므로, 바로 뒤 이력이 바뀌기 전 상태입니다.
 */
const auditLog = () =>
  REGISTRATIONS.flatMap(({ rqstNo, statHistList }) =>
    statHistList.map((history, index) => {
      const before = statHistList[index + 1]?.statNm ?? "";
      const order = statHistList.length - index; // 이 의뢰의 몇 번째 이력인지 (클수록 최근)
      return {
        order,
        item: {
          seq: `${rqstNo}-${order}`,
          crtDtm: history.crtTm ? `${history.crtDtm} ${history.crtTm}` : history.crtDtm,
          crtMembNm: history.crtMembNm,
          rqstNo,
          actnNm: before ? "상태 변경" : "의뢰 등록",
          bfrStatNm: before,
          aftStatNm: history.statNm,
          rsnCnts: history.procRsnCnts,
        },
      };
    }),
  )
    // 같은 시각이면 의뢰번호, 같은 의뢰면 이력 순서(숫자)로 최근이 앞
    .sort(
      (a, b) =>
        b.item.crtDtm.localeCompare(a.item.crtDtm) ||
        b.item.rqstNo.localeCompare(a.item.rqstNo) ||
        b.order - a.order,
    )
    .map(({ item }) => item);

/* 통계: 날짜(YYYY-MM-DD) 계산 */
const DAY_MS = 86_400_000;
const parseDay = (date: string) => new Date(`${date.slice(0, 10)}T00:00:00`);
const formatDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const daysBetween = (from: string, to: string) =>
  Math.round((parseDay(to).getTime() - parseDay(from).getTime()) / DAY_MS);
/* YYYY-MM-DD 형식의 실제 날짜인지 (2026-02-30처럼 넘어가는 날짜도 거절) */
const isValidDay = (date: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(date) && formatDay(parseDay(date)) === date;

/* 집계 단위의 시작일: 일별은 그날, 주별은 그 주 월요일, 월별은 그 달 1일 */
const bucketStart = (date: string, unit: string) => {
  const day = parseDay(date);
  if (unit === "MONTH") day.setDate(1);
  if (unit === "WEEK") day.setDate(day.getDate() - ((day.getDay() + 6) % 7));
  return formatDay(day);
};

const round1 = (value: number) => Math.round(value * 10) / 10;

/*
 * 기간별 처리 통계
 * - 건수는 그 기간에 일어난 일을 셈: 의뢰(의뢰일), 접수완료·접수반려·진행취소(그 상태가 된 날)
 * - 반려율(%) = 접수반려 ÷ (접수완료 + 접수반려), 평균 처리 일수 = 의뢰일부터 접수완료일까지 (접수완료 건)
 */
const statistics = (fromDate: string, toDate: string, unit: string) => {
  type Bucket = {
    fromDate: string;
    toDate: string;
    rqstCnt: number;
    cmptCnt: number;
    rtunCnt: number;
    cnclCnt: number;
    procDays: number[];
  };
  const buckets = new Map<string, Bucket>();
  for (let day = parseDay(fromDate); formatDay(day) <= toDate; day.setDate(day.getDate() + 1)) {
    const date = formatDay(day);
    const key = bucketStart(date, unit);
    const bucket = buckets.get(key);
    if (bucket) bucket.toDate = date;
    else
      buckets.set(key, {
        fromDate: date,
        toDate: date,
        rqstCnt: 0,
        cmptCnt: 0,
        rtunCnt: 0,
        cnclCnt: 0,
        procDays: [],
      });
  }
  const bucketOf = (date: string) =>
    date >= fromDate && date <= toDate ? buckets.get(bucketStart(date, unit)) : undefined;

  REGISTRATIONS.forEach((item) => {
    const requested = bucketOf(item.crtDtm);
    if (requested) requested.rqstCnt += 1;
    item.statHistList.forEach(({ statNm: historyStatNm, crtDtm }) => {
      const bucket = bucketOf(crtDtm);
      if (!bucket) return;
      if (historyStatNm === "접수완료") {
        bucket.cmptCnt += 1;
        bucket.procDays.push(Math.max(daysBetween(item.crtDtm, crtDtm), 0));
      }
      if (historyStatNm === "접수반려") bucket.rtunCnt += 1;
      if (historyStatNm === "진행취소") bucket.cnclCnt += 1;
    });
  });

  const summarize = ({ procDays, ...counts }: Omit<Bucket, "fromDate" | "toDate">) => ({
    ...counts,
    rtunRate:
      counts.cmptCnt + counts.rtunCnt
        ? round1((counts.rtunCnt / (counts.cmptCnt + counts.rtunCnt)) * 100)
        : null,
    avgProcDays: procDays.length
      ? round1(procDays.reduce((sum, days) => sum + days, 0) / procDays.length)
      : null,
  });

  const periods = [...buckets.values()];
  const total = periods.reduce(
    (sum, bucket) => ({
      rqstCnt: sum.rqstCnt + bucket.rqstCnt,
      cmptCnt: sum.cmptCnt + bucket.cmptCnt,
      rtunCnt: sum.rtunCnt + bucket.rtunCnt,
      cnclCnt: sum.cnclCnt + bucket.cnclCnt,
      procDays: [...sum.procDays, ...bucket.procDays],
    }),
    { rqstCnt: 0, cmptCnt: 0, rtunCnt: 0, cnclCnt: 0, procDays: [] as number[] },
  );
  return {
    fromDate,
    toDate,
    unit,
    summary: summarize(total),
    periodList: periods.map((bucket) => ({
      fromDate: bucket.fromDate,
      toDate: bucket.toDate,
      ...summarize(bucket),
    })),
  };
};

/* 단건 배정 화면에서 필수인 배정 정보 */
const REQUIRED_ASSIGN_FIELDS: [keyof MockRegistration, string][] = [
  ["dbtrNm", "채무자"],
  ["rdnmAddr", "담보목적물 주소"],
  ["bndMaxAmt", "채권최고액"],
  ["seDt", "설정약정일"],
  ["unqRgstrNo", "등기고유번호"],
];

/* 일괄 배정할 수 없는 이유 (배정할 수 있으면 빈 문자열) */
const bulkAssignBlocker = (item?: MockRegistration) => {
  if (!item) return "의뢰를 찾을 수 없습니다.";
  if (!REQUEST_TAB_STATUS["00"].includes(item.statCd)) return `이미 ${item.statNm} 상태입니다.`;
  const missing = REQUIRED_ASSIGN_FIELDS.filter(([key]) => !item[key]).map(([, label]) => label);
  return missing.length
    ? `배정 정보가 없습니다(${missing.join(", ")}). 배정 화면에서 입력해 주세요.`
    : "";
};

/* 새 의뢰번호: 기존 의뢰번호 중 가장 큰 번호 + 1 */
const nextRequestNo = () => {
  const max = Math.max(...REGISTRATIONS.map((item) => Number(item.rqstNo.replace(/\D/g, "")) || 0));
  return `DEMO-${String(max + 1).padStart(6, "0")}`;
};

/* 미리보기 이미지 경로 (ImageWithAuth가 `${appURI}/api${src}`로 요청) */
const imageSrc = (rqstNo: string, attcFilCd: string, idx: number) =>
  `/files/preview/${rqstNo}/${attcFilCd}/${idx}`;

const routes: Route[] = [
  /* 공통 */
  {
    method: "get",
    pattern: /^\/api\/comm\/code\/([A-Z_]+)$/,
    handler: (_p, m) => ok({ commCodeList: COMMON_CODES[m[1]] ?? [] }),
  },
  {
    method: "patch",
    pattern: /^\/api\/auth\/password\/change$/,
    handler: () => ok(null, "비밀번호가 변경되었습니다."),
  },
  { method: "get", pattern: /^\/api\/auth\/profile$/, handler: () => ok({ imgData: [] }) },

  /* 금융기관 - 홈 */
  {
    method: "get",
    pattern: /^\/api\/client\/home\/statistics$/,
    handler: () => {
      const today = dateFromToday(0);
      return ok({
        cntExec: REGISTRATIONS.filter((item) => item.execDt === today).length,
        cntProg: REGISTRATIONS.filter((item) =>
          (
            [PROC_STAT_CD.MATCH, PROC_STAT_CD.EXECUTION, PROC_STAT_CD.REVIEWING] as string[]
          ).includes(item.statCd),
        ).length,
        cntComplete: REGISTRATIONS.filter((item) => item.statCd === PROC_STAT_CD.COMPLET).length,
      });
    },
  },
  {
    method: "get",
    pattern: /^\/api\/client\/home\/registration-list$/,
    handler: () =>
      ok({
        rgstrMasterList: REGISTRATIONS.slice(0, 5).map(
          ({ rqstNo, dbtrNm, lgagMembNm, statNm, acptNo }) => ({
            rqstNo,
            dbtrNm,
            lgagMembNm: lgagMembNm || "-",
            statCdNm: statNm,
            acptNo,
          }),
        ),
      }),
  },
  {
    method: "get",
    pattern: /^\/api\/client\/home\/board-list$/,
    handler: () =>
      ok({
        homeBoardListRes: NOTICES.slice(0, 5).map(({ boardTitle, chgDtm, emcyYn }) => ({
          boardTitles: boardTitle,
          crtDtm: chgDtm,
          emcyYn,
        })),
      }),
  },
  {
    method: "get",
    pattern: /^\/api\/client\/board\/list$/,
    handler: (params) => {
      const { items, totalElements, totalPages } = paginate(NOTICES, params);
      return ok({ boardList: items, totalElements, totalPages });
    },
  },

  /* 금융기관 - 의뢰목록 */
  {
    method: "get",
    pattern: /^\/api\/client\/request\/list$/,
    handler: (params) => {
      const statuses = REQUEST_TAB_STATUS[params.get("tabSelection") ?? "00"] ?? [];
      const { items, totalElements, totalPages } = paginate(
        REGISTRATIONS.filter((item) => statuses.includes(item.statCd)),
        params,
      );
      return ok({
        rqstList: items.map(({ rqstNo, execDt, crtDtm, statNm, statCd }) => ({
          rqstNo,
          execDt,
          crtDtm,
          statNm,
          statCd,
        })),
        totalElements,
        totalPages,
      });
    },
  },
  {
    method: "get",
    pattern: /^\/api\/client\/request\/info$/,
    handler: (params) => ok(findRegistration(params.get("rqstno")) ?? null),
  },
  {
    method: "post",
    pattern: /^\/api\/client\/request$/,
    // 전자등기 의뢰: 미배정(등기의뢰) 건으로 추가. 나머지 정보는 관리자가 배정할 때 입력합니다.
    handler: (_p, _m, body) => {
      createRegistration({
        rqstNo: nextRequestNo(),
        execDt: toDashedDate(body.execDt) || dateFromToday(0),
        seDt: "",
        dbtrNm: "",
        bndMaxAmt: 0,
        rdnmAddr: "",
        lotnumAddr: "",
        bldg: "",
        unit: "",
      });
      return ok(null, "제출이 완료되었습니다.");
    },
  },
  {
    method: "patch",
    pattern: /^\/api\/client\/request$/,
    // 의뢰 수정: 대출실행일을 고치고, 보완필요 건은 다시 등기의뢰로 돌아갑니다.
    handler: (_p, _m, body) => {
      const target = findRegistration(String(body.rqstNo ?? ""));
      if (target) {
        target.execDt = toDashedDate(body.execDt) || target.execDt;
        if (target.statCd === PROC_STAT_CD.SUPPLEMENT) {
          target.procRsnCnts = "";
          // 다시 제출한 것은 금융기관 (감사기록의 처리자)
          changeStatus(target, PROC_STAT_CD.REQUEST, { crtMembNm: target.clientNm });
        }
      }
      return ok(null, "수정이 완료되었습니다.");
    },
  },

  /* 금융기관 - 전자등기 */
  {
    method: "patch",
    pattern: /^\/api\/client\/registration\/hold$/,
    handler: (_p, _m, body) => {
      const target = findRegistration(String(body.rqstNo ?? ""));
      if (target) changeStatus(target, PROC_STAT_CD.HOLD, { crtMembNm: target.clientNm });
      return ok();
    },
  },
  {
    method: "get",
    pattern: /^\/api\/client\/registration\/(data|accept)$/,
    handler: (params) => ok(findRegistration(params.get("rqstno")) ?? null),
  },
  {
    method: "get",
    pattern: /^\/api\/client\/registration\/search$/,
    handler: (params) => ok(findRegistration(params.get("rqstno"))?.rqstNo ?? null),
  },
  {
    method: "get",
    pattern: /^\/api\/client\/registration\/list$/,
    handler: (params) => {
      const rqstNo = params.get("rqstNo") ?? "";
      const statCd = params.get("statCd") ?? "";
      const acptNo = params.get("acptNo") ?? "";
      const dbtrNm = params.get("dbtrNm") ?? "";
      const fromDate = toDashedDate(params.get("fromDate"));
      const toDate = toDashedDate(params.get("toDate"));
      const dateKey = params.get("searchType") === "RQST" ? "crtDtm" : "execDt";

      const filtered = REGISTRATIONS.filter(
        (item) =>
          (!rqstNo || item.rqstNo.includes(rqstNo)) &&
          (!statCd || item.statCd === statCd) &&
          (!acptNo || item.acptNo.includes(acptNo)) &&
          (!dbtrNm || item.dbtrNm.includes(dbtrNm)) &&
          (!fromDate || item[dateKey] >= fromDate) &&
          (!toDate || item[dateKey] <= toDate),
      );
      const { items, totalElements, totalPages } = paginate(filtered, params);
      return ok({
        rgstrList: items.map(({ rqstNo, crtDtm, execDt, statNm, dbtrNm, statCd, acptNo }) => ({
          rqstNo,
          crtDtm,
          execDt,
          statNm,
          dbtrNm,
          statCd,
          acptNo,
        })),
        totalElements,
        totalPages,
      });
    },
  },

  /* 공통 - 의뢰번호 발급 */
  {
    method: "get",
    pattern: /^\/api\/comm\/sequence$/,
    handler: () => ok(nextRequestNo()),
  },

  /* 인터넷등기소 - 등기고유번호 조회 (가상 번호, 화면 입력칸이 type="number"라 숫자 14자리) */
  {
    method: "get",
    pattern: /^\/api\/api\/iros\/unqrgstrno$/,
    handler: (params) =>
      params.get("rdnmAddr")
        ? ok(`11012026${String(Date.now()).slice(-6)}`)
        : { code: "99", msg: "주소를 입력해 주세요.", data: "" },
  },

  /* 관리자 - 배정관리 */
  {
    method: "get",
    pattern: /^\/api\/admin\/match\/list$/,
    handler: (params) => {
      const statuses = REQUEST_TAB_STATUS[params.get("tabSelection") ?? "00"] ?? [];
      const searchRqstNo = params.get("searchRqstNo") ?? "";
      const filtered = sortBy(
        REGISTRATIONS.filter(
          (item) => statuses.includes(item.statCd) && item.rqstNo.includes(searchRqstNo),
        ),
        params.get("sortOrder"),
      );
      const { items, totalElements, totalPages } = paginate(filtered, params);
      return ok({
        mtchList: items.map(
          ({
            statNm,
            statCd,
            rqstNo,
            execDt,
            clientNm,
            clientMembNo,
            bndNm,
            bndBizNo,
            dbtrNm,
            crtDtm,
            mtchDtm,
          }) => ({
            statNm,
            statCd,
            rqstNo,
            execDt,
            clientNm,
            clientMembNo,
            bndNm,
            bndBizNo,
            dbtrNm,
            crtDtm,
            mtchDtm,
          }),
        ),
        totalElements,
        totalPages,
        unMtchCnt: REGISTRATIONS.filter((item) => REQUEST_TAB_STATUS["00"].includes(item.statCd))
          .length,
      });
    },
  },
  {
    method: "get",
    pattern: /^\/api\/admin\/match\/members\/(\d+)$/,
    handler: (_p, m) => ok(MEMBERS[m[1]] ?? []),
  },
  {
    method: "get",
    pattern: /^\/api\/admin\/match\/([^/]+)$/,
    handler: (_p, m) => ok(findRegistration(m[1]) ?? null),
  },
  {
    // 전자등기 신규 등록 (multipart: req JSON + 파일)
    method: "post",
    pattern: /^\/api\/admin\/match$/,
    handler: (_p, _m, body) => {
      const lawyer = MEMBERS["10"].find((member) => member.membNo === body.lgagMembNo);
      const bank =
        MEMBERS["00"].find((member) => member.bizNo === body.bndBizNo) ?? MEMBERS["00"][0];
      createRegistration({
        rqstNo: String(body.rqstNo || nextRequestNo()),
        execDt: toDashedDate(body.execDt) || dateFromToday(0),
        seDt: toDashedDate(body.seDt),
        dbtrNm: String(body.dbtrNm ?? ""),
        bndMaxAmt: Number(body.bndMaxAmt) || 0,
        rdnmAddr: String(body.rdnmAddr ?? ""),
        lotnumAddr: String(body.lotnumAddr ?? ""),
        bldg: String(body.bldg ?? ""),
        unit: String(body.unit ?? ""),
        unqRgstrNo: String(body.unqRgstrNo ?? ""),
        clientNm: bank.bizNm,
        bndNm: bank.bizNm,
        bndBizNo: bank.bizNo,
        bndMembNm: bank.membNm,
        ...(lawyer
          ? {
              statCd: PROC_STAT_CD.MATCH,
              lgagMembNm: lawyer.membNm,
              lgagMembHpno: "010-0000-0000",
              mtchDtm: dateFromToday(0),
            }
          : {}),
      });
      return ok(null, "등록이 완료되었습니다.");
    },
  },
  {
    // 일괄 배정: 고른 의뢰들에 법무대리인 한 명을 지정 (배정 정보가 빠졌거나 이미 처리된 건은 실패로 돌려줌)
    method: "patch",
    pattern: /^\/api\/admin\/match\/bulk$/,
    handler: (_p, _m, body) => {
      const lawyer = MEMBERS["10"].find((member) => member.membNo === body.lgagMembNo);
      if (!lawyer) return { code: "99", msg: "법무대리인을 선택해 주세요.", data: null };

      const rqstNoList = Array.isArray(body.rqstNoList) ? body.rqstNoList.map(String) : [];
      const successList: string[] = [];
      const failList: { rqstNo: string; reason: string }[] = [];
      [...new Set(rqstNoList)].forEach((rqstNo) => {
        const target = findRegistration(rqstNo);
        const reason = bulkAssignBlocker(target);
        if (reason || !target) {
          failList.push({ rqstNo, reason });
          return;
        }
        Object.assign(target, {
          lgagMembNm: lawyer.membNm,
          lgagMembHpno: "010-0000-0000",
          mtchDtm: dateFromToday(0),
        });
        changeStatus(target, PROC_STAT_CD.MATCH, { procRsnCnts: "일괄 배정" });
        successList.push(rqstNo);
      });
      return ok({ successList, failList }, `${successList.length}건 배정이 완료되었습니다.`);
    },
  },
  {
    // 배정하기 (multipart: req JSON + 파일)
    method: "patch",
    pattern: /^\/api\/admin\/match$/,
    handler: (_p, _m, body) => {
      const target = findRegistration(String(body.rqstNo ?? ""));
      const lawyer =
        MEMBERS["10"].find((member) => member.membNo === body.lgagMembNo) ?? MEMBERS["10"][0];
      if (target) {
        Object.assign(target, {
          dbtrNm: String(body.dbtrNm || target.dbtrNm),
          seDt: toDashedDate(body.seDt) || target.seDt,
          bndMaxAmt: Number(body.bndMaxAmt) || target.bndMaxAmt,
          unqRgstrNo: String(body.unqRgstrNo || target.unqRgstrNo),
          lgagMembNm: lawyer.membNm,
          lgagMembHpno: "010-0000-0000",
          mtchDtm: dateFromToday(0),
        });
        changeStatus(target, PROC_STAT_CD.MATCH);
      }
      return ok(null, "배정이 완료되었습니다.");
    },
  },

  /* 관리자 - 등기관리 */
  {
    method: "get",
    pattern: /^\/api\/admin\/registration\/list$/,
    handler: (params) => {
      const tab = params.get("tabSelection") ?? "";
      const rqstNo = params.get("searchRqstNo") ?? "";
      const fromDate = toDashedDate(params.get("fromDate"));
      const toDate = toDashedDate(params.get("toDate"));
      const dateKey = params.get("searchType") === "RQST" ? "crtDtm" : "execDt";
      const filtered = sortBy(
        REGISTRATIONS.filter(
          (item) =>
            (!tab || item.statCd === tab) &&
            item.rqstNo.includes(rqstNo) &&
            (!fromDate || item[dateKey] >= fromDate) &&
            (!toDate || item[dateKey] <= toDate),
        ),
        params.get("sortOrder"),
      );
      const { items, totalElements, totalPages } = paginate(filtered, params);
      return ok({
        rgstrMngrList: items.map(
          ({ statNm, statCd, execDt, acptRptDtm, rqstNo, bndMembNm, dbtrNm, lgagMembNm }) => ({
            statNm,
            statCd,
            execDt,
            acptRptDtm,
            rqstNo,
            bndMembNm,
            dbtrNm,
            lgagMembNm,
          }),
        ),
        totalElements,
        totalPages,
        rgstrStatistics: registrationStatistics(),
      });
    },
  },
  {
    method: "get",
    pattern: /^\/api\/admin\/registration\/detail$/,
    handler: (params) => {
      const item = findRegistration(params.get("rqstno"));
      return ok(item ? { ...item, docList: documentList(item) } : null);
    },
  },
  {
    method: "get",
    pattern: /^\/api\/admin\/registration\/(data|accept)$/,
    handler: (params) => ok(findRegistration(params.get("rqstno")) ?? null),
  },
  {
    // 접수정보 등록 팝업 (등록된 접수증 이미지 포함)
    method: "get",
    pattern: /^\/api\/admin\/registration\/info$/,
    handler: (params) => {
      const item = findRegistration(params.get("rqstno"));
      if (!item) return ok(null);
      return ok({
        ...item,
        fileList: item.acptNo
          ? [
              {
                seq: item.rqstNo,
                filIdx: "1",
                src: imageSrc(item.rqstNo, "02", 1),
                attcFilNm: "등기접수증_1.svg",
                filSize: 24000,
              },
            ]
          : [],
      });
    },
  },
  {
    method: "get",
    pattern: /^\/api\/admin\/registration\/search$/,
    handler: (params) => ok(findRegistration(params.get("rqstno"))?.rqstNo ?? null),
  },
  {
    // 접수정보 등록 (multipart: reqVo JSON + 접수증 파일)
    method: "post",
    pattern: /^\/api\/admin\/registration\/accept$/,
    handler: (_p, _m, body) => {
      const target = findRegistration(String(body.rqstNo ?? ""));
      if (target) {
        Object.assign(target, {
          acptNo: String(body.acptNo || target.acptNo || "10999"),
          judtCourtCd: String(body.judtCourtCd ?? ""),
          regrCd: String(body.regrCd ?? ""),
          judtCourtNm:
            COMMON_CODES.JUDT_COURT_CD.find((code) => code.code === body.judtCourtCd)?.codeNm ??
            target.judtCourtNm,
          regrNm:
            COMMON_CODES.REGR_CD.find((code) => code.code === body.regrCd)?.codeNm ?? target.regrNm,
          mngrDlvrCnts: String(body.mngrDlvrCnts ?? ""),
          acptRptDtm: dateFromToday(0),
          rgstrAcptYn: "Y",
        });
        changeStatus(target, PROC_STAT_CD.REVIEWING, { crtMembNm: target.lgagMembNm || "관리자" });
      }
      return ok(null, "접수정보가 등록되었습니다.");
    },
  },
  {
    method: "patch",
    pattern: /^\/api\/admin\/registration\/approval$/,
    handler: (_p, _m, body) => {
      const target = findRegistration(String(body.rqstNo ?? ""));
      if (target) changeStatus(target, PROC_STAT_CD.COMPLET);
      return ok(null, "승인이 완료되었습니다.");
    },
  },
  {
    // 보완요청(supplementation)·진행취소(cancel)·반려(reject)
    method: "patch",
    pattern: /^\/api\/admin\/registration\/(supplementation|cancel|reject)$/,
    handler: (_p, m, body) => {
      const statCd = {
        supplementation: PROC_STAT_CD.SUPPLEMENT,
        cancel: PROC_STAT_CD.CANCEL,
        reject: PROC_STAT_CD.RETURN,
      }[m[1]]!;
      const target = findRegistration(String(body.rqstNo ?? ""));
      if (target) {
        const procRsnCnts = String(body.procRsnCnts ?? "");
        if (statCd === PROC_STAT_CD.SUPPLEMENT) target.procRsnCnts = procRsnCnts;
        changeStatus(target, statCd, { procRsnCnts });
      }
      return ok();
    },
  },

  /* 관리자 - 통계 (기간별 처리 건수·처리 시간·반려율). 기간이 없으면 최근 30일, 최대 1년 */
  {
    method: "get",
    pattern: /^\/api\/admin\/statistics$/,
    handler: (params) => {
      const toDate = toDashedDate(params.get("toDate")) || dateFromToday(0);
      const fromDate = toDashedDate(params.get("fromDate")) || dateFromToday(-29);
      const unit = ["DAY", "WEEK", "MONTH"].includes(params.get("unit") ?? "")
        ? params.get("unit")!
        : "DAY";
      // 날짜가 아니면 기간을 돌기 전에 거절 (형식이 틀린 날짜는 문자열 비교로 끝나지 않음)
      if (!isValidDay(fromDate) || !isValidDay(toDate)) {
        return { code: "99", msg: "조회 기간을 날짜로 정해 주세요.", data: null };
      }
      if (fromDate > toDate || daysBetween(fromDate, toDate) > 366) {
        return { code: "99", msg: "조회 기간은 1년 안으로 정해 주세요.", data: null };
      }
      return ok(statistics(fromDate, toDate, unit));
    },
  },

  /* 관리자 - 감사 기록 (누가 언제 무엇을 바꿨는지) */
  {
    method: "get",
    pattern: /^\/api\/admin\/audit\/list$/,
    handler: (params) => {
      const fromDate = toDashedDate(params.get("fromDate"));
      const toDate = toDashedDate(params.get("toDate"));
      const rqstNo = params.get("searchRqstNo") ?? "";
      const membNm = params.get("searchMembNm") ?? "";
      const filtered = auditLog().filter(
        (item) =>
          item.rqstNo.includes(rqstNo) &&
          item.crtMembNm.includes(membNm) &&
          (!fromDate || item.crtDtm.slice(0, 10) >= fromDate) &&
          (!toDate || item.crtDtm.slice(0, 10) <= toDate),
      );
      const { items, totalElements, totalPages } = paginate(filtered, params);
      return ok({ auditList: items, totalElements, totalPages });
    },
  },

  /* 파일 */
  {
    method: "get",
    pattern: /^\/api\/files\/images$/,
    handler: (params) => {
      const rqstNo = params.get("seq") ?? "";
      const attcFilCd = params.get("attcFilCd") ?? "01";
      const count = attcFilCd === "02" ? 1 : 3;
      return ok({
        // 이 API의 execDt는 YYYYMMDD 형식 (utils/dateUtil.stringToDate 기준)
        execDt: (findRegistration(rqstNo)?.execDt ?? "").replaceAll("-", ""),
        imgData: Array.from({ length: count }, (_, i) => ({
          seq: rqstNo,
          filIdx: String(i + 1),
          src: imageSrc(rqstNo, attcFilCd, i + 1),
          attcFilNm: `${attcFilCd === "02" ? "등기접수증" : "등기자료"}_${i + 1}.svg`,
          filSize: 24000, // 업로드 화면에서 용량 합산에 사용하므로 숫자
        })),
      });
    },
  },
  {
    method: "get",
    pattern: /^\/api\/files\/preview\/([^/]+)\/(\d+)\/(\d+)$/,
    handler: (_p, m) =>
      new Blob(
        [
          createDocumentSvg(
            m[2] === "02" ? "등기접수증" : "근저당권 설정계약서",
            m[1],
            Number(m[3]),
          ),
        ],
        {
          type: "image/svg+xml",
        },
      ),
  },
  {
    method: "get",
    pattern: /^\/api\/files\/download\/([^/]+)\/([^/]+)$/,
    handler: () =>
      new Blob(["포트폴리오 데모용 첨부파일입니다.\n실제 파일은 제공되지 않습니다.\n"], {
        type: "text/plain;charset=utf-8",
      }),
  },
];

/* baseURL 유무와 관계없이 "/api/..." 경로와 쿼리스트링을 추출 */
const parseRequest = (config: InternalAxiosRequestConfig) => {
  const raw = config.url ?? "";
  const apiIndex = raw.indexOf("/api/");
  const pathWithQuery = apiIndex >= 0 ? raw.slice(apiIndex) : raw;
  const [path, query = ""] = pathWithQuery.split("?");
  const params = new URLSearchParams(query);
  // axios와 같이 null·undefined 값은 쿼리에서 제외
  Object.entries(config.params ?? {}).forEach(([key, value]) => {
    if (value !== null && value !== undefined) params.set(key, String(value));
  });
  return { path, params };
};

/* JSON 문자열 또는 multipart(FormData의 req·reqVo·rqstCrtReq JSON 필드, 그 외 문자열 필드) 요청 본문을 객체로 바꿉니다. */
const parseBody = (data: unknown): Body => {
  if (typeof FormData !== "undefined" && data instanceof FormData) {
    const json = data.get("req") ?? data.get("reqVo") ?? data.get("rqstCrtReq");
    if (json) return parseBody(json);
    return Object.fromEntries([...data.entries()].filter(([, value]) => typeof value === "string"));
  }
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return {};
};

export const mockAdapter = (config: InternalAxiosRequestConfig): Promise<AxiosResponse> =>
  new Promise((resolve, reject) => {
    const method = (config.method ?? "get").toLowerCase();
    const { path, params } = parseRequest(config);

    setTimeout(() => {
      for (const route of routes) {
        const match = route.method === method ? path.match(route.pattern) : null;
        if (match) {
          const data = route.handler(params, match, parseBody(config.data));
          // 조회가 아닌 요청(등록·수정·상태 변경)은 결과를 저장해 새로고침 후에도 유지
          if (method !== "get") saveDemoState();
          resolve({
            data,
            status: 200,
            statusText: "OK",
            headers: {},
            config,
          });
          return;
        }
      }

      const response: AxiosResponse = {
        data: { code: "99", msg: "데모 모드에서 지원하지 않는 API입니다." },
        status: 404,
        statusText: "Not Found",
        headers: {},
        config,
      };
      reject(
        new AxiosError(
          `Mock API not found: ${method.toUpperCase()} ${path}`,
          "ERR_BAD_REQUEST",
          config,
          null,
          response,
        ),
      );
    }, RESPONSE_DELAY_MS);
  });
