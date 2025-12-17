// Copyright (c) Santa Barbara Newcomers Club
// Admin summary API - requires members:view capability
// Charter: P1 (identity provable), P2 (default deny), P9 (fail closed)

import { NextRequest, NextResponse } from "next/server";
import { getAdminSummary } from "@/lib/adminSummary";
import { requireCapability } from "@/lib/auth";

export async function GET(req: NextRequest) {
  // Charter P1/P2: Require authenticated identity with members:view capability
  // Summary includes member/registration counts, so require members:view
  const auth = await requireCapability(req, "members:view");
  if (!auth.ok) return auth.response;

  const summary = await getAdminSummary();
  return NextResponse.json({ summary });
}
