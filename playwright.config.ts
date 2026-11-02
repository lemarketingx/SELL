import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3100);
const FIXTURE_PORT = 3199;

// מצב בדיקות: זיכרון במקום Upstash, ואישור לסרוק את אתר הדמה המקומי (localhost). לעולם לא בייצור.
const testEnv = { NEXT_PUBLIC_TAKIN_TEST: "1", TAKIN_TEST_ALLOW_PRIVATE: "1", TAKIN_TEST_MEMORY_STORE: "1" };

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${PORT}`, locale: "he-IL" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Desktop Chrome"], viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true } },
  ],
  webServer: [
    {
      command: `node tests/e2e/fixture-server.mjs`,
      url: `http://localhost:${FIXTURE_PORT}/`,
      env: { FIXTURE_PORT: String(FIXTURE_PORT) },
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm build && pnpm start --port ${PORT}`,
      url: `http://localhost:${PORT}`,
      env: testEnv,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
