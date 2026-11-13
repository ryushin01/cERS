import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { axiosBasicInstance } from "@services";
import { mockDesktopMatchMedia, renderWithProviders } from "@/test/renderWithProviders";

import ProcessReasonModal from "./ProcessReasonModal";

const RQST_NO = "DEMO-002400";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => `/admin/assign/assign-detail/${RQST_NO}`,
  useSearchParams: () => new URLSearchParams(),
}));

let requests: InternalAxiosRequestConfig[] = [];
const originalAdapter = axiosBasicInstance.defaults.adapter;

beforeEach(() => {
  sessionStorage.clear();
  mockDesktopMatchMedia();
  document.body.insertAdjacentHTML("beforeend", '<div id="portal"></div>');
  requests = [];
  axiosBasicInstance.defaults.adapter = (config) => {
    requests.push(config);
    return (originalAdapter as (c: InternalAxiosRequestConfig) => Promise<never>)(config);
  };
});

afterEach(() => {
  axiosBasicInstance.defaults.adapter = originalAdapter;
  document.getElementById("portal")?.remove();
});

const sentReasons = () =>
  requests
    .filter((r) => r.method === "patch" && r.url?.endsWith("/supplementation"))
    .map((r) => JSON.parse(String(r.data)).procRsnCnts);

async function openSupplement() {
  renderWithProviders(
    <ProcessReasonModal kind="supplement" requestNo={RQST_NO} onClose={() => {}} />,
  );
  const select = await screen.findByRole("combobox", { name: /보완요청 사유/ });
  await vi.waitFor(() => expect(select.querySelectorAll("option").length).toBeGreaterThan(2), {
    timeout: 3000,
  });
  return select;
}

describe("ProcessReasonModal", () => {
  it("'기타'를 골라 입력하면 입력한 사유를 보낸다", async () => {
    const select = await openSupplement();
    await userEvent.selectOptions(select, "99");
    await userEvent.type(
      screen.getByPlaceholderText("사유를 입력해 주세요"),
      "등본 발급일 확인 필요",
    );
    await userEvent.click(screen.getByRole("button", { name: "보완 요청하기" }));
    await vi.waitFor(() => expect(sentReasons()).toEqual(["등본 발급일 확인 필요"]));
  });

  it("'기타'에서 다른 사유로 바꾸면 코드가 아니라 사유 문구를 보낸다", async () => {
    const select = await openSupplement();
    await userEvent.selectOptions(select, "99");
    await userEvent.type(screen.getByPlaceholderText("사유를 입력해 주세요"), "임시");
    await userEvent.selectOptions(select, "01");
    await userEvent.click(screen.getByRole("button", { name: "보완 요청하기" }));
    await vi.waitFor(() => expect(sentReasons()).toEqual(["필수 서류 누락"]));
  });

  it("사유가 없으면 보내지 않는다", async () => {
    const select = await openSupplement();
    await userEvent.selectOptions(select, "99");
    await userEvent.click(screen.getByRole("button", { name: "보완 요청하기" }));
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(sentReasons()).toEqual([]);
  });
});
