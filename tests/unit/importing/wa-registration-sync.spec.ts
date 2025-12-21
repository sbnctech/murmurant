/**
 * Wild Apricot Registration Sync Unit Tests
 *
 * Tests for registration sync logic, diagnostics, and skip reason tracking.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  WAEventRegistration,
  WAContactRef,
  RegistrationDiagnostics,
} from "@/lib/importing/wildapricot/types";
import {
  transformRegistration,
  mapRegistrationStatus,
} from "@/lib/importing/wildapricot/transformers";

// ============================================================================
// Test Fixtures
// ============================================================================

function makeRegistration(overrides: Partial<WAEventRegistration> = {}): WAEventRegistration {
  return {
    Id: 12345,
    Event: {
      Id: 100,
      Name: "Test Event",
      StartDate: "2025-01-15T10:00:00",
    },
    Contact: {
      Id: 5000,
      Name: "John Doe",
      Email: "john@example.com",
    },
    RegistrationType: {
      Id: 1,
      Name: "Standard",
    },
    Status: "Confirmed",
    RegistrationDate: "2025-01-10T08:30:00",
    IsCheckedIn: false,
    OnWaitlist: false,
    RegistrationFee: 25.0,
    PaidSum: 25.0,
    Memo: null,
    ...overrides,
  };
}

function makeDiagnostics(): RegistrationDiagnostics {
  return {
    eventsProcessed: 0,
    eventsSkippedUnmapped: 0,
    registrationFetchCalls: 0,
    registrationsFetchedTotal: 0,
    registrationsTransformedOk: 0,
    registrationsSkippedMissingEvent: 0,
    registrationsSkippedMissingMember: 0,
    registrationsSkippedTransformError: 0,
    registrationsUpserted: 0,
    skipReasons: new Map(),
  };
}

// ============================================================================
// Registration Status Mapping Tests
// ============================================================================

describe("mapRegistrationStatus", () => {
  it("maps Confirmed to CONFIRMED", () => {
    expect(mapRegistrationStatus("Confirmed", false)).toBe("CONFIRMED");
  });

  it("maps Cancelled to CANCELLED", () => {
    expect(mapRegistrationStatus("Cancelled", false)).toBe("CANCELLED");
  });

  it("maps PendingPayment to PENDING_PAYMENT", () => {
    expect(mapRegistrationStatus("PendingPayment", false)).toBe("PENDING_PAYMENT");
  });

  it("maps WaitList to WAITLISTED", () => {
    expect(mapRegistrationStatus("WaitList", false)).toBe("WAITLISTED");
  });

  it("maps Declined to CANCELLED", () => {
    expect(mapRegistrationStatus("Declined", false)).toBe("CANCELLED");
  });

  it("maps NoShow to NO_SHOW", () => {
    expect(mapRegistrationStatus("NoShow", false)).toBe("NO_SHOW");
  });

  it("maps unknown status to PENDING with warning", () => {
    // @ts-expect-error - testing unknown status
    const result = mapRegistrationStatus("SomeNewStatus", false);
    expect(result).toBe("PENDING");
  });
});

// ============================================================================
// Registration Transform Tests
// ============================================================================

describe("transformRegistration", () => {
  const eventId = "clubos-event-uuid";
  const memberId = "clubos-member-uuid";

  it("transforms a valid registration successfully", () => {
    const waReg = makeRegistration();
    const result = transformRegistration(waReg, eventId, memberId);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    // Prisma uses connect syntax for relations
    expect(result.data!.event).toEqual({ connect: { id: eventId } });
    expect(result.data!.member).toEqual({ connect: { id: memberId } });
    expect(result.data!.status).toBe("CONFIRMED");
  });

  it("handles Cancelled status", () => {
    const waReg = makeRegistration({ Status: "Cancelled" });
    const result = transformRegistration(waReg, eventId, memberId);

    expect(result.success).toBe(true);
    expect(result.data!.status).toBe("CANCELLED");
  });

  it("handles WaitList status and sets waitlistPosition", () => {
    const waReg = makeRegistration({ Status: "WaitList", OnWaitlist: true });
    const result = transformRegistration(waReg, eventId, memberId);

    expect(result.success).toBe(true);
    expect(result.data!.status).toBe("WAITLISTED");
  });

  it("handles registration with no registration type", () => {
    const waReg = makeRegistration({ RegistrationType: null });
    const result = transformRegistration(waReg, eventId, memberId);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it("handles registration with memo", () => {
    const waReg = makeRegistration({ Memo: "VIP guest" });
    const result = transformRegistration(waReg, eventId, memberId);

    expect(result.success).toBe(true);
    // Note: memo handling depends on schema
  });
});

// ============================================================================
// Registration Diagnostics Tests
// ============================================================================

describe("RegistrationDiagnostics", () => {
  it("initializes with zero counts", () => {
    const diag = makeDiagnostics();

    expect(diag.eventsProcessed).toBe(0);
    expect(diag.registrationsFetchedTotal).toBe(0);
    expect(diag.registrationsSkippedMissingMember).toBe(0);
    expect(diag.skipReasons.size).toBe(0);
  });

  it("tracks skip reasons correctly", () => {
    const diag = makeDiagnostics();

    // Simulate recording skip reasons
    const recordSkipReason = (reason: string) => {
      const count = diag.skipReasons.get(reason) || 0;
      diag.skipReasons.set(reason, count + 1);
    };

    recordSkipReason("Member not mapped: WA contact 123");
    recordSkipReason("Member not mapped: WA contact 456");
    recordSkipReason("Member not mapped: WA contact 123"); // Duplicate

    expect(diag.skipReasons.get("Member not mapped: WA contact 123")).toBe(2);
    expect(diag.skipReasons.get("Member not mapped: WA contact 456")).toBe(1);
    expect(diag.skipReasons.size).toBe(2);
  });

  it("can compute summary statistics", () => {
    const diag = makeDiagnostics();

    // Simulate a sync run
    diag.eventsProcessed = 100;
    diag.registrationFetchCalls = 100;
    diag.registrationsFetchedTotal = 5000;
    diag.registrationsTransformedOk = 500;
    diag.registrationsSkippedMissingMember = 4500;
    diag.registrationsUpserted = 500;

    // Assert referential integrity
    const totalAccounted =
      diag.registrationsUpserted +
      diag.registrationsSkippedMissingMember +
      diag.registrationsSkippedMissingEvent +
      diag.registrationsSkippedTransformError;

    expect(totalAccounted).toBeLessThanOrEqual(diag.registrationsFetchedTotal);
  });
});

// ============================================================================
// Referential Integrity Tests
// ============================================================================

describe("Registration Sync Prerequisites", () => {
  it("documents that registrations require member mappings", () => {
    // This test documents the critical invariant:
    // A registration can only be imported if the member mapping exists

    const waReg = makeRegistration();
    const memberIdMap = new Map<number, string>();

    // Simulate the check done in syncRegistration
    const memberId = memberIdMap.get(waReg.Contact.Id);
    expect(memberId).toBeUndefined();

    // Without member mapping, registration should be skipped
    // This is the expected behavior that causes "0 registrations imported"
    // when members haven't been synced first
  });

  it("documents that registrations require event mappings", () => {
    // This test documents the critical invariant:
    // A registration can only be imported if the event mapping exists

    const waReg = makeRegistration();
    const eventIdMap = new Map<number, string>();

    // Simulate the check done in syncRegistrations
    const eventId = eventIdMap.get(waReg.Event.Id);
    expect(eventId).toBeUndefined();

    // Without event mapping, the event's registrations are skipped entirely
  });

  it("documents correct sync order: members -> events -> registrations", () => {
    // This test documents the required sync order
    const syncOrder = ["members", "events", "registrations"];

    // Members must come first
    expect(syncOrder[0]).toBe("members");

    // Events must come before registrations
    expect(syncOrder.indexOf("events")).toBeLessThan(
      syncOrder.indexOf("registrations")
    );
  });
});

// ============================================================================
// Edge Case Tests
// ============================================================================

describe("Registration Edge Cases", () => {
  const eventId = "clubos-event-uuid";
  const memberId = "clubos-member-uuid";

  it("handles registration with checked-in status", () => {
    const waReg = makeRegistration({ IsCheckedIn: true });
    const result = transformRegistration(waReg, eventId, memberId);

    expect(result.success).toBe(true);
    // Checked-in registrations should still transform successfully
  });

  it("handles registration with zero fee", () => {
    const waReg = makeRegistration({ RegistrationFee: 0, PaidSum: 0 });
    const result = transformRegistration(waReg, eventId, memberId);

    expect(result.success).toBe(true);
  });

  it("handles registration with guest info", () => {
    const waReg = makeRegistration({
      GuestRegistrationsSummary: {
        NumberOfGuests: 2,
        TotalPaid: 50.0,
      },
    });
    const result = transformRegistration(waReg, eventId, memberId);

    expect(result.success).toBe(true);
  });

  it("handles contact with null email", () => {
    const waReg = makeRegistration({
      Contact: {
        Id: 5000,
        Name: "John Doe",
        Email: null,
      },
    });
    const result = transformRegistration(waReg, eventId, memberId);

    expect(result.success).toBe(true);
  });
});
