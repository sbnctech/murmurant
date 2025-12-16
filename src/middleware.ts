import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * DEVELOPMENT-ONLY SESSION COOKIE MIDDLEWARE
 *
 * In development mode, this middleware sets a dev session cookie for browser
 * requests to admin routes. This enables:
 * - E2E tests to work without manual login
 * - Local development without auth setup
 *
 * IMPORTANT: This is ONLY active when NODE_ENV !== "production".
 * In production, users must authenticate via the login flow.
 *
 * Charter P2: Default deny - production has no bypass.
 * Charter P7: No hidden rules - dev-only behavior clearly documented.
 * Charter P9: Fail closed - missing this middleware in prod = secure.
 */

const DEV_SESSION_COOKIE_NAME = "clubos_dev_session";
const DEV_SESSION_VALUE = "test-admin-token"; // Matches parseTestToken in auth.ts

/**
 * Paths that should get the dev session cookie.
 * Only admin routes need the cookie for client-side API calls.
 */
const ADMIN_PATHS = [
  "/admin",
  "/api/admin",
  "/api/v1/admin",
];

function isAdminPath(pathname: string): boolean {
  return ADMIN_PATHS.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  // Only set dev cookie in development mode
  if (process.env.NODE_ENV === "production") {
    return NextResponse.next();
  }

  // Only for admin routes
  if (!isAdminPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // Check if cookie already exists
  const existingCookie = request.cookies.get(DEV_SESSION_COOKIE_NAME);
  if (existingCookie) {
    return NextResponse.next();
  }

  // Set the dev session cookie for browser requests
  const response = NextResponse.next();
  response.cookies.set({
    name: DEV_SESSION_COOKIE_NAME,
    value: DEV_SESSION_VALUE,
    path: "/",
    httpOnly: true,
    secure: false, // localhost doesn't use HTTPS
    sameSite: "lax",
    // Don't set maxAge for session cookie - expires when browser closes
  });

  return response;
}

/**
 * Configure which paths the middleware runs on.
 * Running on admin paths only for performance.
 */
export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/v1/admin/:path*",
  ],
};
