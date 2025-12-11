import { NextResponse } from "next/server";

export async function GET() {
  const registrations = [
    {
      id: "r1",
      memberId: "m1",
      eventId: "e1",
      status: "REGISTERED",
    },
    {
      id: "r2",
      memberId: "m2",
      eventId: "e2",
      status: "WAITLISTED",
    },
  ];

  return NextResponse.json({ registrations });
}
