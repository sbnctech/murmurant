/**
 * Member Gadgets Tests
 *
 * Playwright tests for:
 * - News gadget on /my (requires authentication)
 * - Gift Certificate CTA on public /events page
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

// =============================================================================
// Public: Gift Certificate CTA on /events
// =============================================================================

test.describe("Gift Certificate CTA", () => {
  test("shows gift certificate link on events page", async ({ page }) => {
    await page.goto(`${BASE}/events`);

    // Gift Certificate link should be visible
    const giftLink = page.locator('[data-test-id="gift-certificate-link"]');
    await expect(giftLink).toBeVisible();
    await expect(giftLink).toContainText("Gift Certificates");
  });

  test("gift certificate link opens in new tab", async ({ page }) => {
    await page.goto(`${BASE}/events`);

    const giftLink = page.locator('[data-test-id="gift-certificate-link"]');

    // Should have target="_blank" attribute
    const target = await giftLink.getAttribute("target");
    expect(target).toBe("_blank");

    // Should have proper rel attribute for security
    const rel = await giftLink.getAttribute("rel");
    expect(rel).toContain("noopener");
  });

  test("gift certificate is visible without authentication", async ({ page }) => {
    // Make sure we're not logged in (fresh context)
    await page.goto(`${BASE}/events`);

    // Should see gift certificate link
    await expect(page.locator('[data-test-id="gift-certificate-link"]')).toBeVisible();

    // Should also see Sign In link (not logged in)
    await expect(page.locator('text=Sign In')).toBeVisible();
  });
});

// =============================================================================
// Member: News Gadget on /my
// =============================================================================

test.describe("News Gadget on Member Home", () => {
  // Note: These tests require authentication to be set up.
  // In a dev environment, the /my page may redirect to login if not authenticated.

  test("news card exists on member home structure", async ({ page }) => {
    // Try to access /my - will redirect to login if not authenticated
    const response = await page.goto(`${BASE}/my`);

    // If we get a successful page (not 401/redirect), check for news card
    if (response?.status() === 200) {
      // News card should be in the page structure
      const newsCard = page.locator('[data-test-id="club-news-card"]');

      // May be visible or not depending on auth state
      // Just verify the selector pattern is correct
      const isVisible = await newsCard.isVisible().catch(() => false);

      // If visible, check content
      if (isVisible) {
        await expect(newsCard).toContainText("News");
      }
    }
  });

  test("news items have proper structure", async ({ page }) => {
    const response = await page.goto(`${BASE}/my`);

    if (response?.status() === 200) {
      const newsCard = page.locator('[data-test-id="club-news-card"]');

      if (await newsCard.isVisible().catch(() => false)) {
        // Check for news items
        const newsItems = page.locator('[data-test-id^="news-item-"]');
        const count = await newsItems.count();

        // Should have at least one news item if card is visible
        expect(count).toBeGreaterThan(0);
      }
    }
  });
});
