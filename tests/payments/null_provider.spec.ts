import { test, expect } from "@playwright/test";
import { NullPaymentProvider } from "../../src/lib/payments/providers/null_provider";

test.describe("NullPaymentProvider", () => {
  const provider = new NullPaymentProvider();

  test("creates intent", () => {
    expect(provider.createIntent().status).toBe("authorized");
  });

  test("captures intent", () => {
    expect(provider.captureIntent().status).toBe("captured");
  });

  test("rejects invalid webhook", () => {
    expect(() => provider.verifyWebhook({})).toThrow();
  });
});
