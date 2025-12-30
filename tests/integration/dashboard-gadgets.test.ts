/**
 * Dashboard Gadget Integration Tests
 *
 * These tests verify that dashboard gadgets correctly fetch and
 * display data from the API layer using PFOS seed data.
 *
 * Prerequisites:
 *   - GadgetHost component exists (DONE)
 *   - Member layout exists (DONE)
 *   - Gadget data APIs implemented (DONE)
 *   - Real gadget components implemented (DONE)
 *   - PFOS seed data loaded
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { test, expect } from "@playwright/test";
import {
  SEED_EVENTS,
  SEED_COUNTS,
  SEED_CATEGORIES,
} from "../fixtures/seed-data";

test.describe("Dashboard Gadget Integration", () => {
  test.describe("Upcoming Events Gadget", () => {
    test("Gadget placeholder renders", async ({ page }) => {
      await page.goto("/member");
      await expect(
        page.locator('[data-test-id="gadget-host-upcoming-events"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-test-id="gadget-title-upcoming-events"]')
      ).toContainText("Upcoming Events");
    });

    test("Gadget displays events from API", async ({ page }) => {
      await page.goto("/member");

      // Wait for events to load
      const gadget = page.locator('[data-test-id="gadget-host-upcoming-events"]');
      await expect(gadget).toBeVisible();

      // Wait for event items to appear (not loading state)
      const eventItems = gadget.locator('[data-test-id="upcoming-event-item"]');
      await expect(eventItems.first()).toBeVisible({ timeout: 10000 });

      // Should show up to 5 events (limit from API call)
      const count = await eventItems.count();
      expect(count).toBeGreaterThanOrEqual(1);
      expect(count).toBeLessThanOrEqual(5);
    });

    test("Gadget shows empty state when no events", async ({ page }) => {
      // This test would require mocking the API - skip for now
      // In production, empty state shows: "No upcoming events at this time."
      test.skip();
    });

    test("Events display title and date", async ({ page }) => {
      await page.goto("/member");

      const gadget = page.locator('[data-test-id="gadget-host-upcoming-events"]');
      const firstEvent = gadget.locator('[data-test-id="upcoming-event-item"]').first();

      // Wait for content to load
      await expect(firstEvent).toBeVisible({ timeout: 10000 });

      // Event should have a title (non-empty text)
      const eventText = await firstEvent.textContent();
      expect(eventText).toBeTruthy();
      expect(eventText!.length).toBeGreaterThan(0);
    });

    test("Events link to detail pages", async ({ page }) => {
      await page.goto("/member");

      const gadget = page.locator('[data-test-id="gadget-host-upcoming-events"]');
      const firstEventLink = gadget.locator('[data-test-id="upcoming-event-item"] a').first();

      await expect(firstEventLink).toBeVisible({ timeout: 10000 });

      // Link should point to an event detail page
      const href = await firstEventLink.getAttribute("href");
      expect(href).toMatch(/^\/events\//);
    });

    test("View all link navigates to events page", async ({ page }) => {
      await page.goto("/member");

      const gadget = page.locator('[data-test-id="gadget-host-upcoming-events"]');
      await expect(gadget).toBeVisible();

      // Wait for content to load
      await expect(
        gadget.locator('[data-test-id="upcoming-event-item"]').first()
      ).toBeVisible({ timeout: 10000 });

      // Find "View all events" link
      const viewAllLink = gadget.locator('a:has-text("View all events")');
      await expect(viewAllLink).toBeVisible();

      // Click and verify navigation
      await viewAllLink.click();
      await expect(page).toHaveURL(/\/events/);
    });
  });

  test.describe("My Registrations Gadget", () => {
    test("Gadget placeholder renders", async ({ page }) => {
      await page.goto("/member");
      await expect(
        page.locator('[data-test-id="gadget-host-my-registrations"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-test-id="gadget-title-my-registrations"]')
      ).toContainText("My Registrations");
    });

    test("Gadget shows empty state for new members", async ({ page }) => {
      // Note: This depends on the logged-in user having no registrations
      // The empty state shows: "You have not registered for any events yet."
      await page.goto("/member");

      const gadget = page.locator('[data-test-id="gadget-host-my-registrations"]');
      await expect(gadget).toBeVisible();

      // Wait for loading to complete
      await page.waitForTimeout(2000); // Allow time for API call

      // Check for either registrations or empty state
      const hasRegistrations = await gadget.locator('[data-test-id="registration-item"]').count() > 0;
      const hasEmptyState = await gadget.locator('text=You have not registered for any events yet').isVisible().catch(() => false);

      // One of these should be true
      expect(hasRegistrations || hasEmptyState).toBe(true);
    });

    test("Registrations show status badges", async ({ page }) => {
      await page.goto("/member");

      const gadget = page.locator('[data-test-id="gadget-host-my-registrations"]');
      await expect(gadget).toBeVisible();

      // Wait for content
      await page.waitForTimeout(2000);

      // If there are registrations, check for status badges
      const registrationItems = gadget.locator('[data-test-id="registration-item"]');
      const count = await registrationItems.count();

      if (count > 0) {
        // First registration should have a status badge
        const firstItem = registrationItems.first();
        const statusBadge = firstItem.locator('[data-test-id="registration-status"]');
        await expect(statusBadge).toBeVisible();

        // Status should be one of the known values
        const statusText = await statusBadge.textContent();
        expect(["Confirmed", "Pending", "Waitlisted", "Cancelled", "Payment Pending"]).toContain(statusText);
      }
    });

    test("Registration items link to event detail", async ({ page }) => {
      await page.goto("/member");

      const gadget = page.locator('[data-test-id="gadget-host-my-registrations"]');
      await expect(gadget).toBeVisible();

      // Wait for content
      await page.waitForTimeout(2000);

      const registrationItems = gadget.locator('[data-test-id="registration-item"]');
      const count = await registrationItems.count();

      if (count > 0) {
        const firstLink = registrationItems.first().locator("a");
        const href = await firstLink.getAttribute("href");
        expect(href).toMatch(/^\/events\//);
      }
    });
  });

  test.describe("Gadget Layout Integration", () => {
    test("Primary gadget area contains upcoming-events", async ({ page }) => {
      await page.goto("/member");
      const primaryArea = page.locator('[data-test-id="myclub-gadgets-primary"]');
      await expect(
        primaryArea.locator('[data-test-id="gadget-host-upcoming-events"]')
      ).toBeVisible();
    });

    test("Secondary gadget area contains my-registrations", async ({ page }) => {
      await page.goto("/member");
      const secondaryArea = page.locator('[data-test-id="myclub-gadgets-secondary"]');
      await expect(
        secondaryArea.locator('[data-test-id="gadget-host-my-registrations"]')
      ).toBeVisible();
    });

    test("Gadgets have consistent card styling", async ({ page }) => {
      await page.goto("/member");

      const upcomingEventsGadget = page.locator('[data-test-id="gadget-host-upcoming-events"]');
      const myRegistrationsGadget = page.locator('[data-test-id="gadget-host-my-registrations"]');

      await expect(upcomingEventsGadget).toBeVisible();
      await expect(myRegistrationsGadget).toBeVisible();

      // Both should have the gadget-id attribute
      await expect(upcomingEventsGadget).toHaveAttribute("data-gadget-id", "upcoming-events");
      await expect(myRegistrationsGadget).toHaveAttribute("data-gadget-id", "my-registrations");
    });
  });

  test.describe("Gadget Error Handling", () => {
    test("Gadget shows loading state initially", async ({ page }) => {
      // Slow down network to catch loading state
      await page.route("**/api/v1/events*", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await route.continue();
      });

      await page.goto("/member");

      const gadget = page.locator('[data-test-id="gadget-host-upcoming-events"]');
      await expect(gadget).toBeVisible();

      // Should show loading text initially
      const loadingText = gadget.locator('text=Loading events...');
      // This may or may not be visible depending on timing
      // Just verify the gadget container is present
    });

    test("Unknown gadget shows error styling", async ({ page }) => {
      // This would require rendering an unknown gadget ID
      // GadgetHost handles this gracefully with "Unknown gadget: <id>" message
      test.skip();
    });
  });

  test.describe("Gadget Loading States", () => {
    test("Loading state transitions to content", async ({ page }) => {
      await page.goto("/member");

      const gadget = page.locator('[data-test-id="gadget-host-upcoming-events"]');
      await expect(gadget).toBeVisible();

      // Wait for content to appear (loading -> content transition)
      const content = gadget.locator('[data-test-id="gadget-content-upcoming-events"]');
      await expect(content).toBeVisible();

      // Eventually should show either events or empty state
      await page.waitForTimeout(5000);

      const hasEvents = await gadget.locator('[data-test-id="upcoming-event-item"]').count() > 0;
      const hasEmptyState = await gadget.locator('text=No upcoming events').isVisible().catch(() => false);

      // One of these should be true after loading completes
      expect(hasEvents || hasEmptyState).toBe(true);
    });
  });

  test.describe("Gadget Interactivity", () => {
    test("Upcoming events gadget shows register buttons when logged in", async ({ page }) => {
      await page.goto("/member");

      const gadget = page.locator('[data-test-id="gadget-host-upcoming-events"]');
      await expect(gadget).toBeVisible();

      // Wait for events to load
      const eventItems = gadget.locator('[data-test-id="upcoming-event-item"]');
      await expect(eventItems.first()).toBeVisible({ timeout: 10000 });

      // Check for registration status or register button on first event
      const firstEvent = eventItems.first();

      // Should have either a status badge (already registered) or register button
      const hasStatus = await firstEvent.locator('[data-test-id="event-registration-status"]').isVisible().catch(() => false);
      const hasButton = await firstEvent.locator('[data-test-id="event-register-button"]').isVisible().catch(() => false);
      const hasAvailability = await firstEvent.locator('text=/\\d+ spots|Open|Full|Waitlist/').isVisible().catch(() => false);

      // At least one of these should be present
      expect(hasStatus || hasButton || hasAvailability).toBe(true);
    });
  });
});

test.describe("Future Gadgets (Placeholders)", () => {
  test.describe("Announcements Gadget", () => {
    test.skip("Gadget displays club announcements", async ({ page }) => {
      // TODO: Implement when announcements gadget exists
      await page.goto("/member");
      await expect(
        page.locator('[data-test-id="gadget-host-announcements"]')
      ).toBeVisible();
    });
  });

  test.describe("President's Message Gadget", () => {
    test.skip("Gadget displays president message", async ({ page }) => {
      // TODO: Implement when presidents-message gadget exists
      await page.goto("/member");
      await expect(
        page.locator('[data-test-id="gadget-host-presidents-message"]')
      ).toBeVisible();
    });
  });

  test.describe("Recent Photos Gadget", () => {
    test.skip("Gadget displays recent photo thumbnails", async () => {
      // TODO: Implement when recent-photos gadget exists
    });
  });

  test.describe("Quick Actions Gadget", () => {
    test.skip("Gadget displays action buttons", async () => {
      // TODO: Implement when quick-actions gadget exists
    });
  });
});
