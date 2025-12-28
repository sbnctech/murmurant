import { NextRequest, NextResponse } from "next/server";
import { NativeAuthService } from "@/services/auth";
import { isFeatureEnabled } from "@/lib/features";

const authService = new NativeAuthService();

export async function GET(request: NextRequest) {
  if (!isFeatureEnabled("native-auth")) {
    return NextResponse.json(
      { error: "Native auth is not enabled" },
      { status: 503 }
    );
  }

  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const session = await authService.verifySession(token);

    if (!session) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const user = await authService.getUserById(session.userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        memberId: user.memberId,
      },
      session: {
        id: session.id,
        expiresAt: session.expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Session validation error:", error);
    return NextResponse.json(
      { error: "An error occurred validating session" },
      { status: 500 }
    );
  }
}
