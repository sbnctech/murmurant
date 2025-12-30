import { test, expect } from "@playwright/test";

/**
 * API Contract Tests for Publishing System
 * Tests CRUD operations, status transitions, and validation
 */
test.describe("API Contract - Page Lifecycle", () => {
  let createdPageId: string | null = null;

  test.afterAll(async ({ request }) => {
    // Cleanup: delete the test page if it was created
    if (createdPageId) {
      await request.delete(`/api/admin/content/pages/${createdPageId}`);
    }
  });

  test("create page returns valid structure", async ({ request }) => {
    const response = await request.post("/api/admin/content/pages", {
      data: {
        slug: `test-page-${Date.now()}`,
        title: "Contract Test Page",
        visibility: "PUBLIC",
        content: {
          schemaVersion: 1,
          blocks: [
            {
              id: "b1",
              type: "text",
              order: 0,
              data: { content: "Test content" },
            },
          ],
        },
      },
    });

    expect(response.status()).toBe(201);

    const data = await response.json();
    expect(data).toHaveProperty("page");
    expect(data.page).toHaveProperty("id");
    expect(data.page).toHaveProperty("slug");
    expect(data.page).toHaveProperty("title", "Contract Test Page");
    expect(data.page).toHaveProperty("status", "DRAFT");
    expect(data.page).toHaveProperty("visibility", "PUBLIC");
    expect(data.page).toHaveProperty("createdAt");
    expect(data.page).toHaveProperty("updatedAt");

    createdPageId = data.page.id;
  });

  test("read page returns correct data", async ({ request }) => {
    // First create a page
    const createResponse = await request.post("/api/admin/content/pages", {
      data: {
        slug: `test-read-${Date.now()}`,
        title: "Read Test Page",
        visibility: "PUBLIC",
        content: { schemaVersion: 1, blocks: [] },
      },
    });

    const created = await createResponse.json();
    const pageId = created.page.id;

    // Read it back
    const readResponse = await request.get(`/api/admin/content/pages/${pageId}`);
    expect(readResponse.status()).toBe(200);

    const data = await readResponse.json();
    expect(data.page.id).toBe(pageId);
    expect(data.page.title).toBe("Read Test Page");

    // Cleanup
    await request.delete(`/api/admin/content/pages/${pageId}`);
  });

  test("update page modifies fields", async ({ request }) => {
    // Create a page
    const createResponse = await request.post("/api/admin/content/pages", {
      data: {
        slug: `test-update-${Date.now()}`,
        title: "Original Title",
        visibility: "PUBLIC",
        content: { schemaVersion: 1, blocks: [] },
      },
    });

    const created = await createResponse.json();
    const pageId = created.page.id;

    // Update it (API uses PUT)
    const updateResponse = await request.put(`/api/admin/content/pages/${pageId}`, {
      data: {
        title: "Updated Title",
        description: "Added description",
      },
    });

    expect(updateResponse.status()).toBe(200);

    const data = await updateResponse.json();
    expect(data.page.title).toBe("Updated Title");
    expect(data.page.description).toBe("Added description");

    // Cleanup
    await request.delete(`/api/admin/content/pages/${pageId}`);
  });

  test("publish page changes status to PUBLISHED", async ({ request }) => {
    // Create a draft page with content
    const createResponse = await request.post("/api/admin/content/pages", {
      data: {
        slug: `test-publish-${Date.now()}`,
        title: "Publish Test Page",
        visibility: "PUBLIC",
        content: { schemaVersion: 1, blocks: [{ id: "b1", type: "text", order: 0, data: {} }] },
      },
    });

    const created = await createResponse.json();
    const pageId = created.page.id;

    // Publish it (API uses POST with ?action=publish)
    const publishResponse = await request.post(`/api/admin/content/pages/${pageId}?action=publish`);

    expect(publishResponse.status()).toBe(200);

    const data = await publishResponse.json();
    expect(data.page.status).toBe("PUBLISHED");
    expect(data.page.publishedAt).toBeTruthy();

    // Cleanup
    await request.delete(`/api/admin/content/pages/${pageId}`);
  });

  test("unpublish page reverts to DRAFT", async ({ request }) => {
    // Create and publish a page
    const createResponse = await request.post("/api/admin/content/pages", {
      data: {
        slug: `test-unpublish-${Date.now()}`,
        title: "Unpublish Test Page",
        visibility: "PUBLIC",
        content: { schemaVersion: 1, blocks: [{ id: "b1", type: "text", order: 0, data: {} }] },
      },
    });

    const created = await createResponse.json();
    const pageId = created.page.id;

    // Publish first
    await request.post(`/api/admin/content/pages/${pageId}?action=publish`);

    // Unpublish it
    const unpublishResponse = await request.post(`/api/admin/content/pages/${pageId}?action=unpublish`);

    expect(unpublishResponse.status()).toBe(200);

    const data = await unpublishResponse.json();
    expect(data.page.status).toBe("DRAFT");

    // Cleanup
    await request.delete(`/api/admin/content/pages/${pageId}`);
  });

  test("delete page removes it", async ({ request }) => {
    // Create a page
    const createResponse = await request.post("/api/admin/content/pages", {
      data: {
        slug: `test-delete-${Date.now()}`,
        title: "Delete Test Page",
        visibility: "PUBLIC",
        content: { schemaVersion: 1, blocks: [] },
      },
    });

    const created = await createResponse.json();
    const pageId = created.page.id;

    // Delete it
    const deleteResponse = await request.delete(`/api/admin/content/pages/${pageId}`);
    expect(deleteResponse.status()).toBe(200);

    // Verify it's gone
    const getResponse = await request.get(`/api/admin/content/pages/${pageId}`);
    expect(getResponse.status()).toBe(404);
  });
});

test.describe("API Contract - Theme Validation", () => {
  test("theme list returns structured data", async ({ request }) => {
    const response = await request.get("/api/admin/content/themes");

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("themes");
    expect(Array.isArray(data.themes)).toBe(true);

    // Each theme should have required fields
    for (const theme of data.themes) {
      expect(theme).toHaveProperty("id");
      expect(theme).toHaveProperty("name");
      expect(theme).toHaveProperty("slug");
      expect(theme).toHaveProperty("status");
    }
  });

  test("theme create rejects invalid tokens", async ({ request }) => {
    const response = await request.post("/api/admin/content/themes", {
      data: {
        name: "Invalid Theme",
        slug: `invalid-theme-${Date.now()}`,
        tokens: "not-an-object", // String should be rejected
      },
    });

    // Should fail validation
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});

test.describe("API Contract - List Endpoints", () => {
  test("pages list returns pagination metadata", async ({ request }) => {
    const response = await request.get("/api/admin/content/pages");

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("items");
    expect(data).toHaveProperty("page");
    expect(data).toHaveProperty("pageSize");
    expect(data).toHaveProperty("totalItems");
    expect(data).toHaveProperty("totalPages");
    expect(typeof data.page).toBe("number");
    expect(typeof data.totalItems).toBe("number");
  });

  test("templates list returns list data", async ({ request }) => {
    const response = await request.get("/api/admin/content/templates");

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("templates");
    expect(Array.isArray(data.templates)).toBe(true);
  });

  test("mailing lists returns list data", async ({ request }) => {
    const response = await request.get("/api/admin/comms/lists");

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("lists");
    expect(Array.isArray(data.lists)).toBe(true);
  });

  test("campaigns list returns pagination metadata", async ({ request }) => {
    const response = await request.get("/api/admin/comms/campaigns");

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("items");
    expect(data).toHaveProperty("page");
    expect(data).toHaveProperty("pageSize");
    expect(data).toHaveProperty("totalItems");
    expect(data).toHaveProperty("totalPages");
  });
});

// @quarantine - Public theme CSS route not yet implemented
test.describe("@quarantine API Contract - Public Theme CSS", () => {
  test("theme API returns CSS variables", async ({ request }) => {
    const response = await request.get("/api/theme");

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/css");

    const css = await response.text();
    expect(css).toContain(":root {");
    expect(css).toContain("--color-primary:");
    expect(css).toContain("--font-family:");
    expect(css).toContain("--spacing-");
  });
});
