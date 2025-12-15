import { NextRequest, NextResponse } from "next/server";
import { requireVPOrAdmin } from "@/lib/eventAuth";

export async function GET(req: NextRequest) {
  const auth = await requireVPOrAdmin(req);
  if (!auth.ok) return auth.response;

  return NextResponse.json(
    { error: "Not Implemented", message: "TicketType model pending PR #78", ticketTypes: [] },
    { status: 501 }
  );
}
