import { expect, test } from "@playwright/test";

/*
 * 아이콘과 공유 미리보기(OG) 링크 검사 (실제 프로덕션 빌드)
 * - 파비콘·홈 화면 아이콘·매니페스트 아이콘이 실제 그림으로 열리고, PNG는 표기한 크기와 같은지
 * - 공유 미리보기 이미지 주소가 localhost가 아닌 https 절대 주소이고, 그 경로의 파일이 있는지
 * 운영의 og:image가 기본값 localhost를 가리켜 메신저·SNS 미리보기 그림이 비던 문제(v2.2.4)를 다시 겪지 않게 합니다.
 */
test("아이콘과 공유 미리보기 링크가 실제 그림을 가리킨다", async ({ page, request }) => {
  await page.goto("/");

  const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(ogImage, "og:image").toMatch(/^https:\/\//);
  expect(ogImage, "og:image").not.toContain("localhost");
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", ogImage!);

  // 운영 주소 대신 이 빌드에서 같은 경로의 파일을 받습니다.
  const og = await request.get(new URL(ogImage!).pathname);
  expect(og.ok(), "og:image 파일").toBe(true);
  expect(og.headers()["content-type"], "og:image 형식").toMatch(/^image\//);

  const icons = await page
    .locator('link[rel="icon"], link[rel="apple-touch-icon"]')
    .evaluateAll((links) =>
      links.map((link) => ({
        href: link.getAttribute("href")!,
        sizes: link.getAttribute("sizes"),
      })),
    );
  expect(icons.length, "아이콘 링크").toBeGreaterThan(0);

  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
  const manifest = (await (await request.get(manifestHref!)).json()) as {
    icons: { src: string; sizes?: string }[];
  };
  icons.push(...manifest.icons.map(({ src, sizes }) => ({ href: src, sizes: sizes ?? null })));

  for (const { href, sizes } of icons) {
    const response = await request.get(href);
    expect.soft(response.ok(), `${href} 응답`).toBe(true);
    const type = response.headers()["content-type"] ?? "";
    expect.soft(type, `${href} 형식`).toMatch(/^image\//);
    if (type.startsWith("image/png") && sizes) {
      // PNG 머리(IHDR)의 너비·높이
      const body = await response.body();
      const actual = `${body.readUInt32BE(16)}x${body.readUInt32BE(20)}`;
      expect.soft(actual, `${href} 크기`).toBe(sizes);
    }
  }
});
