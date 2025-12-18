/**
 * Current User API
 *
 * GET /api/auth/me
 *
 * Returns information about the currently authenticated user
 * including their roles and capabilities.
 *
 * Returns 401 if not authenticated.
 *
 * Charter Compliance:
 * - P1: Identity is provable via session
 * - P2: Returns only what the user is entitled to see
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getRoleCapabilities, type GlobalRole, type Capability } from "@/lib/auth";

interface UserInfo {
  id: string;
  email: string;
  memberId: string;
  firstName: string;
  lastName: string;
  globalRole: GlobalRole;
  capabilities: Capability[];
  sessionCreatedAt: string;
  sessionExpiresAt: string;
}

export async function GET(req: NextRequest) {
  try {
    // Get current session
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get user details from database
    const userAccount = await prisma.userAccount.findUnique({
      where: { id: session.userAccountId },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!userAccount) {
      return NextResponse.json(
        { error: "Not Found", message: "User account not found" },
        { status: 404 }
      );
    }

    // Get capabilities for the user's role
    const globalRole = session.globalRole as GlobalRole;
    const capabilities = getRoleCapabilities(globalRole);

    const userInfo: UserInfo = {
      id: userAccount.id,
      email: userAccount.email,
      memberId: userAccount.member.id,
      firstName: userAccount.member.firstName,
      lastName: userAccount.member.lastName,
      globalRole,
      capabilities,
      sessionCreatedAt: session.createdAt.toISOString(),
      sessionExpiresAt: session.expiresAt.toISOString(),
    };

    return NextResponse.json(userInfo);
  } catch (error) {
    console.error("[AUTH] Error in /me:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to get user info" },
      { status: 500 }
    );
  }
}
