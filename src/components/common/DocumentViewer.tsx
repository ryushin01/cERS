"use client";

import { ReactNode, useEffect, useId, useRef, useState } from "react";

import { Modal } from "@components/modal";

import "@styles/document-viewer.css";

export type ViewerPage = {
  key: string;
  content: ReactNode;
};

type DocumentViewerProps = {
  /* 문서 이름 (예: 등기자료, 등기접수증) — 모달 제목과 알림 문구에 사용 */
  documentName: string;
  pages: ViewerPage[];
  /* 처음 보여 줄 쪽 (0부터) */
  initialPage?: number;
  onClose: () => void;
  isDesktop?: boolean;
};

/* 배율 단계 (1 = 기본 크기) */
export const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
const DEFAULT_ZOOM_INDEX = ZOOM_LEVELS.indexOf(1);

/* 기본 크기의 문서 영역 (A4 비율에 가까운 1:1.4) */
const BASE_SIZE = {
  desktop: { width: 480, height: 672 },
  mobile: { width: 220, height: 308 },
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/* 회전 각도(90도 단위 횟수)를 0·90·180·270도로 */
const toDegree = (quarterTurns: number) => (((quarterTurns % 4) + 4) % 4) * 90;

/* 스크린 리더에 전달할 현재 상태 */
export const describeViewerState = (page: number, total: number, zoom: number, degree: number) =>
  `${total}쪽 중 ${page}쪽, 배율 ${Math.round(zoom * 100)}%${degree ? `, ${degree}도 회전` : ""}`;

/**
 * @name DocumentViewer
 * @version 1.0.0
 * @author 류창선 <ryushin0167@gmail.com>
 * @description 등기자료·등기접수증을 판독하기 위한 확대 보기 모달입니다. 부모 컴포넌트가 클라이언트 컴포넌트이어야 합니다.
 *              - 확대·축소(50~300%), 왼쪽·오른쪽 회전(쪽마다 따로), 쪽 이동
 *              - 버튼마다 접근 가능한 이름과 단축키(aria-keyshortcuts)를 두고, 바뀐 상태는 role="status"로 알림
 *              - 단축키: ←·→·PageUp·PageDown 쪽 이동, Home·End 처음·마지막 쪽, +·− 확대·축소, 0 원래대로, R·Shift+R 회전
 *                (확대한 문서 영역에 초점이 있으면 방향키는 화면 이동에 쓰므로 쪽을 넘기지 않음)
 *              - 끝에 닿은 버튼은 disabled 대신 aria-disabled로 두어, 누르던 버튼에서 초점이 사라지지 않게 함
 * @property {string} documentName  - 문서 이름 (모달 제목: "{문서 이름} 크게 보기")
 * @property {ViewerPage[]} pages   - 쪽 목록 (이미지 등)
 * @property {number} initialPage   - 처음 보여 줄 쪽 (0부터, 기본값 0)
 * @property {function} onClose     - 닫기
 */
export default function DocumentViewer({
  documentName,
  pages,
  initialPage = 0,
  onClose,
  isDesktop = true,
}: DocumentViewerProps) {
  const id = useId();
  const helpId = `${id}-help`;
  const total = pages.length;
  const lastIndex = Math.max(total - 1, 0);
  const [selectedPage, setPageIndex] = useState(() => clamp(initialPage, 0, lastIndex));
  // 열려 있는 동안 이미지 목록이 다시 조회되어 쪽 수가 줄어도 없는 쪽을 가리키지 않게 함
  const pageIndex = clamp(selectedPage, 0, lastIndex);
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  // 쪽마다 따로 회전 (스캔 방향이 쪽마다 다를 수 있음). 목록이 다시 조회되어 순서가 바뀌어도 같은 쪽에 남도록 key로 저장
  const [rotations, setRotations] = useState<Record<string, number>>({});
  const pageKey = pages[pageIndex]?.key ?? "";

  const zoom = ZOOM_LEVELS[zoomIndex];
  const degree = toDegree(rotations[pageKey] ?? 0);
  const isFirstPage = pageIndex <= 0;
  const isLastPage = pageIndex >= total - 1;
  const isMinZoom = zoomIndex <= 0;
  const isMaxZoom = zoomIndex >= ZOOM_LEVELS.length - 1;

  const goToPage = (index: number) => setPageIndex(clamp(index, 0, lastIndex));
  const changeZoom = (step: number) =>
    setZoomIndex((current) => clamp(current + step, 0, ZOOM_LEVELS.length - 1));
  const rotate = (quarterTurns: number) =>
    setRotations((current) => ({
      ...current,
      [pageKey]: (current[pageKey] ?? 0) + quarterTurns,
    }));
  const reset = () => {
    setZoomIndex(DEFAULT_ZOOM_INDEX);
    setRotations((current) => ({ ...current, [pageKey]: 0 }));
  };

  /* 문서 영역 크기: 90·270도면 가로세로가 바뀌므로 바깥 영역도 바꿔 스크롤 범위를 맞춤 */
  const base = isDesktop ? BASE_SIZE.desktop : BASE_SIZE.mobile;
  const pageWidth = base.width * zoom;
  const pageHeight = base.height * zoom;
  const isSideways = degree === 90 || degree === 270;

  const handleKeyDown = (event: KeyboardEvent) => {
    // 브라우저 확대(Ctrl/⌘ +) 등 다른 조합은 그대로 둠
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    // 문서 영역에 초점이 있으면 방향키·Home·End는 확대한 화면을 움직이는 데 양보
    const isStage = (event.target as HTMLElement).hasAttribute("data-viewer-stage");
    const pageKeys: Record<string, () => void> = isStage
      ? {}
      : {
          ArrowLeft: () => goToPage(pageIndex - 1),
          ArrowRight: () => goToPage(pageIndex + 1),
          Home: () => goToPage(0),
          End: () => goToPage(total - 1),
        };
    const actions: Record<string, () => void> = {
      ...pageKeys,
      PageUp: () => goToPage(pageIndex - 1),
      PageDown: () => goToPage(pageIndex + 1),
      "+": () => changeZoom(1),
      "=": () => changeZoom(1),
      "-": () => changeZoom(-1),
      "0": reset,
      r: () => rotate(1),
      R: () => rotate(event.shiftKey ? -1 : 1),
    };

    const action = actions[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  };

  /*
   * 단축키는 이 보기 대화상자 안 어디에 초점이 있어도 동작해야 합니다.
   * 열면 초점이 대화상자 자체(감싸는 요소의 바깥)로 가므로 document에서 받아, 초점이 이 대화상자 안일 때만 처리합니다.
   * (겹친 아래 모달에 초점이 있을 때는 처리하지 않음)
   */
  const rootRef = useRef<HTMLDivElement>(null);
  const handleKeyDownRef = useRef(handleKeyDown);
  useEffect(() => {
    handleKeyDownRef.current = handleKeyDown;
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      const dialog = rootRef.current?.closest('[role="dialog"]');
      if (!dialog || !(event.target instanceof Node) || !dialog.contains(event.target)) return;
      handleKeyDownRef.current(event);
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, []);

  const toolButton = (
    label: string,
    onClick: () => void,
    { isDisabled = false, shortcuts }: { isDisabled?: boolean; shortcuts?: string } = {},
  ) => (
    <button
      type="button"
      className="_viewer-button"
      aria-disabled={isDisabled || undefined}
      aria-keyshortcuts={shortcuts}
      onClick={() => {
        if (!isDisabled) onClick();
      }}
    >
      {label}
    </button>
  );

  return (
    <Modal title={`${documentName} 크게 보기`} onClose={onClose}>
      <div ref={rootRef} className="_document-viewer">
        <div className="_viewer-toolbar" role="toolbar" aria-label={`${documentName} 보기 도구`}>
          <div className="_viewer-group">
            {toolButton("이전 쪽", () => goToPage(pageIndex - 1), {
              isDisabled: isFirstPage,
              shortcuts: "PageUp ArrowLeft",
            })}
            <span className="_viewer-value" aria-hidden="true">
              {total ? pageIndex + 1 : 0} / {total}
            </span>
            {toolButton("다음 쪽", () => goToPage(pageIndex + 1), {
              isDisabled: isLastPage,
              shortcuts: "PageDown ArrowRight",
            })}
          </div>
          <div className="_viewer-group">
            {toolButton("축소", () => changeZoom(-1), { isDisabled: isMinZoom, shortcuts: "-" })}
            <span className="_viewer-value" aria-hidden="true">
              {Math.round(zoom * 100)}%
            </span>
            {toolButton("확대", () => changeZoom(1), { isDisabled: isMaxZoom, shortcuts: "+" })}
          </div>
          <div className="_viewer-group">
            {toolButton("왼쪽으로 회전", () => rotate(-1), { shortcuts: "Shift+R" })}
            {toolButton("오른쪽으로 회전", () => rotate(1), { shortcuts: "R" })}
            {toolButton("원래대로", reset, { shortcuts: "0" })}
          </div>
        </div>

        <p id={helpId} className="_viewer-help">
          단축키: ← → 쪽 이동, + − 확대·축소, R 회전(Shift+R 반대 방향), 0 원래대로. 문서 영역에서는
          방향키로 확대한 화면을 움직입니다.
        </p>

        {/* 바뀐 쪽·배율·회전을 스크린 리더에 알림 */}
        <p className="sr-only" role="status">
          {total ? describeViewerState(pageIndex + 1, total, zoom, degree) : ""}
        </p>

        <div
          className="_viewer-stage"
          data-viewer-stage=""
          // 확대하면 스크롤이 생기므로 키보드로도 화면을 움직일 수 있게 초점을 받음
          tabIndex={0}
          role="region"
          aria-label={`${documentName} ${pageIndex + 1}쪽`}
          aria-describedby={helpId}
        >
          {total ? (
            <div
              className="_viewer-canvas"
              style={{
                width: isSideways ? pageHeight : pageWidth,
                height: isSideways ? pageWidth : pageHeight,
              }}
            >
              <div
                className="_viewer-page"
                data-testid="viewer-page"
                style={{
                  width: pageWidth,
                  height: pageHeight,
                  transform: `translate(-50%, -50%) rotate(${degree}deg)`,
                }}
              >
                {pages[pageIndex].content}
              </div>
            </div>
          ) : (
            <p className="m-auto text-ers-grayscale-90">표시할 문서가 없습니다.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
