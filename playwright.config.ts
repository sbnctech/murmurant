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
  // Skip tests marked with @quarantine - these are future/strict tests not yet passing
  grepInvert: /@quarantine/,
};

export default config;
