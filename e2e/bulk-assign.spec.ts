import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { login, settle } from "./helpers";

/* 일괄 배정: 키보드로 여러 건을 고르고, 법무대리인 오류 안내·초점, 배정 후 목록·건수 반영 */
test("배정관리에서 여러 건을 키보드로 골라 법무대리인을 한 번에 지정한다", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page, "admin");
  await page.goto("/admin/assign");
  await settle(page);

  const badge = page.getByText(/^미배정 \d+건$/);
  const before = Number((await badge.textContent())!.match(/\d+/)![0]);
  const checkboxes = page.getByRole("checkbox", { name: /^DEMO-\d+ 선택$/ });

  // 선택 칸은 누를 수 있는 영역 24×24px 이상 (라벨)
  for (const checkbox of (await checkboxes.all()).slice(0, 2)) {
    const box = await checkbox.locator("xpath=..").boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(24);
    expect(box!.height).toBeGreaterThanOrEqual(24);
    await checkbox.focus();
    await page.keyboard.press("Space");
  }
  await expect(page.getByRole("status").filter({ hasText: "건 선택됨" })).toHaveText("2건 선택됨");

  await page.getByRole("button", { name: "일괄 배정" }).click();
  const dialog = page.getByRole("dialog", { name: "일괄 배정" });
  await expect(dialog).toBeVisible();
  await settle(page);
  const { violations } = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
  expect(violations.map(({ id, nodes }) => `${id} ${nodes[0].target.join(" ")}`)).toEqual([]);

  // 법무대리인 없이 제출: 오류를 select에 연결하고 초점 이동
  await dialog.getByRole("button", { name: "2건 배정하기" }).click();
  const select = dialog.getByRole("combobox", { name: /법무대리인/ });
  await expect(select).toBeFocused();
  await expect(select).toHaveAttribute("aria-invalid", "true");
  await expect(select).toHaveAccessibleDescription("법무대리인을 선택해 주세요.");

  await select.selectOption({ label: "데모 법무법인" });
  await dialog.getByRole("button", { name: "2건 배정하기" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText("2건을 배정했습니다.")).toBeVisible();
  await expect(page.getByRole("button", { name: "일괄 배정" })).toBeFocused();
  await expect(badge).toHaveText(`미배정 ${before - 2}건`);
});
