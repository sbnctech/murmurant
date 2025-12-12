import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // If the body is not JSON, fall back to an empty object.
    body = {};
  }

  const to =
    typeof body.to === "string" && body.to.length > 0
      ? body.to
      : "test@example.com";

  const subject =
    typeof body.subject === "string" ? body.subject : "Test email from ClubOS";
  const text =
    typeof body.body === "string" ? body.body : "This is a test email placeholder body.";

  const { messageId } = await sendEmail({
    to,
    subject,
    text,
  });

  return NextResponse.json({
    ok: true,
    to,
    messageId,
  });
}

export async function GET() {
  // Stubbed for now; we will wire real EmailMessageLog queries later.
  return NextResponse.json({ emails: [] });
}
