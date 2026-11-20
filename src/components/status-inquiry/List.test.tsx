import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PROC_STAT_CD } from "@constants/code";
import { getStasusListData } from "@services/statusInquiry";
import { REGISTRATIONS } from "@/mocks/data";
import { mockDesktopMatchMedia, renderWithProviders } from "@/test/renderWithProviders";

import List from "./List";

/*
 * 통합 테스트: 금융기관 현황조회의 검색 조건이 목업 API까지 전달되어 목록에 반영되는지 확인합니다.
 * 기대값은 목업 데이터에서 직접 계산합니다.
 */

/* 기본은 실제 요청(목업 API), 실패 응답이 필요한 테스트에서만 한 번 바꿈 */
vi.mock("@services/statusInquiry", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@services/statusInquiry")>();
  return { ...actual, getStasusListData: vi.fn(actual.getStasusListData) };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/financial/status-inquiry",
  useSearchParams: () => new URLSearchParams(),
}));

beforeEach(() => {
  sessionStorage.clear();
  mockDesktopMatchMedia();
});

const shownNumbers = () =>
  [...new Set(screen.queryAllByText(/^DEMO-\d+$/).map((el) => el.textContent))].sort();
const numbersOf = (items: typeof REGISTRATIONS) => items.map((item) => item.rqstNo).sort();
const expectShown = (items: typeof REGISTRATIONS) =>
  waitFor(() => expect(shownNumbers()).toEqual(numbersOf(items)), { timeout: 3000 });
const search = () => userEvent.click(screen.getByRole("button", { name: "검색" }));
const input = (placeholder: string) => screen.getByPlaceholderText(placeholder);
const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const dashed = (value: string) => value.replace(/(\d{4})-?(\d{2})-?(\d{2}).*/, "$1-$2-$3");

describe("현황조회 검색", () => {
  it("처음에는 전체 목록을 보여 준다", async () => {
    renderWithProviders(<List isDesktop />);
    await expectShown(REGISTRATIONS);
  });

  it("의뢰번호로 검색한다", async () => {
    renderWithProviders(<List isDesktop />);
    await expectShown(REGISTRATIONS);

    await userEvent.type(input("의뢰번호를 입력해 주세요"), "DEMO-002400");
    await search();

    await expectShown(REGISTRATIONS.filter((item) => item.rqstNo === "DEMO-002400"));
  });

  it("진행상태는 검색을 눌러야 적용되고, 그 전에 입력한 값도 먼저 적용되지 않는다", async () => {
    renderWithProviders(<List isDesktop />);
    await expectShown(REGISTRATIONS);

    await userEvent.type(input("의뢰번호를 입력해 주세요"), "DEMO-0023");
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "진행상태" }),
      PROC_STAT_CD.REQUEST,
    );
    await new Promise((resolve) => setTimeout(resolve, 300));
    await expectShown(REGISTRATIONS);

    await search();

    await expectShown(
      REGISTRATIONS.filter(
        (item) => item.rqstNo.includes("DEMO-0023") && item.statCd === PROC_STAT_CD.REQUEST,
      ),
    );
  });

  it("접수번호와 채무자로 검색한다", async () => {
    const target = REGISTRATIONS.find((item) => item.acptNo)!;
    renderWithProviders(<List isDesktop />);
    await expectShown(REGISTRATIONS);

    await userEvent.type(input("접수번호 입력"), target.acptNo);
    await search();
    await expectShown(REGISTRATIONS.filter((item) => item.acptNo.includes(target.acptNo)));

    await userEvent.clear(input("접수번호 입력"));
    await userEvent.type(input("채무자 입력"), target.dbtrNm);
    await search();
    await expectShown(REGISTRATIONS.filter((item) => item.dbtrNm.includes(target.dbtrNm)));
  });

  it("기간 버튼은 대출실행일 기준으로 바로 검색한다", async () => {
    renderWithProviders(<List isDesktop />);
    await expectShown(REGISTRATIONS);

    await userEvent.click(screen.getByRole("button", { name: "1주일" }));

    await expectShown(
      REGISTRATIONS.filter(
        (item) => dashed(item.execDt) >= daysAgo(7) && dashed(item.execDt) <= daysAgo(0),
      ),
    );
  });

  it("조회기간 기준을 의뢰일로 바꾸면 의뢰일로 검색한다", async () => {
    renderWithProviders(<List isDesktop />);
    await expectShown(REGISTRATIONS);

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "조회기간 기준" }), "RQST");
    await userEvent.click(screen.getByRole("button", { name: "1주일" }));

    await expectShown(
      REGISTRATIONS.filter(
        (item) => dashed(item.crtDtm) >= daysAgo(7) && dashed(item.crtDtm) <= daysAgo(0),
      ),
    );
  });

  it("초기화하면 입력칸을 비우고 전체 목록으로 돌아온다", async () => {
    renderWithProviders(<List isDesktop />);
    await expectShown(REGISTRATIONS);

    await userEvent.type(input("의뢰번호를 입력해 주세요"), "DEMO-002400");
    await search();
    await expectShown(REGISTRATIONS.filter((item) => item.rqstNo === "DEMO-002400"));

    await userEvent.click(screen.getByRole("button", { name: "초기화" }));

    await expectShown(REGISTRATIONS);
    expect(input("의뢰번호를 입력해 주세요")).toHaveValue("");
  });

  it("결과가 없으면 빈 목록을 보여 준다", async () => {
    renderWithProviders(<List isDesktop />);
    await expectShown(REGISTRATIONS);

    await userEvent.type(input("의뢰번호를 입력해 주세요"), "없는번호");
    await search();

    await expectShown([]);
  });

  it("헤더 검색으로 오면 번호를 채워 검색하고, 다시 검색해도 유지한다", async () => {
    sessionStorage.setItem("bank-rqstno", "DEMO-002400");
    renderWithProviders(<List isDesktop />);
    const expected = REGISTRATIONS.filter((item) => item.rqstNo === "DEMO-002400");

    await expectShown(expected);
    expect(input("의뢰번호를 입력해 주세요")).toHaveValue("DEMO-002400");

    await search();
    await new Promise((resolve) => setTimeout(resolve, 300));
    await expectShown(expected);
  });

  it("엑셀 내보내기: 중간 쪽이 업무 실패면 앞 쪽만 담긴 파일을 내려받지 않고 실패로 끝낸다", async () => {
    renderWithProviders(<List isDesktop />);
    await expectShown(REGISTRATIONS);

    const download = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const logError = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(getStasusListData)
      .mockResolvedValueOnce({
        code: "00",
        msg: "",
        data: { rgstrList: [{ rqstNo: "DEMO-000001" }], totalPages: 2 },
      })
      .mockResolvedValueOnce({ code: "99", msg: "2쪽 조회 실패", data: null });
    await userEvent.click(screen.getByRole("button", { name: "엑셀 내보내기" }));

    await waitFor(() =>
      expect(logError).toHaveBeenCalledWith(expect.objectContaining({ message: "2쪽 조회 실패" })),
    );
    expect(getStasusListData).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2, size: 100 }),
    );
    expect(download).not.toHaveBeenCalled();
  });
});
