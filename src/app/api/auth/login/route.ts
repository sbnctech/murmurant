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
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const session = await authService.login({ email, password });

    return NextResponse.json({
      token: session.token,
      expiresAt: session.expiresAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid credentials") {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
