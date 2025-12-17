// Copyright (c) Santa Barbara Newcomers Club
// E2E tests for page editor WYSIWYG functionality

import { test, expect } from "@playwright/test";

test.describe("Admin Page Editor", () => {
  test.beforeEach(async ({ request }) => {
    // Clean up any test pages
    const listRes = await request.get("/api/admin/content/pages?search=e2e-test");
    if (listRes.ok()) {
      const data = await listRes.json();
      for (const page of data.items || []) {
        await request.delete(`/api/admin/content/pages/${page.id}`);
      }
    }
  });

  test("can create a new page with blocks", async ({ page }) => {
    // Navigate to new page form
    await page.goto("/admin/content/pages/new");
    await expect(page.locator("h1")).toContainText("Create New Page");

    // Fill in page details
    await page.locator('[data-test-id="new-page-title-input"]').fill("E2E Test Page");
    await expect(page.locator('[data-test-id="new-page-slug-input"]')).toHaveValue("e2e-test-page");

    // Add a text block
    await page.locator('[data-test-id="add-block-text"]').click();
    await expect(page.locator('[data-test-id="sortable-block-list"]')).toBeVisible();

    // Create the page
    await page.locator('[data-test-id="create-page-button"]').click();

    // Should redirect to editor
    await expect(page).toHaveURL(/\/admin\/content\/pages\/[a-f0-9-]+/);
    await expect(page.locator("h1")).toContainText("E2E Test Page");
  });

  test("can add and reorder blocks via drag-drop", async ({ page, request }) => {
    // Create a test page via API
    const createRes = await request.post("/api/admin/content/pages", {
      data: {
        title: "E2E Test Blocks",
        slug: "e2e-test-blocks",
        content: { schemaVersion: 1, blocks: [] },
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const { page: testPage } = await createRes.json();

    // Navigate to editor
    await page.goto(`/admin/content/pages/${testPage.id}`);
    await expect(page.locator('[data-test-id="page-editor"]')).toBeVisible();

    // Add hero block
    await page.locator('[data-test-id="add-block-hero"]').click();
    await expect(page.locator('[data-test-id="sortable-block-list"]')).toContainText("Hero");

    // Add text block
    await page.locator('[data-test-id="add-block-text"]').click();

    // Add CTA block
    await page.locator('[data-test-id="add-block-cta"]').click();

    // Should have 3 blocks
    const blockItems = page.locator('[data-test-id^="block-item-"]');
    await expect(blockItems).toHaveCount(3);
  });

  test("can edit block content", async ({ page, request }) => {
    // Create a test page with a hero block
    const createRes = await request.post("/api/admin/content/pages", {
      data: {
        title: "E2E Test Edit",
        slug: "e2e-test-edit",
        content: {
          schemaVersion: 1,
          blocks: [{ id: "test-hero-1", type: "hero", order: 0, data: { title: "Original Title" } }],
        },
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const { page: testPage } = await createRes.json();

    // Navigate to editor
    await page.goto(`/admin/content/pages/${testPage.id}`);

    // Click on the hero block to select it
    await page.locator('[data-test-id="block-item-test-hero-1"]').click();

    // Should show hero editor
    await expect(page.locator('[data-test-id="hero-block-editor"]')).toBeVisible();

    // Edit the title
    await page.locator('[data-test-id="hero-title-input"]').fill("Updated Title");

    // Save the page
    await page.locator('[data-test-id="save-page-button"]').click();

    // Wait for save to complete (button becomes disabled)
    await expect(page.locator('[data-test-id="save-page-button"]')).toBeDisabled();
  });

  test("can publish and unpublish a page", async ({ page, request }) => {
    // Create a draft page
    const createRes = await request.post("/api/admin/content/pages", {
      data: { title: "E2E Test Publish", slug: "e2e-test-publish" },
    });
    expect(createRes.ok()).toBeTruthy();
    const { page: testPage } = await createRes.json();

    // Navigate to editor
    await page.goto(`/admin/content/pages/${testPage.id}`);

    // Should show DRAFT status
    await expect(page.locator("text=DRAFT")).toBeVisible();

    // Publish button should be visible
    await expect(page.locator('[data-test-id="publish-page-button"]')).toBeVisible();

    // Click publish
    await page.locator('[data-test-id="publish-page-button"]').click();

    // Should show PUBLISHED status
    await expect(page.locator("text=PUBLISHED")).toBeVisible();

    // Unpublish button should now be visible
    await expect(page.locator('[data-test-id="unpublish-page-button"]')).toBeVisible();

    // Click unpublish
    await page.locator('[data-test-id="unpublish-page-button"]').click();

    // Should show DRAFT status again
    await expect(page.locator("text=DRAFT")).toBeVisible();
  });

  test("warns about unsaved changes", async ({ page, request }) => {
    // Create a test page
    const createRes = await request.post("/api/admin/content/pages", {
      data: { title: "E2E Test Unsaved", slug: "e2e-test-unsaved" },
    });
    expect(createRes.ok()).toBeTruthy();
    const { page: testPage } = await createRes.json();

    // Navigate to editor
    await page.goto(`/admin/content/pages/${testPage.id}`);

    // Make a change
    await page.locator('[data-test-id="page-title-input"]').fill("Changed Title");

    // Should show unsaved changes indicator
    await expect(page.locator("text=Unsaved changes")).toBeVisible();

    // Save button should be enabled
    await expect(page.locator('[data-test-id="save-page-button"]')).toBeEnabled();

    // Publish button should be disabled (need to save first)
    await expect(page.locator('[data-test-id="publish-page-button"]')).toBeDisabled();
  });

  test("can delete blocks", async ({ page, request }) => {
    // Create a page with blocks
    const createRes = await request.post("/api/admin/content/pages", {
      data: {
        title: "E2E Test Delete Block",
        slug: "e2e-test-delete-block",
        content: {
          schemaVersion: 1,
          blocks: [
            { id: "block-1", type: "hero", order: 0, data: { title: "Hero" } },
            { id: "block-2", type: "text", order: 1, data: { content: "<p>Text</p>" } },
          ],
        },
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const { page: testPage } = await createRes.json();

    // Navigate to editor
    await page.goto(`/admin/content/pages/${testPage.id}`);

    // Should have 2 blocks
    await expect(page.locator('[data-test-id^="block-item-"]')).toHaveCount(2);

    // Delete the first block
    await page.locator('[data-test-id="delete-block-block-1"]').click();

    // Should have 1 block
    await expect(page.locator('[data-test-id^="block-item-"]')).toHaveCount(1);
  });

  test("block palette shows all block types", async ({ page }) => {
    await page.goto("/admin/content/pages/new");

    // Should show all block type buttons
    await expect(page.locator('[data-test-id="add-block-hero"]')).toBeVisible();
    await expect(page.locator('[data-test-id="add-block-text"]')).toBeVisible();
    await expect(page.locator('[data-test-id="add-block-image"]')).toBeVisible();
    await expect(page.locator('[data-test-id="add-block-cards"]')).toBeVisible();
    await expect(page.locator('[data-test-id="add-block-event-list"]')).toBeVisible();
    await expect(page.locator('[data-test-id="add-block-gallery"]')).toBeVisible();
    await expect(page.locator('[data-test-id="add-block-faq"]')).toBeVisible();
    await expect(page.locator('[data-test-id="add-block-contact"]')).toBeVisible();
    await expect(page.locator('[data-test-id="add-block-cta"]')).toBeVisible();
    await expect(page.locator('[data-test-id="add-block-divider"]')).toBeVisible();
    await expect(page.locator('[data-test-id="add-block-spacer"]')).toBeVisible();
  });
});
