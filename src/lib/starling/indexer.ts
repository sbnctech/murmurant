// Copyright (c) Murmurant, Inc.
// Knowledge base indexer for Starling
// Primary source: CMS content (Pages, FAQs, Policies, etc.)
// Legacy support: Filesystem-based indexing for backwards compatibility

import { readFile, readdir } from "fs/promises";
import { join, extname, relative } from "path";
import { prisma } from "@/lib/prisma";
import { generateEmbedding, generateEmbeddings, prepareDocument, chunkText, type DocumentChunk } from "./embeddings";
import { indexDocument, deleteSource, getKnowledgeStats } from "./rag";

/**
 * Index configuration
 */
export interface IndexConfig {
  basePath: string;
  sourceType: DocumentChunk["sourceType"];
  extensions?: string[];
  excludePatterns?: RegExp[];
  organizationId?: string; // null/undefined for platform, set for operator-specific
}

/**
 * Index result
 */
export interface IndexResult {
  source: string;
  chunksIndexed: number;
  errors: string[];
}

/**
 * Index a single file
 * @param organizationId - null/undefined for platform docs, org ID for operator-specific
 */
export async function indexFile(
  filePath: string,
  sourceType: DocumentChunk["sourceType"],
  basePath: string,
  organizationId?: string
): Promise<IndexResult> {
  const source = relative(basePath, filePath);
  const errors: string[] = [];

  try {
    const content = await readFile(filePath, "utf-8");

    // Extract title from first heading
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch?.[1];

    // Prepare document chunks
    const chunks = prepareDocument(content, source, sourceType, title);

    if (chunks.length === 0) {
      return { source, chunksIndexed: 0, errors: [] };
    }

    // Generate embeddings in batch
    const embeddings = await generateEmbeddings(chunks.map((c) => c.content));

    // Index each chunk with organization scope
    for (let i = 0; i < chunks.length; i++) {
      try {
        await indexDocument(chunks[i], embeddings[i], organizationId);
      } catch (error) {
        errors.push(`Chunk ${i}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return { source, chunksIndexed: chunks.length - errors.length, errors };
  } catch (error) {
    return {
      source,
      chunksIndexed: 0,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}

/**
 * Index all files in a directory
 * Supports multi-tenant: organizationId in config scopes to that org
 */
export async function indexDirectory(config: IndexConfig): Promise<IndexResult[]> {
  const {
    basePath,
    sourceType,
    extensions = [".md", ".txt"],
    excludePatterns = [],
    organizationId,
  } = config;

  const results: IndexResult[] = [];

  async function walkDir(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = relative(basePath, fullPath);

      // Check exclude patterns
      if (excludePatterns.some((pattern) => pattern.test(relativePath))) {
        continue;
      }

      if (entry.isDirectory()) {
        await walkDir(fullPath);
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        if (extensions.includes(ext)) {
          const result = await indexFile(fullPath, sourceType, basePath, organizationId);
          results.push(result);
        }
      }
    }
  }

  await walkDir(basePath);
  return results;
}

/**
 * Reindex a source (delete and re-add)
 * @param organizationId - Scope to specific org (null for platform only)
 */
export async function reindexSource(
  source: string,
  filePath: string,
  sourceType: DocumentChunk["sourceType"],
  organizationId?: string
): Promise<IndexResult> {
  // Delete existing chunks for this source (scoped to org)
  await deleteSource(source, organizationId ?? null);

  // Re-index
  return indexFile(filePath, sourceType, "", organizationId);
}

/**
 * Index the Murmurant documentation
 * This is the main entry point for indexing all docs
 */
export async function indexMurmurantDocs(docsPath: string): Promise<{
  results: IndexResult[];
  stats: Awaited<ReturnType<typeof getKnowledgeStats>>;
}> {
  const results: IndexResult[] = [];

  // Index runbooks
  const runbookResults = await indexDirectory({
    basePath: join(docsPath, "RUNBOOKS"),
    sourceType: "runbook",
    extensions: [".md"],
    excludePatterns: [/ARCHIVE/, /\.draft\./, /_WIP/],
  });
  results.push(...runbookResults);

  // Index FAQs
  try {
    const faqResults = await indexDirectory({
      basePath: join(docsPath, "FAQ"),
      sourceType: "faq",
      extensions: [".md"],
    });
    results.push(...faqResults);
  } catch {
    // FAQ directory might not exist
  }

  // Index help articles
  try {
    const helpResults = await indexDirectory({
      basePath: join(docsPath, "HELP"),
      sourceType: "help",
      extensions: [".md"],
    });
    results.push(...helpResults);
  } catch {
    // Help directory might not exist
  }

  // Index policies
  try {
    const policyResults = await indexDirectory({
      basePath: join(docsPath, "POLICIES"),
      sourceType: "policy",
      extensions: [".md"],
    });
    results.push(...policyResults);
  } catch {
    // Policies directory might not exist
  }

  const stats = await getKnowledgeStats();

  return { results, stats };
}

/**
 * Print indexing report
 */
export function formatIndexReport(results: IndexResult[]): string {
  const successCount = results.filter((r) => r.errors.length === 0).length;
  const errorCount = results.filter((r) => r.errors.length > 0).length;
  const totalChunks = results.reduce((sum, r) => sum + r.chunksIndexed, 0);

  let report = `\n📚 Indexing Report\n`;
  report += `${"=".repeat(40)}\n\n`;
  report += `Files processed: ${results.length}\n`;
  report += `  ✓ Successful: ${successCount}\n`;
  report += `  ✗ With errors: ${errorCount}\n`;
  report += `Total chunks indexed: ${totalChunks}\n\n`;

  if (errorCount > 0) {
    report += `Errors:\n`;
    for (const result of results) {
      if (result.errors.length > 0) {
        report += `  ${result.source}:\n`;
        for (const error of result.errors) {
          report += `    - ${error}\n`;
        }
      }
    }
  }

  return report;
}

/**
 * Index operator-specific documentation
 * Each operator can have their own FAQs, policies, etc.
 *
 * Expected directory structure:
 *   {operatorDocsPath}/
 *     faq/          - Operator FAQs
 *     policies/     - Organization policies
 *     help/         - Help articles
 *
 * @param operatorDocsPath - Path to operator's docs directory
 * @param organizationId - The organization UUID
 */
export async function indexOperatorDocs(
  operatorDocsPath: string,
  organizationId: string
): Promise<{
  results: IndexResult[];
  stats: Awaited<ReturnType<typeof getKnowledgeStats>>;
}> {
  const results: IndexResult[] = [];

  // Index operator FAQs
  try {
    const faqResults = await indexDirectory({
      basePath: join(operatorDocsPath, "faq"),
      sourceType: "faq",
      extensions: [".md"],
      organizationId,
    });
    results.push(...faqResults);
  } catch {
    // FAQ directory might not exist
  }

  // Index operator policies
  try {
    const policyResults = await indexDirectory({
      basePath: join(operatorDocsPath, "policies"),
      sourceType: "policy",
      extensions: [".md"],
      organizationId,
    });
    results.push(...policyResults);
  } catch {
    // Policies directory might not exist
  }

  // Index operator help articles
  try {
    const helpResults = await indexDirectory({
      basePath: join(operatorDocsPath, "help"),
      sourceType: "help",
      extensions: [".md"],
      organizationId,
    });
    results.push(...helpResults);
  } catch {
    // Help directory might not exist
  }

  const stats = await getKnowledgeStats();

  return { results, stats };
}

/**
 * Clear all knowledge for an operator
 * Used when an operator wants to re-index from scratch
 */
export async function clearOperatorKnowledge(organizationId: string): Promise<number> {
  const result = await prisma.$executeRawUnsafe(
    `DELETE FROM "StarlingKnowledge" WHERE organization_id = $1::uuid`,
    organizationId
  );
  return result;
}

// ============================================================================
// CMS-BASED INDEXING (Primary)
// These functions work with content stored in the CMS database
// ============================================================================

/**
 * Content type mapping from CMS to knowledge source types
 */
const CMS_TYPE_MAP: Record<string, DocumentChunk["sourceType"]> = {
  faq: "faq",
  policy: "policy",
  help: "help",
  runbook: "runbook",
  page: "help", // Generic pages default to help
};

/**
 * Extract plain text from block-based CMS content
 */
export function extractTextFromBlocks(content: unknown): string {
  if (!content) return "";

  const texts: string[] = [];

  function extractFromNode(node: unknown): void {
    if (!node || typeof node !== "object") return;

    const obj = node as Record<string, unknown>;

    // Handle text nodes
    if (obj.type === "text" && typeof obj.text === "string") {
      texts.push(obj.text);
      return;
    }

    // Handle paragraph, heading, etc with content array
    if (Array.isArray(obj.content)) {
      for (const child of obj.content) {
        extractFromNode(child);
      }
      texts.push("\n");
      return;
    }

    // Handle blocks array
    if (Array.isArray(obj.blocks)) {
      for (const block of obj.blocks) {
        extractFromNode(block);
      }
      return;
    }

    // Recurse into object properties
    for (const value of Object.values(obj)) {
      if (typeof value === "object") {
        extractFromNode(value);
      }
    }
  }

  extractFromNode(content);

  return texts.join(" ").replace(/\s+/g, " ").trim();
}

/**
 * Index a single CMS page
 * @param pageId - The page UUID
 * @param organizationId - null for platform content, org UUID for operator content
 */
export async function indexCMSPage(
  pageId: string,
  organizationId?: string | null
): Promise<IndexResult> {
  const errors: string[] = [];

  try {
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: {
        id: true,
        slug: true,
        title: true,
        content: true,
        publishedContent: true,
        status: true,
      },
    });

    if (!page) {
      return { source: pageId, chunksIndexed: 0, errors: ["Page not found"] };
    }

    // Use published content if available, otherwise working content
    const content = page.publishedContent ?? page.content;
    if (!content) {
      return { source: pageId, chunksIndexed: 0, errors: [] };
    }

    // Extract text from block content
    const textContent = extractTextFromBlocks(content);
    if (!textContent.trim()) {
      return { source: pageId, chunksIndexed: 0, errors: [] };
    }

    // Delete existing entries for this page
    await prisma.$executeRaw`
      DELETE FROM "StarlingKnowledge"
      WHERE source = ${pageId} OR id LIKE ${pageId + ":%"}
    `;

    // Chunk the content
    const chunks = chunkText(textContent, 500, 50);

    // Index each chunk
    for (let i = 0; i < chunks.length; i++) {
      try {
        const chunkId = `${pageId}:${i}`;
        const embedding = await generateEmbedding(chunks[i]);

        await prisma.$executeRawUnsafe(
          `
          INSERT INTO "StarlingKnowledge"
            (id, content, source, source_type, title, section, organization_id, metadata, embedding, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::vector, NOW(), NOW())
          `,
          chunkId,
          chunks[i],
          pageId,
          "help", // CMS pages default to help type
          page.title,
          i > 0 ? `Part ${i + 1}` : null,
          organizationId ?? null,
          JSON.stringify({ slug: page.slug, chunkIndex: i, totalChunks: chunks.length }),
          `[${embedding.join(",")}]`
        );
      } catch (error) {
        errors.push(`Chunk ${i}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return { source: pageId, chunksIndexed: chunks.length - errors.length, errors };
  } catch (error) {
    return {
      source: pageId,
      chunksIndexed: 0,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}

/**
 * Index content from webhook payload
 * Used when CMS content changes are pushed via webhook
 */
export async function indexFromWebhook(payload: {
  contentId: string;
  contentType: string;
  title?: string;
  content: string;
  section?: string;
  organizationId?: string;
  metadata?: Record<string, unknown>;
}): Promise<IndexResult> {
  const errors: string[] = [];
  const sourceType = CMS_TYPE_MAP[payload.contentType] ?? "help";

  try {
    // Delete existing entries for this content
    await deleteSource(payload.contentId, payload.organizationId ?? null);

    // Skip if content is empty
    if (!payload.content.trim()) {
      return { source: payload.contentId, chunksIndexed: 0, errors: [] };
    }

    // Chunk and index
    const chunks = chunkText(payload.content, 500, 50);

    for (let i = 0; i < chunks.length; i++) {
      try {
        const chunkId = `${payload.contentId}:${i}`;
        const embedding = await generateEmbedding(chunks[i]);

        await prisma.$executeRawUnsafe(
          `
          INSERT INTO "StarlingKnowledge"
            (id, content, source, source_type, title, section, organization_id, metadata, embedding, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::vector, NOW(), NOW())
          `,
          chunkId,
          chunks[i],
          payload.contentId,
          sourceType,
          payload.title ?? null,
          payload.section ?? (i > 0 ? `Part ${i + 1}` : null),
          payload.organizationId ?? null,
          JSON.stringify({ ...payload.metadata, chunkIndex: i, totalChunks: chunks.length }),
          `[${embedding.join(",")}]`
        );
      } catch (error) {
        errors.push(`Chunk ${i}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return { source: payload.contentId, chunksIndexed: chunks.length - errors.length, errors };
  } catch (error) {
    return {
      source: payload.contentId,
      chunksIndexed: 0,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}

/**
 * Delete content from knowledge base when CMS content is deleted
 */
export async function deleteFromWebhook(
  contentId: string,
  organizationId?: string
): Promise<number> {
  return deleteSource(contentId, organizationId ?? null);
}

/**
 * Index all published CMS pages
 * Used for full re-indexing from CMS
 * @param organizationId - null for platform pages, org UUID for operator pages
 */
export async function indexAllCMSPages(
  organizationId?: string | null
): Promise<{
  results: IndexResult[];
  stats: Awaited<ReturnType<typeof getKnowledgeStats>>;
}> {
  const results: IndexResult[] = [];

  // Get all published pages
  // Note: In a multi-tenant setup, pages would have an organizationId field
  // For now, we index all published pages as platform content
  const pages = await prisma.page.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true },
  });

  for (const page of pages) {
    const result = await indexCMSPage(page.id, organizationId);
    results.push(result);
  }

  const stats = await getKnowledgeStats();

  return { results, stats };
}

/**
 * Sync knowledge base with current CMS state
 * Removes orphaned entries and re-indexes changed content
 */
export async function syncKnowledgeWithCMS(): Promise<{
  added: number;
  removed: number;
  updated: number;
}> {
  let added = 0;
  let removed = 0;
  let updated = 0;

  // Get all published pages from CMS
  const pages = await prisma.page.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, updatedAt: true },
  });

  const pageIds = new Set(pages.map((p) => p.id));

  // Get all CMS-sourced knowledge entries (those with UUID source)
  const knowledgeEntries = await prisma.$queryRaw<
    Array<{ source: string; updated_at: Date }>
  >`
    SELECT DISTINCT source, MAX(updated_at) as updated_at
    FROM "StarlingKnowledge"
    WHERE source ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    GROUP BY source
  `;

  // Remove orphaned entries (page was deleted or unpublished)
  for (const entry of knowledgeEntries) {
    if (!pageIds.has(entry.source)) {
      await deleteSource(entry.source, null);
      removed++;
    }
  }

  // Check for pages that need (re)indexing
  const knowledgeMap = new Map(
    knowledgeEntries.map((e) => [e.source, e.updated_at])
  );

  for (const page of pages) {
    const knowledgeUpdated = knowledgeMap.get(page.id);

    if (!knowledgeUpdated) {
      // New page, needs indexing
      await indexCMSPage(page.id);
      added++;
    } else if (page.updatedAt > knowledgeUpdated) {
      // Page was updated, needs re-indexing
      await indexCMSPage(page.id);
      updated++;
    }
    // Otherwise, knowledge is up to date
  }

  return { added, removed, updated };
}
