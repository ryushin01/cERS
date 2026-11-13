import { useState } from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSubmitLock } from "@hooks";
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

/* 화면(Table)처럼 잠금을 모달 바깥에 두고, 닫았다 다시 열 수 있게 합니다. */
function Harness() {
  const lock = useSubmitLock();
  const [open, setOpen] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        다시 열기
      </button>
      {open && (
        <ProcessReasonModal
          kind="supplement"
          requestNo={RQST_NO}
          lock={lock}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

async function findReasonSelect() {
  const select = await screen.findByRole("combobox", { name: /보완요청 사유/ });
  await vi.waitFor(() => expect(select.querySelectorAll("option").length).toBeGreaterThan(2), {
    timeout: 3000,
  });
  return select;
}

async function openSupplement() {
  renderWithProviders(<Harness />);
  return findReasonSelect();
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

  it("보내는 중에 닫았다 다시 열어도 다시 보내지 않는다", async () => {
    const select = await openSupplement();
    await userEvent.selectOptions(select, "01");
    await userEvent.click(screen.getByRole("button", { name: "보완 요청하기" }));
    await userEvent.click(screen.getByRole("button", { name: "취소" }));
    await userEvent.click(screen.getByRole("button", { name: "다시 열기" }));
    await userEvent.selectOptions(await findReasonSelect(), "01");
    await userEvent.click(screen.getByRole("button", { name: "보완 요청하기" }));
    await new Promise((resolve) => setTimeout(resolve, 700));
    expect(sentReasons()).toEqual(["필수 서류 누락"]);
  });
});
