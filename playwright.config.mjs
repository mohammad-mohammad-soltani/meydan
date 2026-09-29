import { defineConfig } from "@playwright/test";

const baseURL = process.env.MAP_TEST_BASE_URL || "http://localhost:3000";
export default defineConfig({
  testDir: "./tests",
  testMatch: "map-browser.spec.mjs",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL,
    viewport: { width: 1280, height: 1000 },
    launchOptions: process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {},
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `npm run dev -- --port ${new URL(baseURL).port || "3000"}`,
    url: `${baseURL}/map`,
    reuseExistingServer: true,
    timeout: 60000,
  },
});
