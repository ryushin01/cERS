import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { login, settle } from "./helpers";

/* 등기자료 크게 보기(확대·회전·쪽 이동): 실제 화면에서 키보드 조작, 초점 복귀, 접근성 검사 */
for (const viewport of [
  { name: "PC", width: 1440, height: 900 },
  { name: "모바일", width: 375, height: 812 },
]) {
  test(`${viewport.name}: 등기자료 슬라이드를 눌러 크게 보고, 키보드로 확대·회전·쪽 이동한다`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await login(page, "financial");
    await page.goto("/financial/status-inquiry");
    await settle(page);

    await page
      .getByRole("button", { name: /등기자료/ })
      .first()
      .click();
    const dataDialog = page.getByRole("dialog", { name: "등기자료" });
    await expect(dataDialog).toBeVisible();
    await settle(page);

    // 슬라이드는 "크게 보기" 버튼 (키보드로 열기)
    const opener = dataDialog.getByRole("button", { name: "등기자료 1쪽 크게 보기" });
    await opener.focus();
    await page.keyboard.press("Enter");

    const viewer = page.getByRole("dialog", { name: "등기자료 크게 보기" });
    await expect(viewer).toBeVisible();
    const status = viewer.getByRole("status");
    await expect(status).toHaveText("3쪽 중 1쪽, 배율 100%");
    await settle(page);

    const { violations } = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
    expect(violations.map(({ id, nodes }) => `${id} ${nodes[0].target.join(" ")}`)).toEqual([]);

    // 조작 버튼은 44×44px 이상 (KWCAG 6.1.3)
    for (const button of await viewer.getByRole("toolbar").getByRole("button").all()) {
      const box = await button.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }

    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("+");
    await page.keyboard.press("r");
    await expect(status).toHaveText("3쪽 중 2쪽, 배율 125%, 90도 회전");
    await expect(viewer.getByRole("img", { name: /등기자료 2번 이미지/ })).toBeVisible();

    // 확대하면 문서 영역이 스크롤되어 키보드로 움직일 수 있음
    await page.keyboard.press("+");
    await page.keyboard.press("+");
    const stage = viewer.getByRole("region", { name: "등기자료 2쪽" });
    const isScrollable = await stage.evaluate(
      (element) =>
        element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth,
    );
    expect(isScrollable).toBe(true);

    // 문서 영역에 초점을 두면 방향키는 쪽을 넘기지 않고 확대한 화면을 움직임
    await stage.focus();
    const scrollTop = await stage.evaluate((element) => element.scrollTop);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowRight");
    await expect
      .poll(() => stage.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(scrollTop);
    await expect(status).toHaveText("3쪽 중 2쪽, 배율 200%, 90도 회전");

    // Esc는 크게 보기만 닫고, 초점은 누른 슬라이드 버튼으로 돌아감
    await page.keyboard.press("Escape");
    await expect(viewer).toHaveCount(0);
    await expect(dataDialog).toBeVisible();
    await expect(opener).toBeFocused();
  });
}
