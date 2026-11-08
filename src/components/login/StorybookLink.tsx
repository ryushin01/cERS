"use client";

import { CSSProperties, MouseEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Typography } from "@components/common";
import { STORYBOOK_URL } from "@constants/path";
import { ResponsiveType } from "@types";

import "@styles/storybook-link.css";

/* Storybook 쪽(.storybook/manager-head.html)에서 이어지는 도착 애니메이션을 보여 줄지 판단하는 키 */
export const STORYBOOK_TRANSITION_KEY = "ers-storybook-transition";

/* 화면 전환 애니메이션이 끝나고 이동하기까지의 시간(ms). storybook-link.css의 애니메이션 길이와 맞춥니다. */
export const STORYBOOK_TRANSITION_MS = 1400;

/* 전환 화면에서 조립되는 컴포넌트 조각 12개(4열 x 3행)의 출발 위치(px)·각도(deg). 흩어져 있다가 격자로 모입니다. */
const TILES = [
  [-220, -140, -160],
  [-60, -210, 120],
  [90, -190, -75],
  [240, -120, 200],
  [-260, 20, 95],
  [-120, 150, -210],
  [150, 40, 160],
  [270, 110, -120],
  [-200, 210, 230],
  [-20, 240, -95],
  [130, 220, 70],
  [230, 230, -180],
];

type Origin = { x: number; y: number };

/**
 * @name StorybookLink
 * @version 1.0.0
 * @author 류창선 <ryushin0167@gmail.com>
 * @description 로그인 화면에서 Storybook(컴포넌트 문서)으로 이동하는 버튼입니다.
 *              누르면 버튼 위치에서 화면이 원형으로 펼쳐지고, 컴포넌트 조각이 모여 격자를 이룬 뒤 Storybook으로 이동합니다.
 *              - 새 탭 열기(⌘/Ctrl/Shift/가운데 클릭)는 브라우저 기본 동작을 그대로 따릅니다.
 *              - 동작 줄이기(prefers-reduced-motion) 설정이면 애니메이션 없이 바로 이동합니다.
 */
export default function StorybookLink({ isDesktop }: ResponsiveType) {
  const [origin, setOrigin] = useState<Origin | null>(null);

  /* 뒤로 가기로 돌아왔을 때(bfcache) 전환 화면이 남아 있지 않도록 초기화 */
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setOrigin(null);
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  /* 전환 애니메이션이 끝나면 이동 */
  useEffect(() => {
    if (!origin) return;
    const timer = window.setTimeout(
      () => window.location.assign(STORYBOOK_URL),
      STORYBOOK_TRANSITION_MS,
    );
    return () => window.clearTimeout(timer);
  }, [origin]);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const isNewTab = event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0;
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (isNewTab || prefersReducedMotion || origin) {
      if (origin) event.preventDefault(); // 전환 중 중복 클릭 무시
      return;
    }

    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    setOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });

    try {
      sessionStorage.setItem(STORYBOOK_TRANSITION_KEY, String(Date.now()));
    } catch {
      // 저장소를 쓸 수 없으면 도착 애니메이션만 생략
    }
  };

  return (
    <>
      <a href={STORYBOOK_URL} className="_storybook-link" onClick={handleClick}>
        <span className="_storybook-link-icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" />
            <rect x="13" y="3" width="8" height="8" rx="2" fill="currentColor" opacity="0.55" />
            <rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" opacity="0.55" />
            <rect x="13" y="13" width="8" height="8" rx="4" fill="#FABE00" />
          </svg>
        </span>
        <span className="_storybook-link-texts">
          <Typography kind={isDesktop ? "title-medium" : "body-medium"} isBold>
            Storybook 바로 가기
          </Typography>
          <Typography kind={isDesktop ? "body-medium" : "caption-large"} className="_description">
            디자인 시스템과 모든 화면 컴포넌트를 둘러보세요
          </Typography>
        </span>
        <span className="_storybook-link-arrow" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M4 10h11m0 0-4.5-4.5M15 10l-4.5 4.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </a>

      {origin && createPortal(<StorybookTransition origin={origin} />, document.body)}
    </>
  );
}

/** 버튼 위치에서 펼쳐지는 전환 화면 */
export function StorybookTransition({ origin }: { origin: Origin }) {
  return (
    <div
      className="_storybook-transition"
      style={{ "--origin-x": `${origin.x}px`, "--origin-y": `${origin.y}px` } as CSSProperties}
      role="status"
      aria-live="polite"
    >
      <div className="_storybook-transition-stage">
        <div className="_storybook-transition-grid" aria-hidden="true">
          {TILES.map(([dx, dy, rotate], index) => (
            <span
              key={index}
              style={
                {
                  "--i": index,
                  "--dx": `${dx}px`,
                  "--dy": `${dy}px`,
                  "--r": `${rotate}deg`,
                } as CSSProperties
              }
            />
          ))}
        </div>

        <div className="_storybook-transition-caption">
          <strong>cERS Storybook</strong>
          <span>컴포넌트 문서로 이동하고 있어요</span>
        </div>
      </div>
    </div>
  );
}
