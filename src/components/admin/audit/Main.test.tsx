import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PROC_STAT_CD } from "@constants/code";
import { changeStatus, REGISTRATIONS } from "@/mocks/data";
import { mockDesktopMatchMedia, renderWithProviders } from "@/test/renderWithProviders";

import Main from "./Main";

/* 통합 테스트: 관리자 감사기록을 데모 목업 데이터(진행 이력)로 렌더링 */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/admin/audit",
  useSearchParams: () => new URLSearchParams(),
}));

beforeEach(() => {
  sessionStorage.clear();
  mockDesktopMatchMedia();
});

const historyCount = () => REGISTRATIONS.reduce((sum, item) => sum + item.statHistList.length, 0);
const rows = () => within(screen.getByRole("table")).getAllByRole("row").slice(1);

describe("감사기록", () => {
  it("모든 의뢰의 진행 이력을 최근 순으로 보여 주고 전체 건수를 알린다", async () => {
    const target = REGISTRATIONS.find((item) => item.statCd === PROC_STAT_CD.REQUEST)!;
    changeStatus(target, PROC_STAT_CD.HOLD, { crtMembNm: "감사 테스트" });
    renderWithProviders(<Main />);

    await waitFor(
      () => expect(screen.getByRole("status")).toHaveTextContent(`총 ${historyCount()}건`),
      {
        timeout: 3000,
      },
    );
    // 방금 남긴 기록이 맨 위: 시각까지, 이전 → 이후 상태
    const [first] = rows();
    expect(within(first).getByText(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)).toBeInTheDocument();
    expect(first).toHaveTextContent("감사 테스트");
    expect(first).toHaveTextContent("등기의뢰 → 진행보류");
    expect(
      within(first).getByRole("link", { name: `${target.rqstNo} 등기관리 상세 보기` }),
    ).toHaveAttribute("href", `/admin/registration/registration-detail/${target.rqstNo}`);
    expect(rows()).toHaveLength(10);
  });

  it("조건은 검색 버튼을 눌러야 적용되고, 의뢰번호·처리자로 좁힌다", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Main />);
    await waitFor(() => expect(rows()).toHaveLength(10), { timeout: 3000 });

    const target = REGISTRATIONS.find((item) => item.statHistList.length >= 3)!;
    await user.type(screen.getByLabelText("의뢰번호"), target.rqstNo);
    expect(rows()).toHaveLength(10);

    await user.click(screen.getByRole("button", { name: "검색" }));
    await waitFor(() => expect(rows()).toHaveLength(target.statHistList.length), { timeout: 3000 });
    expect(screen.getByRole("status")).toHaveTextContent(`총 ${target.statHistList.length}건`);
    // 처음 등록 기록은 이전 상태 없이 "의뢰 등록"
    expect(rows().at(-1)).toHaveTextContent("의뢰 등록");

    await user.type(screen.getByLabelText("처리자"), "없는 처리자");
    await user.click(screen.getByRole("button", { name: "검색" }));
    await screen.findByText("조건에 맞는 기록이 없습니다.", {}, { timeout: 3000 });

    await user.click(screen.getByRole("button", { name: "초기화" }));
    await waitFor(() => expect(rows()).toHaveLength(10), { timeout: 3000 });
    expect(screen.getByLabelText("의뢰번호")).toHaveValue("");
  });

  it("기간 버튼은 눌린 상태를 알리고, 오늘을 고르면 오늘 기록만 보여 준다", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Main />);
    await waitFor(() => expect(rows()).toHaveLength(10), { timeout: 3000 });

    const today = screen.getByRole("button", { name: "오늘" });
    expect(screen.getByRole("button", { name: "전체" })).toHaveAttribute("aria-pressed", "true");
    await user.click(today);
    expect(today).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "검색" }));

    const pad = (n: number) => String(n).padStart(2, "0");
    const now = new Date();
    const todayText = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    await waitFor(
      () =>
        rows().forEach((row) =>
          expect(within(row).getAllByRole("cell")[0].textContent).toMatch(
            new RegExp(`^${todayText}`),
          ),
        ),
      { timeout: 3000 },
    );
  });
});
