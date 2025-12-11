import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const to = body.to ?? "recipient@example.com";

  const result = await sendEmail({
    to,
    subject: "ClubOS test email",
    text: "This is a mock test email from ClubOS.",
  });

  return NextResponse.json({
    ok: true,
    to,
    messageId: result.messageId,
  });
}
