/**
 * File Object Library - CRUD operations for file metadata
 *
 * Copyright (c) Santa Barbara Newcomers Club
 *
 * Charter Principles:
 * - P1: Identity provable (uploadedBy tracked)
 * - P2: Default deny (authorization checked via FileAccess)
 * - P7: Full audit trail (separate audit logging)
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  getStorageAdapter,
  generateStorageKey,
  calculateChecksum,
} from "./storage";
import type {
  CreateFileInput,
  UpdateFileInput,
  FileFilters,
  PaginationInput,
} from "./schemas";

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Create a new file record with storage upload.
 *
 * @param input - File metadata
 * @param fileData - Raw file contents
 * @param uploadedById - Member ID who uploaded the file
 */
export async function createFile(
  input: CreateFileInput,
  fileData: Buffer,
  uploadedById: string
) {
  const storage = getStorageAdapter();
  const storageKey = generateStorageKey(input.name);
  const checksum = calculateChecksum(fileData);

  // Upload to storage
  await storage.upload(storageKey, fileData, input.mimeType);

  // Create metadata record with tags in a transaction
  return prisma.$transaction(async (tx) => {
    const file = await tx.fileObject.create({
      data: {
        name: input.name,
        mimeType: input.mimeType,
        size: fileData.length,
        checksum,
        storageKey,
        description: input.description,
        isPublic: input.isPublic ?? false,
        uploadedById,
      },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        tags: true,
      },
    });

    // Add tags if provided
    if (input.tags && input.tags.length > 0) {
      await tx.fileTag.createMany({
        data: input.tags.map((tag) => ({
          fileId: file.id,
          tag,
        })),
      });
    }

    // Re-fetch with tags
    return tx.fileObject.findUnique({
      where: { id: file.id },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        tags: true,
      },
    });
  });
}

/**
 * Get file by ID.
 * Note: Authorization should be checked separately before calling this.
 */
export async function getFileById(id: string) {
  return prisma.fileObject.findUnique({
    where: { id },
    include: {
      uploadedBy: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      tags: true,
      accessList: {
        include: {
          grantedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      },
    },
  });
}

/**
 * Get file by storage key.
 */
export async function getFileByStorageKey(storageKey: string) {
  return prisma.fileObject.findUnique({
    where: { storageKey },
    include: {
      uploadedBy: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      tags: true,
    },
  });
}

/**
 * List files with optional filters and pagination.
 * Note: For authorization-filtered list, use getAuthorizedFiles() instead.
 */
export async function listFiles(
  filters: FileFilters = {},
  pagination: PaginationInput = { page: 1, limit: 20 }
) {
  const where: Prisma.FileObjectWhereInput = {};

  if (filters.tag) {
    where.tags = {
      some: { tag: filters.tag },
    };
  }
  if (filters.mimeType) {
    where.mimeType = filters.mimeType;
  }
  if (filters.uploadedById) {
    where.uploadedById = filters.uploadedById;
  }
  if (filters.isPublic !== undefined) {
    where.isPublic = filters.isPublic;
  }

  const [items, total] = await Promise.all([
    prisma.fileObject.findMany({
      where,
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
      orderBy: { createdAt: "desc" },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        tags: true,
      },
    }),
    prisma.fileObject.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}

/**
 * Get authorized files for a member.
 * Returns files the member can access based on their ID and role.
 */
export async function getAuthorizedFiles(
  fileIds: string[],
  filters: FileFilters = {},
  pagination: PaginationInput = { page: 1, limit: 20 }
) {
  const where: Prisma.FileObjectWhereInput = {
    id: { in: fileIds },
  };

  if (filters.tag) {
    where.tags = {
      some: { tag: filters.tag },
    };
  }
  if (filters.mimeType) {
    where.mimeType = filters.mimeType;
  }
  if (filters.uploadedById) {
    where.uploadedById = filters.uploadedById;
  }
  if (filters.isPublic !== undefined) {
    where.isPublic = filters.isPublic;
  }

  const [items, total] = await Promise.all([
    prisma.fileObject.findMany({
      where,
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
      orderBy: { createdAt: "desc" },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        tags: true,
      },
    }),
    prisma.fileObject.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}

/**
 * Update file metadata.
 * Note: Authorization (WRITE permission) should be checked before calling.
 */
export async function updateFile(id: string, data: UpdateFileInput) {
  return prisma.fileObject.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
    },
    include: {
      uploadedBy: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      tags: true,
    },
  });
}

/**
 * Delete a file (metadata and storage).
 * Note: Authorization (ADMIN permission) should be checked before calling.
 */
export async function deleteFile(id: string) {
  const file = await prisma.fileObject.findUnique({
    where: { id },
    select: { storageKey: true },
  });

  if (!file) {
    throw new Error("File not found");
  }

  // Delete from storage
  const storage = getStorageAdapter();
  await storage.delete(file.storageKey);

  // Delete metadata (cascades to FileAccess and FileTag)
  return prisma.fileObject.delete({
    where: { id },
  });
}

/**
 * Download file contents.
 * Note: Authorization should be checked before calling.
 */
export async function downloadFile(id: string) {
  const file = await prisma.fileObject.findUnique({
    where: { id },
    select: { storageKey: true, name: true, mimeType: true, checksum: true },
  });

  if (!file) {
    return null;
  }

  const storage = getStorageAdapter();
  const result = await storage.download(file.storageKey);

  if (!result) {
    return null;
  }

  return {
    data: result.data,
    name: file.name,
    mimeType: file.mimeType,
    checksum: file.checksum,
  };
}

// ============================================================================
// Tag Operations
// ============================================================================

/**
 * Add a tag to a file.
 */
export async function addFileTag(fileId: string, tag: string) {
  return prisma.fileTag.upsert({
    where: {
      fileId_tag: { fileId, tag },
    },
    create: { fileId, tag },
    update: {}, // No update needed, just ensure it exists
  });
}

/**
 * Remove a tag from a file.
 */
export async function removeFileTag(fileId: string, tag: string) {
  return prisma.fileTag.deleteMany({
    where: { fileId, tag },
  });
}

/**
 * List all unique tags in the system.
 */
export async function listAllTags() {
  const tags = await prisma.fileTag.findMany({
    select: { tag: true },
    distinct: ["tag"],
    orderBy: { tag: "asc" },
  });

  return tags.map((t: { tag: string }) => t.tag);
}

/**
 * Get files by tag.
 */
export async function getFilesByTag(tag: string, pagination: PaginationInput = { page: 1, limit: 20 }) {
  return listFiles({ tag }, pagination);
}
