/**
 * Authentication and Authorization Helpers
 *
 * Provides simple header-based auth for dev environment.
 * Uses Bearer tokens stored in UserAccount.apiToken field.
 *
 * Usage:
 *   Authorization: Bearer <token>
 *
 * Error responses:
 *   401 - Missing or invalid token
 *   403 - Valid token but insufficient permissions
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export type AuthUser = {
  userId: string;
  memberId: string;
  email: string;
  role: UserRole;
};

export type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; response: NextResponse };

/**
 * Extract Bearer token from Authorization header
 */
export function parseBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return null;
  }

  return parts[1];
}

/**
 * Create a 401 Unauthorized response
 */
export function unauthorized(message = "Authentication required"): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "UNAUTHORIZED",
        message,
      },
    },
    { status: 401 }
  );
}

/**
 * Create a 403 Forbidden response
 */
export function forbidden(message = "Insufficient permissions"): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "FORBIDDEN",
        message,
      },
    },
    { status: 403 }
  );
}

/**
 * Require authentication - returns user info or 401 response
 *
 * Usage:
 *   const auth = await requireAuth(req);
 *   if (!auth.ok) return auth.response;
 *   const { user } = auth;
 */
export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  const token = parseBearerToken(req);

  if (!token) {
    return { ok: false, response: unauthorized("Missing Authorization header") };
  }

  const userAccount = await prisma.userAccount.findUnique({
    where: { apiToken: token },
    select: {
      id: true,
      memberId: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  if (!userAccount) {
    return { ok: false, response: unauthorized("Invalid token") };
  }

  if (!userAccount.isActive) {
    return { ok: false, response: unauthorized("Account is disabled") };
  }

  return {
    ok: true,
    user: {
      userId: userAccount.id,
      memberId: userAccount.memberId,
      email: userAccount.email,
      role: userAccount.role,
    },
  };
}

/**
 * Require admin role - returns user info or 401/403 response
 *
 * Usage:
 *   const auth = await requireAdmin(req);
 *   if (!auth.ok) return auth.response;
 *   const { user } = auth;
 */
export async function requireAdmin(req: NextRequest): Promise<AuthResult> {
  const auth = await requireAuth(req);

  if (!auth.ok) {
    return auth;
  }

  if (auth.user.role !== UserRole.ADMIN) {
    return { ok: false, response: forbidden("Admin access required") };
  }

  return auth;
}
