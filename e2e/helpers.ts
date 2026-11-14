import type { Page } from "@playwright/test";

export type UserType = "financial" | "admin";

/* 목업 데이터의 의뢰번호 (src/mocks/data.ts): 002400은 등기의뢰, 002396은 접수검토중 상태 */
const REQUEST_NO = "DEMO-002400";
const REVIEWING_NO = "DEMO-002396";

export const PAGES: Record<UserType, string[]> = {
  financial: [
    "/financial/home",
    "/financial/home/notice",
    "/financial/request-list",
    "/financial/request-list/request",
    "/financial/status-inquiry",
  ],
  admin: [
    "/admin/assign",
    "/admin/assign/assign-create",
    `/admin/assign/assign-detail/${REQUEST_NO}`,
    "/admin/registration",
    `/admin/registration/registration-detail/${REVIEWING_NO}`,
    `/admin/registration/registration-acceptance/${REVIEWING_NO}`,
    "/admin/member",
    "/admin/notice",
  ],
};

/** 데모 로그인: 사용자 유형만 고르고 로그인 버튼을 누릅니다. */
export async function login(page: Page, userType: UserType) {
  await page.goto("/");
  if (userType === "admin") {
    await page.getByText("관리자", { exact: true }).click();
  }
  await page.getByRole("button", { name: /로그인/ }).click();
  await page.waitForURL(userType === "admin" ? /\/admin\// : /\/financial\//);
  await settle(page);
}

/** 데이터와 글꼴까지 불러온 뒤 측정합니다. (글꼴이 바뀌면 글자 폭도 바뀜) */
export async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
}

export type LayoutReport = {
  /** 페이지가 가로로 넘친 폭(px). 0이면 정상 */
  overflow: number;
  /** 스크롤할 수 없는 영역에 잘린 버튼·입력칸 */
  clippedControls: string[];
  /** 두 줄 이상으로 꺾인 탭 이름 */
  wrappedTabs: string[];
  /** 글자 중간에서 줄이 꺾인 홈 인사말 */
  wrappedGreeting: string[];
  /** 사라질 만큼 좁아진 입력칸 */
  collapsedControls: string[];
  /** 콘텐츠 모델에 어긋난 요소 중첩 (HTML Living Standard, KWCAG 마크업 오류 방지) */
  invalidNesting: string[];
  /** 내용이 잘린 표 머리글(항목 이름) */
  cutHeaders: string[];
  /** 내용이 잘린 표 값 */
  cutCells: string[];
};

/** 화면의 가로 넘침, 잘린 버튼·입력칸, 잘린 표 글자를 측정합니다. */
export function measureLayout(page: Page): Promise<LayoutReport> {
  return page.evaluate(() => {
    const isSkipped = (element: Element) =>
      // 슬라이드와 탭 목록은 가로로 넘기는 것이 정상 동작
      !!element.closest('[class*="swiper"]') || !!element.closest("._tab-list");

    /** 조상 요소 중 하나라도 이 요소를 잘라 내는지 확인합니다. 스크롤할 수 있는 영역을 만나면 볼 수 있으므로 멈춥니다. */
    const isClipped = (element: Element, rect: DOMRect) => {
      let parent = element.parentElement;
      while (parent && parent !== document.body) {
        const overflowX = getComputedStyle(parent).overflowX;
        if (overflowX === "auto" || overflowX === "scroll") return false;
        if (overflowX !== "visible") {
          const parentRect = parent.getBoundingClientRect();
          if (rect.right > parentRect.right + 1 || rect.left < parentRect.left - 1) return true;
        }
        parent = parent.parentElement;
      }
      return false;
    };

    const clippedControls = new Set<string>();
    const controls = document.querySelectorAll<HTMLElement>(
      'main button, main input:not([type="file"]):not([type="radio"]):not([type="checkbox"]), main select',
    );
    controls.forEach((control) => {
      const rect = control.getBoundingClientRect();
      if (!rect.width || getComputedStyle(control).visibility === "hidden") return;
      if (isSkipped(control)) return;

      if (isClipped(control, rect)) {
        const name =
          control.getAttribute("aria-label") || control.getAttribute("name") || control.tagName;
        clippedControls.add(name);
      }
    });

    const wrappedGreeting = [...document.querySelectorAll<HTMLElement>("._banner-text > span")]
      .filter((text) => text.getClientRects().length > 1 || text.offsetHeight > 60)
      .map((text) => text.textContent ?? "");

    const collapsedControls = [...document.querySelectorAll<HTMLElement>("main input, main select")]
      .filter((control) => {
        const type = control.getAttribute("type");
        if (type === "radio" || type === "checkbox" || type === "file" || type === "hidden") {
          return false;
        }
        const { width } = control.getBoundingClientRect();
        return width > 0 && width < 30;
      })
      .map((control) => control.getAttribute("aria-label") || control.getAttribute("name") || "");

    // 라이브러리(antd, react-datepicker)가 만드는 마크업은 고칠 수 없으므로 제외
    const isLibraryMarkup = (element: Element) =>
      !!element.closest('[class*="ant-"], [class*="react-datepicker"]');
    const FLOW_CONTENT = "div, p, ul, ol, li, form, fieldset, section, table, h1, h2, h3, h4, nav";
    const invalidNesting = new Set<string>();
    document.querySelectorAll("span, p, label, button, h1, h2, h3, h4").forEach((parent) => {
      if (isLibraryMarkup(parent)) return;
      const child = parent.querySelector(FLOW_CONTENT);
      if (child) {
        invalidNesting.add(`${parent.tagName} > ${child.tagName}: ${parent.className}`);
      }
    });
    document.querySelectorAll("button, a[href]").forEach((parent) => {
      const child = parent.querySelector("button, a[href], input, select, textarea, [tabindex]");
      if (child && !isLibraryMarkup(parent)) {
        invalidNesting.add(`대화형 ${parent.tagName} > ${child.tagName}: ${parent.className}`);
      }
    });
    document.querySelectorAll("label").forEach((label) => {
      if (
        !isLibraryMarkup(label) &&
        label.querySelectorAll("input, select, textarea, button").length > 1
      ) {
        invalidNesting.add(`label에 컨트롤 2개 이상: ${label.className}`);
      }
    });

    // 탭 이름은 한 줄이어야 함 (좁은 화면에서 글자가 세로로 쌓이지 않고 가로로 스크롤)
    const wrappedTabs = [
      ...document.querySelectorAll<HTMLElement>("._tab-trigger > span:first-child"),
    ]
      .filter((label) => label.getClientRects().length > 1 || label.offsetHeight > 40)
      .map((label) => label.textContent ?? "");

    const cutHeaders = new Set<string>();
    const cutCells = new Set<string>();
    document
      .querySelectorAll<HTMLElement>('main th, main td, [role="dialog"] th, [role="dialog"] td')
      .forEach((cell) => {
        const text = cell.textContent?.trim();
        if (!text || cell.querySelector("input, select, button, textarea")) return;
        // 공지 표의 제목 칸은 긴 제목을 말줄임으로 표시하는 것이 정상 동작
        if (cell.closest("._col-2-type") && !cell.previousElementSibling) return;

        const range = document.createRange();
        range.selectNodeContents(cell);
        const style = getComputedStyle(cell);
        const available =
          cell.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
        const isCutInside = [...cell.querySelectorAll("span")].some(
          (span) =>
            span.scrollWidth > span.clientWidth + 1 &&
            getComputedStyle(span).overflow !== "visible",
        );

        if (
          range.getBoundingClientRect().width > available + 1 ||
          cell.scrollWidth > cell.clientWidth + 1 ||
          isCutInside
        ) {
          (cell.tagName === "TH" ? cutHeaders : cutCells).add(text);
        }
      });

    return {
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      clippedControls: [...clippedControls],
      wrappedTabs,
      wrappedGreeting,
      collapsedControls,
      invalidNesting: [...invalidNesting],
      cutHeaders: [...cutHeaders],
      cutCells: [...cutCells],
    };
  });
}

/** 페이지의 콘솔 오류, 처리되지 않은 예외, 같은 주소의 요청 실패를 모읍니다. (외부 CDN 장애는 제외) */
export function collectPageProblems(page: Page, baseURL: string) {
  const problems: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().startsWith("Failed to load resource")) {
      problems.push(`console: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => problems.push(`exception: ${error.message}`));
  page.on("response", (response) => {
    if (response.status() >= 400 && response.url().startsWith(baseURL)) {
      problems.push(`http ${response.status()}: ${response.url().replace(baseURL, "")}`);
    }
  });

  return problems;
}

/** 깨진 이미지 주소 목록 */
export function findBrokenImages(page: Page) {
  return page.evaluate(() =>
    [...document.images]
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => image.getAttribute("src")),
  );
}
