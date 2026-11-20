import { expect, type Page, test } from "@playwright/test";

import { login, PAGES, settle, type UserType } from "./helpers";

/*
 * 조작 크기(KWCAG 6.1.3, WCAG 2.5.8): 누를 수 있는 컨트롤은 24×24px 이상
 * - 화면에서만 숨긴 입력(라디오·체크박스·파일)은 그 라벨을 잽니다.
 * - 보이는 크기보다 누르는 영역을 넓힌 경우(헤더 로고)는 실제로 눌리는 지점을 찍어 확인합니다.
 */
const MIN = 24;

function findSmallTargets(page: Page) {
  return page.evaluate((min) => {
    const hits = (element: Element, x: number, y: number) => {
      const hit = document.elementFromPoint(x, y);
      return !!hit && (hit === element || element.contains(hit));
    };
    const small: string[] = [];
    document
      .querySelectorAll<HTMLElement>(
        'a[href], button, input:not([type="hidden"]), select, textarea, [role="tab"]',
      )
      .forEach((element) => {
        let target: Element = element;
        if (element instanceof HTMLInputElement && element.classList.contains("sr-only")) {
          target =
            element.closest("label") ??
            (element.id ? document.querySelector(`label[for="${element.id}"]`) : null) ??
            element;
        }
        if (element instanceof HTMLInputElement && getComputedStyle(element).clip !== "auto") {
          target = element.closest("label") ?? target;
        }
        let rect = target.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        if (rect.width < min || rect.height < min) {
          // 누르는 지점을 찍어 보려면 화면 안에 있어야 하므로 가운데로 스크롤
          target.scrollIntoView({ block: "center", inline: "center" });
          rect = target.getBoundingClientRect();
        }
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const half = (min - 1) / 2;
        const tallEnough =
          rect.height >= min || (hits(target, cx, cy - half) && hits(target, cx, cy + half));
        const wideEnough =
          rect.width >= min || (hits(target, cx - half, cy) && hits(target, cx + half, cy));
        if (!tallEnough || !wideEnough) {
          const name = (
            element.getAttribute("aria-label") ||
            element.textContent ||
            (element as HTMLInputElement).name ||
            ""
          )
            .trim()
            .slice(0, 30);
          small.push(
            `${element.tagName.toLowerCase()} "${name}" ${Math.round(rect.width)}×${Math.round(rect.height)}`,
          );
        }
      });
    return [...new Set(small)];
  }, MIN);
}

for (const viewport of [
  { name: "PC", width: 1440, height: 900 },
  { name: "모바일", width: 375, height: 812 },
]) {
  test(`${viewport.name}: 로그인 화면의 컨트롤이 24px 이상이다`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");
    await settle(page);
    expect(await findSmallTargets(page)).toEqual([]);
  });

  for (const userType of ["financial", "admin"] as UserType[]) {
    test(`${viewport.name}: ${userType} 화면의 컨트롤이 24px 이상이다`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await login(page, userType);
      for (const path of PAGES[userType]) {
        await page.goto(path);
        await settle(page);
        expect.soft(await findSmallTargets(page), path).toEqual([]);
      }
    });
  }
}
