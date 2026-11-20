/**
 * CSV 내보내기 유틸 (엑셀에서 바로 열 수 있는 UTF-8 CSV)
 * - 새 의존성 없이 CSV를 만들고, 맨 앞에 BOM(﻿)을 붙여 엑셀이 한글을 UTF-8로 읽게 합니다.
 * - 쉼표·따옴표·줄바꿈이 든 값은 따옴표로 감싸고 따옴표는 두 번 씁니다. (RFC 4180, 줄 끝 CRLF)
 * - 수식 주입(CSV injection) 방지: = + - @ 탭 CR LF로 시작하는 글자 값은 앞에 '를 붙여 엑셀이 수식으로 실행하지 않게 합니다.
 *   숫자 값(number)은 그대로 둡니다.
 */

export type CsvValue = string | number | null | undefined;

export type CsvColumn<T> = {
  header: string;
  value: (row: T) => CsvValue;
};

const FORMULA_PREFIX = /^[=+\-@\t\r\n]/;

export function escapeCsvCell(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  const text = FORMULA_PREFIX.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const lines = [
    columns.map(({ header }) => escapeCsvCell(header)),
    ...rows.map((row) => columns.map(({ value }) => escapeCsvCell(value(row)))),
  ];
  return lines.map((cells) => cells.join(",")).join("\r\n");
}

/** 파일 이름: "{제목}_{YYYYMMDD}.csv" (파일 이름에 쓸 수 없는 문자는 _로) */
export function csvFileName(title: string, date: Date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const ymd = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  return `${title.replace(/[\\/:*?"<>|]/g, "_")}_${ymd}.csv`;
}

/** CSV 글을 BOM과 함께 파일로 내려받습니다. */
export function downloadCsv(fileName: string, csv: string) {
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.hidden = true;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // 다운로드가 시작된 뒤 주소를 해제
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

type ApiEnvelope = { code?: string; msg?: string | null };

/**
 * 목록 API 응답(code·msg·data)을 확인해 돌려줍니다. 내보내기의 fetchPage에서 씁니다.
 * 업무 실패(HTTP 200 + code가 "00"이 아님)는 msg를 담은 오류로 던져, 한 쪽이라도 실패하면
 * 일부만 담긴 파일을 "모두 내보냈다"고 내려받지 않고 내보내기 전체를 실패로 알립니다.
 */
export function okListResponse<R extends ApiEnvelope>(response: R | null | undefined): R {
  if (response?.code !== "00") {
    throw new Error(response?.msg || "목록을 불러오지 못했습니다.");
  }
  return response;
}

/** 내보내기 한 번에 받을 최대 행 수 (목록 API를 여러 번 불러 모음) */
export const CSV_EXPORT_PAGE_SIZE = 100;
export const CSV_EXPORT_MAX_ROWS = 10_000;

/**
 * 목록 API를 첫 쪽부터 끝 쪽까지 차례로 불러 모든 행을 모읍니다. (화면의 조회 조건 그대로)
 * 너무 많으면 CSV_EXPORT_MAX_ROWS에서 멈추고 truncated를 알려 줍니다.
 */
export async function fetchAllPages<T>(
  fetchPage: (pageNum: number, pageSize: number) => Promise<{ items: T[]; totalPages: number }>,
  { pageSize = CSV_EXPORT_PAGE_SIZE, maxRows = CSV_EXPORT_MAX_ROWS } = {},
) {
  const rows: T[] = [];
  let totalPages = 1;
  for (let pageNum = 1; pageNum <= totalPages; pageNum += 1) {
    const page = await fetchPage(pageNum, pageSize);
    rows.push(...page.items);
    totalPages = Math.max(page.totalPages || 1, 1);
    if (rows.length >= maxRows) {
      return {
        rows: rows.slice(0, maxRows),
        truncated: pageNum < totalPages || rows.length > maxRows,
      };
    }
  }
  return { rows, truncated: false };
}
