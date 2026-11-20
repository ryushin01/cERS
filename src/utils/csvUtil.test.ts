import { describe, expect, it, vi } from "vitest";

import { csvFileName, escapeCsvCell, fetchAllPages, toCsv } from "./csvUtil";

describe("csvUtil", () => {
  it("쉼표·따옴표·줄바꿈이 든 값은 따옴표로 감싼다", () => {
    expect(escapeCsvCell("서울특별시 중구, 101동")).toBe('"서울특별시 중구, 101동"');
    expect(escapeCsvCell('데모 "법무" 법인')).toBe('"데모 ""법무"" 법인"');
    expect(escapeCsvCell("첫 줄\n둘째 줄")).toBe('"첫 줄\n둘째 줄"');
    expect(escapeCsvCell("DEMO-002400")).toBe("DEMO-002400");
  });

  it("수식으로 실행될 수 있는 글자 값은 앞에 '를 붙이고, 숫자는 그대로 둔다", () => {
    expect(escapeCsvCell('=HYPERLINK("http://example.com")')).toBe(
      '"\'=HYPERLINK(""http://example.com"")"',
    );
    expect(escapeCsvCell("+821000000000")).toBe("'+821000000000");
    expect(escapeCsvCell("-1")).toBe("'-1");
    expect(escapeCsvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(escapeCsvCell(-1)).toBe("-1");
    expect(escapeCsvCell(120_000_000)).toBe("120000000");
    expect(escapeCsvCell(Number.NaN)).toBe("");
    expect(escapeCsvCell(null)).toBe("");
    expect(escapeCsvCell(undefined)).toBe("");
  });

  it("머리 줄과 행을 CRLF로 잇는다", () => {
    const csv = toCsv(
      [
        { rqstNo: "DEMO-002400", dbtrNm: "김민준", amount: 120_000_000 },
        { rqstNo: "DEMO-002399", dbtrNm: "", amount: 0 },
      ],
      [
        { header: "의뢰번호", value: (row) => row.rqstNo },
        { header: "채무자", value: (row) => row.dbtrNm },
        { header: "채권최고액(원)", value: (row) => row.amount },
      ],
    );
    expect(csv).toBe(
      "의뢰번호,채무자,채권최고액(원)\r\nDEMO-002400,김민준,120000000\r\nDEMO-002399,,0",
    );
  });

  it("파일 이름은 제목과 날짜, 파일 이름에 쓸 수 없는 문자는 _로", () => {
    expect(csvFileName("등기관리 목록", new Date(2026, 10, 20))).toBe("등기관리 목록_20261120.csv");
    expect(csvFileName("배정관리/미배정", new Date(2026, 0, 5))).toBe(
      "배정관리_미배정_20260105.csv",
    );
  });

  it("목록 API를 끝 쪽까지 차례로 불러 모으고, 최대 행 수에서 멈춘다", async () => {
    const all = Array.from({ length: 25 }, (_, i) => i + 1);
    const fetchPage = vi.fn(async (pageNum: number, pageSize: number) => ({
      items: all.slice((pageNum - 1) * pageSize, pageNum * pageSize),
      totalPages: Math.ceil(all.length / pageSize),
    }));

    expect(await fetchAllPages(fetchPage, { pageSize: 10 })).toEqual({
      rows: all,
      truncated: false,
    });
    expect(fetchPage).toHaveBeenCalledTimes(3);

    fetchPage.mockClear();
    expect(await fetchAllPages(fetchPage, { pageSize: 10, maxRows: 15 })).toEqual({
      rows: all.slice(0, 15),
      truncated: true,
    });
    expect(fetchPage).toHaveBeenCalledTimes(2);

    // 빈 목록도 한 번만 부름
    const empty = vi.fn(async () => ({ items: [], totalPages: 0 }));
    expect(await fetchAllPages(empty)).toEqual({ rows: [], truncated: false });
    expect(empty).toHaveBeenCalledTimes(1);
  });
});
