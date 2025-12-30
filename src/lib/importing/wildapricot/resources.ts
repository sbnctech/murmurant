/**
 * Wild Apricot Resource Discovery and Download
 *
 * Copyright © 2025 Murmurant, Inc.
 *
 * Discovers and downloads resources (images, PDFs, files) hosted on Wild Apricot
 * servers and migrates them to Murmurant file storage.
 *
 * Charter Principles:
 * - P1: Audit trail (WaResourceMapping tracks all operations)
 * - P5: Reversibility (original URLs preserved, mappings maintained)
 * - P7: Observability (sync reports include resource stats)
 * - N5: Idempotency (unique constraints prevent duplicate downloads)
 */

import { prisma } from "@/lib/prisma";
import { getStorageAdapter, generateStorageKey, calculateChecksum } from "@/lib/files/storage";

// ============================================================================
// URL Pattern Detection
// ============================================================================

/**
 * Known Wild Apricot resource URL patterns.
 * These cover CDN, user uploads, and system-generated files.
 */
const WA_URL_PATTERNS = [
  // CDN-hosted images and files
  /https?:\/\/cdn\.wildapricot\.org\/[^\s"'<>]+/gi,

  // Direct WA uploads (site-specific subdomain)
  /https?:\/\/[a-z0-9-]+\.wildapricot\.org\/resources\/[^\s"'<>]+/gi,

  // WA S3 storage
  /https?:\/\/s3\.amazonaws\.com\/wasc-[^\s"'<>]+/gi,

  // Cloudfront CDN for WA
  /https?:\/\/d[a-z0-9]+\.cloudfront\.net\/[^\s"'<>]+/gi,

  // Document viewer URLs (need to extract actual doc URL)
  /https?:\/\/[a-z0-9-]+\.wildapricot\.org\/widget\/Documents\/[^\s"'<>]+/gi,
];

/**
 * File extensions we should download (vs. skip).
 */
const DOWNLOADABLE_EXTENSIONS = new Set([
  // Images
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".ico", ".bmp",
  // Documents
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
  ".txt", ".rtf", ".odt", ".ods", ".odp",
  // Other files
  ".csv", ".json", ".xml", ".zip", ".mp3", ".mp4", ".wav", ".mov",
]);

/**
 * URL patterns to skip (external links, login pages, etc.).
 */
const SKIP_PATTERNS = [
  /\/sys\/login/i,
  /\/sys\/logout/i,
  /\/admin\//i,
  /\/widget\/Sys\//i,
  /javascript:/i,
  /mailto:/i,
  /tel:/i,
];

// ============================================================================
// Resource Discovery
// ============================================================================

export interface DiscoveredResource {
  url: string;
  discoveredIn: string;
  originalName?: string;
  mimeType?: string;
}

/**
 * Extract WA resource URLs from HTML content.
 */
export function extractWaUrls(content: string): string[] {
  const urls = new Set<string>();

  for (const pattern of WA_URL_PATTERNS) {
    const matches = content.match(pattern) || [];
    for (const match of matches) {
      // Clean up the URL (remove trailing punctuation, quotes)
      const cleanUrl = match.replace(/[)"'<>]+$/, "").trim();
      if (cleanUrl && shouldDownload(cleanUrl)) {
        urls.add(cleanUrl);
      }
    }
  }

  return Array.from(urls);
}

/**
 * Check if a URL should be downloaded.
 */
function shouldDownload(url: string): boolean {
  // Skip known non-resource patterns
  for (const pattern of SKIP_PATTERNS) {
    if (pattern.test(url)) {
      return false;
    }
  }

  // Check if URL ends with a downloadable extension
  const urlPath = new URL(url).pathname.toLowerCase();
  for (const ext of DOWNLOADABLE_EXTENSIONS) {
    if (urlPath.endsWith(ext)) {
      return true;
    }
  }

  // For URLs without clear extension, include if from known CDN
  if (url.includes("cdn.wildapricot.org") || url.includes("cloudfront.net")) {
    return true;
  }

  return false;
}

/**
 * Extract original filename from URL.
 */
function extractFilename(url: string): string | undefined {
  try {
    const urlPath = new URL(url).pathname;
    const filename = urlPath.split("/").pop();
    if (filename && filename.includes(".")) {
      // Decode URI components and clean up
      return decodeURIComponent(filename).replace(/%20/g, " ");
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Guess MIME type from URL extension.
 */
function guessMimeType(url: string): string | undefined {
  const ext = url.toLowerCase().split(".").pop()?.split("?")[0];
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    ico: "image/x-icon",
    bmp: "image/bmp",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt: "text/plain",
    rtf: "application/rtf",
    csv: "text/csv",
    json: "application/json",
    xml: "application/xml",
    zip: "application/zip",
    mp3: "audio/mpeg",
    mp4: "video/mp4",
    wav: "audio/wav",
    mov: "video/quicktime",
  };
  return ext ? mimeTypes[ext] : undefined;
}

// ============================================================================
// Resource Tracking
// ============================================================================

export interface ResourceStats {
  totalDiscovered: number;
  pending: number;
  downloaded: number;
  failed: number;
  skipped: number;
}

/**
 * Discover resources in content and track them in the database.
 *
 * @param content - HTML content to scan
 * @param discoveredIn - Source identifier (e.g., "event:123:description", "page:about")
 * @returns Array of newly discovered URLs
 */
export async function discoverResources(
  content: string,
  discoveredIn: string
): Promise<string[]> {
  const urls = extractWaUrls(content);
  const newUrls: string[] = [];

  for (const url of urls) {
    // Check if already tracked
    const existing = await prisma.waResourceMapping.findUnique({
      where: { waResourceUrl: url },
    });

    if (!existing) {
      // Create new tracking record
      await prisma.waResourceMapping.create({
        data: {
          waResourceUrl: url,
          originalName: extractFilename(url),
          mimeType: guessMimeType(url),
          discoveredIn,
          status: "pending",
        },
      });
      newUrls.push(url);
    }
  }

  return newUrls;
}

/**
 * Get resource migration statistics.
 */
export async function getResourceStats(): Promise<ResourceStats> {
  const [total, pending, downloaded, failed, skipped] = await Promise.all([
    prisma.waResourceMapping.count(),
    prisma.waResourceMapping.count({ where: { status: "pending" } }),
    prisma.waResourceMapping.count({ where: { status: "downloaded" } }),
    prisma.waResourceMapping.count({ where: { status: "failed" } }),
    prisma.waResourceMapping.count({ where: { status: "skipped" } }),
  ]);

  return {
    totalDiscovered: total,
    pending,
    downloaded,
    failed,
    skipped,
  };
}

/**
 * Get all pending resources to download.
 */
export async function getPendingResources(limit = 100) {
  return prisma.waResourceMapping.findMany({
    where: { status: "pending" },
    take: limit,
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Get failed resources (for retry or investigation).
 */
export async function getFailedResources(limit = 100) {
  return prisma.waResourceMapping.findMany({
    where: { status: "failed" },
    take: limit,
    orderBy: { updatedAt: "desc" },
  });
}

// ============================================================================
// Resource Download
// ============================================================================

export interface DownloadResult {
  url: string;
  success: boolean;
  fileObjectId?: string;
  storageKey?: string;
  error?: string;
}

/**
 * Download a WA resource and store it in our file system.
 *
 * @param resourceUrl - The WA URL to download
 * @returns Download result with file object reference
 */
export async function downloadResource(resourceUrl: string): Promise<DownloadResult> {
  // Get or create the mapping record
  let mapping = await prisma.waResourceMapping.findUnique({
    where: { waResourceUrl: resourceUrl },
  });

  if (!mapping) {
    mapping = await prisma.waResourceMapping.create({
      data: {
        waResourceUrl: resourceUrl,
        originalName: extractFilename(resourceUrl),
        mimeType: guessMimeType(resourceUrl),
        status: "pending",
      },
    });
  }

  // Skip if already processed
  if (mapping.status === "downloaded" && mapping.fileObjectId) {
    return {
      url: resourceUrl,
      success: true,
      fileObjectId: mapping.fileObjectId,
    };
  }

  try {
    // Fetch the resource
    const response = await fetch(resourceUrl, {
      headers: {
        "User-Agent": "Murmurant-Migration/1.0",
      },
      signal: AbortSignal.timeout(60000), // 60 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Get content type from response
    const contentType = response.headers.get("content-type") || mapping.mimeType || "application/octet-stream";

    // Read the data
    const arrayBuffer = await response.arrayBuffer();
    const data = Buffer.from(arrayBuffer);

    // Determine filename
    const filename = mapping.originalName || `resource-${mapping.id}`;

    // Upload to our storage
    const storage = getStorageAdapter();
    const storageKey = generateStorageKey(filename);
    const checksum = calculateChecksum(data);

    await storage.upload(storageKey, data, contentType);

    // Create FileObject record
    const fileObject = await prisma.fileObject.create({
      data: {
        name: filename,
        mimeType: contentType.split(";")[0].trim(), // Remove charset if present
        size: data.length,
        checksum,
        storageKey,
        description: `Migrated from Wild Apricot: ${resourceUrl}`,
        isPublic: false,
        // Note: uploadedById is null for system-imported files
      },
    });

    // Update the mapping
    await prisma.waResourceMapping.update({
      where: { id: mapping.id },
      data: {
        status: "downloaded",
        fileObjectId: fileObject.id,
        mimeType: contentType.split(";")[0].trim(),
      },
    });

    return {
      url: resourceUrl,
      success: true,
      fileObjectId: fileObject.id,
      storageKey,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Update the mapping with failure
    await prisma.waResourceMapping.update({
      where: { id: mapping.id },
      data: {
        status: "failed",
        failureReason: errorMessage.slice(0, 500), // Limit length
      },
    });

    return {
      url: resourceUrl,
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Download all pending resources in batches.
 *
 * @param batchSize - Number of concurrent downloads
 * @param maxResources - Maximum resources to process in this run
 * @param onProgress - Optional callback for progress updates
 */
export async function downloadPendingResources(
  batchSize = 5,
  maxResources = 100,
  onProgress?: (completed: number, total: number, result: DownloadResult) => void
): Promise<{ downloaded: number; failed: number }> {
  const pending = await getPendingResources(maxResources);
  let downloaded = 0;
  let failed = 0;

  // Process in batches
  for (let i = 0; i < pending.length; i += batchSize) {
    const batch = pending.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((resource) => downloadResource(resource.waResourceUrl))
    );

    for (const result of results) {
      if (result.success) {
        downloaded++;
      } else {
        failed++;
      }
      onProgress?.(downloaded + failed, pending.length, result);
    }
  }

  return { downloaded, failed };
}

/**
 * Retry failed downloads.
 *
 * @param maxRetries - Maximum resources to retry
 */
export async function retryFailedDownloads(
  maxRetries = 50
): Promise<{ retried: number; succeeded: number; failed: number }> {
  // Reset status to pending for retry
  const failedResources = await getFailedResources(maxRetries);

  await prisma.waResourceMapping.updateMany({
    where: {
      id: { in: failedResources.map((r) => r.id) },
    },
    data: {
      status: "pending",
      failureReason: null,
    },
  });

  // Download them
  const results = await downloadPendingResources(5, maxRetries);

  return {
    retried: failedResources.length,
    succeeded: results.downloaded,
    failed: results.failed,
  };
}

/**
 * Mark a resource to skip (not downloadable or not needed).
 */
export async function skipResource(resourceUrl: string, reason: string): Promise<void> {
  await prisma.waResourceMapping.updateMany({
    where: { waResourceUrl: resourceUrl },
    data: {
      status: "skipped",
      failureReason: reason.slice(0, 500),
    },
  });
}

// ============================================================================
// URL Mapping
// ============================================================================

/**
 * Get the internal URL for a previously downloaded WA resource.
 *
 * @param waUrl - Original WA resource URL
 * @returns Internal URL path or null if not downloaded
 */
export async function getInternalUrl(waUrl: string): Promise<string | null> {
  const mapping = await prisma.waResourceMapping.findUnique({
    where: { waResourceUrl: waUrl },
    include: { fileObject: true },
  });

  if (mapping?.status === "downloaded" && mapping.fileObject) {
    // Return the internal file API URL
    return `/api/v1/files/${mapping.fileObject.id}`;
  }

  return null;
}

/**
 * Build a URL mapping table for rewriting content.
 *
 * @returns Map of WA URL → internal URL
 */
export async function buildUrlMappingTable(): Promise<Map<string, string>> {
  const mappings = await prisma.waResourceMapping.findMany({
    where: { status: "downloaded" },
    include: { fileObject: true },
  });

  const urlMap = new Map<string, string>();

  for (const mapping of mappings) {
    if (mapping.fileObject) {
      urlMap.set(mapping.waResourceUrl, `/api/v1/files/${mapping.fileObject.id}`);
    }
  }

  return urlMap;
}
