import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { mockDesktopMatchMedia } from "@/test/renderWithProviders";

import DocumentViewer, { describeViewerState } from "./DocumentViewer";

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div><div id="portal"></div>';
  mockDesktopMatchMedia();
});

const pages = [1, 2, 3].map((page) => ({
  key: `page-${page}`,
  // eslint-disable-next-line @next/next/no-img-element
  content: <img src={`/page-${page}.svg`} alt={`등기자료 ${page}번 이미지`} />,
}));

function Page({ initialPage = 0 }: { initialPage?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        크게 보기
      </button>
      {isOpen && (
        <DocumentViewer
          documentName="등기자료"
          pages={pages}
          initialPage={initialPage}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

const openViewer = async (initialPage?: number) => {
  const user = userEvent.setup();
  render(<Page initialPage={initialPage} />, { container: document.getElementById("app")! });
  await user.click(screen.getByRole("button", { name: "크게 보기" }));
  return user;
};

const status = () => screen.getByRole("status");
const viewerPage = () => screen.getByTestId("viewer-page");

describe("DocumentViewer", () => {
  it("상태 문구: 쪽·배율·회전", () => {
    expect(describeViewerState(1, 3, 1, 0)).toBe("3쪽 중 1쪽, 배율 100%");
    expect(describeViewerState(2, 3, 1.5, 90)).toBe("3쪽 중 2쪽, 배율 150%, 90도 회전");
  });

  it("제목이 있는 대화상자로 열리고, 처음 쪽과 배율을 알린다", async () => {
    await openViewer();

    expect(screen.getByRole("dialog", { name: "등기자료 크게 보기" })).toBeInTheDocument();
    expect(screen.getByRole("toolbar", { name: "등기자료 보기 도구" })).toBeInTheDocument();
    expect(status()).toHaveTextContent("3쪽 중 1쪽, 배율 100%");
    expect(screen.getByRole("img", { name: "등기자료 1번 이미지" })).toBeInTheDocument();
    // 첫 쪽에서는 이전 쪽 버튼이 비활성이지만 초점은 받을 수 있음(aria-disabled)
    expect(screen.getByRole("button", { name: "이전 쪽" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("버튼과 방향키로 쪽을 넘기고, 끝 쪽에서는 더 넘어가지 않으며 초점이 버튼에 남는다", async () => {
    const user = await openViewer();
    const next = screen.getByRole("button", { name: "다음 쪽" });

    await user.click(next);
    expect(status()).toHaveTextContent("3쪽 중 2쪽");

    await user.keyboard("{ArrowRight}");
    expect(status()).toHaveTextContent("3쪽 중 3쪽");
    expect(screen.getByRole("img", { name: "등기자료 3번 이미지" })).toBeInTheDocument();
    expect(next).toHaveAttribute("aria-disabled", "true");

    await user.click(next);
    expect(status()).toHaveTextContent("3쪽 중 3쪽");
    expect(next).toHaveFocus();

    await user.keyboard("{Home}");
    expect(status()).toHaveTextContent("3쪽 중 1쪽");
    await user.keyboard("{End}");
    expect(status()).toHaveTextContent("3쪽 중 3쪽");
    await user.keyboard("{PageUp}");
    expect(status()).toHaveTextContent("3쪽 중 2쪽");
  });

  it("열자마자(초점이 대화상자에 있을 때) 단축키가 동작한다", async () => {
    const user = await openViewer();
    expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true);

    await user.keyboard("+{ArrowRight}r");
    expect(status()).toHaveTextContent("3쪽 중 2쪽, 배율 125%, 90도 회전");
  });

  it("고른 쪽부터 연다", async () => {
    await openViewer(1);
    expect(status()).toHaveTextContent("3쪽 중 2쪽");
  });

  it("확대·축소는 버튼과 +·− 키로, 문서 크기가 배율만큼 바뀐다", async () => {
    const user = await openViewer();

    await user.click(screen.getByRole("button", { name: "확대" }));
    expect(status()).toHaveTextContent("배율 125%");
    expect(viewerPage()).toHaveStyle({ width: "600px", height: "840px" });

    await user.keyboard("+");
    expect(status()).toHaveTextContent("배율 150%");
    await user.keyboard("--");
    expect(status()).toHaveTextContent("배율 100%");

    // 최소 배율(50%)에서는 축소 버튼이 비활성
    await user.keyboard("----");
    expect(status()).toHaveTextContent("배율 50%");
    expect(screen.getByRole("button", { name: "축소" })).toHaveAttribute("aria-disabled", "true");
  });

  it("회전은 쪽마다 따로 적용되고, 0 키로 원래대로 돌아간다", async () => {
    const user = await openViewer();

    await user.click(screen.getByRole("button", { name: "오른쪽으로 회전" }));
    expect(status()).toHaveTextContent("90도 회전");
    expect(viewerPage().style.transform).toContain("rotate(90deg)");
    // 옆으로 누우면 바깥 영역의 가로세로가 바뀌어 스크롤 범위가 맞음
    expect(viewerPage().parentElement).toHaveStyle({ width: "672px", height: "480px" });

    await user.keyboard("{Shift>}R{/Shift}");
    expect(status()).not.toHaveTextContent("회전");

    await user.click(screen.getByRole("button", { name: "왼쪽으로 회전" }));
    expect(status()).toHaveTextContent("270도 회전");

    // 다른 쪽은 회전하지 않은 상태
    await user.click(screen.getByRole("button", { name: "다음 쪽" }));
    expect(status()).toHaveTextContent("3쪽 중 2쪽, 배율 100%");
    expect(status()).not.toHaveTextContent("회전");

    await user.keyboard("{PageUp}");
    expect(status()).toHaveTextContent("270도 회전");
    await user.keyboard("+0");
    expect(status()).toHaveTextContent("3쪽 중 1쪽, 배율 100%");
    expect(status()).not.toHaveTextContent("회전");
  });

  it("열려 있는 동안 쪽 목록이 바뀌어도 회전은 같은 쪽에 남는다", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <DocumentViewer documentName="등기자료" pages={pages} initialPage={1} onClose={() => {}} />,
      { container: document.getElementById("app")! },
    );
    await user.keyboard("r");
    expect(status()).toHaveTextContent("3쪽 중 2쪽, 배율 100%, 90도 회전");

    // 다시 조회해 첫 쪽이 빠지면, 같은 자리(2쪽)에 온 다른 쪽은 회전하지 않은 상태
    rerender(
      <DocumentViewer
        documentName="등기자료"
        pages={pages.slice(0, 1).concat(pages.slice(2))}
        initialPage={1}
        onClose={() => {}}
      />,
    );
    expect(screen.getByRole("img", { name: "등기자료 3번 이미지" })).toBeInTheDocument();
    expect(status()).not.toHaveTextContent("회전");
  });

  it("문서 영역에 초점이 있으면 방향키는 쪽을 넘기지 않는다(확대한 화면 이동)", async () => {
    const user = await openViewer();
    const stage = screen.getByRole("region", { name: "등기자료 1쪽" });

    stage.focus();
    await user.keyboard("{ArrowRight}{End}");
    expect(status()).toHaveTextContent("3쪽 중 1쪽");

    // 쪽 이동 전용 키는 문서 영역에서도 동작
    await user.keyboard("{PageDown}");
    expect(status()).toHaveTextContent("3쪽 중 2쪽");
  });

  it("Ctrl·⌘ 조합(브라우저 확대 등)은 가로채지 않는다", async () => {
    const user = await openViewer();
    await user.keyboard("{Control>}+{/Control}");
    expect(status()).toHaveTextContent("배율 100%");
  });

  it("Esc로 닫으면 연 버튼으로 초점이 돌아간다", async () => {
    const user = await openViewer();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "크게 보기" })).toHaveFocus();
  });
});
