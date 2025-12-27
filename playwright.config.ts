import type { PlaywrightTestConfig } from "@playwright/test";

const ADMIN_E2E_TOKEN = process.env.ADMIN_E2E_TOKEN ?? "dev-admin-token";

const config: PlaywrightTestConfig = {
  testDir: "tests",
  use: {
    extraHTTPHeaders: {
      "x-admin-test-token": ADMIN_E2E_TOKEN,
    },

    baseURL: process.env.PW_BASE_URL ?? "http://localhost:3000",
    browserName: "chromium",
    // Add admin auth headers for API requests in tests
    // This allows lookupIds helpers and other API calls to authenticate
  },
  // Timeout settings for stability
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  // Skip tests marked with @quarantine or @flaky from the default test run
  // - @quarantine: future/strict tests not yet passing
  // - @flaky: tests with intermittent failures (must have issue links)
  // Use `npm run green:flaky` to run flaky tests specifically
  grepInvert: /@quarantine|@flaky/,

  // Auto-start dev server when running E2E tests
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
};

export default config;
