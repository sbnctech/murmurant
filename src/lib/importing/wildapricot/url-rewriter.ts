/**
 * Wild Apricot URL Rewriter
 *
 * Copyright © 2025 Murmurant, Inc.
 *
 * Rewrites Wild Apricot resource URLs in content to point to
 * locally stored copies after resource migration.
 *
 * Charter Principles:
 * - P5: Reversibility (original URLs preserved in WaResourceMapping)
 * - P7: Observability (rewrite stats tracked)
 */

import { prisma } from "@/lib/prisma";
import { buildUrlMappingTable, extractWaUrls } from "./resources";

// ============================================================================
// URL Rewriting
// ============================================================================

export interface RewriteResult {
  content: string;
  urlsFound: number;
  urlsRewritten: number;
  unmappedUrls: string[];
}

/**
 * Rewrite WA URLs in content to internal URLs.
 *
 * @param content - HTML content containing WA URLs
 * @param urlMapping - Map of WA URL → internal URL
 * @returns Rewritten content with stats
 */
export function rewriteContent(
  content: string,
  urlMapping: Map<string, string>
): RewriteResult {
  const foundUrls = extractWaUrls(content);
  let rewrittenContent = content;
  let urlsRewritten = 0;
  const unmappedUrls: string[] = [];

  for (const waUrl of foundUrls) {
    const internalUrl = urlMapping.get(waUrl);

    if (internalUrl) {
      // Replace all occurrences of this URL
      rewrittenContent = rewrittenContent.split(waUrl).join(internalUrl);
      urlsRewritten++;
    } else {
      unmappedUrls.push(waUrl);
    }
  }

  return {
    content: rewrittenContent,
    urlsFound: foundUrls.length,
    urlsRewritten,
    unmappedUrls,
  };
}

// ============================================================================
// Entity Rewriting
// ============================================================================

export interface EntityRewriteResult {
  entityType: string;
  entityId: string;
  urlsFound: number;
  urlsRewritten: number;
  unmappedUrls: string[];
  updated: boolean;
}

/**
 * Rewrite URLs in all event descriptions.
 */
export async function rewriteEventUrls(): Promise<{
  processed: number;
  updated: number;
  results: EntityRewriteResult[];
}> {
  const urlMapping = await buildUrlMappingTable();
  const results: EntityRewriteResult[] = [];
  let updated = 0;

  // Find events with descriptions
  const events = await prisma.event.findMany({
    where: {
      description: { not: null },
    },
    select: {
      id: true,
      title: true,
      description: true,
    },
  });

  for (const event of events) {
    if (!event.description) continue;

    const foundUrls = extractWaUrls(event.description);
    if (foundUrls.length === 0) continue;

    const rewriteResult = rewriteContent(event.description, urlMapping);

    const result: EntityRewriteResult = {
      entityType: "event",
      entityId: event.id,
      urlsFound: rewriteResult.urlsFound,
      urlsRewritten: rewriteResult.urlsRewritten,
      unmappedUrls: rewriteResult.unmappedUrls,
      updated: false,
    };

    // Only update if something was rewritten
    if (rewriteResult.urlsRewritten > 0) {
      await prisma.event.update({
        where: { id: event.id },
        data: { description: rewriteResult.content },
      });
      result.updated = true;
      updated++;
    }

    results.push(result);
  }

  return {
    processed: events.length,
    updated,
    results: results.filter((r) => r.urlsFound > 0),
  };
}

/**
 * Rewrite URLs in all page content.
 */
export async function rewritePageUrls(): Promise<{
  processed: number;
  updated: number;
  results: EntityRewriteResult[];
}> {
  const urlMapping = await buildUrlMappingTable();
  const results: EntityRewriteResult[] = [];
  let updated = 0;

  // Find pages with content
  const pages = await prisma.page.findMany({
    select: {
      id: true,
      slug: true,
      content: true,
    },
  });

  for (const page of pages) {
    // Convert content JSON to string for URL searching
    const contentString = JSON.stringify(page.content);
    const foundUrls = extractWaUrls(contentString);

    if (foundUrls.length === 0) continue;

    const rewriteResult = rewriteContent(contentString, urlMapping);

    const result: EntityRewriteResult = {
      entityType: "page",
      entityId: page.id,
      urlsFound: rewriteResult.urlsFound,
      urlsRewritten: rewriteResult.urlsRewritten,
      unmappedUrls: rewriteResult.unmappedUrls,
      updated: false,
    };

    // Only update if something was rewritten
    if (rewriteResult.urlsRewritten > 0) {
      try {
        // Parse the rewritten content back to JSON
        const newContent = JSON.parse(rewriteResult.content);
        await prisma.page.update({
          where: { id: page.id },
          data: { content: newContent },
        });
        result.updated = true;
        updated++;
      } catch {
        // If JSON parsing fails, log the error but continue
        result.unmappedUrls.push("JSON_PARSE_ERROR");
      }
    }

    results.push(result);
  }

  return {
    processed: pages.length,
    updated,
    results: results.filter((r) => r.urlsFound > 0),
  };
}

// ============================================================================
// Combined Rewriting
// ============================================================================

export interface FullRewriteResult {
  events: {
    processed: number;
    updated: number;
    urlsFound: number;
    urlsRewritten: number;
  };
  pages: {
    processed: number;
    updated: number;
    urlsFound: number;
    urlsRewritten: number;
  };
  unmappedUrls: string[];
}

/**
 * Rewrite URLs in all content types.
 */
export async function rewriteAllUrls(): Promise<FullRewriteResult> {
  const eventResult = await rewriteEventUrls();
  const pageResult = await rewritePageUrls();

  // Collect unique unmapped URLs
  const unmappedSet = new Set<string>();
  for (const r of eventResult.results) {
    for (const url of r.unmappedUrls) {
      unmappedSet.add(url);
    }
  }
  for (const r of pageResult.results) {
    for (const url of r.unmappedUrls) {
      unmappedSet.add(url);
    }
  }

  return {
    events: {
      processed: eventResult.processed,
      updated: eventResult.updated,
      urlsFound: eventResult.results.reduce((sum, r) => sum + r.urlsFound, 0),
      urlsRewritten: eventResult.results.reduce((sum, r) => sum + r.urlsRewritten, 0),
    },
    pages: {
      processed: pageResult.processed,
      updated: pageResult.updated,
      urlsFound: pageResult.results.reduce((sum, r) => sum + r.urlsFound, 0),
      urlsRewritten: pageResult.results.reduce((sum, r) => sum + r.urlsRewritten, 0),
    },
    unmappedUrls: Array.from(unmappedSet),
  };
}

// ============================================================================
// Scanning (Dry Run)
// ============================================================================

export interface ScanResult {
  entityType: string;
  entityId: string;
  entityTitle: string;
  urlsFound: number;
  urls: string[];
}

/**
 * Scan content for WA URLs without making changes.
 * Useful for previewing what would be rewritten.
 */
export async function scanForWaUrls(): Promise<{
  events: ScanResult[];
  pages: ScanResult[];
  totalUrls: number;
  uniqueUrls: string[];
}> {
  const events: ScanResult[] = [];
  const pages: ScanResult[] = [];
  const allUrlsSet = new Set<string>();

  // Scan events
  const eventRecords = await prisma.event.findMany({
    where: { description: { not: null } },
    select: { id: true, title: true, description: true },
  });

  for (const event of eventRecords) {
    if (!event.description) continue;
    const urls = extractWaUrls(event.description);
    if (urls.length > 0) {
      events.push({
        entityType: "event",
        entityId: event.id,
        entityTitle: event.title,
        urlsFound: urls.length,
        urls,
      });
      for (const url of urls) {
        allUrlsSet.add(url);
      }
    }
  }

  // Scan pages
  const pageRecords = await prisma.page.findMany({
    select: { id: true, slug: true, content: true },
  });

  for (const page of pageRecords) {
    const contentString = JSON.stringify(page.content);
    const urls = extractWaUrls(contentString);
    if (urls.length > 0) {
      pages.push({
        entityType: "page",
        entityId: page.id,
        entityTitle: page.slug,
        urlsFound: urls.length,
        urls,
      });
      for (const url of urls) {
        allUrlsSet.add(url);
      }
    }
  }

  return {
    events,
    pages,
    totalUrls: events.reduce((s, e) => s + e.urlsFound, 0) +
               pages.reduce((s, p) => s + p.urlsFound, 0),
    uniqueUrls: Array.from(allUrlsSet),
  };
}
