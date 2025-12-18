// Copyright (c) Santa Barbara Newcomers Club
// E2E tests for page editor golden path scenarios
//
// These tests cover the happy path for page editing workflows.
// See: docs/PUBLISHING/PAGE_EDITOR_TEST_PLAN.md
//
// NOTE: These tests are quarantined until the page editor UI is fully integrated
// into the admin routes.

import { test, expect } from "@playwright/test";

test.describe("@quarantine Page Editor E2E", () => {
  // Unique slug for test isolation
  const testSlug = `test-e2e-page-${Date.now()}`;

  test.describe("Golden Path: Create and Edit Page", () => {
    test("can create a new page with blocks", async ({ page }) => {
      // Navigate to pages list
      await page.goto("/admin/content/pages", { waitUntil: "networkidle" });

      // Click create button
      await page.getByTestId("admin-pages-create-button").click();

      // Fill in page details
      await page.getByTestId("field-title").fill("Test Page Title");
      await page.getByTestId("field-slug").fill(testSlug);

      // Save the page
      await page.getByTestId("save-button").click();

      // Verify redirect to editor
      await expect(page).toHaveURL(new RegExp(`/admin/content/pages/.+/edit`));

      // Verify editor loads
      await expect(page.getByTestId("page-editor")).toBeVisible();
    });

    test("can add a text block", async ({ page }) => {
      // Assumes we're on the editor page from previous test
      // In real test, would navigate directly

      // Click add text block
      await page.getByTestId("add-block-text").click();

      // Wait for block to appear
      await expect(page.getByTestId("block-list").locator('[data-testid^="block-"]')).toHaveCount(1);

      // Verify inspector panel shows text block options
      await expect(page.getByTestId("block-inspector")).toBeVisible();
    });

    test("can edit block content", async ({ page }) => {
      // Select the text block
      await page.getByTestId("block-list").locator('[data-testid^="select-block-"]').first().click();

      // Edit content in inspector
      await page.getByTestId("field-content-(html)").fill("<p>Hello World</p>");

      // Wait for auto-save
      await expect(page.getByTestId("save-status")).toHaveText("Saving...");
      await expect(page.getByTestId("save-status")).not.toBeVisible({ timeout: 2000 });
    });

    test("content persists after reload", async ({ page }) => {
      // Reload page
      await page.reload({ waitUntil: "networkidle" });

      // Verify editor loads
      await expect(page.getByTestId("page-editor")).toBeVisible();

      // Select block and verify content
      await page.getByTestId("block-list").locator('[data-testid^="select-block-"]').first().click();
      await expect(page.getByTestId("field-content-(html)")).toHaveValue("<p>Hello World</p>");
    });
  });

  test.describe("Golden Path: Reorder Blocks", () => {
    test("can reorder blocks with keyboard", async ({ page }) => {
      // Add a second block first
      await page.getByTestId("add-block-cta").click();
      await expect(page.getByTestId("block-list").locator('[data-testid^="block-"]')).toHaveCount(2);

      // Focus first block's drag handle
      const firstBlock = page.getByTestId("block-list").locator('[data-testid^="block-"]').first();
      await firstBlock.focus();

      // Use keyboard to start drag
      await page.keyboard.press("Space");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Space");

      // Verify order changed - text block should now be second
      const blocks = page.getByTestId("block-list").locator('[data-testid^="block-"]');
      await expect(blocks.first()).toContainText("Call to Action");
    });
  });

  test.describe("Golden Path: Publish Workflow", () => {
    test("can publish draft page", async ({ page }) => {
      // Verify page is in draft state
      await expect(page.locator("text=DRAFT")).toBeVisible();

      // Click publish button
      await page.getByTestId("publish-button").click();

      // Verify status changes
      await expect(page.locator("text=PUBLISHED")).toBeVisible();
    });

    test("can preview page", async ({ page }) => {
      // Click preview button
      await page.getByTestId("preview-button").click();

      // Verify preview mode
      await expect(page.locator("text=Preview Mode")).toBeVisible();
      await expect(page.getByTestId("exit-preview")).toBeVisible();

      // Exit preview
      await page.getByTestId("exit-preview").click();
      await expect(page.getByTestId("page-editor")).toBeVisible();
    });
  });

  test.describe("Permission Boundaries", () => {
    test("webmaster can edit but not delete published page", async () => {
      // This test would require logging in as webmaster role
      // and verifying the delete button is disabled or hidden
      // for published pages

      // Navigate to a published page
      // Verify delete is not available or returns 403
      test.skip(true, "Requires webmaster role auth setup");
    });
  });
});
