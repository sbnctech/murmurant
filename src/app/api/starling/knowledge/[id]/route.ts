// Copyright (c) Murmurant, Inc.
// Starling knowledge entry management

import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { requireCapabilitySafe } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/starling/embeddings";

/**
 * GET /api/starling/knowledge/[id]
 * Get a single knowledge entry
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const entries = await prisma.$queryRaw<
      Array<{
        id: string;
        content: string;
        source: string;
        source_type: string;
        title: string | null;
        section: string | null;
        organization_id: string | null;
        created_at: Date;
        updated_at: Date;
      }>
    >`
      SELECT id, content, source, source_type, title, section, organization_id, created_at, updated_at
      FROM "StarlingKnowledge"
      WHERE id = ${id}
    `;

    if (entries.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const e = entries[0];
    return NextResponse.json({
      id: e.id,
      content: e.content,
      source: e.source,
      sourceType: e.source_type,
      title: e.title,
      section: e.section,
      organizationId: e.organization_id,
      createdAt: e.created_at,
      updatedAt: e.updated_at,
    });
  } catch (error) {
    console.error("Knowledge get error:", error);
    return NextResponse.json(
      { error: "Failed to get knowledge entry" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/starling/knowledge/[id]
 * Update a knowledge entry (re-generates embedding)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canManage = await requireCapabilitySafe(req, "admin:full");
    if (!canManage) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { content, title, section } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Re-generate embedding for updated content
    const embedding = await generateEmbedding(content);

    const result = await prisma.$executeRawUnsafe(
      `
      UPDATE "StarlingKnowledge"
      SET content = $2, title = $3, section = $4, embedding = $5::vector, updated_at = NOW()
      WHERE id = $1
      `,
      id,
      content,
      title ?? null,
      section ?? null,
      `[${embedding.join(",")}]`
    );

    if (result === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Knowledge update error:", error);
    return NextResponse.json(
      { error: "Failed to update knowledge entry" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/starling/knowledge/[id]
 * Delete a knowledge entry
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canManage = await requireCapabilitySafe(req, "admin:full");
    if (!canManage) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const result = await prisma.$executeRaw`
      DELETE FROM "StarlingKnowledge" WHERE id = ${id}
    `;

    if (result === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Knowledge delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete knowledge entry" },
      { status: 500 }
    );
  }
}
