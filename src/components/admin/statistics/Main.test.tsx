import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getStatistics } from "@services/adminStatistics";
import { getDateString, getTodayAddDays } from "@utils/dateUtil";
import { mockDesktopMatchMedia, renderWithProviders } from "@/test/renderWithProviders";

import Main, { formatCount, formatDays, formatRate, periodLabel } from "./Main";

/* 통합 테스트: 관리자 통계를 데모 목업 데이터로 렌더링 */

/* 기본은 실제 요청(목업 API), 실패 응답이 필요한 테스트에서만 한 번 바꿈 */
vi.mock("@services/adminStatistics", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@services/adminStatistics")>();
  return { ...actual, getStatistics: vi.fn(actual.getStatistics) };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/admin/statistics",
  useSearchParams: () => new URLSearchParams(),
}));

beforeEach(() => {
  sessionStorage.clear();
  mockDesktopMatchMedia();
});

const statisticsOf = async (days: number, unit: "DAY" | "WEEK" | "MONTH") =>
  (
    await getStatistics({
      fromDate: getDateString(getTodayAddDays(-(days - 1))),
      toDate: getDateString(new Date()),
      unit,
    })
  ).data;

const tile = (label: string) =>
  screen.getByText(label, { selector: "dt" }).parentElement!.querySelector("dd")!;

describe("통계", () => {
  it("표시 형식: 건수·비율·일수, 기간 이름", () => {
    expect(formatCount(1234)).toBe("1,234건");
    expect(formatRate(33.3)).toBe("33.3%");
    expect(formatRate(null)).toBe("-");
    expect(formatDays(4)).toBe("4일");
    const row = { fromDate: "2026-11-16", toDate: "2026-11-20" } as Parameters<
      typeof periodLabel
    >[0];
    expect(periodLabel(row, "DAY")).toBe("2026-11-16");
    expect(periodLabel(row, "WEEK")).toBe("2026-11-16 ~ 2026-11-20");
    expect(periodLabel(row, "MONTH")).toBe("2026년 11월");
  });

  it("처음에는 최근 1개월을 주별로 보여 주고, 요약 칸과 표가 API 결과와 같다", async () => {
    renderWithProviders(<Main />);
    const expected = await statisticsOf(30, "WEEK");

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("주별"), {
      timeout: 3000,
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      `${expected.fromDate} ~ ${expected.toDate}`,
    );
    expect(tile("의뢰")).toHaveTextContent(formatCount(expected.summary.rqstCnt));
    expect(tile("접수완료")).toHaveTextContent(formatCount(expected.summary.cmptCnt));
    expect(tile("반려율")).toHaveTextContent(formatRate(expected.summary.rtunRate));
    expect(tile("평균 처리 일수")).toHaveTextContent(formatDays(expected.summary.avgProcDays));

    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(expected.periodList.length);
    expect(within(rows[0]).getByRole("rowheader")).toHaveTextContent(
      periodLabel(expected.periodList[0], "WEEK"),
    );
  });

  it("기간·집계 단위는 조회 버튼을 눌러야 적용된다", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Main />);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("주별"), {
      timeout: 3000,
    });

    const week = screen.getByRole("button", { name: "최근 1주일" });
    await user.click(week);
    expect(week).toHaveAttribute("aria-pressed", "true");
    await user.selectOptions(screen.getByLabelText("집계 단위"), "일별");
    expect(screen.getByRole("status")).toHaveTextContent("주별");

    await user.click(screen.getByRole("button", { name: "조회" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("일별"), {
      timeout: 3000,
    });
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(1 + 7);
  });

  it("업무 실패 응답은 빈 화면이 아니라 실패로 알리고, 같은 조건으로 조회를 누르면 다시 조회한다", async () => {
    const user = userEvent.setup();
    vi.mocked(getStatistics).mockClear();
    vi.mocked(getStatistics).mockResolvedValueOnce({
      code: "99",
      msg: "조회 기간은 1년 안으로 정해 주세요.",
      data: null,
    });
    renderWithProviders(<Main />);

    await waitFor(
      () =>
        expect(screen.getByRole("status")).toHaveTextContent(
          "통계를 불러오지 못했습니다. 조회를 눌러 다시 시도해 주세요.",
        ),
      { timeout: 3000 },
    );
    expect(screen.getByText("통계를 불러오지 못했습니다.")).toBeInTheDocument();
    expect(getStatistics).toHaveBeenCalledTimes(1);

    // 조건을 바꾸지 않고 조회 → 다시 조회
    await user.click(screen.getByRole("button", { name: "조회" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/주별.* 집계$/), {
      timeout: 3000,
    });
    expect(getStatistics).toHaveBeenCalledTimes(2);
    const expected = await statisticsOf(30, "WEEK");
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(
      1 + expected.periodList.length,
    );

    // 성공한 뒤에도 같은 조건으로 조회하면 새로 불러옴
    vi.mocked(getStatistics).mockClear();
    await user.click(screen.getByRole("button", { name: "조회" }));
    await waitFor(() => expect(getStatistics).toHaveBeenCalledTimes(1));
  });
});
