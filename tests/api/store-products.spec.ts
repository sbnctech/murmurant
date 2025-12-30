import { test, expect } from "@playwright/test";

/**
 * Store Products API Tests
 *
 * Tests product CRUD operations, pagination, and validation.
 * Requires admin authentication.
 */
test.describe("API - Store Products", () => {
  test.describe("GET /api/admin/store/products", () => {
    test("returns paginated product list", async ({ request }) => {
      const response = await request.get("/api/admin/store/products");

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("page");
      expect(data).toHaveProperty("pageSize");
      expect(data).toHaveProperty("totalItems");
      expect(data).toHaveProperty("totalPages");
      expect(Array.isArray(data.items)).toBe(true);
    });

    test("each product has required fields", async ({ request }) => {
      const response = await request.get("/api/admin/store/products");
      expect(response.status()).toBe(200);

      const data = await response.json();
      for (const product of data.items) {
        expect(product).toHaveProperty("id");
        expect(product).toHaveProperty("name");
        expect(product).toHaveProperty("slug");
        expect(product).toHaveProperty("type");
        expect(product).toHaveProperty("priceCents");
        expect(product).toHaveProperty("quantity");
        expect(product).toHaveProperty("isActive");
        expect(product).toHaveProperty("variantCount");
      }
    });

    test("supports pagination params", async ({ request }) => {
      const response = await request.get("/api/admin/store/products?page=1&pageSize=5");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.page).toBe(1);
      expect(data.pageSize).toBe(5);
      expect(data.items.length).toBeLessThanOrEqual(5);
    });

    test("supports activeOnly filter", async ({ request }) => {
      const response = await request.get("/api/admin/store/products?activeOnly=true");
      expect(response.status()).toBe(200);

      const data = await response.json();
      for (const product of data.items) {
        expect(product.isActive).toBe(true);
      }
    });

    test("supports search query", async ({ request }) => {
      // Search for a product name that should exist in seed data
      const response = await request.get("/api/admin/store/products?query=shirt");
      expect(response.status()).toBe(200);

      const data = await response.json();
      // Should find the t-shirt
      expect(data.items.length).toBeGreaterThan(0);
    });
  });

  test.describe("POST /api/admin/store/products", () => {
    test("creates product with minimum required fields", async ({ request }) => {
      const slug = `test-product-${Date.now()}`;
      const response = await request.post("/api/admin/store/products", {
        data: {
          name: "Test Product",
          slug,
          priceCents: 1999,
        },
      });

      expect(response.status()).toBe(201);

      const data = await response.json();
      expect(data.product).toHaveProperty("id");
      expect(data.product.name).toBe("Test Product");
      expect(data.product.slug).toBe(slug);
      expect(data.product.priceCents).toBe(1999);

      // Cleanup
      await request.delete(`/api/admin/store/products/${data.product.id}`);
    });

    test("creates physical product with all options", async ({ request }) => {
      const slug = `test-physical-${Date.now()}`;
      const response = await request.post("/api/admin/store/products", {
        data: {
          name: "Full Physical Product",
          slug,
          description: "A complete physical product",
          type: "PHYSICAL",
          priceCents: 2500,
          memberPriceCents: 2000,
          comparePriceCents: 3000,
          imageUrl: "/images/test.jpg",
          isActive: true,
          isPublic: true,
          allowsShipping: true,
          allowsPickup: true,
          trackInventory: true,
          quantity: 100,
          lowStockThreshold: 10,
        },
      });

      expect(response.status()).toBe(201);

      const data = await response.json();
      expect(data.product.type).toBe("PHYSICAL");
      expect(data.product.memberPriceCents).toBe(2000);
      expect(data.product.allowsShipping).toBe(true);
      expect(data.product.trackInventory).toBe(true);

      // Cleanup
      await request.delete(`/api/admin/store/products/${data.product.id}`);
    });

    test("creates digital product", async ({ request }) => {
      const slug = `test-digital-${Date.now()}`;
      const response = await request.post("/api/admin/store/products", {
        data: {
          name: "Digital Product",
          slug,
          type: "DIGITAL",
          priceCents: 999,
          digitalAssetUrl: "s3://bucket/asset.pdf",
          downloadLimit: 5,
        },
      });

      expect(response.status()).toBe(201);

      const data = await response.json();
      expect(data.product.type).toBe("DIGITAL");
      expect(data.product.downloadLimit).toBe(5);

      // Cleanup
      await request.delete(`/api/admin/store/products/${data.product.id}`);
    });

    test("auto-generates slug from name", async ({ request }) => {
      const response = await request.post("/api/admin/store/products", {
        data: {
          name: "Auto Slug Product Test",
          priceCents: 500,
        },
      });

      expect(response.status()).toBe(201);

      const data = await response.json();
      expect(data.product.slug).toMatch(/^auto-slug-product-test/);

      // Cleanup
      await request.delete(`/api/admin/store/products/${data.product.id}`);
    });

    test("rejects missing name", async ({ request }) => {
      const response = await request.post("/api/admin/store/products", {
        data: {
          priceCents: 1000,
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Name");
    });

    test("rejects negative price", async ({ request }) => {
      const response = await request.post("/api/admin/store/products", {
        data: {
          name: "Negative Price Product",
          priceCents: -100,
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Price");
    });

    test("rejects duplicate slug", async ({ request }) => {
      // Create first product
      const slug = `duplicate-test-${Date.now()}`;
      const first = await request.post("/api/admin/store/products", {
        data: {
          name: "First Product",
          slug,
          priceCents: 1000,
        },
      });
      expect(first.status()).toBe(201);
      const firstData = await first.json();

      // Try to create second with same slug
      const second = await request.post("/api/admin/store/products", {
        data: {
          name: "Second Product",
          slug,
          priceCents: 2000,
        },
      });

      expect(second.status()).toBe(409);

      // Cleanup
      await request.delete(`/api/admin/store/products/${firstData.product.id}`);
    });
  });
});

test.describe("API - Store Product Detail", () => {
  let testProductId: string;

  test.beforeAll(async ({ request }) => {
    // Create a test product for detail operations
    const response = await request.post("/api/admin/store/products", {
      data: {
        name: "Detail Test Product",
        slug: `detail-test-${Date.now()}`,
        description: "Product for testing detail operations",
        priceCents: 1500,
        quantity: 50,
      },
    });
    const data = await response.json();
    testProductId = data.product.id;
  });

  test.afterAll(async ({ request }) => {
    if (testProductId) {
      await request.delete(`/api/admin/store/products/${testProductId}`);
    }
  });

  test("GET returns product details", async ({ request }) => {
    const response = await request.get(`/api/admin/store/products/${testProductId}`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.product).toHaveProperty("id", testProductId);
    expect(data.product).toHaveProperty("name", "Detail Test Product");
    expect(data.product).toHaveProperty("variants");
    expect(Array.isArray(data.product.variants)).toBe(true);
  });

  test("GET returns 404 for non-existent product", async ({ request }) => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const response = await request.get(`/api/admin/store/products/${fakeId}`);
    expect(response.status()).toBe(404);
  });

  test("PUT updates product fields", async ({ request }) => {
    const response = await request.put(`/api/admin/store/products/${testProductId}`, {
      data: {
        name: "Updated Product Name",
        priceCents: 1800,
        description: "Updated description",
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.product.name).toBe("Updated Product Name");
    expect(data.product.priceCents).toBe(1800);
    expect(data.product.description).toBe("Updated description");
  });

  test("PUT can toggle product status", async ({ request }) => {
    // Deactivate
    let response = await request.put(`/api/admin/store/products/${testProductId}`, {
      data: { isActive: false },
    });
    expect(response.status()).toBe(200);
    let data = await response.json();
    expect(data.product.isActive).toBe(false);

    // Reactivate
    response = await request.put(`/api/admin/store/products/${testProductId}`, {
      data: { isActive: true },
    });
    expect(response.status()).toBe(200);
    data = await response.json();
    expect(data.product.isActive).toBe(true);
  });

  test("DELETE removes product", async ({ request }) => {
    // Create a product to delete
    const createResp = await request.post("/api/admin/store/products", {
      data: {
        name: "Product to Delete",
        slug: `delete-me-${Date.now()}`,
        priceCents: 100,
      },
    });
    const created = await createResp.json();

    // Delete it
    const deleteResp = await request.delete(`/api/admin/store/products/${created.product.id}`);
    expect(deleteResp.status()).toBe(200);

    // Verify it's gone
    const getResp = await request.get(`/api/admin/store/products/${created.product.id}`);
    expect(getResp.status()).toBe(404);
  });
});
