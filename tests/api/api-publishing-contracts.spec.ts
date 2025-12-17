import { test, expect } from "@playwright/test";

/**
 * API Contract Tests for Publishing System
 * Tests CRUD operations, status transitions, and validation
 *
 * TODO: Routes not implemented yet - quarantined until publishing system is built
 */
test.describe("@quarantine API Contract - Page Lifecycle", () => {
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
        status: "DRAFT",
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

    const page = await response.json();
    expect(page).toHaveProperty("id");
    expect(page).toHaveProperty("slug");
    expect(page).toHaveProperty("title", "Contract Test Page");
    expect(page).toHaveProperty("status", "DRAFT");
    expect(page).toHaveProperty("visibility", "PUBLIC");
    expect(page).toHaveProperty("createdAt");
    expect(page).toHaveProperty("updatedAt");

    createdPageId = page.id;
  });

  test("read page returns correct data", async ({ request }) => {
    // First create a page
    const createResponse = await request.post("/api/admin/content/pages", {
      data: {
        slug: `test-read-${Date.now()}`,
        title: "Read Test Page",
        status: "DRAFT",
        visibility: "PUBLIC",
        content: { schemaVersion: 1, blocks: [] },
      },
    });

    const created = await createResponse.json();
    const pageId = created.id;

    // Read it back
    const readResponse = await request.get(`/api/admin/content/pages/${pageId}`);
    expect(readResponse.status()).toBe(200);

    const page = await readResponse.json();
    expect(page.id).toBe(pageId);
    expect(page.title).toBe("Read Test Page");

    // Cleanup
    await request.delete(`/api/admin/content/pages/${pageId}`);
  });

  test("update page modifies fields", async ({ request }) => {
    // Create a page
    const createResponse = await request.post("/api/admin/content/pages", {
      data: {
        slug: `test-update-${Date.now()}`,
        title: "Original Title",
        status: "DRAFT",
        visibility: "PUBLIC",
        content: { schemaVersion: 1, blocks: [] },
      },
    });

    const created = await createResponse.json();
    const pageId = created.id;

    // Update it
    const updateResponse = await request.patch(`/api/admin/content/pages/${pageId}`, {
      data: {
        title: "Updated Title",
        description: "Added description",
      },
    });

    expect(updateResponse.status()).toBe(200);

    const updated = await updateResponse.json();
    expect(updated.title).toBe("Updated Title");
    expect(updated.description).toBe("Added description");

    // Cleanup
    await request.delete(`/api/admin/content/pages/${pageId}`);
  });

  test("publish page changes status to PUBLISHED", async ({ request }) => {
    // Create a draft page
    const createResponse = await request.post("/api/admin/content/pages", {
      data: {
        slug: `test-publish-${Date.now()}`,
        title: "Publish Test Page",
        status: "DRAFT",
        visibility: "PUBLIC",
        content: { schemaVersion: 1, blocks: [] },
      },
    });

    const created = await createResponse.json();
    const pageId = created.id;

    // Publish it
    const publishResponse = await request.patch(`/api/admin/content/pages/${pageId}`, {
      data: { status: "PUBLISHED" },
    });

    expect(publishResponse.status()).toBe(200);

    const published = await publishResponse.json();
    expect(published.status).toBe("PUBLISHED");
    expect(published.publishedAt).toBeTruthy();

    // Cleanup
    await request.delete(`/api/admin/content/pages/${pageId}`);
  });

  test("unpublish page reverts to DRAFT", async ({ request }) => {
    // Create and publish a page
    const createResponse = await request.post("/api/admin/content/pages", {
      data: {
        slug: `test-unpublish-${Date.now()}`,
        title: "Unpublish Test Page",
        status: "PUBLISHED",
        visibility: "PUBLIC",
        content: { schemaVersion: 1, blocks: [] },
      },
    });

    const created = await createResponse.json();
    const pageId = created.id;

    // Unpublish it
    const unpublishResponse = await request.patch(`/api/admin/content/pages/${pageId}`, {
      data: { status: "DRAFT" },
    });

    expect(unpublishResponse.status()).toBe(200);

    const unpublished = await unpublishResponse.json();
    expect(unpublished.status).toBe("DRAFT");

    // Cleanup
    await request.delete(`/api/admin/content/pages/${pageId}`);
  });

  test("delete page removes it", async ({ request }) => {
    // Create a page
    const createResponse = await request.post("/api/admin/content/pages", {
      data: {
        slug: `test-delete-${Date.now()}`,
        title: "Delete Test Page",
        status: "DRAFT",
        visibility: "PUBLIC",
        content: { schemaVersion: 1, blocks: [] },
      },
    });

    const created = await createResponse.json();
    const pageId = created.id;

    // Delete it
    const deleteResponse = await request.delete(`/api/admin/content/pages/${pageId}`);
    expect(deleteResponse.status()).toBe(200);

    // Verify it's gone
    const getResponse = await request.get(`/api/admin/content/pages/${pageId}`);
    expect(getResponse.status()).toBe(404);
  });
});

test.describe("@quarantine API Contract - Theme Validation", () => {
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

  test("theme list returns structured data", async ({ request }) => {
    const response = await request.get("/api/admin/content/themes");

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("items");
    expect(Array.isArray(data.items)).toBe(true);

    // Each theme should have required fields
    for (const theme of data.items) {
      expect(theme).toHaveProperty("id");
      expect(theme).toHaveProperty("name");
      expect(theme).toHaveProperty("slug");
      expect(theme).toHaveProperty("status");
    }
  });

  test("theme create rejects array for typography", async ({ request }) => {
    const response = await request.post("/api/admin/content/themes", {
      data: {
        name: "Invalid Theme",
        slug: `invalid-theme-${Date.now()}`,
        tokens: {
          typography: [], // Array should be rejected
        },
      },
    });

    // Should fail validation
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test("theme create rejects non-object tokens", async ({ request }) => {
    const response = await request.post("/api/admin/content/themes", {
      data: {
        name: "Invalid Theme 2",
        slug: `invalid-theme-2-${Date.now()}`,
        tokens: "not-an-object", // String should be rejected
      },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});

test.describe("@quarantine API Contract - List Endpoints", () => {
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

  test("templates list returns pagination metadata", async ({ request }) => {
    const response = await request.get("/api/admin/content/templates");

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("items");
    expect(Array.isArray(data.items)).toBe(true);
  });

  test("mailing lists returns pagination metadata", async ({ request }) => {
    const response = await request.get("/api/admin/comms/lists");

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("items");
    expect(data).toHaveProperty("page");
    expect(data).toHaveProperty("totalItems");
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
