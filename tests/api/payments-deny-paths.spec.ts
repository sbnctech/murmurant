/**
 * Payment API Deny Path Tests
 *
 * Charter Principles:
 * - P1: Identity and authorization must be provable
 * - P2: Default deny, least privilege
 * - P9: Security must fail closed
 */

import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("Payment Intent API Authorization", () => {
  test.describe("POST /api/payments/intents", () => {
    test("returns 401 for unauthenticated requests", async ({ request }) => {
      const response = await request.post(`${BASE}/api/payments/intents`, {
        data: {
          registrationId: "00000000-0000-0000-0000-000000000001",
          amountCents: 5000,
          idempotencyKey: "test-key",
        },
      });

      expect(response.status()).toBe(401);
    });

    test("returns 400 for malformed request body", async ({ request }) => {
      const response = await request.post(`${BASE}/api/payments/intents`, {
        headers: {
          Authorization: "Bearer test-member-token",
        },
        data: {
          // Missing required fields
          amountCents: "not-a-number",
        },
      });

      expect(response.status()).toBe(400);
    });

    test("returns 404 for non-existent registration", async ({ request }) => {
      const response = await request.post(`${BASE}/api/payments/intents`, {
        headers: {
          Authorization: "Bearer test-member-token",
        },
        data: {
          registrationId: "00000000-0000-0000-0000-000000000000",
          amountCents: 5000,
          idempotencyKey: "test-key-nonexistent",
        },
      });

      expect(response.status()).toBe(404);
    });

    test("rejects negative amount", async ({ request }) => {
      const response = await request.post(`${BASE}/api/payments/intents`, {
        headers: {
          Authorization: "Bearer test-member-token",
        },
        data: {
          registrationId: "00000000-0000-0000-0000-000000000001",
          amountCents: -100,
          idempotencyKey: "test-negative",
        },
      });

      expect(response.status()).toBe(400);
    });

    test("rejects zero amount", async ({ request }) => {
      const response = await request.post(`${BASE}/api/payments/intents`, {
        headers: {
          Authorization: "Bearer test-member-token",
        },
        data: {
          registrationId: "00000000-0000-0000-0000-000000000001",
          amountCents: 0,
          idempotencyKey: "test-zero",
        },
      });

      expect(response.status()).toBe(400);
    });
  });
});

test.describe("Fake Payment Endpoints (Dev Only)", () => {
  test.describe("GET /api/payments/fake/checkout", () => {
    test("returns 400 for missing ref parameter", async ({ request }) => {
      const response = await request.get(`${BASE}/api/payments/fake/checkout`);

      // In dev mode, returns 400 for missing ref
      // In production without PAYMENTS_FAKE_ENABLED, would return 404
      expect([400, 404]).toContain(response.status());
    });

    test("returns 404 for non-existent payment ref", async ({ request }) => {
      const response = await request.get(`${BASE}/api/payments/fake/checkout?ref=nonexistent_ref`);

      expect(response.status()).toBe(404);
    });
  });

  test.describe("POST /api/payments/fake/webhook", () => {
    test("returns 400 for missing required fields", async ({ request }) => {
      const response = await request.post(`${BASE}/api/payments/fake/webhook`, {
        data: {
          // Missing type and providerRef
        },
      });

      // In dev mode, returns 400 for invalid payload
      // In production without PAYMENTS_FAKE_ENABLED, would return 404
      expect([400, 404]).toContain(response.status());
    });

    test("returns 400 for invalid event type", async ({ request }) => {
      const response = await request.post(`${BASE}/api/payments/fake/webhook`, {
        data: {
          type: "invalid.event.type",
          providerRef: "fake_pi_nonexistent",
        },
      });

      expect([400, 404]).toContain(response.status());
    });

    test("returns 400 for non-existent provider ref", async ({ request }) => {
      const response = await request.post(`${BASE}/api/payments/fake/webhook`, {
        data: {
          type: "payment_intent.succeeded",
          providerRef: "fake_pi_nonexistent_12345",
        },
      });

      expect([400, 404]).toContain(response.status());
    });
  });
});

test.describe("Idempotency Key Validation", () => {
  test("idempotency key must be provided", async ({ request }) => {
    const response = await request.post(`${BASE}/api/payments/intents`, {
      headers: {
        Authorization: "Bearer test-member-token",
      },
      data: {
        registrationId: "00000000-0000-0000-0000-000000000001",
        amountCents: 5000,
        // Missing idempotencyKey
      },
    });

    expect(response.status()).toBe(400);
  });

  test("idempotency key cannot be empty", async ({ request }) => {
    const response = await request.post(`${BASE}/api/payments/intents`, {
      headers: {
        Authorization: "Bearer test-member-token",
      },
      data: {
        registrationId: "00000000-0000-0000-0000-000000000001",
        amountCents: 5000,
        idempotencyKey: "",
      },
    });

    expect(response.status()).toBe(400);
  });
});

test.describe("P9: Fail Closed Security", () => {
  test("invalid auth token returns 401", async ({ request }) => {
    const response = await request.post(`${BASE}/api/payments/intents`, {
      headers: {
        Authorization: "Bearer invalid-token-12345",
      },
      data: {
        registrationId: "00000000-0000-0000-0000-000000000001",
        amountCents: 5000,
        idempotencyKey: "test-invalid-auth",
      },
    });

    expect(response.status()).toBe(401);
  });

  test("malformed authorization header returns 401", async ({ request }) => {
    const response = await request.post(`${BASE}/api/payments/intents`, {
      headers: {
        Authorization: "NotBearer some-token",
      },
      data: {
        registrationId: "00000000-0000-0000-0000-000000000001",
        amountCents: 5000,
        idempotencyKey: "test-malformed-auth",
      },
    });

    expect(response.status()).toBe(401);
  });
});
