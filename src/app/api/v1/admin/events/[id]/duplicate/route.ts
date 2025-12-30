/**
 * POST /api/v1/admin/events/:id/duplicate
 *
 * Creates a copy of an existing event with safeguards.
 *
 * Cloning Rules (from EVENT_LIFECYCLE_DESIGN.md):
 * - Clone starts as DRAFT (must go through approval workflow)
 * - Clone has NO dates (startTime/endTime cleared - forces user to set them)
 * - Clone has NO chair (eventChairId cleared - forces assignment)
 * - Clone preserves: title (with suffix), description, category, location, ticket tiers
 * - Clone preserves: HANDOFF and LESSON notes (institutional memory)
 * - Clone does NOT preserve: registrations, PLANNING/VENUE/WRAP_UP notes
 * - clonedFromId tracks lineage
 *
 * Request body: { title?: string, includeTicketTiers?: boolean }
 * Response: ClonedEventResponse (201 Created)
 *
 * Charter: P2 (events:edit required), P3 (explicit state - DRAFT), P7 (audit logged)
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { NextRequest } from "next/server";
import { apiCreated, errors } from "@/lib/api";
import { requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EventStatus, EventNoteType } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface CloneRequest {
  title?: string;
  includeTicketTiers?: boolean;
  includeNotes?: boolean; // Include LESSON and HANDOFF notes
}

interface ClonedEventResponse {
  id: string;
  title: string;
  status: EventStatus;
  clonedFromId: string;
  clonedAt: string;
  warnings: string[];
  copiedItems: {
    ticketTiers: number;
    notes: number;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  // Require events:edit capability
  const auth = await requireCapability(request, "events:edit");
  if (!auth.ok) return auth.response;

  try {
    // 1. Fetch source event with related data
    const sourceEvent = await prisma.event.findUnique({
      where: { id },
      include: {
        ticketTiers: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
        notes: {
          where: {
            noteType: { in: [EventNoteType.LESSON, EventNoteType.HANDOFF] },
          },
        },
      },
    });

    if (!sourceEvent) {
      return errors.notFound("Event", id);
    }

    // 2. Parse request body
    let body: CloneRequest = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      // Empty body is OK, use defaults
    }

    const {
      title = `${sourceEvent.title} (Copy)`,
      includeTicketTiers = true,
      includeNotes = true,
    } = body;

    // 3. Create the cloned event
    const warnings: string[] = [];
    const now = new Date();

    // Warn about what's NOT copied
    warnings.push("Dates cleared - you must set startTime and endTime");
    warnings.push("Event chair cleared - you must assign a chair");
    warnings.push("All registrations are NOT copied");
    if (sourceEvent.notes.length > 0 && includeNotes) {
      warnings.push(
        `${sourceEvent.notes.length} institutional notes (LESSON/HANDOFF) will be copied`
      );
    }

    // Use transaction for atomicity
    const clonedEvent = await prisma.$transaction(async (tx) => {
      // Create the new event
      const newEvent = await tx.event.create({
        data: {
          // Content fields - copied
          title,
          description: sourceEvent.description,
          category: sourceEvent.category,
          location: sourceEvent.location,
          committeeId: sourceEvent.committeeId,

          // Dates - NOT copied (safeguard: force user to set them)
          startTime: new Date(0), // Placeholder - UI must require setting
          endTime: null,

          // Status - always DRAFT (safeguard: must go through approval)
          status: EventStatus.DRAFT,
          isPublished: false,

          // Chair - NOT copied (safeguard: force assignment)
          eventChairId: null,

          // Capacity - deprecated, not copied
          capacity: null,

          // Clone tracking
          clonedFromId: id,
          clonedAt: now,

          // Approval fields - cleared
          submittedAt: null,
          submittedById: null,
          approvedAt: null,
          approvedById: null,
          approvalNotes: null,
          rejectionNotes: null,
          publishAt: null,
          registrationDeadline: null,
        },
      });

      // Copy ticket tiers if requested
      let ticketTierCount = 0;
      if (includeTicketTiers && sourceEvent.ticketTiers.length > 0) {
        await tx.ticketTier.createMany({
          data: sourceEvent.ticketTiers.map((tier) => ({
            eventId: newEvent.id,
            name: tier.name,
            description: tier.description,
            priceCents: tier.priceCents,
            quantity: tier.quantity,
            sortOrder: tier.sortOrder,
            isActive: true,
            salesStartAt: null, // Clear dates
            salesEndAt: null,
          })),
        });
        ticketTierCount = sourceEvent.ticketTiers.length;
      }

      // Copy LESSON and HANDOFF notes if requested
      let noteCount = 0;
      if (includeNotes && sourceEvent.notes.length > 0) {
        await tx.eventNote.createMany({
          data: sourceEvent.notes.map((note) => ({
            eventId: newEvent.id,
            authorId: note.authorId,
            noteType: note.noteType,
            content: note.content,
            isPrivate: note.isPrivate,
          })),
        });
        noteCount = sourceEvent.notes.length;
      }

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          action: "CREATE", // EVENT_CLONED would be better, but using existing enum
          resourceType: "event",
          resourceId: newEvent.id,
          memberId: auth.context.memberId,
          metadata: {
            action: "EVENT_CLONED",
            sourceEventId: id,
            sourceEventTitle: sourceEvent.title,
            copiedTicketTiers: ticketTierCount,
            copiedNotes: noteCount,
          },
        },
      });

      return { event: newEvent, ticketTierCount, noteCount };
    });

    // 4. Return response
    const response: ClonedEventResponse = {
      id: clonedEvent.event.id,
      title: clonedEvent.event.title,
      status: clonedEvent.event.status,
      clonedFromId: id,
      clonedAt: now.toISOString(),
      warnings,
      copiedItems: {
        ticketTiers: clonedEvent.ticketTierCount,
        notes: clonedEvent.noteCount,
      },
    };

    return apiCreated(response);
  } catch (error) {
    console.error("Error cloning event:", error);
    return errors.internal("Failed to clone event");
  }
}
