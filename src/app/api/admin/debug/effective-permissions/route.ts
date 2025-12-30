// Copyright © 2025 Murmurant, Inc.
// Debug endpoint for webmaster support - view effective permissions for a user
//
// CONSTRAINTS:
// - Only available when WEBMASTER_SUPPORT_DEBUG=1 env var is set
// - Requires publishing:manage capability (webmaster has this)
// - Read-only: returns only capability booleans and role name
// - Requires explicit email parameter - no browsing user list
// - NEVER returns finance-related data

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireCapability,
  hasCapability,
  GlobalRole,
} from "@/lib/auth";

/**
 * GET /api/admin/debug/effective-permissions?email=user@example.com
 *
 * Returns computed capability booleans for the specified user.
 * Only available when WEBMASTER_SUPPORT_DEBUG=1 is set.
 */
export async function GET(req: NextRequest) {
  // Check debug mode is enabled
  if (process.env.WEBMASTER_SUPPORT_DEBUG !== "1") {
    return NextResponse.json(
      { error: "Not Found" },
      { status: 404 }
    );
  }

  // Require publishing:manage capability (webmaster has this)
  const auth = await requireCapability(req, "publishing:manage");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email || typeof email !== "string") {
    return NextResponse.json(
      { error: "Bad Request", message: "email query parameter is required" },
      { status: 400 }
    );
  }

  // Look up member by email
  const member = await prisma.member.findUnique({
    where: { email },
    include: {
      membershipStatus: true,
      roleAssignments: {
        where: {
          OR: [
            { endDate: null },
            { endDate: { gte: new Date() } },
          ],
        },
        include: {
          committeeRole: true,
        },
      },
    },
  });

  if (!member) {
    return NextResponse.json(
      { error: "Not Found", message: "No member found with that email" },
      { status: 404 }
    );
  }

  // Extract role slugs from active role assignments
  const roleSlugs = member.roleAssignments.map(
    (ra) => ra.committeeRole.slug
  );

  // Determine effective GlobalRole based on committee role slugs
  // This maps committee roles to our capability system
  const effectiveGlobalRole = determineGlobalRole(roleSlugs);

  // Compute capabilities (excluding finance-related ones for security)
  const capabilities: Record<string, boolean> = {
    "publishing:manage": hasCapability(effectiveGlobalRole, "publishing:manage"),
    "comms:manage": hasCapability(effectiveGlobalRole, "comms:manage"),
    "members:view": hasCapability(effectiveGlobalRole, "members:view"),
    "registrations:view": hasCapability(effectiveGlobalRole, "registrations:view"),
    "exports:access": hasCapability(effectiveGlobalRole, "exports:access"),
    "users:manage": hasCapability(effectiveGlobalRole, "users:manage"),
    "admin:full": hasCapability(effectiveGlobalRole, "admin:full"),
    // NOTE: Intentionally NOT including finance:view or finance:manage
  };

  return NextResponse.json({
    email: member.email,
    membershipStatus: member.membershipStatus.code,
    effectiveRole: effectiveGlobalRole,
    roleSlugs,
    capabilities,
    // Explicit note that finance capabilities are hidden
    _note: "Finance capabilities are intentionally hidden from this endpoint",
  });
}

/**
 * Maps committee role slugs to a GlobalRole for capability checking.
 * This is a simplified mapping - in production this would be more sophisticated.
 */
function determineGlobalRole(roleSlugs: string[]): GlobalRole {
  // Check for full admin roles first
  if (roleSlugs.includes("president") || roleSlugs.includes("board-member")) {
    return "admin";
  }

  // Check for webmaster
  if (roleSlugs.includes("webmaster")) {
    return "webmaster";
  }

  // Check for VP activities
  if (roleSlugs.includes("vp-activities")) {
    return "vp-activities";
  }

  // Check for event chair
  if (roleSlugs.includes("event-chair")) {
    return "event-chair";
  }

  // Default to member
  return "member";
}
