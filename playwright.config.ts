import type { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  testDir: "tests",
  use: {
    baseURL: process.env.PW_BASE_URL ?? "http://localhost:3000",
    browserName: "chromium",
    // Add admin auth headers for API requests in tests
    // This allows lookupIds helpers and other API calls to authenticate
    extraHTTPHeaders: {
      Authorization: "Bearer test-admin-token",
    },
  },
  // Timeout settings for stability
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
};

export default config;
