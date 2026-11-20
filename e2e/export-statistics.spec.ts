import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

import { login, settle } from "./helpers";

/* 목록 엑셀(CSV) 내보내기와 통계 화면 */

async function exportCsv(page: Page) {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "엑셀 내보내기" }).click(),
  ]);
  const bytes = await readFile((await download.path())!);
  return { name: download.suggestedFilename(), bytes, text: bytes.subarray(3).toString("utf8") };
}

test("등기관리 목록을 BOM이 붙은 CSV로 내보내고, 행 수가 화면의 건수와 같다", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page, "admin");
  await page.goto("/admin/registration");
  await settle(page);

  const total = Number(
    (await page.getByRole("tab", { name: /전체/ }).textContent())!.match(/\d+/)![0],
  );
  const { name, bytes, text } = await exportCsv(page);

  expect(name).toMatch(/^등기관리_목록_\d{8}\.csv$/);
  expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
  const lines = text.split("\r\n");
  expect(lines[0]).toBe("진행상태,대출실행일,접수보고일시,의뢰번호,채권자,채무자,법무대리인");
  expect(lines).toHaveLength(total + 1);
  await expect(page.getByText(`${total}건을 엑셀(CSV) 파일로 내보냈습니다.`)).toBeVisible();
});

test("금융기관 현황조회 목록도 내보낼 수 있다", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await login(page, "financial");
  await page.goto("/financial/status-inquiry");
  await settle(page);

  const { name, text } = await exportCsv(page);
  expect(name).toMatch(/^전자등기_현황조회_\d{8}\.csv$/);
  expect(text.split("\r\n")[0]).toBe("의뢰번호,의뢰일,대출실행일,진행상태,접수번호,채무자");
});

test("통계: 요약과 기간별 표를 보여 주고, 조건을 바꿔 조회하면 알린다", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page, "admin");
  await page.goto("/admin/statistics");
  await settle(page);

  await expect(page.getByRole("heading", { name: "통계", level: 2 })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "집계" })).toContainText("주별");
  for (const label of ["의뢰", "접수완료", "접수반려", "진행취소", "반려율", "평균 처리 일수"]) {
    await expect(page.locator("dt", { hasText: new RegExp(`^${label}$`) })).toBeVisible();
  }
  const { violations } = await new AxeBuilder({ page }).include("main").analyze();
  expect(violations.map(({ id, nodes }) => `${id} ${nodes[0].target.join(" ")}`)).toEqual([]);

  await page.getByRole("button", { name: "최근 1주일" }).click();
  await page.getByLabel("집계 단위").selectOption({ label: "일별" });
  await page.getByRole("button", { name: "조회" }).click();
  await expect(page.getByRole("status").filter({ hasText: "집계" })).toContainText("일별");
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(1 + 7);

  const { name, text } = await exportCsv(page);
  expect(name).toMatch(/^통계_\d{8}\.csv$/);
  expect(text.split("\r\n")).toHaveLength(1 + 7);
});
