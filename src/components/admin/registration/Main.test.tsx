import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PROC_STAT_CD } from "@constants/code";
import { getRegistrationListData } from "@services/registrationManagement";
import { mockDesktopMatchMedia, renderWithProviders } from "@/test/renderWithProviders";

import Main from "./Main";

/*
 * 통합 테스트: 관리자 등기관리 화면을 데모 목업 데이터로 렌더링해,
 * API 응답(탭 건수·목록)이 화면에 그대로 표시되는지 확인합니다.
 */

/* 기본은 실제 요청(목업 API), 실패 응답이 필요한 테스트에서만 한 번 바꿈 */
vi.mock("@services/registrationManagement", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@services/registrationManagement")>();
  return { ...actual, getRegistrationListData: vi.fn(actual.getRegistrationListData) };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/admin/registration",
  useSearchParams: () => new URLSearchParams(),
}));

beforeEach(() => {
  sessionStorage.clear();
  mockDesktopMatchMedia();
});

/** 목업 데이터에서 직접 센 상태별 건수 (화면과 비교할 기준) */
async function expectedCounts() {
  const { REGISTRATIONS } = await import("@/mocks/data");
  const count = (statCd: string) => REGISTRATIONS.filter((item) => item.statCd === statCd).length;
  return {
    total: REGISTRATIONS.length,
    reviewing: count(PROC_STAT_CD.REVIEWING),
    complete: count(PROC_STAT_CD.COMPLET),
  };
}

/** 표 본문(tbody)의 행 */
const bodyRows = () => {
  // 화면에는 검색 필터 표도 있으므로, 캡션("등기관리 표")으로 목록 표를 찾음
  const table = screen.getByRole("table", { name: "등기관리 표" });
  return within(table.querySelector("tbody")!).queryAllByRole("row");
};

describe("관리자 등기관리 화면 (데모 데이터 통합)", () => {
  it("탭 건수와 전체 목록 행 수가 목업 데이터와 같다", async () => {
    const counts = await expectedCounts();
    renderWithProviders(<Main />);

    const allTab = await screen.findByRole("tab", { name: new RegExp(`전체\\s*${counts.total}`) });
    expect(allTab).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: new RegExp(`접수검토중\\s*${counts.reviewing}`) }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: new RegExp(`접수완료\\s*${counts.complete}`) }),
    ).toBeInTheDocument();

    // 한 페이지 50건 기준이라 전체가 한 번에 보임
    expect(bodyRows()).toHaveLength(counts.total);
  });

  it("탭을 바꾸면 해당 상태의 의뢰만 보인다", async () => {
    const counts = await expectedCounts();
    renderWithProviders(<Main />);
    await screen.findByRole("tab", { name: new RegExp(`전체\\s*${counts.total}`) });

    await userEvent.click(screen.getByRole("tab", { name: /접수완료/ }));

    await vi.waitFor(() => expect(bodyRows()).toHaveLength(counts.complete), { timeout: 3000 });
    bodyRows().forEach((row) =>
      expect(within(row).getAllByRole("cell")[0]).toHaveTextContent("접수완료"),
    );
  });

  it("엑셀 내보내기: 중간 쪽이 업무 실패면 앞 쪽만 담긴 파일을 내려받지 않고 실패로 끝낸다", async () => {
    const counts = await expectedCounts();
    renderWithProviders(<Main />);
    await screen.findByRole("tab", { name: new RegExp(`전체\\s*${counts.total}`) });

    const download = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const logError = vi.spyOn(console, "error").mockImplementation(() => {});
    // 이 API는 axios 응답을 그대로 돌려주므로 봉투(code·msg·data)는 data 안에 있음
    vi.mocked(getRegistrationListData)
      .mockResolvedValueOnce({
        data: {
          code: "00",
          msg: "",
          data: { rgstrMngrList: [{ rqstNo: "DEMO-000001" }], totalPages: 2 },
        },
      } as never)
      .mockResolvedValueOnce({ data: { code: "99", msg: "2쪽 조회 실패", data: null } } as never);
    await userEvent.click(screen.getByRole("button", { name: "엑셀 내보내기" }));

    await vi.waitFor(() =>
      expect(logError).toHaveBeenCalledWith(expect.objectContaining({ message: "2쪽 조회 실패" })),
    );
    expect(getRegistrationListData).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2, size: 100 }),
    );
    expect(download).not.toHaveBeenCalled();
  });
});
