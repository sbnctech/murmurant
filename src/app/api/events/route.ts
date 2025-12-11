import { NextResponse } from "next/server";

export async function GET() {
  const events = [
    {
      id: "e1",
      title: "Welcome Hike",
      category: "Outdoors",
      startTime: "2025-06-01T09:00:00Z",
    },
    {
      id: "e2",
      title: "Wine Mixer",
      category: "Social",
      startTime: "2025-06-05T18:00:00Z",
    },
  ];

  return NextResponse.json({ events });
}
