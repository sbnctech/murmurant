import { NextRequest, NextResponse } from "next/server";

/**
 * Authentication and authorization utilities for API routes.
 *
 * For v1, we use a simplified approach:
 * - Check for Authorization header with Bearer token
 * - In development, allow bypass with specific test tokens
 * - Production will integrate with actual JWT/session validation
 */

export type AuthContext = {
  memberId: string;
  email: string;
  globalRole: "admin" | "member";
};

export type AuthResult =
  | { ok: true; context: AuthContext }
  | { ok: false; response: NextResponse };

/**
 * Validates the request has a valid authentication token.
 * Returns 401 if missing/invalid token.
 */
export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unauthorized", message: "Missing or invalid authorization header" },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix

  // For development/testing, accept specific test tokens
  // In production, this would validate JWT or session
  const context = parseTestToken(token);
  if (!context) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unauthorized", message: "Invalid or expired token" },
        { status: 401 }
      ),
    };
  }

  return { ok: true, context };
}

/**
 * Validates the authenticated user has admin role.
 * Returns 403 if not an admin.
 */
export async function requireAdmin(req: NextRequest): Promise<AuthResult> {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return authResult;
  }

  if (authResult.context.globalRole !== "admin") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Forbidden", message: "Admin access required" },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

/**
 * Validates the authenticated user has one of the required roles.
 */
export async function requireRole(
  req: NextRequest,
  roles: Array<"admin" | "member">
): Promise<AuthResult> {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return authResult;
  }

  if (!roles.includes(authResult.context.globalRole)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Forbidden", message: `Required role: ${roles.join(" or ")}` },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

/**
 * Parse test tokens for development/testing.
 * Format: "test-admin-{memberId}" or "test-member-{memberId}"
 *
 * In production, this would be replaced with JWT validation.
 */
function parseTestToken(token: string): AuthContext | null {
  // Test admin token
  if (token.startsWith("test-admin-")) {
    const memberId = token.slice(11) || "test-admin-id";
    return {
      memberId,
      email: "admin@test.com",
      globalRole: "admin",
    };
  }

  // Test member token
  if (token.startsWith("test-member-")) {
    const memberId = token.slice(12) || "test-member-id";
    return {
      memberId,
      email: "member@test.com",
      globalRole: "member",
    };
  }

  // Legacy simple tokens for backward compatibility with existing tests
  if (token === "admin-token" || token === "test-admin") {
    return {
      memberId: "test-admin-id",
      email: "admin@test.com",
      globalRole: "admin",
    };
  }

  if (token === "member-token" || token === "test-member") {
    return {
      memberId: "test-member-id",
      email: "member@test.com",
      globalRole: "member",
    };
  }

  return null;
}
