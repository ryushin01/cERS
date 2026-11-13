import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AD_ASSIGN, FI_HOME } from "@constants/path";
import { mockDesktopMatchMedia, renderWithProviders } from "@/test/renderWithProviders";

import NotFound from "./not-found";

const state = vi.hoisted(() => ({ pathname: "/financial/unknown", push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: state.push }),
  usePathname: () => state.pathname,
}));

beforeEach(() => {
  mockDesktopMatchMedia();
  state.push.mockReset();
});

describe("찾을 수 없는 화면", () => {
  it("금융기관 주소면 금융기관 홈으로 보낸다", async () => {
    state.pathname = "/financial/unknown";
    renderWithProviders(<NotFound />);
    await userEvent.click(screen.getByRole("button", { name: "홈으로 이동하기" }));
    expect(state.push).toHaveBeenCalledWith(FI_HOME);
  });

  it("관리자 주소면 관리자 홈으로 보낸다", async () => {
    state.pathname = "/admin/unknown";
    renderWithProviders(<NotFound />);
    await userEvent.click(screen.getByRole("button", { name: "홈으로 이동하기" }));
    expect(state.push).toHaveBeenCalledWith(AD_ASSIGN);
  });
});
