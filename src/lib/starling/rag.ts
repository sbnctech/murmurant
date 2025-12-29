// Copyright (c) Murmurant, Inc.
// RAG (Retrieval Augmented Generation) pipeline for Starling
// Supports RBAC-based visibility filtering

import { prisma } from "@/lib/prisma";
import { generateEmbedding, type DocumentChunk } from "./embeddings";
import type { KnowledgeVisibility } from "./types";

/**
 * Retrieved document with similarity score
 */
export interface RetrievedDocument {
  id: string;
  content: string;
  source: string;
  sourceType: string;
  title?: string;
  section?: string;
  organizationId?: string; // null = platform, set = operator-specific
  visibility: KnowledgeVisibility;
  similarity: number;
}

/**
 * Visibility hierarchy for filtering
 * staff can see: staff, member, public
 * member can see: member, public
 * public can see: public
 */
const VISIBILITY_HIERARCHY: Record<KnowledgeVisibility, KnowledgeVisibility[]> = {
  staff: ["staff", "member", "public"],
  member: ["member", "public"],
  public: ["public"],
};

/**
 * Search the knowledge base for relevant documents
 * Uses cosine similarity with pgvector
 *
 * RBAC: Filters by visibility based on user's role level
 * Multi-tenant: searches both platform docs (organizationId = null)
 * and operator-specific docs (organizationId = provided org)
 */
export async function searchKnowledge(
  query: string,
  options: {
    limit?: number;
    minSimilarity?: number;
    sourceTypes?: string[];
    organizationId?: string; // Include operator-specific knowledge
    visibility?: KnowledgeVisibility; // User's visibility level (from role)
  } = {}
): Promise<RetrievedDocument[]> {
  const {
    limit = 5,
    minSimilarity = 0.7,
    sourceTypes,
    organizationId,
    visibility = "public", // Default to most restrictive
  } = options;

  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query);

  // Get allowed visibility levels for this user
  const allowedVisibilities = VISIBILITY_HIERARCHY[visibility];

  // Build the query with all filters
  // Using parameterized query to prevent SQL injection
  const results = await prisma.$queryRawUnsafe<
    {
      id: string;
      content: string;
      source: string;
      source_type: string;
      title: string | null;
      section: string | null;
      organization_id: string | null;
      visibility: string;
      similarity: number;
    }[]
  >(
    `
    SELECT
      id,
      content,
      source,
      source_type,
      title,
      section,
      organization_id,
      visibility,
      1 - (embedding <=> $1::vector) as similarity
    FROM "StarlingKnowledge"
    WHERE 1 - (embedding <=> $1::vector) >= $2
      AND visibility = ANY($3::text[])
      ${sourceTypes?.length ? `AND source_type = ANY($4::text[])` : ""}
      ${organizationId
        ? `AND (organization_id IS NULL OR organization_id = $${sourceTypes?.length ? 5 : 4}::uuid)`
        : `AND organization_id IS NULL`
      }
    ORDER BY embedding <=> $1::vector
    LIMIT ${limit}
    `,
    `[${queryEmbedding.join(",")}]`,
    minSimilarity,
    allowedVisibilities,
    ...(sourceTypes?.length ? [sourceTypes] : []),
    ...(organizationId ? [organizationId] : [])
  );

  return results.map((row) => ({
    id: row.id,
    content: row.content,
    source: row.source,
    sourceType: row.source_type,
    title: row.title ?? undefined,
    section: row.section ?? undefined,
    organizationId: row.organization_id ?? undefined,
    visibility: row.visibility as KnowledgeVisibility,
    similarity: row.similarity,
  }));
}

/**
 * Default visibility based on content type
 * - runbook: staff only (internal procedures)
 * - policy: member (club policies)
 * - faq: public (general questions)
 * - help: member (member-facing help)
 */
const DEFAULT_VISIBILITY: Record<string, KnowledgeVisibility> = {
  runbook: "staff",
  policy: "member",
  faq: "public",
  help: "member",
};

/**
 * Index a document into the knowledge base
 * @param chunk - Document chunk to index
 * @param embedding - Vector embedding
 * @param organizationId - null for platform docs, org ID for operator-specific
 * @param visibility - Access level (defaults based on sourceType)
 */
export async function indexDocument(
  chunk: DocumentChunk,
  embedding: number[],
  organizationId?: string,
  visibility?: KnowledgeVisibility
): Promise<void> {
  const effectiveVisibility = visibility ?? DEFAULT_VISIBILITY[chunk.sourceType] ?? "member";

  await prisma.$executeRawUnsafe(
    `
    INSERT INTO "StarlingKnowledge" (id, content, source, source_type, title, section, metadata, organization_id, visibility, embedding, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::vector, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      content = EXCLUDED.content,
      title = EXCLUDED.title,
      section = EXCLUDED.section,
      metadata = EXCLUDED.metadata,
      organization_id = EXCLUDED.organization_id,
      visibility = EXCLUDED.visibility,
      embedding = EXCLUDED.embedding,
      updated_at = NOW()
    `,
    chunk.id,
    chunk.content,
    chunk.source,
    chunk.sourceType,
    chunk.title ?? null,
    chunk.section ?? null,
    JSON.stringify(chunk.metadata ?? {}),
    organizationId ?? null,
    effectiveVisibility,
    `[${embedding.join(",")}]`
  );
}

/**
 * Delete all documents from a source
 * @param source - Source identifier
 * @param organizationId - Limit to specific org (null for platform only)
 */
export async function deleteSource(
  source: string,
  organizationId?: string | null
): Promise<number> {
  if (organizationId === undefined) {
    // Delete all matching sources regardless of org
    const result = await prisma.$executeRaw`
      DELETE FROM "StarlingKnowledge" WHERE source = ${source}
    `;
    return result;
  }

  if (organizationId === null) {
    // Delete only platform docs
    const result = await prisma.$executeRaw`
      DELETE FROM "StarlingKnowledge"
      WHERE source = ${source} AND organization_id IS NULL
    `;
    return result;
  }

  // Delete only for specific org
  const result = await prisma.$executeRawUnsafe(
    `DELETE FROM "StarlingKnowledge" WHERE source = $1 AND organization_id = $2::uuid`,
    source,
    organizationId
  );
  return result;
}

/**
 * Get knowledge base statistics
 */
export async function getKnowledgeStats(): Promise<{
  totalDocuments: number;
  bySourceType: Record<string, number>;
  lastUpdated: Date | null;
}> {
  const stats = await prisma.$queryRaw<
    { source_type: string; count: bigint }[]
  >`
    SELECT source_type, COUNT(*) as count
    FROM "StarlingKnowledge"
    GROUP BY source_type
  `;

  const lastUpdated = await prisma.$queryRaw<{ max: Date | null }[]>`
    SELECT MAX(updated_at) as max FROM "StarlingKnowledge"
  `;

  const bySourceType: Record<string, number> = {};
  let totalDocuments = 0;

  for (const row of stats) {
    const count = Number(row.count);
    bySourceType[row.source_type] = count;
    totalDocuments += count;
  }

  return {
    totalDocuments,
    bySourceType,
    lastUpdated: lastUpdated[0]?.max ?? null,
  };
}

/**
 * Format retrieved documents for LLM context
 */
export function formatRetrievedDocs(docs: RetrievedDocument[]): string[] {
  return docs.map((doc) => {
    let formatted = "";

    if (doc.title) {
      formatted += `## ${doc.title}\n`;
    }
    if (doc.section && doc.section !== doc.title) {
      formatted += `### ${doc.section}\n`;
    }

    formatted += doc.content;

    // Add source attribution
    formatted += `\n\n_Source: ${doc.source}_`;

    return formatted;
  });
}

/**
 * Retrieve and format context for a query
 * This is the main entry point for RAG
 *
 * @param query - User query to search for
 * @param options.organizationId - Include operator-specific knowledge
 * @param options.visibility - User's visibility level for RBAC filtering
 */
export async function getRAGContext(
  query: string,
  options: {
    limit?: number;
    minSimilarity?: number;
    sourceTypes?: string[];
    organizationId?: string;
    visibility?: KnowledgeVisibility;
  } = {}
): Promise<{
  context: string[];
  sources: RetrievedDocument[];
}> {
  const docs = await searchKnowledge(query, options);

  return {
    context: formatRetrievedDocs(docs),
    sources: docs,
  };
}

// Export for use in indexer
export { DEFAULT_VISIBILITY };
