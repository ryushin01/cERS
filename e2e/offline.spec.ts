import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

import {
  collectPageProblems,
  findBrokenImages,
  login,
  PAGES,
  settle,
  type UserType,
} from "./helpers";

/*
 * 오프라인 검사: localhost 밖으로 나가는 요청을 모두 막은 채(route abort) 환경 변수(.env) 없이
 * 모든 화면 축(로그인·금융기관·관리자·Storybook)이 내용과 함께 뜨는지 확인합니다.
 * - 외부 요청은 막기만 하지 않고 기록해, 주요 화면이 외부에 기대지 않는다는 것(요청 0건)까지 확인합니다.
 * - 외부 서비스가 꼭 필요한 기능(주소검색: 다음 우편번호)은 예시 주소 대체 흐름을 끝까지 확인합니다.
 */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const USER_TYPES: UserType[] = ["financial", "admin"];

/** localhost가 아닌 요청을 모두 막고, 막은 주소를 모읍니다. */
async function blockExternal(page: Page) {
  const blocked: string[] = [];
  await page.context().route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.protocol === "data:" || url.protocol === "blob:" || LOCAL_HOSTS.has(url.hostname)) {
      return route.continue();
    }
    blocked.push(url.href);
    return route.abort("internetdisconnected");
  });
  return blocked;
}

const axeViolations = async (page: Page) => {
  const { violations } = await new AxeBuilder({ page }).analyze();
  return violations.map(({ id, impact, nodes }) => `${impact}:${id} ${nodes[0].target.join(" ")}`);
};

/** 화면에 실제 내용(제목과 글자)이 그려졌는지 확인합니다. */
async function expectContent(page: Page, label: string) {
  await expect(page.getByRole("heading").first(), `${label} 제목`).toBeVisible();
  const text = (await page.locator("body").innerText()).replace(/\s+/g, "");
  expect.soft(text.length, `${label} 본문 글자 수`).toBeGreaterThan(50);
}

/** 글꼴(Pretendard)을 외부 CDN 없이 불러왔는지 확인합니다. */
const hasLocalFont = (page: Page) =>
  page.evaluate(() =>
    document.fonts.ready.then(() =>
      [...document.fonts].some(
        (font) =>
          font.family.replace(/"/g, "") === "Pretendard Variable" && font.status === "loaded",
      ),
    ),
  );

test.describe("오프라인(외부 요청 차단)", () => {
  test("로그인 화면", async ({ page, baseURL }) => {
    const blocked = await blockExternal(page);
    const problems = collectPageProblems(page, baseURL!);
    await page.goto("/");
    await settle(page);

    await expectContent(page, "로그인");
    expect(await hasLocalFont(page), "Pretendard 글꼴").toBe(true);
    expect(await axeViolations(page)).toEqual([]);
    expect(await findBrokenImages(page)).toEqual([]);
    expect(problems).toEqual([]);
    expect(blocked, "외부 요청").toEqual([]);
  });

  for (const userType of USER_TYPES) {
    test(`${userType} 모든 화면`, async ({ page, baseURL }) => {
      const blocked = await blockExternal(page);
      const problems = collectPageProblems(page, baseURL!);
      await login(page, userType);

      for (const path of PAGES[userType]) {
        await page.goto(path);
        await settle(page);

        await expectContent(page, path);
        expect.soft(await axeViolations(page), `${path} 접근성`).toEqual([]);
        expect.soft(await findBrokenImages(page), `${path} 깨진 이미지`).toEqual([]);
      }
      expect(problems).toEqual([]);
      expect(blocked, "외부 요청").toEqual([]);
    });
  }

  test("주소검색은 우편번호 서비스 대신 예시 주소로 대체해 끝까지 고를 수 있다", async ({
    page,
  }) => {
    const blocked = await blockExternal(page);
    await login(page, "admin");
    await page.goto("/admin/assign/assign-create");
    await settle(page);

    await page.getByRole("button", { name: "주소 검색" }).click();
    const dialog = page.getByRole("dialog", { name: "주소검색" });
    await expect(dialog.getByRole("status")).toHaveText(/오프라인 예시 주소로 표시 중/);
    expect(await axeViolations(page)).toEqual([]);

    await dialog.getByRole("button", { name: /서울특별시 중구 예시로 12/ }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole("textbox", { name: "도로명 주소" })).toHaveValue(
      "서울특별시 중구 예시로 12 (예시아파트)",
    );
    await expect(page.getByRole("textbox", { name: "지번 주소" })).toHaveValue(
      "서울특별시 중구 예시동 101-1",
    );
    // 막힌 외부 요청은 우편번호 스크립트뿐
    expect(blocked.every((url) => url.includes("daumcdn.net"))).toBe(true);
  });

  test("Storybook", async ({ page }) => {
    const blocked = await blockExternal(page);
    await page.goto("/storybook/index.html");

    await expect(
      page
        .frameLocator("#storybook-preview-iframe")
        .getByRole("heading", { name: "cERS Storybook" }),
    ).toBeVisible({ timeout: 30_000 });
    await page.waitForLoadState("networkidle");
    expect(blocked, "외부 요청").toEqual([]);
  });
});
