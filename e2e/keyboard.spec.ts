import { expect, type Locator, type Page, test } from "@playwright/test";

import { login, PAGES, settle, type UserType } from "./helpers";

/* 키보드 사용: axe로는 확인할 수 없는 항목 (KWCAG 키보드 사용 보장, 초점 이동과 표시, 반복 영역 건너뛰기) */
const USER_TYPES: UserType[] = ["financial", "admin"];

/** Tab만 눌러 대상에 초점이 갈 때까지 이동합니다. 끝까지 닿지 못하면 실패합니다. */
async function tabTo(page: Page, target: Locator, maxPresses = 40) {
  // 역할·이름으로 찾지 못하면(display: none 등으로 스크린 리더에서 빠진 경우) 바로 실패합니다.
  await expect(target, "스크린 리더에 드러나는 요소여야 합니다").toBeAttached();
  for (let press = 0; press < maxPresses; press += 1) {
    await page.keyboard.press("Tab");
    if (await target.evaluate((element) => element === document.activeElement)) return;
  }
  throw new Error(`Tab ${maxPresses}번 안에 닿지 못했습니다.`);
}

test("Tab을 처음 누르면 본문 바로가기가 보이고, 누르면 본문으로 이동한다", async ({ page }) => {
  await login(page, "financial");

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "본문 바로가기" });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeInViewport();

  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
});

test("로그인 화면에도 본문 바로가기가 있다", async ({ page }) => {
  await page.goto("/");
  await settle(page);

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "본문 바로가기" })).toBeFocused();
});

for (const userType of USER_TYPES) {
  test(`${userType} 화면에서 Tab으로 이동할 때 초점이 항상 보인다`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page, userType);

    for (const path of PAGES[userType]) {
      await page.goto(path);
      await settle(page);

      for (let press = 0; press < 25; press += 1) {
        await page.keyboard.press("Tab");
        const hidden = await page.evaluate(() => {
          const active = document.activeElement;
          if (!active || active === document.body) return null;
          const style = getComputedStyle(active);
          const isVisible =
            style.outlineStyle !== "none" &&
            parseFloat(style.outlineWidth) > 0 &&
            !/rgba\(0, 0, 0, 0\)|transparent/.test(style.outlineColor);
          return isVisible ? null : `${active.tagName} ${active.className}`;
        });
        expect.soft(hidden, `${path} 초점 표시`).toBeNull();
      }
    }
  });
}

test("계정 메뉴를 Esc로 닫으면 연 버튼으로 초점이 돌아간다", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page, "financial");

  const opener = page.locator("._header-right-area").getByRole("button", { name: /데모 금융기관/ });
  await opener.focus();
  await expect(opener).toHaveAttribute("aria-expanded", "false");
  await page.keyboard.press("Enter");
  await expect(page.locator("._account-layer")).toBeVisible();
  await expect(opener).toHaveAttribute("aria-expanded", "true");

  await page.keyboard.press("Escape");
  await expect(page.locator("._account-layer")).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test("모바일 드로어는 대화상자로 열리고, Esc로 닫으면 메뉴 버튼으로 초점이 돌아간다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await login(page, "financial");

  const opener = page.getByRole("button", { name: "계정 메뉴 열기" });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "계정 메뉴" });
  await expect(dialog).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test("배정관리 의뢰번호 검색칸에 의뢰번호를 입력할 수 있다", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await login(page, "admin");

  const search = page.getByRole("textbox", { name: "의뢰번호" }).first();
  await search.fill("DEMO-002400");

  await expect(search).toHaveValue("DEMO-002400");
});

// 재발 방지: 라디오·체크박스의 실제 입력이 display: none이라 Tab으로 갈 수 없고 스크린 리더도 읽지 못했습니다.
test("로그인 화면의 사용자 유형과 아이디 저장을 키보드로 고르고 로그인할 수 있다", async ({
  page,
}) => {
  await page.goto("/");
  await settle(page);

  const financial = page.getByRole("radio", { name: "금융기관" });
  await tabTo(page, financial);
  await expect(financial).toBeChecked();
  // 숨긴 입력 대신 라벨 전체에 초점이 보인다
  await expect(financial.locator("xpath=..")).toHaveCSS("outline-style", "solid");

  // 방향키로 법무대리인을 지나 관리자를 고른다
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "관리자" })).toBeChecked();

  const saveId = page.getByRole("checkbox", { name: "아이디 저장" });
  await tabTo(page, saveId);
  await expect(saveId.locator("xpath=..")).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Space");
  await expect(saveId).toBeChecked();

  await tabTo(page, page.getByRole("button", { name: /로그인/ }));
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/admin\//);
});

// 재발 방지: 파일 입력이 display: none이라 "등기자료 추가"를 마우스로만 쓸 수 있었습니다.
test("관리자 신규등록의 등기자료 추가를 키보드로 열 수 있다", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page, "admin");
  await page.goto("/admin/assign/assign-create");
  await settle(page);

  await tabTo(page, page.getByLabel("등기자료 추가"));
  await expect(page.locator("label._file-uploader")).toHaveCSS("outline-style", "solid");

  const fileChooser = page.waitForEvent("filechooser");
  await page.keyboard.press("Space");
  await fileChooser;
});
