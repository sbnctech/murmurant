import { test, expect } from "@playwright/test";

// Respect PW_BASE_URL when provided, otherwise default to http://localhost:3000
const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test("email test endpoint sends a mock email", async ({ request }) => {
  const response = await request.post(`${BASE}/api/email/test`, {
    data: { to: "recipient@example.com" },
  });

  expect(response.ok()).toBeTruthy();

  const data = await response.json();
  expect(data.ok).toBe(true);
  expect(data.to).toBe("recipient@example.com");
  expect(typeof data.messageId).toBe("string");
});
