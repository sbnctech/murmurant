/**
 * Support Case Notes API
 *
 * POST /api/v1/support/cases/:id/notes - Add a note to a case
 *
 * Note Types:
 * - status_change: Automatic status transition note
 * - clarification_sent: Question sent to submitter
 * - response_sent: Response sent to submitter
 * - internal: Internal team note
 * - ai_analysis: AI-generated analysis
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// UUID validation
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type NoteType = "status_change" | "clarification_sent" | "response_sent" | "internal" | "ai_analysis";

/**
 * POST /api/v1/support/cases/:id/notes
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: caseId } = await params;

  if (!uuidRegex.test(caseId)) {
    return NextResponse.json(
      { error: "Not Found", message: "Case not found" },
      { status: 404 }
    );
  }

  const auth = await requireCapability(req, "admin:full");
  if (!auth.ok) {
    return auth.response;
  }

  // Verify case exists
  const supportCase = await prisma.supportCase.findUnique({
    where: { id: caseId },
    select: { id: true, caseNumber: true },
  });

  if (!supportCase) {
    return NextResponse.json(
      { error: "Not Found", message: "Case not found" },
      { status: 404 }
    );
  }

  // Parse body
  const body = await req.json();

  // Validate noteType
  const validTypes: NoteType[] = ["status_change", "clarification_sent", "response_sent", "internal", "ai_analysis"];
  if (!body.noteType || !validTypes.includes(body.noteType)) {
    return NextResponse.json(
      {
        error: "Bad Request",
        message: "Invalid noteType. Must be one of: " + validTypes.join(", "),
      },
      { status: 400 }
    );
  }

  // Validate content
  if (!body.content || typeof body.content !== "string" || body.content.trim() === "") {
    return NextResponse.json(
      { error: "Bad Request", message: "content is required" },
      { status: 400 }
    );
  }

  // Create note
  const note = await prisma.supportCaseNote.create({
    data: {
      caseId,
      authorId: auth.context.memberId,
      noteType: body.noteType,
      content: body.content.trim(),
      metadata: (body.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
    },
    include: {
      author: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return NextResponse.json(
    {
      id: note.id,
      noteType: note.noteType,
      content: note.content,
      createdAt: note.createdAt.toISOString(),
      author: note.author
        ? { id: note.author.id, name: note.author.firstName + " " + note.author.lastName }
        : null,
      message: "Note added",
    },
    { status: 201 }
  );
}
