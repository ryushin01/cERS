import { expect, test } from "@playwright/test";

/* 로그인 화면의 Storybook 바로 가기: 전환 애니메이션 → 이동 → 도착 애니메이션 → 뒤로 가기 */
test("바로 가기를 누르면 전환 화면을 거쳐 Storybook으로 이동하고, 뒤로 가기 한 번에 돌아온다", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.getByRole("link", { name: /Storybook 바로 가기/ }).click();
  await expect(page.locator("._storybook-transition")).toBeVisible();

  await page.waitForURL(/\/storybook\/index\.html/);
  await expect(page.locator("html.ers-arrive")).toHaveCount(1);

  // 도착 후: 애니메이션이 끝나고 소개 문서와 cERS 로고가 표시됨
  await expect(page.locator("html.ers-arrive")).toHaveCount(0, { timeout: 5_000 });
  await expect(
    page.frameLocator("#storybook-preview-iframe").getByRole("heading", { name: "cERS Storybook" }),
  ).toBeVisible({ timeout: 30_000 });
  const brandLogo = page.locator('img[src$="Logo.svg"]').first();
  await expect(brandLogo).toBeVisible();
  expect(await brandLogo.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(
    0,
  );

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("._storybook-transition")).toHaveCount(0);
});

test("로그인 여부와 상관없이 /storybook으로 들어올 수 있다", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "membGbCd", value: "20", url: baseURL! }]);

  const response = await page.goto("/storybook");

  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/storybook\/index\.html/);
});

test("동작 줄이기 설정이면 전환 화면 없이 바로 이동한다", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.getByRole("link", { name: /Storybook 바로 가기/ }).click();

  await page.waitForURL(/\/storybook\/index\.html/);
  await expect(page.locator("html.ers-arrive")).toHaveCount(0);
});
