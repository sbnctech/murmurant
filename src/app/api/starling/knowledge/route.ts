// Copyright (c) Murmurant, Inc.
// Starling knowledge management API
// Allows operators to manage their knowledge base entries

import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { requireCapabilitySafe } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/starling/embeddings";
import { nanoid } from "nanoid";

/**
 * GET /api/starling/knowledge
 * List knowledge base entries for the current organization
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get organization from session or query param
    const url = new URL(req.url);
    const organizationId = url.searchParams.get("organizationId");

    // Build query - platform docs (null org) are always visible
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
      WHERE organization_id IS NULL OR organization_id = ${organizationId}::uuid
      ORDER BY updated_at DESC
      LIMIT 100
    `;

    return NextResponse.json({
      entries: entries.map((e) => ({
        id: e.id,
        content: e.content,
        source: e.source,
        sourceType: e.source_type,
        title: e.title,
        section: e.section,
        organizationId: e.organization_id,
        createdAt: e.created_at,
        updatedAt: e.updated_at,
      })),
    });
  } catch (error) {
    console.error("Knowledge list error:", error);
    return NextResponse.json(
      { error: "Failed to list knowledge" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/starling/knowledge
 * Create a new knowledge base entry
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Require admin capability to manage knowledge
    const canManage = await requireCapabilitySafe(req, "admin:full");
    if (!canManage) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      content,
      sourceType,
      title,
      section,
      organizationId,
    }: {
      content: string;
      sourceType: "faq" | "policy" | "help" | "runbook";
      title?: string;
      section?: string;
      organizationId?: string;
    } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Generate embedding for the content
    const embedding = await generateEmbedding(content);

    // Create the entry
    const id = `kb_${nanoid(12)}`;
    const source = `admin:${session.userAccountId}:${Date.now()}`;

    await prisma.$executeRawUnsafe(
      `
      INSERT INTO "StarlingKnowledge"
        (id, content, source, source_type, title, section, organization_id, embedding, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector, NOW(), NOW())
      `,
      id,
      content,
      source,
      sourceType,
      title ?? null,
      section ?? null,
      organizationId ?? null,
      `[${embedding.join(",")}]`
    );

    return NextResponse.json({ id, success: true });
  } catch (error) {
    console.error("Knowledge create error:", error);
    return NextResponse.json(
      { error: "Failed to create knowledge entry" },
      { status: 500 }
    );
  }
}
