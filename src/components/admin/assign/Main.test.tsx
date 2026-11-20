import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PROC_STAT_CD } from "@constants/code";
import { REGISTRATIONS } from "@/mocks/data";
import { mockDesktopMatchMedia, renderWithProviders } from "@/test/renderWithProviders";

import Main from "./Main";

/* 통합 테스트: 관리자 배정관리의 미배정 건수, 탭, 의뢰번호 검색 */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/admin/assign",
  useSearchParams: () => new URLSearchParams(),
}));

beforeEach(() => {
  sessionStorage.clear();
  mockDesktopMatchMedia();
  // 일괄 배정 모달을 띄울 포털
  if (!document.getElementById("portal")) {
    const portal = document.createElement("div");
    portal.id = "portal";
    document.body.appendChild(portal);
  }
});

const shownNumbers = () =>
  [...new Set(screen.queryAllByText(/^DEMO-\d+$/).map((el) => el.textContent))].sort();

describe("배정관리", () => {
  it("미배정 건수와 목록을 보여 준다", async () => {
    renderWithProviders(<Main />);

    await waitFor(
      () => expect(screen.getByText(/^미배정 \d+건$/)).not.toHaveTextContent("미배정 0건"),
      {
        timeout: 3000,
      },
    );
    expect(shownNumbers().length).toBeGreaterThan(0);
  });

  it("검색은 검색 버튼을 눌러야 적용되고 입력한 번호만 보여 준다", async () => {
    renderWithProviders(<Main />);
    const target = (await screen.findAllByText(/^DEMO-\d+$/, {}, { timeout: 3000 }))[0]
      .textContent!;
    const before = shownNumbers();

    await userEvent.type(screen.getByPlaceholderText(/의뢰번호/), target);
    expect(shownNumbers()).toEqual(before);

    await userEvent.click(screen.getByRole("button", { name: "검색" }));
    await waitFor(() => expect(shownNumbers()).toEqual([target]), { timeout: 3000 });
  });

  it("탭을 바꾸면 해당 상태의 목록으로 바뀐다", async () => {
    renderWithProviders(<Main />);
    await screen.findAllByText(/^DEMO-\d+$/, {}, { timeout: 3000 });
    const before = shownNumbers();

    await userEvent.click(screen.getByRole("tab", { name: "진행취소" }));

    const cancelled = REGISTRATIONS.filter((item) => item.statCd === PROC_STAT_CD.CANCEL)
      .map((item) => item.rqstNo)
      .sort();
    await waitFor(() => expect(shownNumbers()).toEqual(cancelled), { timeout: 3000 });
    expect(shownNumbers()).not.toEqual(before);
  });

  it("일괄 배정: 여러 건을 골라 법무대리인을 한 번에 지정하면 미배정 목록에서 빠진다", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Main />);
    await screen.findAllByText(/^DEMO-\d+$/, {}, { timeout: 3000 });

    // 고른 건이 없으면 열리지 않음 (버튼은 초점을 받을 수 있게 disabled로 두지 않음)
    const bulkButton = screen.getByRole("button", { name: "일괄 배정" });
    await user.click(bulkButton);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const [first, second] = shownNumbers() as string[];
    await user.click(screen.getByRole("checkbox", { name: `${first} 선택` }));
    await user.click(screen.getByRole("checkbox", { name: `${second} 선택` }));
    expect(screen.getByText("2건 선택됨")).toHaveAttribute("role", "status");

    await user.click(bulkButton);
    const dialog = await screen.findByRole("dialog", { name: "일괄 배정" });
    expect(within(dialog).getByRole("list", { name: "고른 의뢰번호" })).toHaveTextContent(first);

    // 법무대리인을 고르지 않고 제출: 오류 문구를 연결하고 초점을 옮김
    await user.click(within(dialog).getByRole("button", { name: "2건 배정하기" }));
    const select = within(dialog).getByRole("combobox", { name: /법무대리인/ });
    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(select).toHaveAccessibleDescription("법무대리인을 선택해 주세요.");
    expect(select).toHaveFocus();

    await waitFor(() =>
      expect(within(dialog).getByRole("option", { name: "데모 법무법인" })).toBeInTheDocument(),
    );
    await user.selectOptions(select, "데모 법무법인");
    expect(select).not.toHaveAttribute("aria-invalid");
    await user.click(within(dialog).getByRole("button", { name: "2건 배정하기" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument(), {
      timeout: 3000,
    });
    // 모달을 연 버튼으로 초점이 돌아옴 (고른 건이 비어도 버튼이 비활성이 아님)
    expect(bulkButton).toHaveFocus();
    await waitFor(() => expect(shownNumbers()).not.toContain(first), { timeout: 3000 });
    expect(shownNumbers()).not.toContain(second);
    for (const rqstNo of [first, second]) {
      expect(REGISTRATIONS.find((item) => item.rqstNo === rqstNo)).toMatchObject({
        statCd: PROC_STAT_CD.MATCH,
        lgagMembNm: "데모 법무법인",
      });
    }
  });

  it("일괄 배정: 배정 정보가 빠진 건은 결과에 사유와 배정 화면 링크로 보여 준다", async () => {
    const user = userEvent.setup();
    const target = REGISTRATIONS.find((item) => item.statCd === PROC_STAT_CD.REQUEST)!;
    target.dbtrNm = "";
    renderWithProviders(<Main />);
    await screen.findAllByText(/^DEMO-\d+$/, {}, { timeout: 3000 });

    await user.click(screen.getByRole("checkbox", { name: `${target.rqstNo} 선택` }));
    await user.click(screen.getByRole("button", { name: "일괄 배정" }));
    const dialog = await screen.findByRole("dialog", { name: "일괄 배정" });
    await waitFor(() =>
      expect(within(dialog).getByRole("option", { name: "데모 법무법인" })).toBeInTheDocument(),
    );
    await user.selectOptions(within(dialog).getByRole("combobox"), "데모 법무법인");
    await user.click(within(dialog).getByRole("button", { name: "1건 배정하기" }));

    const alert = await within(dialog).findByRole("alert", {}, { timeout: 3000 });
    expect(alert).toHaveTextContent("0건 배정, 1건은 배정하지 못했습니다.");
    expect(within(dialog).getByText(/배정 정보가 없습니다\(채무자\)/)).toBeInTheDocument();
    expect(
      within(dialog).getByRole("link", { name: `${target.rqstNo} 배정 화면으로 이동` }),
    ).toHaveAttribute("href", `/admin/assign/assign-detail/${target.rqstNo}`);
    // 양식이 사라지므로 초점은 결과로
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(target.statCd).toBe(PROC_STAT_CD.REQUEST);
  });
});
