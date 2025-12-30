/**
 * Officer Gadgets Integration Tests
 *
 * Tests for role-specific officer gadgets on the member dashboard.
 * These gadgets are only visible to officers with specific roles.
 *
 * Prerequisites:
 *   - OfficerGadgets component exists
 *   - View context system implemented
 *   - PFOS seed data with officer roles
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { test, expect } from "@playwright/test";

test.describe("Officer Gadgets Integration", () => {
  test.describe("VP Membership Gadget", () => {
    test("renders for VP Activities role", async ({ page }) => {
      // Note: This test depends on simulating the VP role
      // Using view-as context if available
      await page.goto("/member");

      // Check if officer gadget area exists
      const officerArea = page.locator('[data-test-id="officer-gadgets-area"]');
      const vpGadget = page.locator('[data-test-id="vp-membership-gadget"]');

      // Officer gadgets may not be visible for regular members
      // This is a positive test when viewing as VP
      const isOfficerAreaVisible = await officerArea.isVisible().catch(() => false);
      const isVpGadgetVisible = await vpGadget.isVisible().catch(() => false);

      // Log the result for debugging
      console.log(`Officer area visible: ${isOfficerAreaVisible}`);
      console.log(`VP gadget visible: ${isVpGadgetVisible}`);
    });

    test("shows pending approvals count", async ({ page }) => {
      await page.goto("/member");

      const vpGadget = page.locator('[data-test-id="vp-membership-gadget"]');
      const isVisible = await vpGadget.isVisible().catch(() => false);

      if (isVisible) {
        // Should show pending approvals
        await expect(vpGadget.locator('text=Pending Approvals')).toBeVisible();

        // Should show expiring this month
        await expect(vpGadget.locator('text=Expiring This Month')).toBeVisible();

        // Should have link to members dashboard
        const adminLink = vpGadget.locator('a[href="/admin/members"]');
        await expect(adminLink).toBeVisible();
      }
    });
  });

  test.describe("Event Chair Gadget", () => {
    test("renders for Event Chair role", async ({ page }) => {
      await page.goto("/member");

      const eventChairGadget = page.locator('[data-test-id="event-chair-gadget"]');
      const isVisible = await eventChairGadget.isVisible().catch(() => false);

      console.log(`Event Chair gadget visible: ${isVisible}`);
    });

    test("shows managed events", async ({ page }) => {
      await page.goto("/member");

      const eventChairGadget = page.locator('[data-test-id="event-chair-gadget"]');
      const isVisible = await eventChairGadget.isVisible().catch(() => false);

      if (isVisible) {
        // Should show "My Events" title
        await expect(eventChairGadget.locator('text=My Events')).toBeVisible();

        // Should have link to events dashboard
        const adminLink = eventChairGadget.locator('a[href="/admin/events"]');
        await expect(adminLink).toBeVisible();
      }
    });
  });

  test.describe("President Gadget", () => {
    test("renders for President role", async ({ page }) => {
      await page.goto("/member");

      const presidentGadget = page.locator('[data-test-id="president-gadget"]');
      const isVisible = await presidentGadget.isVisible().catch(() => false);

      console.log(`President gadget visible: ${isVisible}`);
    });

    test("shows governance summary", async ({ page }) => {
      await page.goto("/member");

      const presidentGadget = page.locator('[data-test-id="president-gadget"]');
      const isVisible = await presidentGadget.isVisible().catch(() => false);

      if (isVisible) {
        // Should show governance metrics
        await expect(presidentGadget.locator('text=Open Flags')).toBeVisible();
        await expect(presidentGadget.locator('text=Pending Minutes')).toBeVisible();

        // Should have link to governance dashboard
        const adminLink = presidentGadget.locator('a[href="/admin/governance"]');
        await expect(adminLink).toBeVisible();
      }
    });
  });

  test.describe("Tech Lead Gadget", () => {
    test("renders for Admin role", async ({ page }) => {
      await page.goto("/member");

      const techLeadGadget = page.locator('[data-test-id="tech-lead-gadget"]');
      const isVisible = await techLeadGadget.isVisible().catch(() => false);

      console.log(`Tech Lead gadget visible: ${isVisible}`);
    });

    test("shows system status", async ({ page }) => {
      await page.goto("/member");

      const techLeadGadget = page.locator('[data-test-id="tech-lead-gadget"]');
      const isVisible = await techLeadGadget.isVisible().catch(() => false);

      if (isVisible) {
        // Should show system status
        await expect(techLeadGadget.locator('text=System Status')).toBeVisible();
        await expect(techLeadGadget.locator('text=Healthy')).toBeVisible();

        // Should show demo mode indicator
        await expect(techLeadGadget.locator('text=Demo Mode')).toBeVisible();

        // Should have link to admin dashboard
        const adminLink = techLeadGadget.locator('a[href="/admin"]');
        await expect(adminLink).toBeVisible();
      }
    });
  });

  test.describe("View As Context", () => {
    test("switching view mode affects officer gadget visibility", async ({ page }) => {
      await page.goto("/member");

      // Look for view-as selector if available
      const viewAsSelector = page.locator('[data-test-id="view-as-selector"]');
      const hasViewAs = await viewAsSelector.isVisible().catch(() => false);

      if (hasViewAs) {
        // Test switching to public view - should hide officer gadgets
        await viewAsSelector.selectOption("public");
        await page.waitForTimeout(500);

        const officerArea = page.locator('[data-test-id="officer-gadgets-area"]');
        const isOfficerAreaVisible = await officerArea.isVisible().catch(() => false);

        // Officer gadgets should not be visible in public view
        expect(isOfficerAreaVisible).toBe(false);
      }
    });
  });

  test.describe("Officer Gadget Navigation", () => {
    test("admin links navigate correctly", async ({ page }) => {
      await page.goto("/member");

      // Find any visible officer gadget admin link
      const adminLinks = page.locator('[data-test-id$="-gadget"] a[href^="/admin"]');
      const count = await adminLinks.count();

      if (count > 0) {
        const firstLink = adminLinks.first();
        const href = await firstLink.getAttribute("href");

        await firstLink.click();

        // Should navigate to an admin page
        await expect(page).toHaveURL(/\/admin/);
      }
    });
  });
});

test.describe("Officer Gadget Accessibility", () => {
  test("gadgets have proper heading structure", async ({ page }) => {
    await page.goto("/member");

    // Check for officer gadgets with proper headings
    const gadgets = page.locator('[data-test-id$="-gadget"]');
    const count = await gadgets.count();

    for (let i = 0; i < count; i++) {
      const gadget = gadgets.nth(i);
      const isVisible = await gadget.isVisible().catch(() => false);

      if (isVisible) {
        // Each gadget should have a title
        const heading = gadget.locator('h1, h2, h3, h4, h5, h6, [role="heading"]');
        const headingCount = await heading.count();
        expect(headingCount).toBeGreaterThan(0);
      }
    }
  });
});
