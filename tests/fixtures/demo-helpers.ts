/**
 * Demo Test Helpers
 *
 * These helpers combine the demo seed constants with API lookups
 * to provide a clean interface for tests that need dynamic IDs.
 */

import type { APIRequestContext, Page } from "@playwright/test";
import {
  lookupMemberIdByEmail,
  lookupEventIdByTitle,
  lookupRegistrationId,
} from "../admin/helpers/lookupIds";
import {
  DEMO_MEMBERS,
  DEMO_EVENTS,
  DEMO_REGISTRATIONS,
  type DemoMemberKey,
  type DemoEventKey,
  type DemoRegistrationKey,
} from "./demo-seed";

// =============================================================================
// ID LOOKUP HELPERS
// =============================================================================

/**
 * Get a member ID by their key in DEMO_MEMBERS
 */
export async function getMemberIdByKey(
  request: APIRequestContext,
  key: DemoMemberKey
): Promise<string> {
  const member = DEMO_MEMBERS[key];
  return lookupMemberIdByEmail(request, member.email);
}

/**
 * Get an event ID by its key in DEMO_EVENTS
 */
export async function getEventIdByKey(
  request: APIRequestContext,
  key: DemoEventKey
): Promise<string> {
  const event = DEMO_EVENTS[key];
  return lookupEventIdByTitle(request, event.title);
}

/**
 * Get a registration ID by its key in DEMO_REGISTRATIONS
 */
export async function getRegistrationIdByKey(
  request: APIRequestContext,
  key: DemoRegistrationKey
): Promise<string> {
  const reg = DEMO_REGISTRATIONS[key];
  return lookupRegistrationId(request, {
    memberEmail: reg.memberEmail,
    eventTitle: reg.eventTitle,
  });
}

// =============================================================================
// NAVIGATION HELPERS
// =============================================================================

const BASE_URL = process.env.PW_BASE_URL ?? "http://localhost:3000";

/**
 * Navigate to member detail page by demo member key
 */
export async function goToMemberDetail(
  page: Page,
  request: APIRequestContext,
  memberKey: DemoMemberKey
): Promise<void> {
  const memberId = await getMemberIdByKey(request, memberKey);
  await page.goto(`${BASE_URL}/admin/members/${memberId}`);
}

/**
 * Navigate to event detail page by demo event key
 */
export async function goToEventDetail(
  page: Page,
  request: APIRequestContext,
  eventKey: DemoEventKey
): Promise<void> {
  const eventId = await getEventIdByKey(request, eventKey);
  await page.goto(`${BASE_URL}/admin/events/${eventId}`);
}

/**
 * Navigate to registration detail page by demo registration key
 */
export async function goToRegistrationDetail(
  page: Page,
  request: APIRequestContext,
  regKey: DemoRegistrationKey
): Promise<void> {
  const regId = await getRegistrationIdByKey(request, regKey);
  await page.goto(`${BASE_URL}/admin/registrations/${regId}`);
}

// =============================================================================
// ASSERTION HELPERS
// =============================================================================

/**
 * Check if page URL contains a valid UUID pattern
 */
export function expectUrlContainsUuid(url: string): boolean {
  const uuidPattern = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i;
  return uuidPattern.test(url);
}

/**
 * Get UUID from URL path
 */
export function extractUuidFromUrl(url: string): string | null {
  const uuidPattern = /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i;
  const match = url.match(uuidPattern);
  return match ? match[1] : null;
}
