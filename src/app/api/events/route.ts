import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const dbEvents = await prisma.event.findMany({
    where: {
      isPublished: true,
    },
    select: {
      id: true,
      title: true,
      category: true,
      startTime: true,
    },
    orderBy: {
      startTime: "asc",
    },
  });

  const events = dbEvents.map((e) => ({
    id: e.id,
    title: e.title,
    category: e.category ?? "",
    startTime: e.startTime.toISOString(),
  }));

  return NextResponse.json({ events });
}
