// @vitest-environment node
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { middleware } from "./middleware";

const BASE_URL = "https://localhost:4000";

function request(pathname: string, membGbCd?: string) {
  const headers = membGbCd ? { cookie: `membGbCd=${membGbCd}` } : undefined;
  return middleware(new NextRequest(new URL(pathname, BASE_URL), { headers }));
}

/** 리다이렉트면 이동할 경로를, 통과면 null을 돌려줍니다. */
function redirectedTo(pathname: string, membGbCd?: string) {
  const location = request(pathname, membGbCd).headers.get("location");
  return location ? new URL(location).pathname : null;
}

describe("middleware 권한별 라우팅", () => {
  // 사용자 구분 코드: 00 금융기관, 20 관리자
  it.each([
    // [요청 경로, 쿠키 membGbCd, 이동할 경로(null이면 통과)]
    ["/", undefined, null],
    ["/financial/home", undefined, "/"],
    ["/admin/assign", undefined, "/"],
    ["/lawyer", undefined, "/"],
    ["/financial/home", "00", null],
    ["/financial/request-list/request", "00", null],
    ["/admin/assign", "00", "/financial/home"],
    ["/admin/assign", "20", null],
    ["/financial/home", "20", "/admin/assign"],
    // 재발 방지: 이전에는 includes로 판정해서 금융기관 페이지로 오인했습니다.
    ["/financialx", "00", "/financial/home"],
    // 재발 방지: 점이 있는 경로를 정적 파일로 보아 권한 검사를 건너뛰었습니다.
    ["/admin/registration/registration-detail/example.svg", undefined, "/"],
    ["/financial/home.png", undefined, "/"],
    ["/admin/assign/assign-detail/1.2", "00", "/financial/home"],
    ["/admin/assign/assign-detail/1.2", "20", null],
  ])("%s (membGbCd=%s) → %s", (pathname, membGbCd, expected) => {
    expect(redirectedTo(pathname, membGbCd)).toBe(expected);
  });

  it("로그인 상태에서 로그인 화면에 오면 유형별 홈으로 보낸다", () => {
    expect(redirectedTo("/", "00")).toBe("/financial/home");
    expect(redirectedTo("/", "20")).toBe("/admin/assign");
  });

  it("정적 파일은 권한과 상관없이 통과한다", () => {
    expect(redirectedTo("/icons/24/logo.svg")).toBeNull();
  });

  it.each([undefined, "00", "20"])(
    "Storybook은 로그인 상태(membGbCd=%s)와 상관없이 통과한다",
    (membGbCd) => {
      expect(redirectedTo("/storybook", membGbCd)).toBeNull();
      expect(redirectedTo("/storybook/index.html", membGbCd)).toBeNull();
      expect(redirectedTo("/storybook/iframe.html", membGbCd)).toBeNull();
    },
  );
});
