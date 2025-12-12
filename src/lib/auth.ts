import { NextRequest, NextResponse } from "next/server";

/**
 * Authentication and authorization utilities for API routes.
 *
 * For v1, we use a simplified approach:
 * - Check for Authorization header with Bearer token
 * - In development, allow bypass with specific test tokens
 * - Production will integrate with actual JWT/session validation
 *
 * TEMPORARY DEV TOKENS (intentionally simple until real auth arrives):
 *   - "test-admin-token" or "admin-dev" -> admin role
 *   - "vp-dev" -> admin role (VP Activities treated as admin)
 *   - "chair-dev" -> member role (Event Chair)
 *   - "test-member-token" or "member-dev" -> member role
 *   - "test-admin-{memberId}" -> admin with custom memberId
 *   - "test-member-{memberId}" -> member with custom memberId
 *   - Any other token -> invalid (401)
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
 * Extract Bearer token from Authorization header.
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
 * Validates the request has a valid authentication token.
 * Returns 401 if missing/invalid token.
 */
export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  const token = parseBearerToken(req);

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unauthorized", message: "Missing or invalid authorization header" },
        { status: 401 }
      ),
    };
  }

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
 *
 * TEMPORARY DEV TOKENS (intentionally simple until real auth arrives):
 *   - "test-admin-token" or "admin-dev" -> admin role
 *   - "vp-dev" -> admin role (VP Activities treated as admin for now)
 *   - "chair-dev" -> member role (Event Chair)
 *   - "test-member-token" or "member-dev" -> member role
 *   - "test-admin-{memberId}" -> admin with custom memberId
 *   - "test-member-{memberId}" -> member with custom memberId
 *
 * In production, this would be replaced with JWT validation.
 */
function parseTestToken(token: string): AuthContext | null {
  // Test admin token with custom memberId
  if (token.startsWith("test-admin-")) {
    const memberId = token.slice(11) || "test-admin-id";
    return {
      memberId,
      email: "admin@test.com",
      globalRole: "admin",
    };
  }

  // Test member token with custom memberId
  if (token.startsWith("test-member-")) {
    const memberId = token.slice(12) || "test-member-id";
    return {
      memberId,
      email: "member@test.com",
      globalRole: "member",
    };
  }

  // Static dev tokens for common roles
  // Admin tokens
  if (
    token === "test-admin-token" ||
    token === "admin-dev" ||
    token === "admin-token" ||
    token === "test-admin"
  ) {
    return {
      memberId: "test-admin-id",
      email: "admin@test.com",
      globalRole: "admin",
    };
  }

  // VP Activities (treated as admin for endpoint access)
  if (token === "vp-dev") {
    return {
      memberId: "test-vp-id",
      email: "vp@test.com",
      globalRole: "admin",
    };
  }

  // Event Chair (member-level access, but can manage their events)
  if (token === "chair-dev") {
    return {
      memberId: "test-chair-id",
      email: "chair@test.com",
      globalRole: "member",
    };
  }

  // Member tokens
  if (
    token === "test-member-token" ||
    token === "member-dev" ||
    token === "member-token" ||
    token === "test-member"
  ) {
    return {
      memberId: "test-member-id",
      email: "member@test.com",
      globalRole: "member",
    };
  }

  return null;
}
