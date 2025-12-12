import { NextRequest, NextResponse } from "next/server";

type MockSmsRequest = {
  to: string;
  body?: string;
};

type MockSmsResult = {
  messageId: string;
};

let smsCounter = 0;

async function mockSmsSend(input: MockSmsRequest): Promise<MockSmsResult> {
  const messageId = `mock-sms-${Date.now()}-${smsCounter++}`;
  console.log("[mock-sms] sent", { ...input, messageId });
  return { messageId };
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const to =
    typeof body.to === "string" && body.to.length > 0
      ? body.to
      : "test@example.com";

  const smsBody =
    typeof body.body === "string" ? body.body : "This is a test SMS placeholder body.";

  const { messageId } = await mockSmsSend({
    to,
    body: smsBody,
  });

  return NextResponse.json({
    ok: true,
    to,
    messageId,
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "SMS test endpoint is alive",
  });
}
