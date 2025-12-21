/**
 * Wild Apricot Importer
 *
 * Main import orchestrator implementing fullSync() and incrementalSync().
 * Handles ID mapping, idempotent upserts, and audit logging.
 */

import { prisma } from "@/lib/prisma";
import { AuditAction } from "@prisma/client";
import { WildApricotClient, createWAClient } from "./client";
import { loadWAConfig, isDryRun, getSystemActor } from "./config";
import {
  WAContact,
  WAEvent,
  WAEventRegistration,
  SyncResult,
  SyncStats,
  SyncError,
  RegistrationDiagnostics,
  SyncReport,
  SyncWarning,
} from "./types";
import * as fs from "fs";
import * as path from "path";
import {
  transformContact,
  transformEvent,
  transformRegistration,
  mapContactStatusToCode,
  getMemberChanges,
  getEventChanges,
} from "./transformers";

// ============================================================================
// Types
// ============================================================================

interface IdMapping {
  entityType: string;
  waId: number;
  clubosId: string;
}

interface SyncContext {
  runId: string;
  mode: "full" | "incremental";
  dryRun: boolean;
  startedAt: Date;
  stats: {
    members: SyncStats;
    events: SyncStats;
    registrations: SyncStats;
  };
  errors: SyncError[];
  membershipStatusMap: Map<string, string>; // code -> id
  memberIdMap: Map<number, string>; // WA ID -> ClubOS ID
  eventIdMap: Map<number, string>; // WA ID -> ClubOS ID
  registrationDiagnostics: RegistrationDiagnostics;
  /** Counts fetched from WA (for report) */
  fetched: {
    contacts: number;
    events: number;
  };
  /** Warnings generated during sync */
  warnings: SyncWarning[];
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateRunId(): string {
  return `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function initStats(): SyncStats {
  return { created: 0, updated: 0, skipped: 0, errors: 0 };
}

function initRegistrationDiagnostics(): RegistrationDiagnostics {
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

function recordSkipReason(diag: RegistrationDiagnostics, reason: string): void {
  const count = diag.skipReasons.get(reason) || 0;
  diag.skipReasons.set(reason, count + 1);
}

async function log(level: "INFO" | "WARN" | "ERROR", message: string, data?: unknown): Promise<void> {
  const prefix = `[WA-IMPORT] [${level}]`;
  if (level === "ERROR") {
    console.error(prefix, message, data ?? "");
  } else if (level === "WARN") {
    console.warn(prefix, message, data ?? "");
  } else {
    console.log(prefix, message, data ?? "");
  }
}

// ============================================================================
// Preflight Validation
// ============================================================================

/**
 * Required MembershipStatus codes for WA import.
 * These must exist before sync can proceed.
 */
const REQUIRED_STATUS_CODES = [
  "active",
  "lapsed",
  "pending_new",
  "pending_renewal",
  "suspended",
  "not_a_member",
  "unknown",
];

export interface PreflightResult {
  ok: boolean;
  checks: {
    database: boolean;
    waIdMappingTable: boolean;
    waSyncStateTable: boolean;
    membershipStatuses: boolean;
  };
  missingStatuses: string[];
  error?: string;
}

/**
 * Run preflight checks to ensure the system is ready for WA import.
 * Validates database connectivity, required tables, and MembershipStatus records.
 */
export async function runPreflightChecks(): Promise<PreflightResult> {
  const result: PreflightResult = {
    ok: false,
    checks: {
      database: false,
      waIdMappingTable: false,
      waSyncStateTable: false,
      membershipStatuses: false,
    },
    missingStatuses: [],
  };

  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    result.checks.database = true;

    // Check WaIdMapping table exists
    try {
      await prisma.waIdMapping.findFirst();
      result.checks.waIdMappingTable = true;
    } catch (error) {
      if (error instanceof Error && error.message.includes("does not exist")) {
        result.error = "WaIdMapping table does not exist. Run: npx prisma migrate deploy";
        return result;
      }
      throw error;
    }

    // Check WaSyncState table exists
    try {
      await prisma.waSyncState.findFirst();
      result.checks.waSyncStateTable = true;
    } catch (error) {
      if (error instanceof Error && error.message.includes("does not exist")) {
        result.error = "WaSyncState table does not exist. Run: npx prisma migrate deploy";
        return result;
      }
      throw error;
    }

    // Check required MembershipStatus codes exist
    const existingStatuses = await prisma.membershipStatus.findMany({
      where: { code: { in: REQUIRED_STATUS_CODES } },
      select: { code: true },
    });

    const existingCodes = new Set(existingStatuses.map((s) => s.code));
    result.missingStatuses = REQUIRED_STATUS_CODES.filter(
      (code) => !existingCodes.has(code)
    );

    if (result.missingStatuses.length > 0) {
      result.error = `Missing MembershipStatus codes: ${result.missingStatuses.join(", ")}. Run: npx tsx scripts/importing/seed_membership_statuses.ts`;
      return result;
    }

    result.checks.membershipStatuses = true;
    result.ok = true;
    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    return result;
  }
}

// ============================================================================
// ID Mapping
// ============================================================================

async function getIdMapping(entityType: string, waId: number): Promise<string | null> {
  const mapping = await prisma.waIdMapping.findUnique({
    where: { entityType_waId: { entityType, waId } },
  });
  return mapping?.clubosId ?? null;
}

async function createIdMapping(mapping: IdMapping): Promise<void> {
  await prisma.waIdMapping.create({
    data: {
      entityType: mapping.entityType,
      waId: mapping.waId,
      clubosId: mapping.clubosId,
    },
  });
}

async function updateIdMappingSyncedAt(entityType: string, waId: number): Promise<void> {
  await prisma.waIdMapping.update({
    where: { entityType_waId: { entityType, waId } },
    data: { syncedAt: new Date() },
  });
}

async function loadExistingMappings(entityType: string): Promise<Map<number, string>> {
  const mappings = await prisma.waIdMapping.findMany({
    where: { entityType },
  });
  return new Map(mappings.map((m) => [m.waId, m.clubosId]));
}

// ============================================================================
// Audit Logging
// ============================================================================

async function auditImport(
  action: AuditAction,
  resourceType: string,
  resourceId: string,
  ctx: SyncContext,
  metadata?: Record<string, unknown>
): Promise<void> {
  if (ctx.dryRun) return;

  try {
    await prisma.auditLog.create({
      data: {
        action,
        resourceType,
        resourceId,
        memberId: null, // System actor
        metadata: {
          source: "wa_import",
          syncRunId: ctx.runId,
          mode: ctx.mode,
          ...metadata,
        },
      },
    });
  } catch (error) {
    await log("ERROR", `Failed to create audit log for ${resourceType}/${resourceId}`, error);
  }
}

// ============================================================================
// Membership Status Loader
// ============================================================================

async function loadMembershipStatusMap(): Promise<Map<string, string>> {
  const statuses = await prisma.membershipStatus.findMany();
  return new Map(statuses.map((s) => [s.code, s.id]));
}

// ============================================================================
// Stale Record Detection
// ============================================================================

export interface StaleRecord {
  entityType: string;
  waId: number;
  clubosId: string;
  lastSyncedAt: Date;
  staleDays: number;
}

export interface StaleDetectionResult {
  staleMembers: StaleRecord[];
  staleEvents: StaleRecord[];
  staleRegistrations: StaleRecord[];
  threshold: Date;
  staleDaysThreshold: number;
}

/**
 * Detect records that haven't been seen in recent syncs.
 * These may have been deleted in WA.
 *
 * @param staleDays - Number of days since last sync to consider stale (default: 7)
 */
export async function detectStaleRecords(
  staleDays: number = 7
): Promise<StaleDetectionResult> {
  const threshold = new Date(Date.now() - staleDays * 24 * 60 * 60 * 1000);
  const now = Date.now();

  // Find mappings not synced since threshold
  const staleMappings = await prisma.waIdMapping.findMany({
    where: {
      syncedAt: { lt: threshold },
    },
    orderBy: { syncedAt: "asc" },
  });

  const toStaleRecord = (m: typeof staleMappings[0]): StaleRecord => ({
    entityType: m.entityType,
    waId: m.waId,
    clubosId: m.clubosId,
    lastSyncedAt: m.syncedAt,
    staleDays: Math.floor((now - m.syncedAt.getTime()) / (24 * 60 * 60 * 1000)),
  });

  return {
    staleMembers: staleMappings
      .filter((m) => m.entityType === "Member")
      .map(toStaleRecord),
    staleEvents: staleMappings
      .filter((m) => m.entityType === "Event")
      .map(toStaleRecord),
    staleRegistrations: staleMappings
      .filter((m) => m.entityType === "EventRegistration")
      .map(toStaleRecord),
    threshold,
    staleDaysThreshold: staleDays,
  };
}

/**
 * Get counts of stale records for reporting.
 * Note: Actual soft-delete requires adding deletedAt to schema.
 *
 * @param staleDays - Minimum days since last sync to consider stale
 */
export async function getStaleRecordCounts(
  staleDays: number = 30
): Promise<{
  total: number;
  members: number;
  events: number;
  registrations: number;
  threshold: Date;
}> {
  const stale = await detectStaleRecords(staleDays);

  return {
    total: stale.staleMembers.length + stale.staleEvents.length + stale.staleRegistrations.length,
    members: stale.staleMembers.length,
    events: stale.staleEvents.length,
    registrations: stale.staleRegistrations.length,
    threshold: stale.threshold,
  };
}

/**
 * Remove stale WaIdMapping records (cleanup orphaned mappings).
 * This removes the WA ID mapping but does NOT delete the ClubOS entity.
 * Use this after confirming records are truly deleted in WA.
 *
 * @param staleDays - Minimum days since last sync
 * @param dryRun - If true, only report what would be removed
 */
export async function cleanupStaleMappings(
  staleDays: number = 30,
  dryRun: boolean = true
): Promise<{
  removed: number;
  members: number;
  events: number;
  registrations: number;
}> {
  const stale = await detectStaleRecords(staleDays);

  if (dryRun) {
    return {
      removed: stale.staleMembers.length + stale.staleEvents.length + stale.staleRegistrations.length,
      members: stale.staleMembers.length,
      events: stale.staleEvents.length,
      registrations: stale.staleRegistrations.length,
    };
  }

  // Remove stale mappings
  const allStaleWaIds = [
    ...stale.staleMembers,
    ...stale.staleEvents,
    ...stale.staleRegistrations,
  ];

  let removed = 0;
  for (const record of allStaleWaIds) {
    try {
      await prisma.waIdMapping.delete({
        where: {
          entityType_waId: {
            entityType: record.entityType,
            waId: record.waId,
          },
        },
      });
      removed++;
    } catch (error) {
      await log("WARN", `Failed to remove mapping for ${record.entityType} WA#${record.waId}`, error);
    }
  }

  return {
    removed,
    members: stale.staleMembers.length,
    events: stale.staleEvents.length,
    registrations: stale.staleRegistrations.length,
  };
}

// ============================================================================
// Member Sync
// ============================================================================

async function syncMembers(
  contacts: WAContact[],
  ctx: SyncContext
): Promise<void> {
  const batchSize = loadWAConfig().dbBatchSize;

  for (let i = 0; i < contacts.length; i += batchSize) {
    const batch = contacts.slice(i, i + batchSize);
    await log("INFO", `Processing members batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(contacts.length / batchSize)}`);

    for (const contact of batch) {
      try {
        await syncMember(contact, ctx);
      } catch (error) {
        ctx.stats.members.errors++;
        ctx.errors.push({
          entityType: "Member",
          waId: contact.Id,
          message: error instanceof Error ? error.message : String(error),
        });
        await log("ERROR", `Failed to sync member ${contact.Id}`, error);
      }
    }
  }
}

async function syncMember(contact: WAContact, ctx: SyncContext): Promise<void> {
  // Map WA status to ClubOS status code
  const statusCode = mapContactStatusToCode(contact.Status);
  const membershipStatusId = ctx.membershipStatusMap.get(statusCode);

  if (!membershipStatusId) {
    await log("WARN", `Unknown membership status '${statusCode}' for contact ${contact.Id}`);
    ctx.stats.members.skipped++;
    return;
  }

  // Transform contact to member
  const result = transformContact(contact, membershipStatusId);

  if (!result.success || !result.data) {
    await log("WARN", `Transform failed for contact ${contact.Id}: ${result.error}`);
    ctx.stats.members.skipped++;
    return;
  }

  for (const warning of result.warnings) {
    await log("WARN", warning);
  }

  // Check for existing mapping
  const existingId = ctx.memberIdMap.get(contact.Id);

  if (ctx.dryRun) {
    if (existingId) {
      ctx.stats.members.updated++;
    } else {
      ctx.stats.members.created++;
    }
    return;
  }

  if (existingId) {
    // Update existing member
    const existing = await prisma.member.findUnique({
      where: { id: existingId },
      select: { firstName: true, lastName: true, email: true, phone: true },
    });

    if (!existing) {
      // Mapping exists but member doesn't - recreate
      await log("WARN", `Member ${existingId} not found, recreating for WA contact ${contact.Id}`);
      const member = await prisma.member.create({ data: result.data });
      await prisma.waIdMapping.update({
        where: { entityType_waId: { entityType: "Member", waId: contact.Id } },
        data: { clubosId: member.id, syncedAt: new Date() },
      });
      ctx.memberIdMap.set(contact.Id, member.id);
      ctx.stats.members.created++;
      await auditImport("CREATE", "Member", member.id, ctx, { waId: contact.Id });
      return;
    }

    const changes = getMemberChanges(existing, result.data);

    if (changes) {
      await prisma.member.update({
        where: { id: existingId },
        data: changes,
      });
      await updateIdMappingSyncedAt("Member", contact.Id);
      ctx.stats.members.updated++;
      await auditImport("UPDATE", "Member", existingId, ctx, { waId: contact.Id, changes });
    } else {
      await updateIdMappingSyncedAt("Member", contact.Id);
      ctx.stats.members.skipped++;
    }
  } else {
    // Check if email already exists (WA allows duplicates, ClubOS doesn't)
    const existingByEmail = await prisma.member.findUnique({
      where: { email: result.data.email },
      select: { id: true },
    });

    if (existingByEmail) {
      // Map to existing member
      await log("WARN", `Email ${result.data.email} already exists, mapping WA ${contact.Id} to existing member`);
      await createIdMapping({
        entityType: "Member",
        waId: contact.Id,
        clubosId: existingByEmail.id,
      });
      ctx.memberIdMap.set(contact.Id, existingByEmail.id);
      ctx.stats.members.skipped++;
      return;
    }

    // Create new member
    const member = await prisma.member.create({ data: result.data });
    await createIdMapping({
      entityType: "Member",
      waId: contact.Id,
      clubosId: member.id,
    });
    ctx.memberIdMap.set(contact.Id, member.id);
    ctx.stats.members.created++;
    await auditImport("CREATE", "Member", member.id, ctx, { waId: contact.Id });
  }
}

// ============================================================================
// Event Sync
// ============================================================================

async function syncEvents(
  events: WAEvent[],
  client: WildApricotClient,
  ctx: SyncContext
): Promise<void> {
  const batchSize = loadWAConfig().dbBatchSize;

  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);
    await log("INFO", `Processing events batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(events.length / batchSize)}`);

    for (const event of batch) {
      try {
        await syncEvent(event, client, ctx);
      } catch (error) {
        ctx.stats.events.errors++;
        ctx.errors.push({
          entityType: "Event",
          waId: event.Id,
          message: error instanceof Error ? error.message : String(error),
        });
        await log("ERROR", `Failed to sync event ${event.Id}`, error);
      }
    }
  }
}

async function syncEvent(
  event: WAEvent,
  client: WildApricotClient,
  ctx: SyncContext
): Promise<void> {
  // Fetch event details to get organizer
  let eventChairId: string | null = null;

  if (event.Details?.Organizer?.Id) {
    eventChairId = ctx.memberIdMap.get(event.Details.Organizer.Id) ?? null;
    if (!eventChairId) {
      await log("WARN", `Event chair WA ID ${event.Details.Organizer.Id} not found for event ${event.Id}`);
    }
  }

  // Transform event
  const result = transformEvent(event, eventChairId);

  if (!result.success || !result.data) {
    await log("WARN", `Transform failed for event ${event.Id}: ${result.error}`);
    ctx.stats.events.skipped++;
    return;
  }

  for (const warning of result.warnings) {
    await log("WARN", warning);
  }

  // Check for existing mapping
  const existingId = ctx.eventIdMap.get(event.Id);

  if (ctx.dryRun) {
    if (existingId) {
      ctx.stats.events.updated++;
    } else {
      ctx.stats.events.created++;
    }
    return;
  }

  if (existingId) {
    // Update existing event
    const existing = await prisma.event.findUnique({
      where: { id: existingId },
      select: {
        title: true,
        description: true,
        location: true,
        category: true,
        capacity: true,
        isPublished: true,
      },
    });

    if (!existing) {
      // Mapping exists but event doesn't - recreate
      await log("WARN", `Event ${existingId} not found, recreating for WA event ${event.Id}`);
      const newEvent = await prisma.event.create({ data: result.data });
      await prisma.waIdMapping.update({
        where: { entityType_waId: { entityType: "Event", waId: event.Id } },
        data: { clubosId: newEvent.id, syncedAt: new Date() },
      });
      ctx.eventIdMap.set(event.Id, newEvent.id);
      ctx.stats.events.created++;
      await auditImport("CREATE", "Event", newEvent.id, ctx, { waId: event.Id });
      return;
    }

    const changes = getEventChanges(existing, result.data);

    if (changes) {
      await prisma.event.update({
        where: { id: existingId },
        data: changes,
      });
      await updateIdMappingSyncedAt("Event", event.Id);
      ctx.stats.events.updated++;
      await auditImport("UPDATE", "Event", existingId, ctx, { waId: event.Id, changes });
    } else {
      await updateIdMappingSyncedAt("Event", event.Id);
      ctx.stats.events.skipped++;
    }
  } else {
    // Create new event
    const newEvent = await prisma.event.create({ data: result.data });
    await createIdMapping({
      entityType: "Event",
      waId: event.Id,
      clubosId: newEvent.id,
    });
    ctx.eventIdMap.set(event.Id, newEvent.id);
    ctx.stats.events.created++;
    await auditImport("CREATE", "Event", newEvent.id, ctx, { waId: event.Id });
  }
}

// ============================================================================
// Registration Sync
// ============================================================================

async function syncRegistrations(
  events: WAEvent[],
  client: WildApricotClient,
  ctx: SyncContext
): Promise<void> {
  const diag = ctx.registrationDiagnostics;
  const progressInterval = 50; // Log progress every N events

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    diag.eventsProcessed++;

    // Log progress periodically
    if ((i + 1) % progressInterval === 0 || i === events.length - 1) {
      await log(
        "INFO",
        `Registration sync progress: ${i + 1}/${events.length} events, ` +
          `${diag.registrationsFetchedTotal} fetched, ${diag.registrationsUpserted} upserted, ` +
          `${diag.registrationsSkippedMissingMember} skipped (missing member)`
      );
    }

    const eventId = ctx.eventIdMap.get(event.Id);
    if (!eventId) {
      diag.eventsSkippedUnmapped++;
      recordSkipReason(diag, `Event ${event.Id} not mapped`);
      await log("WARN", `Skipping registrations for unmapped event ${event.Id}`);
      continue;
    }

    try {
      diag.registrationFetchCalls++;
      const registrations = await client.fetchEventRegistrations(event.Id);
      diag.registrationsFetchedTotal += registrations.length;

      await log("INFO", `Syncing ${registrations.length} registrations for event ${event.Id}`);

      for (const registration of registrations) {
        try {
          await syncRegistration(registration, eventId, ctx);
        } catch (error) {
          ctx.stats.registrations.errors++;
          ctx.errors.push({
            entityType: "EventRegistration",
            waId: registration.Id,
            message: error instanceof Error ? error.message : String(error),
          });
          recordSkipReason(diag, `Error: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    } catch (error) {
      await log("ERROR", `Failed to fetch registrations for event ${event.Id}`, error);
      recordSkipReason(diag, `Fetch error for event ${event.Id}`);
    }
  }

  // Final summary
  await log(
    "INFO",
    `Registration sync complete: ${diag.eventsProcessed} events processed, ` +
      `${diag.eventsSkippedUnmapped} events skipped (unmapped), ` +
      `${diag.registrationsFetchedTotal} registrations fetched from WA, ` +
      `${diag.registrationsUpserted} upserted, ` +
      `${diag.registrationsSkippedMissingMember} skipped (missing member), ` +
      `${diag.registrationsSkippedTransformError} skipped (transform error)`
  );
}

async function syncRegistration(
  registration: WAEventRegistration,
  eventId: string,
  ctx: SyncContext
): Promise<void> {
  const diag = ctx.registrationDiagnostics;

  // Get member ID
  const memberId = ctx.memberIdMap.get(registration.Contact.Id);
  if (!memberId) {
    diag.registrationsSkippedMissingMember++;
    const reason = `Member not mapped: WA contact ${registration.Contact.Id}`;
    recordSkipReason(diag, reason);
    // Only log first few to avoid spam
    if (diag.registrationsSkippedMissingMember <= 10) {
      await log("WARN", `Member not found for registration ${registration.Id} (contact ${registration.Contact.Id})`);
    }
    ctx.stats.registrations.skipped++;
    return;
  }

  // Transform registration
  const result = transformRegistration(registration, eventId, memberId);

  if (!result.success || !result.data) {
    diag.registrationsSkippedTransformError++;
    recordSkipReason(diag, `Transform error: ${result.error}`);
    await log("WARN", `Transform failed for registration ${registration.Id}: ${result.error}`);
    ctx.stats.registrations.skipped++;
    return;
  }

  diag.registrationsTransformedOk++;

  if (ctx.dryRun) {
    diag.registrationsUpserted++;
    ctx.stats.registrations.created++;
    return;
  }

  // Check for existing registration (by eventId + memberId unique constraint)
  const existing = await prisma.eventRegistration.findUnique({
    where: { eventId_memberId: { eventId, memberId } },
    select: { id: true, status: true },
  });

  if (existing) {
    // Update if status changed
    if (existing.status !== result.data.status) {
      await prisma.eventRegistration.update({
        where: { id: existing.id },
        data: { status: result.data.status, waitlistPosition: result.data.waitlistPosition },
      });
      diag.registrationsUpserted++;
      ctx.stats.registrations.updated++;
      await auditImport("UPDATE", "EventRegistration", existing.id, ctx, {
        waId: registration.Id,
        oldStatus: existing.status,
        newStatus: result.data.status,
      });
    } else {
      ctx.stats.registrations.skipped++;
    }
  } else {
    // Create new registration
    const newReg = await prisma.eventRegistration.create({ data: result.data });

    // Create ID mapping for registration
    await createIdMapping({
      entityType: "EventRegistration",
      waId: registration.Id,
      clubosId: newReg.id,
    });

    diag.registrationsUpserted++;
    ctx.stats.registrations.created++;
    await auditImport("CREATE", "EventRegistration", newReg.id, ctx, { waId: registration.Id });
  }
}

// ============================================================================
// Sync State Management
// ============================================================================

async function getSyncState(): Promise<{
  lastFullSync: Date | null;
  lastIncSync: Date | null;
  lastContactSync: Date | null;
  lastEventSync: Date | null;
}> {
  const state = await prisma.waSyncState.findFirst();
  return {
    lastFullSync: state?.lastFullSync ?? null,
    lastIncSync: state?.lastIncSync ?? null,
    lastContactSync: state?.lastContactSync ?? null,
    lastEventSync: state?.lastEventSync ?? null,
  };
}

async function updateSyncState(updates: {
  lastFullSync?: Date;
  lastIncSync?: Date;
  lastContactSync?: Date;
  lastEventSync?: Date;
  lastRegSync?: Date;
}): Promise<void> {
  const existing = await prisma.waSyncState.findFirst();

  if (existing) {
    await prisma.waSyncState.update({
      where: { id: existing.id },
      data: updates,
    });
  } else {
    await prisma.waSyncState.create({
      data: updates,
    });
  }
}

// ============================================================================
// Warning Generation
// ============================================================================

/** Minimum expected contacts for a full sync (below this is suspicious) */
const SUSPICIOUS_CONTACT_THRESHOLD = 100;

/** Minimum expected events for a full sync (below this is suspicious) */
const SUSPICIOUS_EVENT_THRESHOLD = 10;

/**
 * Generate warnings for suspicious conditions.
 */
function generateWarnings(ctx: SyncContext): void {
  const { fetched, registrationDiagnostics: diag } = ctx;

  // Suspicious contact count
  if (fetched.contacts < SUSPICIOUS_CONTACT_THRESHOLD && fetched.contacts > 0) {
    ctx.warnings.push({
      code: "LOW_CONTACT_COUNT",
      message: `Only ${fetched.contacts} contacts fetched from WA. Expected at least ${SUSPICIOUS_CONTACT_THRESHOLD}. Check API filters or credentials.`,
      severity: "high",
    });
  }

  // Suspicious event count
  if (fetched.events < SUSPICIOUS_EVENT_THRESHOLD && fetched.events > 0) {
    ctx.warnings.push({
      code: "LOW_EVENT_COUNT",
      message: `Only ${fetched.events} events fetched from WA. Expected at least ${SUSPICIOUS_EVENT_THRESHOLD}. Check date range or API filters.`,
      severity: "medium",
    });
  }

  // Zero registrations upserted but some fetched
  if (diag.registrationsFetchedTotal > 0 && diag.registrationsUpserted === 0) {
    const topReasons = Array.from(diag.skipReasons.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([reason, count]) => `${reason}: ${count}`)
      .join("; ");

    ctx.warnings.push({
      code: "ZERO_REGISTRATIONS_UPSERTED",
      message: `Fetched ${diag.registrationsFetchedTotal} registrations but upserted 0. Top skip reasons: ${topReasons || "unknown"}`,
      severity: "high",
    });
  }

  // Many missing member skips
  const skipRatio = diag.registrationsFetchedTotal > 0
    ? diag.registrationsSkippedMissingMember / diag.registrationsFetchedTotal
    : 0;
  if (skipRatio > 0.9 && diag.registrationsFetchedTotal > 100) {
    ctx.warnings.push({
      code: "HIGH_MEMBER_SKIP_RATIO",
      message: `${Math.round(skipRatio * 100)}% of registrations skipped due to missing member mapping. Ensure members are synced before registrations.`,
      severity: "high",
    });
  }

  // Zero contacts fetched
  if (fetched.contacts === 0) {
    ctx.warnings.push({
      code: "ZERO_CONTACTS",
      message: "No contacts fetched from WA. Check API connectivity and credentials.",
      severity: "high",
    });
  }
}

// ============================================================================
// Report Generation and File Writing
// ============================================================================

/** Default report output directory */
const REPORT_DIR = "/tmp/clubos";

/** Default report filename */
const REPORT_FILENAME = "wa_full_sync_report.json";

/**
 * Generate a sync report from the context.
 */
export function generateSyncReport(
  ctx: SyncContext,
  finishedAt: Date,
  durationMs: number
): SyncReport {
  const diag = ctx.registrationDiagnostics;

  // Get top skip reasons
  const topSkipReasons = Array.from(diag.skipReasons.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([reason, count]) => ({ reason, count }));

  return {
    version: 1,
    runId: ctx.runId,
    startedAt: ctx.startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs,
    success: ctx.errors.length === 0,
    dryRun: ctx.dryRun,
    fetched: {
      contacts: ctx.fetched.contacts,
      events: ctx.fetched.events,
      registrations: diag.registrationsFetchedTotal,
    },
    warnings: ctx.warnings,
    stats: ctx.stats,
    registrationDiagnostics: {
      eventsProcessed: diag.eventsProcessed,
      eventsSkippedUnmapped: diag.eventsSkippedUnmapped,
      registrationFetchCalls: diag.registrationFetchCalls,
      registrationsFetchedTotal: diag.registrationsFetchedTotal,
      registrationsTransformedOk: diag.registrationsTransformedOk,
      registrationsSkippedMissingEvent: diag.registrationsSkippedMissingEvent,
      registrationsSkippedMissingMember: diag.registrationsSkippedMissingMember,
      registrationsSkippedTransformError: diag.registrationsSkippedTransformError,
      registrationsUpserted: diag.registrationsUpserted,
      topSkipReasons,
    },
    errors: ctx.errors.slice(0, 50), // First 50 errors
    totalErrorCount: ctx.errors.length,
  };
}

/**
 * Write sync report to JSON file.
 *
 * @param report - The sync report to write
 * @param outputPath - Optional custom output path
 * @returns The path where the report was written
 */
export function writeSyncReport(
  report: SyncReport,
  outputPath?: string
): string {
  const filePath = outputPath ?? path.join(REPORT_DIR, REPORT_FILENAME);
  const dir = path.dirname(filePath);

  // Ensure directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write report
  fs.writeFileSync(filePath, JSON.stringify(report, null, 2));

  return filePath;
}

/**
 * Print warnings to console in a prominent format.
 */
function printWarnings(warnings: SyncWarning[]): void {
  if (warnings.length === 0) return;

  console.log("");
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║                         ⚠️  WARNINGS                          ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");

  for (const warning of warnings) {
    const severity = warning.severity.toUpperCase().padEnd(6);
    console.log(`║ [${severity}] ${warning.code}`);
    // Wrap message at ~60 chars
    const lines = warning.message.match(/.{1,58}/g) ?? [warning.message];
    for (const line of lines) {
      console.log(`║   ${line}`);
    }
    console.log("╟──────────────────────────────────────────────────────────────╢");
  }

  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log("");
}

// ============================================================================
// Main Sync Functions
// ============================================================================

/**
 * Full sync - imports all data from WA.
 *
 * Returns a SyncResult and writes a detailed JSON report to:
 *   /tmp/clubos/wa_full_sync_report.json
 */
export async function fullSync(): Promise<SyncResult> {
  const config = loadWAConfig();
  const dryRun = isDryRun();
  const startedAt = new Date();

  await log("INFO", "============================================================");
  await log("INFO", "  Wild Apricot Full Sync");
  await log("INFO", `  Started: ${startedAt.toISOString()}`);
  await log("INFO", `  Mode: ${dryRun ? "DRY RUN (no writes)" : "LIVE (writes enabled)"}`);
  await log("INFO", "============================================================");

  const ctx: SyncContext = {
    runId: generateRunId(),
    mode: "full",
    dryRun,
    startedAt,
    stats: {
      members: initStats(),
      events: initStats(),
      registrations: initStats(),
    },
    errors: [],
    membershipStatusMap: await loadMembershipStatusMap(),
    memberIdMap: await loadExistingMappings("Member"),
    eventIdMap: await loadExistingMappings("Event"),
    registrationDiagnostics: initRegistrationDiagnostics(),
    fetched: { contacts: 0, events: 0 },
    warnings: [],
  };

  const client = createWAClient();

  try {
    // Step 1: Sync members
    await log("INFO", "[1/3] Fetching contacts from WA...");
    const contacts = await client.fetchContacts();
    ctx.fetched.contacts = contacts.length;
    await log("INFO", `  - Received ${contacts.length} contacts`);
    await syncMembers(contacts, ctx);
    await log("INFO", `  - Members: ${ctx.stats.members.created} created, ${ctx.stats.members.updated} updated, ${ctx.stats.members.skipped} skipped`);

    // Step 2: Sync events
    await log("INFO", "[2/3] Fetching events from WA...");
    const events = await client.fetchEvents();
    ctx.fetched.events = events.length;
    await log("INFO", `  - Received ${events.length} events`);
    await syncEvents(events, client, ctx);
    await log("INFO", `  - Events: ${ctx.stats.events.created} created, ${ctx.stats.events.updated} updated, ${ctx.stats.events.skipped} skipped`);

    // Step 3: Sync registrations
    await log("INFO", "[3/3] Syncing registrations...");
    await syncRegistrations(events, client, ctx);
    await log("INFO", `  - Registrations: ${ctx.stats.registrations.created} created, ${ctx.stats.registrations.updated} updated, ${ctx.stats.registrations.skipped} skipped`);

    // Update sync state
    if (!dryRun) {
      await updateSyncState({
        lastFullSync: new Date(),
        lastContactSync: new Date(),
        lastEventSync: new Date(),
        lastRegSync: new Date(),
      });
    }
  } catch (error) {
    await log("ERROR", "Full sync failed", error);
    throw error;
  }

  const finishedAt = new Date();
  const durationMs = finishedAt.getTime() - startedAt.getTime();

  // Generate warnings for suspicious conditions
  generateWarnings(ctx);

  // Generate and write report
  const report = generateSyncReport(ctx, finishedAt, durationMs);
  let reportPath: string | null = null;
  try {
    reportPath = writeSyncReport(report);
    await log("INFO", `Report written to: ${reportPath}`);
  } catch (error) {
    await log("WARN", `Failed to write report: ${error instanceof Error ? error.message : error}`);
  }

  // Print warnings prominently
  printWarnings(ctx.warnings);

  await log("INFO", "============================================================");
  await log("INFO", "  Sync Complete");
  await log("INFO", "============================================================");
  await log("INFO", "");
  await log("INFO", "  FETCHED FROM WA:");
  await log("INFO", `    Contacts:      ${ctx.fetched.contacts}`);
  await log("INFO", `    Events:        ${ctx.fetched.events}`);
  await log("INFO", `    Registrations: ${ctx.registrationDiagnostics.registrationsFetchedTotal}`);
  await log("INFO", "");
  await log("INFO", "  RESULTS:");
  await log("INFO", `    Members:       ${ctx.stats.members.created} created, ${ctx.stats.members.updated} updated, ${ctx.stats.members.skipped} skipped`);
  await log("INFO", `    Events:        ${ctx.stats.events.created} created, ${ctx.stats.events.updated} updated, ${ctx.stats.events.skipped} skipped`);
  await log("INFO", `    Registrations: ${ctx.stats.registrations.created} created, ${ctx.stats.registrations.updated} updated, ${ctx.stats.registrations.skipped} skipped`);
  await log("INFO", "");
  await log("INFO", "  REGISTRATION DIAGNOSTICS:");
  await log("INFO", `    Events processed:           ${ctx.registrationDiagnostics.eventsProcessed}`);
  await log("INFO", `    Events skipped (unmapped):  ${ctx.registrationDiagnostics.eventsSkippedUnmapped}`);
  await log("INFO", `    Registrations fetched:      ${ctx.registrationDiagnostics.registrationsFetchedTotal}`);
  await log("INFO", `    Registrations upserted:     ${ctx.registrationDiagnostics.registrationsUpserted}`);
  await log("INFO", `    Skipped (missing member):   ${ctx.registrationDiagnostics.registrationsSkippedMissingMember}`);
  await log("INFO", `    Skipped (missing event):    ${ctx.registrationDiagnostics.registrationsSkippedMissingEvent}`);
  await log("INFO", `    Skipped (transform error):  ${ctx.registrationDiagnostics.registrationsSkippedTransformError}`);
  await log("INFO", "");
  await log("INFO", `  Duration:  ${Math.round(durationMs / 1000)}s`);
  await log("INFO", `  Errors:    ${ctx.errors.length}`);
  await log("INFO", `  Warnings:  ${ctx.warnings.length}`);
  if (reportPath) {
    await log("INFO", `  Report:    ${reportPath}`);
  }
  await log("INFO", "============================================================");

  return {
    success: ctx.errors.length === 0,
    mode: "full",
    startedAt,
    finishedAt,
    durationMs,
    stats: ctx.stats,
    errors: ctx.errors,
    registrationDiagnostics: ctx.registrationDiagnostics,
  };
}

/**
 * Incremental sync - imports only changed data since last sync.
 */
export async function incrementalSync(): Promise<SyncResult> {
  const config = loadWAConfig();
  const dryRun = isDryRun();
  const startedAt = new Date();
  const state = await getSyncState();

  await log("INFO", "============================================================");
  await log("INFO", "  Wild Apricot Incremental Sync");
  await log("INFO", `  Started: ${startedAt.toISOString()}`);
  await log("INFO", `  Last sync: ${state.lastIncSync?.toISOString() ?? "never"}`);
  await log("INFO", `  Mode: ${dryRun ? "DRY RUN (no writes)" : "LIVE (writes enabled)"}`);
  await log("INFO", "============================================================");

  const ctx: SyncContext = {
    runId: generateRunId(),
    mode: "incremental",
    dryRun,
    startedAt,
    stats: {
      members: initStats(),
      events: initStats(),
      registrations: initStats(),
    },
    errors: [],
    membershipStatusMap: await loadMembershipStatusMap(),
    memberIdMap: await loadExistingMappings("Member"),
    eventIdMap: await loadExistingMappings("Event"),
    registrationDiagnostics: initRegistrationDiagnostics(),
    fetched: { contacts: 0, events: 0 },
    warnings: [],
  };

  const client = createWAClient();

  try {
    // Step 1: Sync changed members
    const contactSince = state.lastContactSync ?? new Date(Date.now() - config.contactsLookbackDays * 24 * 60 * 60 * 1000);
    await log("INFO", `[1/3] Fetching contacts modified since ${contactSince.toISOString()}...`);
    const contacts = await client.fetchContactsModifiedSince(contactSince);
    ctx.fetched.contacts = contacts.length;
    await log("INFO", `  - Found ${contacts.length} changed contacts`);
    await syncMembers(contacts, ctx);
    await log("INFO", `  - Members: ${ctx.stats.members.created} created, ${ctx.stats.members.updated} updated`);

    // Step 2: Sync recent events
    const eventsSince = new Date(Date.now() - config.eventsLookbackDays * 24 * 60 * 60 * 1000);
    await log("INFO", `[2/3] Fetching events from ${eventsSince.toISOString()}...`);
    const events = await client.fetchEventsFromDate(eventsSince);
    ctx.fetched.events = events.length;
    await log("INFO", `  - Found ${events.length} events`);
    await syncEvents(events, client, ctx);
    await log("INFO", `  - Events: ${ctx.stats.events.created} created, ${ctx.stats.events.updated} updated`);

    // Step 3: Sync registrations for recent events
    await log("INFO", "[3/3] Syncing registrations for recent events...");
    await syncRegistrations(events, client, ctx);
    await log("INFO", `  - Registrations: ${ctx.stats.registrations.created} created, ${ctx.stats.registrations.updated} updated`);

    // Update sync state
    if (!dryRun) {
      await updateSyncState({
        lastIncSync: new Date(),
        lastContactSync: new Date(),
        lastEventSync: new Date(),
        lastRegSync: new Date(),
      });
    }
  } catch (error) {
    await log("ERROR", "Incremental sync failed", error);
    throw error;
  }

  const finishedAt = new Date();
  const durationMs = finishedAt.getTime() - startedAt.getTime();

  // Generate warnings (incremental doesn't use suspicious count thresholds)
  const diag = ctx.registrationDiagnostics;
  if (diag.registrationsFetchedTotal > 0 && diag.registrationsUpserted === 0) {
    const topReasons = Array.from(diag.skipReasons.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([reason, count]) => `${reason}: ${count}`)
      .join("; ");

    ctx.warnings.push({
      code: "ZERO_REGISTRATIONS_UPSERTED",
      message: `Fetched ${diag.registrationsFetchedTotal} registrations but upserted 0. Top skip reasons: ${topReasons || "unknown"}`,
      severity: "high",
    });
  }

  // Print warnings prominently
  printWarnings(ctx.warnings);

  await log("INFO", "============================================================");
  await log("INFO", "  Sync Complete");
  await log("INFO", `  Duration: ${Math.round(durationMs / 1000)}s`);
  await log("INFO", `  Members: ${ctx.stats.members.created + ctx.stats.members.updated} processed`);
  await log("INFO", `  Events: ${ctx.stats.events.created + ctx.stats.events.updated} processed`);
  await log("INFO", `  Registrations: ${ctx.stats.registrations.created + ctx.stats.registrations.updated} processed`);
  await log("INFO", `  Errors: ${ctx.errors.length}`);
  await log("INFO", `  Warnings: ${ctx.warnings.length}`);
  await log("INFO", "============================================================");

  return {
    success: ctx.errors.length === 0,
    mode: "incremental",
    startedAt,
    finishedAt,
    durationMs,
    stats: ctx.stats,
    errors: ctx.errors,
    registrationDiagnostics: ctx.registrationDiagnostics,
  };
}

// ============================================================================
// Probe Functions (Targeted Diagnostics)
// ============================================================================

export interface ProbeResult {
  eventId: number;
  eventFound: boolean;
  eventMapped: boolean;
  clubosEventId: string | null;
  registrationsFromWA: number;
  registrations: Array<{
    waRegistrationId: number;
    waContactId: number;
    contactName: string;
    contactEmail: string | null;
    status: string;
    memberMapped: boolean;
    clubosMemberId: string | null;
    wouldSkip: boolean;
    skipReason: string | null;
  }>;
  summary: {
    wouldImport: number;
    wouldSkipMissingMember: number;
    wouldSkipTransformError: number;
  };
}

/**
 * Probe a specific event's registrations for debugging.
 * This fetches registrations from WA and reports what would happen
 * during import without actually writing anything.
 */
export async function probeEventRegistrations(waEventId: number): Promise<ProbeResult> {
  const client = createWAClient();

  // Load existing mappings
  const memberIdMap = await loadExistingMappings("Member");
  const eventIdMap = await loadExistingMappings("Event");

  const result: ProbeResult = {
    eventId: waEventId,
    eventFound: false,
    eventMapped: eventIdMap.has(waEventId),
    clubosEventId: eventIdMap.get(waEventId) ?? null,
    registrationsFromWA: 0,
    registrations: [],
    summary: {
      wouldImport: 0,
      wouldSkipMissingMember: 0,
      wouldSkipTransformError: 0,
    },
  };

  try {
    // Fetch the event to verify it exists
    const events = await client.fetchEventsFromDate(new Date(0)); // Fetch all
    const event = events.find(e => e.Id === waEventId);
    result.eventFound = !!event;

    if (!event) {
      console.log(`[PROBE] Event ${waEventId} not found in WA`);
      return result;
    }

    console.log(`[PROBE] Event found: ${event.Name}`);
    console.log(`[PROBE] Event mapped to ClubOS: ${result.eventMapped ? result.clubosEventId : 'NO'}`);

    // Fetch registrations
    const registrations = await client.fetchEventRegistrations(waEventId);
    result.registrationsFromWA = registrations.length;
    console.log(`[PROBE] Fetched ${registrations.length} registrations from WA`);

    // Log first 3 raw registrations
    for (let i = 0; i < Math.min(3, registrations.length); i++) {
      const reg = registrations[i];
      console.log(`[PROBE] Sample registration ${i + 1}:`, JSON.stringify({
        Id: reg.Id,
        Contact: { Id: reg.Contact.Id, Name: reg.Contact.Name, Email: reg.Contact.Email },
        Status: reg.Status,
        RegistrationDate: reg.RegistrationDate,
      }, null, 2));
    }

    // Analyze each registration
    for (const reg of registrations) {
      const memberId = memberIdMap.get(reg.Contact.Id);
      const memberMapped = !!memberId;

      let wouldSkip = false;
      let skipReason: string | null = null;

      if (!memberMapped) {
        wouldSkip = true;
        skipReason = `Member not mapped (WA contact ${reg.Contact.Id})`;
        result.summary.wouldSkipMissingMember++;
      } else if (!result.eventMapped) {
        wouldSkip = true;
        skipReason = `Event not mapped (WA event ${waEventId})`;
      } else {
        // Try transform
        const transformResult = transformRegistration(reg, result.clubosEventId!, memberId!);
        if (!transformResult.success) {
          wouldSkip = true;
          skipReason = `Transform error: ${transformResult.error}`;
          result.summary.wouldSkipTransformError++;
        } else {
          result.summary.wouldImport++;
        }
      }

      result.registrations.push({
        waRegistrationId: reg.Id,
        waContactId: reg.Contact.Id,
        contactName: reg.Contact.Name,
        contactEmail: reg.Contact.Email,
        status: reg.Status,
        memberMapped,
        clubosMemberId: memberId ?? null,
        wouldSkip,
        skipReason,
      });
    }

    console.log(`[PROBE] Summary:`);
    console.log(`  - Would import: ${result.summary.wouldImport}`);
    console.log(`  - Would skip (missing member): ${result.summary.wouldSkipMissingMember}`);
    console.log(`  - Would skip (transform error): ${result.summary.wouldSkipTransformError}`);

  } catch (error) {
    console.error(`[PROBE] Error probing event ${waEventId}:`, error);
    throw error;
  }

  return result;
}
