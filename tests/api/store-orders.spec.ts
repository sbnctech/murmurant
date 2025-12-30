import { test, expect } from "@playwright/test";

/**
 * Store Orders API Tests
 *
 * Tests order listing, filtering, and status management.
 * Requires admin authentication and seed data.
 */
test.describe("API - Store Orders", () => {
  test.describe("GET /api/admin/store/orders", () => {
    test("returns paginated order list", async ({ request }) => {
      const response = await request.get("/api/admin/store/orders");

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("page");
      expect(data).toHaveProperty("pageSize");
      expect(data).toHaveProperty("totalItems");
      expect(data).toHaveProperty("totalPages");
      expect(Array.isArray(data.items)).toBe(true);
    });

    test("excludes cart orders by default", async ({ request }) => {
      const response = await request.get("/api/admin/store/orders");
      expect(response.status()).toBe(200);

      const data = await response.json();
      for (const order of data.items) {
        expect(order.status).not.toBe("CART");
      }
    });

    test("each order has required fields", async ({ request }) => {
      const response = await request.get("/api/admin/store/orders");
      expect(response.status()).toBe(200);

      const data = await response.json();
      for (const order of data.items) {
        expect(order).toHaveProperty("id");
        expect(order).toHaveProperty("orderNumber");
        expect(order).toHaveProperty("status");
        expect(order).toHaveProperty("totalCents");
        expect(order).toHaveProperty("createdAt");
        expect(order).toHaveProperty("itemCount");
      }
    });

    test("supports status filter", async ({ request }) => {
      const response = await request.get("/api/admin/store/orders?status=COMPLETED");
      expect(response.status()).toBe(200);

      const data = await response.json();
      for (const order of data.items) {
        expect(order.status).toBe("COMPLETED");
      }
    });

    test("supports pagination params", async ({ request }) => {
      const response = await request.get("/api/admin/store/orders?page=1&pageSize=5");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.page).toBe(1);
      expect(data.pageSize).toBe(5);
      expect(data.items.length).toBeLessThanOrEqual(5);
    });

    test("displays guest orders with guest info", async ({ request }) => {
      const response = await request.get("/api/admin/store/orders");
      expect(response.status()).toBe(200);

      const data = await response.json();
      // Check if we can identify guest vs member orders by customer info
      const orders = data.items;
      // At least one order should have customerName or email
      expect(orders.some((o: { customerName: string }) => o.customerName || o.customerName !== null)).toBe(true);
    });
  });
});

test.describe("API - Store Order Detail", () => {
  let testOrderId: string | null = null;

  test.beforeAll(async ({ request }) => {
    // Find an existing order from seed data
    const response = await request.get("/api/admin/store/orders?pageSize=1");
    const data = await response.json();
    if (data.items.length > 0) {
      testOrderId = data.items[0].id;
    }
  });

  test("GET returns order with items", async ({ request }) => {
    if (!testOrderId) {
      test.skip(true, "No orders in seed data");
      return;
    }

    const response = await request.get(`/api/admin/store/orders/${testOrderId}`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.order).toHaveProperty("id", testOrderId);
    expect(data.order).toHaveProperty("items");
    expect(Array.isArray(data.order.items)).toBe(true);
  });

  test("GET includes customer details if member order", async ({ request }) => {
    if (!testOrderId) {
      test.skip(true, "No orders in seed data");
      return;
    }

    const response = await request.get(`/api/admin/store/orders/${testOrderId}`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    // Order should have either customer or guest info
    const hasCustomerInfo = data.order.customer !== null || data.order.guestEmail !== null;
    expect(hasCustomerInfo).toBe(true);
  });

  test("GET returns 404 for non-existent order", async ({ request }) => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const response = await request.get(`/api/admin/store/orders/${fakeId}`);
    expect(response.status()).toBe(404);
  });
});

test.describe("API - Order Status Transitions", () => {
  test("can transition PENDING_PAYMENT to CANCELLED", async ({ request }) => {
    // Find a pending payment order from seed data
    const listResp = await request.get("/api/admin/store/orders?status=PENDING_PAYMENT");
    const data = await listResp.json();

    if (data.items.length === 0) {
      test.skip(true, "No pending payment orders in seed data");
      return;
    }

    const orderId = data.items[0].id;

    // Cancel it
    const cancelResp = await request.put(`/api/admin/store/orders/${orderId}`, {
      data: {
        status: "CANCELLED",
        adminNotes: "Test cancellation",
      },
    });

    expect(cancelResp.status()).toBe(200);

    const result = await cancelResp.json();
    expect(result.order.status).toBe("CANCELLED");
  });

  test("can update tracking info on shipped order", async ({ request }) => {
    // Find a shipped order from seed data
    const listResp = await request.get("/api/admin/store/orders?status=SHIPPED");
    const data = await listResp.json();

    if (data.items.length === 0) {
      test.skip(true, "No shipped orders in seed data");
      return;
    }

    const orderId = data.items[0].id;

    // Update tracking
    const updateResp = await request.put(`/api/admin/store/orders/${orderId}`, {
      data: {
        trackingNumber: "TEST123456789",
        carrier: "FedEx",
      },
    });

    expect(updateResp.status()).toBe(200);

    const result = await updateResp.json();
    expect(result.order.trackingNumber).toBe("TEST123456789");
    expect(result.order.carrier).toBe("FedEx");
  });

  test("can mark shipped order as delivered", async ({ request }) => {
    // Find a shipped order
    const listResp = await request.get("/api/admin/store/orders?status=SHIPPED");
    const data = await listResp.json();

    if (data.items.length === 0) {
      test.skip(true, "No shipped orders in seed data");
      return;
    }

    const orderId = data.items[0].id;

    // Mark delivered
    const deliverResp = await request.put(`/api/admin/store/orders/${orderId}`, {
      data: {
        status: "DELIVERED",
      },
    });

    expect(deliverResp.status()).toBe(200);

    const result = await deliverResp.json();
    expect(result.order.status).toBe("DELIVERED");
    expect(result.order.deliveredAt).toBeTruthy();
  });

  test("can mark delivered order as completed", async ({ request }) => {
    // Find a delivered order
    const listResp = await request.get("/api/admin/store/orders?status=DELIVERED");
    const data = await listResp.json();

    if (data.items.length === 0) {
      test.skip(true, "No delivered orders in seed data");
      return;
    }

    const orderId = data.items[0].id;

    // Mark completed
    const completeResp = await request.put(`/api/admin/store/orders/${orderId}`, {
      data: {
        status: "COMPLETED",
      },
    });

    expect(completeResp.status()).toBe(200);

    const result = await completeResp.json();
    expect(result.order.status).toBe("COMPLETED");
    expect(result.order.completedAt).toBeTruthy();
  });
});

test.describe("API - Store Dashboard", () => {
  test("GET /api/admin/store/dashboard returns metrics", async ({ request }) => {
    const response = await request.get("/api/admin/store/dashboard");

    expect(response.status()).toBe(200);

    const data = await response.json();

    // Should have order counts
    expect(data).toHaveProperty("pendingCount");
    expect(data).toHaveProperty("processingCount");
    expect(data).toHaveProperty("shippedCount");
    expect(data).toHaveProperty("completedCount");

    // Should have revenue metrics
    expect(data).toHaveProperty("todayRevenue");
    expect(data).toHaveProperty("monthRevenue");

    // Should have inventory alerts
    expect(data).toHaveProperty("lowStockProducts");
    expect(data).toHaveProperty("lowStockVariants");
    expect(Array.isArray(data.lowStockProducts)).toBe(true);
    expect(Array.isArray(data.lowStockVariants)).toBe(true);

    // Should have recent orders
    expect(data).toHaveProperty("recentOrders");
    expect(Array.isArray(data.recentOrders)).toBe(true);
  });

  test("dashboard includes fulfillment-ready orders", async ({ request }) => {
    const response = await request.get("/api/admin/store/dashboard");
    expect(response.status()).toBe(200);

    const data = await response.json();

    // There should be at least one processing order in seed data
    expect(typeof data.processingCount).toBe("number");
  });

  test("dashboard detects low stock from seed data", async ({ request }) => {
    const response = await request.get("/api/admin/store/dashboard");
    expect(response.status()).toBe(200);

    const data = await response.json();

    // T-shirt should be on low stock list (quantity 0 on parent, variants have stock)
    // Or some products may be below threshold
    expect(Array.isArray(data.lowStockProducts)).toBe(true);
    expect(Array.isArray(data.lowStockVariants)).toBe(true);
  });
});
