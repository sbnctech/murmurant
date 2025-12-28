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
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Always return success to prevent email enumeration
    await authService.requestPasswordReset(email);

    return NextResponse.json({
      message: "If an account exists with this email, a reset link has been sent",
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    // Return success even on error to prevent enumeration
    return NextResponse.json({
      message: "If an account exists with this email, a reset link has been sent",
    });
  }
}
