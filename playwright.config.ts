import { defineConfig, devices } from "@playwright/test";

/* 기본 4100. 다른 서버와 겹치면 E2E_PORT로 바꿔 실행 */
const PORT = Number(process.env.E2E_PORT ?? 4100);

/**
 * E2E 테스트 (pnpm test:e2e)
 * 프로덕션 빌드를 실행해 검사하므로 먼저 pnpm build가 필요합니다.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // README 스크린샷 촬영 (pnpm screenshots). 검사가 아니라서 평소 E2E에는 포함하지 않습니다.
    {
      name: "screenshots",
      testMatch: "readme.screenshots.ts",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `pnpm exec next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
