import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { mockDesktopMatchMedia } from "@/test/renderWithProviders";

import AddressSearchModal, { POSTCODE_LOAD_TIMEOUT_MS } from "./AddressSearchModal";

/*
 * 우편번호 서비스(외부 스크립트)를 쓸 수 없을 때 예시 주소로 대체하는지 확인합니다.
 * - 가짜 DaumPostcode: 스크립트를 불러오지 못한 상태처럼 errorMessage를 그대로 보여 줌
 */
let postcodeFails = true;

vi.mock("react-daum-postcode", () => ({
  default: ({ errorMessage }: { errorMessage: React.ReactNode }) =>
    postcodeFails ? <>{errorMessage}</> : <div>우편번호 검색 화면</div>,
}));

function renderModal() {
  const portal = document.createElement("div");
  portal.id = "portal";
  document.body.appendChild(portal);
  const onSelect = vi.fn();
  const onClose = vi.fn();
  render(<AddressSearchModal onSelect={onSelect} onClose={onClose} />);
  return { onSelect, onClose };
}

beforeEach(() => {
  mockDesktopMatchMedia();
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.getElementById("portal")?.remove();
  vi.useRealTimers();
  postcodeFails = true;
});

describe("AddressSearchModal 오프라인 대체", () => {
  it("스크립트를 불러오지 못하면 안내와 예시 주소를 보여 주고, 고르면 주소를 넘긴다", async () => {
    const user = userEvent.setup();
    const { onSelect, onClose } = renderModal();

    expect(screen.getByRole("status")).toHaveTextContent("오프라인 예시 주소로 표시 중");
    await user.click(screen.getByRole("button", { name: /서울특별시 중구 예시로 12/ }));

    expect(onSelect).toHaveBeenCalledWith({
      rdnmAddr: "서울특별시 중구 예시로 12 (예시아파트)",
      roadAddr: "서울특별시 중구 예시동 101-1",
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("스크립트가 제한 시간 안에 준비되지 않으면 예시 주소로 바꾼다", () => {
    vi.useFakeTimers();
    postcodeFails = false;
    renderModal();

    expect(screen.getByText("우편번호 검색 화면")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(POSTCODE_LOAD_TIMEOUT_MS);
    });
    expect(screen.getByRole("status")).toHaveTextContent("오프라인 예시 주소로 표시 중");
  });
});
