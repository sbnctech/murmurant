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
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    await authService.resetPassword(token, password);

    return NextResponse.json({
      message: "Password has been reset successfully",
    });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "Invalid or expired token" ||
        error.message === "Token has already been used"
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "An error occurred resetting password" },
      { status: 500 }
    );
  }
}
