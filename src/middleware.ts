import { NextResponse } from "next/server";

import {
  AD_ASSIGN,
  AD_PATH,
  FI_HOME,
  FI_PATH,
  LA_PATH,
  LOGIN_PATH,
  STORYBOOK_PATH,
} from "@constants/path";
import { PUBLIC_FILES_REG_EXP } from "@constants/reg-exp";
import { isPathUnder } from "@utils/pathUtil";

import type { NextRequest } from "next/server";

/**
 * @name middleware
 * @version 1.0.0
 * @author 류창선 <ryushin0167@gmail.com>
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const membGbCd = request.cookies.get("membGbCd");
  const isLogin: boolean = !!membGbCd?.value;
  const isFinancial = membGbCd?.value === "00";
  const isAdmin = membGbCd?.value === "20";
  const isFinancialPage = isPathUnder(pathname, FI_PATH);
  const isAdminPage = isPathUnder(pathname, AD_PATH);
  const isMemberPage = [FI_PATH, AD_PATH, LA_PATH].some((path) => isPathUnder(pathname, path));
  const isValidPublicFiles = request.nextUrl.pathname.match(PUBLIC_FILES_REG_EXP);

  // 정적 파일, Storybook(컴포넌트 문서)은 로그인·사용자 유형과 상관없이 통과
  // 권한 페이지 아래의 경로는 점이 있어도 정적 파일로 보지 않습니다. (상세 화면 번호에 점을 넣어 권한 검사를 건너뛰지 못하게)
  if ((isValidPublicFiles && !isMemberPage) || isPathUnder(pathname, STORYBOOK_PATH)) {
    return NextResponse.next();
  }

  // 금융기관 로그인 상태에서 금융기관 권한 외 접근 시
  if (isFinancial && !isFinancialPage) {
    return NextResponse.redirect(new URL(FI_HOME, request.url));
  }

  // 관리자 로그인 상태에서 관리자 권한 외 접근 시
  if (isAdmin && !isAdminPage) {
    return NextResponse.redirect(new URL(AD_ASSIGN, request.url));
  }

  // 미 로그인 상태에서 권한 페이지 접근 시
  if (!isLogin && isMemberPage) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
