import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider as JotaiProvider } from "jotai";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MEMB_GB_CD } from "@constants/auth";
import { AD_REGISTRATION, FI_STATUS_INQUIRY } from "@constants/path";
import { authAtom, toastState } from "@stores";
import { mockDesktopMatchMedia, renderWithProviders } from "@/test/renderWithProviders";

import HeaderRightArea from "./HeaderRightArea";

/*
 * 헤더 의뢰번호 검색: 찾으면 해당 메뉴로 이동하고, 없으면 안내합니다.
 * 검색은 페이지 이동(window.location.href)으로 끝나므로 location을 대신합니다.
 */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

const location = { href: "" };

beforeEach(() => {
  sessionStorage.clear();
  mockDesktopMatchMedia();
  location.href = "";
  vi.stubGlobal("location", location);
});

const renderHeader = (membGbCd: string) => {
  const store = createStore();
  store.set(authAtom, { membGbCd, membNm: "데모 사용자" } as never);
  renderWithProviders(
    <JotaiProvider store={store}>
      <HeaderRightArea />
    </JotaiProvider>,
  );
  return store;
};

const searchBox = () => screen.getByRole("searchbox");

describe("의뢰번호 검색", () => {
  it("입력 후 Enter만 눌러도 금융기관은 현황조회로 이동한다", async () => {
    renderHeader(MEMB_GB_CD.FINANCIAL);

    await userEvent.type(searchBox(), "DEMO-002400{Enter}");

    await waitFor(() => expect(location.href).toBe(FI_STATUS_INQUIRY), { timeout: 3000 });
    expect(sessionStorage.getItem("bank-rqstno")).toBe("DEMO-002400");
  });

  it("검색 버튼을 누르면 관리자는 등기관리로 이동한다", async () => {
    renderHeader(MEMB_GB_CD.ADMIN);

    await userEvent.type(searchBox(), "DEMO-002400");
    await userEvent.click(screen.getByRole("button", { name: "검색" }));

    await waitFor(() => expect(location.href).toBe(AD_REGISTRATION), { timeout: 3000 });
    expect(sessionStorage.getItem("admin-rqstno")).toBe("DEMO-002400");
  });

  it("없는 번호는 안내하고 이동하지 않는다", async () => {
    const store = renderHeader(MEMB_GB_CD.FINANCIAL);

    await userEvent.type(searchBox(), "DEMO-999999{Enter}");

    await waitFor(() => expect(store.get(toastState).message).toContain("검색 결과가 없습니다"), {
      timeout: 3000,
    });
    expect(location.href).toBe("");
  });

  it("빈 칸으로는 검색하지 않는다", async () => {
    const store = renderHeader(MEMB_GB_CD.FINANCIAL);
    const before = store.get(toastState);

    await userEvent.type(searchBox(), "{Enter}");
    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(store.get(toastState)).toEqual(before);
    expect(location.href).toBe("");
  });
});
