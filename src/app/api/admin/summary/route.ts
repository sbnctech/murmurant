import { NextResponse } from "next/server";
import { getAdminSummary } from "@/lib/adminSummary";

export async function GET() {
  const summary = await getAdminSummary();
  return NextResponse.json({ summary });
}
