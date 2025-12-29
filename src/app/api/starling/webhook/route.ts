// Copyright (c) Murmurant, Inc.
// Starling CMS webhook - receives content change notifications
// Called by the CMS when pages/articles are created, updated, or deleted

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateEmbedding, chunkText } from "@/lib/starling/embeddings";
import { nanoid } from "nanoid";

/**
 * Webhook payload from CMS
 */
interface CMSWebhookPayload {
  event: "created" | "updated" | "deleted" | "published" | "unpublished";
  contentType: "page" | "faq" | "policy" | "help" | "runbook";
  contentId: string;
  organizationId?: string; // null for platform content
  title?: string;
  content?: string; // Plain text or markdown content
  section?: string;
  metadata?: Record<string, unknown>;
}

/**
 * POST /api/starling/webhook
 * Receive CMS content change notifications and update knowledge base
 */
export async function POST(req: NextRequest) {
  try {
    // Verify webhook signature (in production, use HMAC or similar)
    const signature = req.headers.get("x-webhook-signature");
    const expectedSignature = process.env.STARLING_WEBHOOK_SECRET;

    if (expectedSignature && signature !== expectedSignature) {
      console.warn("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload: CMSWebhookPayload = await req.json();
    const { event, contentType, contentId, organizationId, title, content, section } = payload;

    console.log(`[Starling Webhook] ${event} ${contentType}:${contentId}`);

    switch (event) {
      case "created":
      case "updated":
      case "published":
        if (!content) {
          return NextResponse.json(
            { error: "Content required for create/update" },
            { status: 400 }
          );
        }
        await indexContent({
          contentId,
          contentType,
          organizationId,
          title,
          content,
          section,
        });
        break;

      case "deleted":
      case "unpublished":
        await deleteContent(contentId);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown event: ${event}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, event, contentId });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Index content into the knowledge base
 * Chunks large content and generates embeddings
 */
async function indexContent(params: {
  contentId: string;
  contentType: string;
  organizationId?: string;
  title?: string;
  content: string;
  section?: string;
}): Promise<void> {
  const { contentId, contentType, organizationId, title, content, section } = params;

  // First, delete any existing chunks for this content
  await deleteContent(contentId);

  // Chunk the content for better retrieval
  const chunks = chunkText(content, 500, 50);

  // Generate embeddings and insert each chunk
  for (let i = 0; i < chunks.length; i++) {
    const chunkContent = chunks[i];
    const chunkId = `${contentId}:${i}`;

    try {
      const embedding = await generateEmbedding(chunkContent);

      await prisma.$executeRawUnsafe(
        `
        INSERT INTO "StarlingKnowledge"
          (id, content, source, source_type, title, section, organization_id, metadata, embedding, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::vector, NOW(), NOW())
        `,
        chunkId,
        chunkContent,
        contentId, // source = original content ID for grouping
        contentType,
        title ?? null,
        section ?? (i > 0 ? `Part ${i + 1}` : null),
        organizationId ?? null,
        JSON.stringify({ chunkIndex: i, totalChunks: chunks.length }),
        `[${embedding.join(",")}]`
      );
    } catch (error) {
      console.error(`Failed to index chunk ${chunkId}:`, error);
      // Continue with other chunks
    }
  }

  console.log(`[Starling] Indexed ${chunks.length} chunks for ${contentId}`);
}

/**
 * Delete all chunks for a content ID
 */
async function deleteContent(contentId: string): Promise<void> {
  const result = await prisma.$executeRaw`
    DELETE FROM "StarlingKnowledge"
    WHERE source = ${contentId} OR id LIKE ${contentId + ':%'}
  `;

  if (result > 0) {
    console.log(`[Starling] Deleted ${result} chunks for ${contentId}`);
  }
}
