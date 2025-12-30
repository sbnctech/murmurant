/**
 * GET /api/v1/me/recommended-events
 *
 * Returns events the member might like based on their registration history.
 * Uses category matching: finds events in categories the member has
 * previously registered for.
 *
 * Response: { events: RecommendedEvent[], basedOn: string[] }
 *
 * Charter: P1 (identity required), P2 (member can see own recommendations)
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { NextRequest } from "next/server";
import { apiSuccess, errors } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RecommendedEvent {
  id: string;
  title: string;
  category: string | null;
  startTime: string;
  location: string | null;
  spotsRemaining: number | null;
}

export async function GET(request: NextRequest) {
  // Require authentication
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const memberId = auth.context.memberId;

  try {
    // Get categories from member's past registrations
    const pastRegistrations = await prisma.eventRegistration.findMany({
      where: {
        memberId,
        status: { in: ["CONFIRMED", "PENDING", "PENDING_PAYMENT"] },
      },
      include: {
        event: {
          select: { category: true },
        },
      },
    });

    // Extract unique categories
    const memberCategories = [
      ...new Set(
        pastRegistrations
          .map((r) => r.event.category)
          .filter((c): c is string => c !== null)
      ),
    ];

    // Get current registrations to exclude
    const currentRegistrationEventIds = pastRegistrations.map((r) => r.eventId);

    // Find upcoming events in member's categories that they haven't registered for
    const recommendedEvents = await prisma.event.findMany({
      where: {
        isPublished: true,
        startTime: { gte: new Date() },
        category: { in: memberCategories.length > 0 ? memberCategories : undefined },
        id: { notIn: currentRegistrationEventIds },
      },
      orderBy: { startTime: "asc" },
      take: 6,
      include: {
        _count: {
          select: {
            registrations: {
              where: {
                status: { in: ["CONFIRMED", "PENDING", "PENDING_PAYMENT"] },
              },
            },
          },
        },
      },
    });

    // If no category-based recommendations, get upcoming events
    let events = recommendedEvents;
    if (events.length === 0) {
      events = await prisma.event.findMany({
        where: {
          isPublished: true,
          startTime: { gte: new Date() },
          id: { notIn: currentRegistrationEventIds },
        },
        orderBy: { startTime: "asc" },
        take: 6,
        include: {
          _count: {
            select: {
              registrations: {
                where: {
                  status: { in: ["CONFIRMED", "PENDING", "PENDING_PAYMENT"] },
                },
              },
            },
          },
        },
      });
    }

    // Transform to response shape
    const recommendations: RecommendedEvent[] = events.map((event) => {
      const registeredCount = event._count.registrations;
      const hasCapacity = event.capacity !== null;
      const spotsRemaining = hasCapacity
        ? Math.max(0, (event.capacity ?? 0) - registeredCount)
        : null;

      return {
        id: event.id,
        title: event.title,
        category: event.category,
        startTime: event.startTime.toISOString(),
        location: event.location,
        spotsRemaining,
      };
    });

    return apiSuccess({
      events: recommendations,
      basedOn: memberCategories,
    });
  } catch (error) {
    console.error("Error fetching recommended events:", error);
    return errors.internal("Failed to fetch recommendations");
  }
}
