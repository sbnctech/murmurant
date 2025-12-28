import { NextRequest, NextResponse } from "next/server";
import { NativeAuthService } from "@/services/auth";
import { isFeatureEnabled } from "@/lib/features";

const authService = new NativeAuthService();

export async function POST(request: NextRequest) {
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
    const newSession = await authService.refreshSession(token);

    return NextResponse.json({
      token: newSession.token,
      expiresAt: newSession.expiresAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Session not found") {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: "An error occurred refreshing token" },
      { status: 500 }
    );
  }
}
