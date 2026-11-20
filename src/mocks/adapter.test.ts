import { InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PROC_STAT_CD } from "@constants/code";

/** 테스트마다 모듈을 새로 불러와 목업 데이터를 초기 상태로 만듭니다. (sessionStorage에 저장된 값은 그대로 읽음) */
async function loadAdapter() {
  vi.resetModules();
  const { mockAdapter } = await import("./adapter");
  return async (method: string, url: string, data?: unknown) => {
    const pending = mockAdapter({
      method,
      url,
      data,
      headers: {},
    } as unknown as InternalAxiosRequestConfig).then((response) => response.data);
    // 타이머를 돌리는 동안 거절되어도 "처리되지 않은 거절"이 되지 않도록 미리 처리기를 붙여 둠 (결과는 아래에서 그대로 전달)
    pending.catch(() => {});
    await vi.runAllTimersAsync(); // 응답 지연(setTimeout) 건너뛰기
    return pending;
  };
}

describe("mockAdapter (데모 모드 목업 API)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("관리자 배정관리 미배정 탭은 등기의뢰·보완필요만 돌려준다", async () => {
    const request = await loadAdapter();
    const { data } = await request(
      "get",
      "/api/admin/match/list?tabSelection=00&searchRqstNo=&sortOrder=00&pageNum=1&pageSize=50",
    );

    expect(data.mtchList.length).toBeGreaterThan(0);
    expect(data.unMtchCnt).toBe(data.mtchList.length);
    for (const item of data.mtchList) {
      expect([PROC_STAT_CD.REQUEST, PROC_STAT_CD.SUPPLEMENT]).toContain(item.statCd);
    }
  });

  it("관리자 등기관리 목록의 탭 건수 합계는 전체 건수와 같다", async () => {
    const request = await loadAdapter();
    const { data } = await request(
      "get",
      "/api/admin/registration/list?tabSelection=&pageNum=1&pageSize=50",
    );
    const { total, ...tabs } = data.rgstrStatistics;

    expect(data.totalElements).toBe(total);
    expect(Object.values(tabs).reduce((sum: number, count) => sum + Number(count), 0)).toBe(total);
  });

  it("등기접수증을 승인하면 접수완료가 되고 진행 이력이 추가된다", async () => {
    const request = await loadAdapter();
    const { data: list } = await request(
      "get",
      "/api/admin/registration/list?tabSelection=40&pageNum=1&pageSize=50",
    );
    const { rqstNo } = list.rgstrMngrList[0];

    const result = await request(
      "patch",
      "/api/admin/registration/approval",
      JSON.stringify({ rqstNo }),
    );
    expect(result.code).toBe("00");

    const { data: detail } = await request(
      "get",
      `/api/admin/registration/detail?rqstno=${rqstNo}`,
    );
    expect(detail.statCd).toBe(PROC_STAT_CD.COMPLET);
    expect(detail.statHistList[0].statNm).toBe("접수완료");
  });

  it("보완요청 사유는 금융기관 의뢰 정보에도 반영된다", async () => {
    const request = await loadAdapter();
    const { data: list } = await request(
      "get",
      "/api/admin/match/list?tabSelection=00&pageNum=1&pageSize=50",
    );
    const { rqstNo } = list.mtchList.find(
      (item: { statCd: string }) => item.statCd === PROC_STAT_CD.REQUEST,
    );

    await request(
      "patch",
      "/api/admin/registration/supplementation",
      JSON.stringify({ rqstNo, procRsnCnts: "필수 서류 누락" }),
    );

    const { data: info } = await request("get", `/api/client/request/info?rqstno=${rqstNo}`);
    expect(info.statCd).toBe(PROC_STAT_CD.SUPPLEMENT);
    expect(info.procRsnCnts).toBe("필수 서류 누락");
  });

  it("multipart(FormData의 req JSON)로 신규 등록하면 새 의뢰번호로 목록에 추가된다", async () => {
    const request = await loadAdapter();
    const { data: rqstNo } = await request("get", "/api/comm/sequence?sequence=RQST_NO");

    const form = new FormData();
    form.append(
      "req",
      JSON.stringify({ rqstNo, dbtrNm: "테스트채무자", lgagMembNo: "LAW1", execDt: "20261110" }),
    );
    expect((await request("post", "/api/admin/match", form)).code).toBe("00");

    const { data: created } = await request("get", `/api/admin/match/${rqstNo}`);
    // 폼이 보내는 YYYYMMDD 날짜는 YYYY-MM-DD로 저장하고, 접수 전이므로 법원·등기소는 비어 있음
    expect(created).toMatchObject({
      rqstNo,
      dbtrNm: "테스트채무자",
      execDt: "2026-11-10",
      statCd: PROC_STAT_CD.MATCH,
      lgagMembNm: "데모 법무법인",
      judtCourtNm: "",
      regrNm: "",
    });
  });

  it("금융기관이 전자등기를 의뢰하면 새 의뢰번호의 미배정 건으로 관리자 목록에 추가된다", async () => {
    const request = await loadAdapter();
    const form = new FormData();
    form.append("execDt", "20991231");
    form.append("multipartFiles", new File(["x"], "계약서.png"));

    await request("post", "/api/client/request", form);

    const { data } = await request(
      "get",
      "/api/admin/match/list?tabSelection=00&pageNum=1&pageSize=50&sortOrder=00",
    );
    const created = data.mtchList.find((item: { rqstNo: string }) => item.rqstNo === "DEMO-002401");
    expect(created).toMatchObject({ execDt: "2099-12-31", statCd: PROC_STAT_CD.REQUEST });
  });

  it("보완필요 건을 수정해 제출하면 등기의뢰로 돌아가고 사유가 지워진다", async () => {
    const request = await loadAdapter();
    const form = new FormData();
    form.append("rqstCrtReq", JSON.stringify({ rqstNo: "DEMO-002399", execDt: "20991231" }));

    await request("patch", "/api/client/request", form);

    const { data } = await request("get", "/api/client/request/info?rqstno=DEMO-002399");
    expect(data).toMatchObject({
      statCd: PROC_STAT_CD.REQUEST,
      execDt: "2099-12-31",
      procRsnCnts: "",
    });
    // 감사기록의 처리자는 다시 제출한 금융기관
    const { data: audit } = await request(
      "get",
      "/api/admin/audit/list?searchRqstNo=DEMO-002399&pageNum=1&pageSize=1",
    );
    expect(audit.auditList[0]).toMatchObject({ aftStatNm: "등기의뢰", crtMembNm: data.clientNm });
    expect(data.clientNm).toBeTruthy();
    expect(data.clientNm).not.toBe("관리자");
  });

  it("변경 내용은 sessionStorage에 저장되어 새로고침(모듈 재로딩) 후에도 유지된다", async () => {
    let request = await loadAdapter();
    const { data: list } = await request(
      "get",
      "/api/admin/registration/list?tabSelection=40&pageNum=1&pageSize=50",
    );
    const { rqstNo } = list.rgstrMngrList[0];
    await request("patch", "/api/admin/registration/approval", JSON.stringify({ rqstNo }));

    request = await loadAdapter();
    const { data: detail } = await request(
      "get",
      `/api/admin/registration/detail?rqstno=${rqstNo}`,
    );
    expect(detail.statCd).toBe(PROC_STAT_CD.COMPLET);
  });

  it("일괄 배정: 고른 미배정 건에 법무대리인을 지정하고, 배정할 수 없는 건은 사유와 함께 돌려준다", async () => {
    const request = await loadAdapter();
    // 금융기관이 막 의뢰한 건은 배정 정보(채무자 등)가 없음
    const form = new FormData();
    form.append("execDt", "20991231");
    await request("post", "/api/client/request", form);

    const response = await request(
      "patch",
      "/api/admin/match/bulk",
      JSON.stringify({
        // 002400: 등기의뢰, 002399: 보완필요, 002398: 이미 배정완료, 002401: 새 의뢰(정보 없음)
        rqstNoList: ["DEMO-002400", "DEMO-002399", "DEMO-002398", "DEMO-002401", "DEMO-999999"],
        lgagMembNo: "LAW2",
      }),
    );

    expect(response.code).toBe("00");
    expect(response.data.successList).toEqual(["DEMO-002400", "DEMO-002399"]);
    expect(response.data.failList).toEqual([
      { rqstNo: "DEMO-002398", reason: "이미 배정완료 상태입니다." },
      {
        rqstNo: "DEMO-002401",
        reason:
          "배정 정보가 없습니다(채무자, 담보목적물 주소, 채권최고액, 설정약정일, 등기고유번호). 배정 화면에서 입력해 주세요.",
      },
      { rqstNo: "DEMO-999999", reason: "의뢰를 찾을 수 없습니다." },
    ]);

    const { data: assigned } = await request("get", "/api/admin/match/DEMO-002400");
    expect(assigned).toMatchObject({
      statCd: PROC_STAT_CD.MATCH,
      lgagMembNm: "샘플 법무사사무소",
    });
    // 진행 이력에 일괄 배정으로 남음 (감사 기록)
    expect(assigned.statHistList[0]).toMatchObject({
      statNm: "배정완료",
      procRsnCnts: "일괄 배정",
    });
  });

  it("일괄 배정: 법무대리인이 없으면 처리하지 않는다", async () => {
    const request = await loadAdapter();
    const response = await request(
      "patch",
      "/api/admin/match/bulk",
      JSON.stringify({ rqstNoList: ["DEMO-002400"], lgagMembNo: "" }),
    );
    expect(response.code).toBe("99");

    const { data } = await request("get", "/api/admin/match/DEMO-002400");
    expect(data.statCd).toBe(PROC_STAT_CD.REQUEST);
  });

  it("감사 기록: 진행 이력을 누가·언제·무엇을 한 줄씩 최근 순으로, 조건으로 좁혀 돌려준다", async () => {
    const request = await loadAdapter();
    await request(
      "patch",
      "/api/admin/match/bulk",
      JSON.stringify({ rqstNoList: ["DEMO-002400"], lgagMembNo: "LAW1" }),
    );

    const { data } = await request("get", "/api/admin/audit/list?pageNum=1&pageSize=5");
    expect(data.auditList).toHaveLength(5);
    expect(data.totalPages).toBe(Math.ceil(data.totalElements / 5));
    // 방금 바꾼 기록이 맨 위, 시각까지 남음
    expect(data.auditList[0]).toMatchObject({
      rqstNo: "DEMO-002400",
      crtMembNm: "관리자",
      actnNm: "상태 변경",
      bfrStatNm: "등기의뢰",
      aftStatNm: "배정완료",
      rsnCnts: "일괄 배정",
    });
    expect(data.auditList[0].crtDtm).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);

    const { data: byRequest } = await request(
      "get",
      "/api/admin/audit/list?searchRqstNo=DEMO-002400&pageNum=1&pageSize=50",
    );
    expect(byRequest.auditList.map((item: { aftStatNm: string }) => item.aftStatNm)).toEqual([
      "배정완료",
      "등기의뢰",
    ]);
    expect(byRequest.auditList.at(-1)).toMatchObject({ actnNm: "의뢰 등록", bfrStatNm: "" });

    const { data: byMember } = await request(
      "get",
      "/api/admin/audit/list?searchMembNm=데모 법무법인&pageNum=1&pageSize=100",
    );
    expect(byMember.totalElements).toBeGreaterThan(0);
    expect(
      byMember.auditList.every((item: { crtMembNm: string }) => item.crtMembNm === "데모 법무법인"),
    ).toBe(true);

    // 미래 기간에는 기록 없음
    const { data: future } = await request(
      "get",
      "/api/admin/audit/list?fromDate=20990101&toDate=20991231&pageNum=1&pageSize=10",
    );
    expect(future.totalElements).toBe(0);
  });

  it("감사 기록: 같은 시각에 여러 번 바뀌어도 한 의뢰의 기록은 최근이 앞이다(10번째 이후 포함)", async () => {
    const request = await loadAdapter();
    const { REGISTRATIONS, changeStatus } = await import("./data");
    const target = REGISTRATIONS.find((item) => item.rqstNo === "DEMO-002400")!;
    for (let order = 1; order <= 10; order += 1) {
      changeStatus(target, order % 2 ? PROC_STAT_CD.HOLD : PROC_STAT_CD.REQUEST, {
        procRsnCnts: `순서 ${order}`,
      });
    }

    const { data } = await request(
      "get",
      "/api/admin/audit/list?searchRqstNo=DEMO-002400&pageNum=1&pageSize=50",
    );
    expect(data.auditList.slice(0, 10).map((item: { rsnCnts: string }) => item.rsnCnts)).toEqual(
      Array.from({ length: 10 }, (_, index) => `순서 ${10 - index}`),
    );
  });

  it("통계: 기간 안의 의뢰·접수완료·반려·취소 건수와 반려율·평균 처리 일수를 단위별로 돌려준다", async () => {
    const { REGISTRATIONS, dateFromToday } = await import("./data");
    const request = await loadAdapter();
    const from = dateFromToday(-29);
    const to = dateFromToday(0);
    const compact = (date: string) => date.replaceAll("-", "");

    const { data } = await request(
      "get",
      `/api/admin/statistics?fromDate=${compact(from)}&toDate=${compact(to)}&unit=DAY`,
    );
    expect(data).toMatchObject({ fromDate: from, toDate: to, unit: "DAY" });
    expect(data.periodList).toHaveLength(30);
    expect(data.periodList[0].fromDate).toBe(from);

    // 목업 데이터에서 직접 센 값과 같음
    const inRange = (date: string) => date >= from && date <= to;
    const histories = (statNm: string) =>
      REGISTRATIONS.flatMap((item) =>
        item.statHistList
          .filter((history) => history.statNm === statNm && inRange(history.crtDtm))
          .map((history) => ({ item, history })),
      );
    const cmpt = histories("접수완료");
    const rtun = histories("접수반려");
    expect(data.summary).toMatchObject({
      rqstCnt: REGISTRATIONS.filter((item) => inRange(item.crtDtm)).length,
      cmptCnt: cmpt.length,
      rtunCnt: rtun.length,
      cnclCnt: histories("진행취소").length,
      rtunRate: Math.round((rtun.length / (cmpt.length + rtun.length)) * 1000) / 10,
    });
    const days = cmpt.map(
      ({ item, history }) =>
        (new Date(history.crtDtm).getTime() - new Date(item.crtDtm).getTime()) / 86_400_000,
    );
    expect(data.summary.avgProcDays).toBe(
      Math.round((days.reduce((a, b) => a + b, 0) / days.length) * 10) / 10,
    );
    // 행의 합은 요약과 같음
    const sum = (key: string) =>
      data.periodList.reduce((total: number, row: Record<string, number>) => total + row[key], 0);
    expect(sum("rqstCnt")).toBe(data.summary.rqstCnt);
    expect(sum("cmptCnt")).toBe(data.summary.cmptCnt);

    // 주별은 월요일 시작, 월별은 1일 시작 (첫 행은 조회 시작일로 잘림)
    const { data: weekly } = await request(
      "get",
      `/api/admin/statistics?fromDate=${compact(from)}&toDate=${compact(to)}&unit=WEEK`,
    );
    weekly.periodList
      .slice(1)
      .forEach((row: { fromDate: string }) => expect(new Date(row.fromDate).getDay()).toBe(1));
    expect(sum("rqstCnt")).toBe(
      weekly.periodList.reduce((t: number, row: { rqstCnt: number }) => t + row.rqstCnt, 0),
    );
    const { data: monthly } = await request(
      "get",
      `/api/admin/statistics?fromDate=${compact(from)}&toDate=${compact(to)}&unit=MONTH`,
    );
    monthly.periodList
      .slice(1)
      .forEach((row: { fromDate: string }) => expect(row.fromDate.endsWith("-01")).toBe(true));
  });

  it("통계: 기간이 거꾸로이거나 1년을 넘으면 처리하지 않고, 처리한 건이 없으면 비율은 null", async () => {
    const request = await loadAdapter();
    expect(
      (await request("get", "/api/admin/statistics?fromDate=20261120&toDate=20261101&unit=DAY"))
        .code,
    ).toBe("99");
    expect(
      (await request("get", "/api/admin/statistics?fromDate=20240101&toDate=20261120&unit=DAY"))
        .code,
    ).toBe("99");

    const { data } = await request(
      "get",
      "/api/admin/statistics?fromDate=20990101&toDate=20990107&unit=DAY",
    );
    expect(data.summary).toEqual({
      rqstCnt: 0,
      cmptCnt: 0,
      rtunCnt: 0,
      cnclCnt: 0,
      rtunRate: null,
      avgProcDays: null,
    });
  });

  it("등록되지 않은 API는 404로 거절한다", async () => {
    const request = await loadAdapter();
    await expect(request("get", "/api/unknown")).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});
