/**
 * Wild Apricot Profile Photo Import
 *
 * Copyright © 2025 Murmurant, Inc.
 *
 * Imports member profile photos from Wild Apricot and stores them
 * in Murmurant file storage.
 *
 * Charter Principles:
 * - P1: Audit trail (WaIdMapping tracks import status)
 * - P5: Reversibility (original WA URLs preserved in waRawData)
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getStorageAdapter, generateStorageKey, calculateChecksum } from "@/lib/files/storage";

// ============================================================================
// Photo URL Detection
// ============================================================================

/**
 * Patterns for WA profile photo URLs.
 */
const PHOTO_URL_PATTERNS = [
  // Standard WA profile pictures
  /https?:\/\/[a-z0-9-]+\.wildapricot\.org\/[^"'\s]*\/Pictures\/[^"'\s]+/i,
  // CDN-hosted profile pictures
  /https?:\/\/cdn\.wildapricot\.org\/[^"'\s]*\/Pictures\/[^"'\s]+/i,
  // S3-hosted profile pictures
  /https?:\/\/s3\.amazonaws\.com\/wasc-[^"'\s]*\/Pictures\/[^"'\s]+/i,
];

/**
 * Extract profile photo URL from waRawData.
 * Looks for the Picture field value in the stored WA data.
 */
export function extractPhotoUrl(waRawData: unknown): string | null {
  if (!waRawData || typeof waRawData !== "object") {
    return null;
  }

  const data = waRawData as Record<string, unknown>;

  // Check fieldValues for Picture field
  const fieldValues = data.fieldValues as Record<string, unknown> | undefined;
  if (fieldValues) {
    // Try common picture field names
    const pictureFieldNames = [
      "Picture",
      "Profile Picture",
      "Photo",
      "ProfilePicture",
      "Picture (Picture)",
    ];

    for (const fieldName of pictureFieldNames) {
      const value = fieldValues[fieldName];
      if (typeof value === "string" && isPhotoUrl(value)) {
        return value;
      }
      // Sometimes the value is an object with a URL property
      if (value && typeof value === "object" && "Url" in (value as Record<string, unknown>)) {
        const url = (value as Record<string, unknown>).Url;
        if (typeof url === "string" && isPhotoUrl(url)) {
          return url;
        }
      }
    }
  }

  // Also check if there's a direct profilePictureUrl field
  if (typeof data.profilePictureUrl === "string" && isPhotoUrl(data.profilePictureUrl)) {
    return data.profilePictureUrl;
  }

  return null;
}

/**
 * Check if a URL looks like a WA profile photo URL.
 */
function isPhotoUrl(url: string): boolean {
  return PHOTO_URL_PATTERNS.some((pattern) => pattern.test(url));
}

// ============================================================================
// Photo Import
// ============================================================================

export interface PhotoImportResult {
  memberId: string;
  memberName: string;
  success: boolean;
  fileObjectId?: string;
  photoUrl?: string;
  error?: string;
}

export interface PhotoImportStats {
  total: number;
  withPhotoUrl: number;
  alreadyImported: number;
  imported: number;
  failed: number;
}

/**
 * Import a single member's profile photo.
 */
export async function importMemberPhoto(memberId: string): Promise<PhotoImportResult> {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      waRawData: true,
      profilePhotoId: true,
    },
  });

  if (!member) {
    return {
      memberId,
      memberName: "Unknown",
      success: false,
      error: "Member not found",
    };
  }

  const memberName = `${member.firstName} ${member.lastName}`;

  // Skip if already has profile photo
  if (member.profilePhotoId) {
    return {
      memberId,
      memberName,
      success: true,
      fileObjectId: member.profilePhotoId,
    };
  }

  // Extract photo URL from waRawData
  const photoUrl = extractPhotoUrl(member.waRawData);

  if (!photoUrl) {
    return {
      memberId,
      memberName,
      success: false,
      error: "No photo URL found in waRawData",
    };
  }

  try {
    // Download the photo
    const response = await fetch(photoUrl, {
      headers: {
        "User-Agent": "Murmurant-Migration/1.0",
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Get content type and data
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const data = Buffer.from(arrayBuffer);

    // Generate filename
    const filename = `profile-${member.firstName}-${member.lastName}.${getExtension(contentType)}`;

    // Upload to storage
    const storage = getStorageAdapter();
    const storageKey = generateStorageKey(filename);
    const checksum = calculateChecksum(data);

    await storage.upload(storageKey, data, contentType);

    // Create FileObject record
    const fileObject = await prisma.fileObject.create({
      data: {
        name: filename,
        mimeType: contentType.split(";")[0].trim(),
        size: data.length,
        checksum,
        storageKey,
        description: `Profile photo for ${memberName}`,
        isPublic: false,
      },
    });

    // Update member with profile photo
    await prisma.member.update({
      where: { id: memberId },
      data: { profilePhotoId: fileObject.id },
    });

    return {
      memberId,
      memberName,
      success: true,
      fileObjectId: fileObject.id,
      photoUrl,
    };
  } catch (error) {
    return {
      memberId,
      memberName,
      success: false,
      photoUrl,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get file extension from MIME type.
 */
function getExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
  };
  return extensions[mimeType.split(";")[0].trim()] || "jpg";
}

/**
 * Import photos for all members with waRawData that contains photo URLs.
 */
export async function importAllMemberPhotos(
  batchSize = 10,
  maxMembers = 100,
  onProgress?: (completed: number, total: number, result: PhotoImportResult) => void
): Promise<PhotoImportStats> {
  // Find members with waRawData but no profile photo
  const members = await prisma.member.findMany({
    where: {
      waRawData: { not: Prisma.DbNull },
      profilePhotoId: null,
    },
    select: { id: true },
    take: maxMembers,
  });

  const stats: PhotoImportStats = {
    total: members.length,
    withPhotoUrl: 0,
    alreadyImported: 0,
    imported: 0,
    failed: 0,
  };

  // Process in batches
  for (let i = 0; i < members.length; i += batchSize) {
    const batch = members.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((m) => importMemberPhoto(m.id))
    );

    for (const result of results) {
      if (result.success && result.fileObjectId) {
        if (result.photoUrl) {
          stats.imported++;
          stats.withPhotoUrl++;
        } else {
          stats.alreadyImported++;
        }
      } else if (result.error === "No photo URL found in waRawData") {
        // Not an error, just no photo
      } else {
        stats.failed++;
        if (result.photoUrl) {
          stats.withPhotoUrl++;
        }
      }

      onProgress?.(i + results.indexOf(result) + 1, members.length, result);
    }
  }

  return stats;
}

/**
 * Get stats about member profile photos.
 */
export async function getPhotoImportStats(): Promise<{
  totalMembers: number;
  withProfilePhoto: number;
  withWaRawData: number;
  potentialPhotos: number;
}> {
  const [totalMembers, withProfilePhoto, withWaRawData] = await Promise.all([
    prisma.member.count(),
    prisma.member.count({ where: { profilePhotoId: { not: null } } }),
    prisma.member.count({ where: { waRawData: { not: Prisma.DbNull } } }),
  ]);

  // Count how many members with waRawData have photo URLs
  // This requires checking the JSON data which is more expensive
  const membersWithWaData = await prisma.member.findMany({
    where: { waRawData: { not: Prisma.DbNull } },
    select: { waRawData: true },
  });

  let potentialPhotos = 0;
  for (const member of membersWithWaData) {
    if (extractPhotoUrl(member.waRawData)) {
      potentialPhotos++;
    }
  }

  return {
    totalMembers,
    withProfilePhoto,
    withWaRawData,
    potentialPhotos,
  };
}
