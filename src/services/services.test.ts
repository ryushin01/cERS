import { AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * services 함수가 만드는 요청(메서드·주소·쿼리·본문·baseURL)을 확인합니다.
 * axios 어댑터를 가로채 실제 네트워크 대신 요청 설정만 기록합니다.
 * 쿼리는 axios가 최종으로 만드는 URL을 다시 해석해서 검사하므로, 값에 &·#·+ 같은 문자가 있어도
 * 서버가 받는 값이 원래 입력과 같은지 확인할 수 있습니다.
 */

const APP_URI = "https://app.example.com";
const ADMIN_URI = "https://admin.example.com";
const API_URI = "https://api.example.com";

// 사용자가 입력할 수 있는 값 중 쿼리 문자열을 깨뜨리기 쉬운 문자를 섞은 예시
const TRICKY = "A&B #1+2=3?";

let requests: InternalAxiosRequestConfig[] = [];
let services: {
  assignDetail: typeof import("./assignDetail");
  adminAssign: typeof import("./adminAssign");
  file: typeof import("./file");
  home: typeof import("./home");
  registrationManagement: typeof import("./registrationManagement");
  request: typeof import("./request");
  statusInquiry: typeof import("./statusInquiry");
};

beforeAll(async () => {
  vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "false");
  vi.stubEnv("NEXT_PUBLIC_APP_URI", APP_URI);
  vi.stubEnv("NEXT_PUBLIC_ADMIN_URI", ADMIN_URI);
  vi.stubEnv("NEXT_PUBLIC_API_URI", API_URI);
  vi.resetModules();

  const { axiosBasicInstance } = await import("@services");
  axiosBasicInstance.defaults.adapter = async (config) => {
    requests.push(config);
    return { data: { code: "00", data: null }, status: 200, statusText: "OK", headers: {}, config };
  };

  services = {
    assignDetail: await import("./assignDetail"),
    adminAssign: await import("./adminAssign"),
    file: await import("./file"),
    home: await import("./home"),
    registrationManagement: await import("./registrationManagement"),
    request: await import("./request"),
    statusInquiry: await import("./statusInquiry"),
  };
});

afterAll(() => {
  vi.unstubAllEnvs();
});

beforeEach(() => {
  requests = [];
});

/** 마지막 요청을 서버가 받는 형태(origin, pathname, 쿼리 값)로 풀어서 돌려줍니다. */
async function lastRequest() {
  const { default: axios } = await import("axios");
  const config = requests.at(-1)!;
  const url = new URL(axios.getUri(config as AxiosRequestConfig));
  return {
    method: (config.method ?? "get").toLowerCase(),
    origin: url.origin,
    path: decodeURIComponent(url.pathname),
    query: Object.fromEntries(url.searchParams),
    data: config.data,
    headers: config.headers,
  };
}

describe("조회 요청의 쿼리 값", () => {
  it("등기고유번호 조회: 주소에 특수문자가 있어도 그대로 전달된다 (외부 API 서버)", async () => {
    const address = "서울특별시 중구 세종대로 110 (A&B타워 #1)";
    await services.assignDetail.getUnqRgsrtNo({
      rdnmAddr: address,
      lotnumAddrCd: "01",
      bldg: "101",
      unit: "1001",
    });

    expect(await lastRequest()).toMatchObject({
      method: "get",
      origin: API_URI,
      path: "/api/api/iros/unqrgstrno",
      query: { rdnmAddr: address, lotnumAddrCd: "01", bldg: "101", unit: "1001" },
    });
  });

  it("현황조회 목록: 검색어(의뢰번호·접수번호·채무자)가 그대로 전달된다", async () => {
    await services.statusInquiry.getStasusListData({
      page: 2,
      size: 10,
      rqstNo: TRICKY,
      statCd: "60",
      acptNo: "10#2",
      searchType: "EXEC",
      fromDate: "2026-11-01",
      toDate: "2026-11-30",
      dbtrNm: "김&이",
    });

    expect(await lastRequest()).toMatchObject({
      origin: APP_URI,
      path: "/api/client/registration/list",
      query: {
        pageNum: "2",
        pageSize: "10",
        rqstNo: TRICKY,
        statCd: "60",
        acptNo: "10#2",
        searchType: "EXEC",
        fromDate: "2026-11-01",
        toDate: "2026-11-30",
        dbtrNm: "김&이",
      },
    });
  });

  it("관리자 배정관리 목록: 의뢰번호 검색어가 그대로 전달된다 (관리자 서버)", async () => {
    await services.adminAssign.getSupplimentListData({
      searchRqstNo: TRICKY,
      tabSelection: "00",
      sortOrder: "01",
      pageNum: 1,
      pageSize: 50,
    });

    expect(await lastRequest()).toMatchObject({
      origin: ADMIN_URI,
      path: "/api/admin/match/list",
      query: {
        searchRqstNo: TRICKY,
        tabSelection: "00",
        sortOrder: "01",
        pageNum: "1",
        pageSize: "50",
      },
    });
  });

  it("관리자 등기관리 목록: 의뢰번호 검색어가 searchRqstNo로 전달된다", async () => {
    await services.registrationManagement.getRegistrationListData({
      tabSelection: "40",
      rqstNo: TRICKY,
      searchType: "RQST",
      fromDate: "",
      toDate: "",
      sortOrder: "00",
      page: 1,
      size: 50,
    });

    expect(await lastRequest()).toMatchObject({
      origin: ADMIN_URI,
      path: "/api/admin/registration/list",
      query: {
        tabSelection: "40",
        searchRqstNo: TRICKY,
        searchType: "RQST",
        fromDate: "",
        toDate: "",
      },
    });
  });

  it.each([
    ["getSearchBankRgstData", "home", APP_URI, "/api/client/registration/search"],
    ["getSearchAdminRgstData", "home", ADMIN_URI, "/api/admin/registration/search"],
    ["getRequestInfoData", "request", APP_URI, "/api/client/request/info"],
    ["getRegistrationInfoData", "request", APP_URI, "/api/client/registration/data"],
    ["getRegistrationAcceptData", "request", APP_URI, "/api/client/registration/accept"],
    [
      "getRegistrationDetailData",
      "registrationManagement",
      ADMIN_URI,
      "/api/admin/registration/detail",
    ],
    ["getRegistrationData", "registrationManagement", ADMIN_URI, "/api/admin/registration/data"],
    [
      "getRegistrationInformationData",
      "registrationManagement",
      ADMIN_URI,
      "/api/admin/registration/info",
    ],
  ] as const)("%s: 의뢰번호(rqstno)가 그대로 전달된다", async (name, module, origin, path) => {
    const service = (
      services[module] as unknown as Record<string, (rqstno: string) => Promise<unknown>>
    )[name];
    await service(TRICKY);
    expect(await lastRequest()).toMatchObject({ origin, path, query: { rqstno: TRICKY } });
  });

  it("배정 등록정보 조회: 의뢰번호를 경로에 넣을 때 인코딩한다", async () => {
    await services.adminAssign.getSupplimentData("DEMO/002400");
    const { path } = await lastRequest();
    expect(path).toBe("/api/admin/match/DEMO/002400");
    expect(requests.at(-1)!.url).toContain("DEMO%2F002400");
  });

  it("등기자료 이미지 조회: 의뢰번호가 없으면 문자열 'null'을 보내지 않는다", async () => {
    await services.file.getRegistrationImages(null, "01");
    const { query } = await lastRequest();
    expect(query.seq).not.toBe("null");
    expect(query.attcFilCd).toBe("01");
  });

  it("목록 조회 기본값: 의뢰목록·공지사항", async () => {
    await services.request.getRequestListData({ tabSelection: "01", page: 3, size: 10 });
    expect((await lastRequest()).query).toEqual({
      tabSelection: "01",
      pageNum: "3",
      pageSize: "10",
    });

    await services.home.getNoticeBoardList({ page: 1, size: 5 });
    expect(await lastRequest()).toMatchObject({
      path: "/api/client/board/list",
      query: { pageNum: "1", pageSize: "5" },
    });
  });
});

describe("변경 요청의 메서드·본문", () => {
  it("진행보류: PATCH, 본문에 의뢰번호", async () => {
    await services.request.patchRegistrationHold("DEMO-002400");
    const req = await lastRequest();
    expect(req).toMatchObject({ method: "patch", path: "/api/client/registration/hold" });
    expect(JSON.parse(req.data)).toEqual({ rqstNo: "DEMO-002400" });
  });

  it("등기접수증 승인: PATCH, 관리자 서버", async () => {
    await services.registrationManagement.patchRegistrationApproval("DEMO-002396");
    const req = await lastRequest();
    expect(req).toMatchObject({
      method: "patch",
      origin: ADMIN_URI,
      path: "/api/admin/registration/approval",
    });
    expect(JSON.parse(req.data)).toEqual({ rqstNo: "DEMO-002396" });
  });

  it("일괄 배정: PATCH, 관리자 서버, 본문에 의뢰번호 목록과 법무대리인", async () => {
    await services.adminAssign.patchBulkAssign({
      rqstNoList: ["DEMO-002400", "DEMO-002399"],
      lgagMembNo: "LAW1",
    });
    const req = await lastRequest();
    expect(req).toMatchObject({
      method: "patch",
      origin: ADMIN_URI,
      path: "/api/admin/match/bulk",
    });
    expect(JSON.parse(req.data)).toEqual({
      rqstNoList: ["DEMO-002400", "DEMO-002399"],
      lgagMembNo: "LAW1",
    });
  });

  it("의뢰 등록: multipart로 POST", async () => {
    const form = new FormData();
    form.append("req", "{}");
    await services.request.postRequestData(form);
    const req = await lastRequest();
    expect(req).toMatchObject({ method: "post", path: "/api/client/request" });
    expect(req.data).toBeInstanceOf(FormData);
  });
});
