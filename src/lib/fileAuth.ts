/**
 * File Authorization Library
 *
 * Provides permission-aware file access control.
 *
 * Charter Principles:
 * - P2: Default deny, least privilege
 * - P9: Fail closed
 */

import { prisma } from "@/lib/prisma";
import { AuthContext, GlobalRole, hasCapability } from "@/lib/auth";
import { FilePrincipalType, FilePermission } from "@prisma/client";

/**
 * Check if user can read a file.
 *
 * Access is granted if:
 * 1. User has files:view_all capability (admin)
 * 2. File is public
 * 3. User uploaded the file
 * 4. User has explicit READ access via FileAccess
 * 5. User's role has explicit READ access via FileAccess
 */
export async function canReadFile(
  auth: AuthContext,
  fileId: string
): Promise<boolean> {
  // Admin can read any file
  if (hasCapability(auth.globalRole, "files:view_all")) {
    return true;
  }

  const file = await prisma.fileObject.findUnique({
    where: { id: fileId },
    include: {
      accessList: true,
    },
  });

  if (!file) return false;

  // Public files are readable by anyone authenticated
  if (file.isPublic) return true;

  // Owner can always read their files
  if (file.uploadedById === auth.memberId) return true;

  // Check explicit access grants
  const now = new Date();
  for (const access of file.accessList) {
    // Skip expired grants
    if (access.expiresAt && access.expiresAt < now) continue;

    // Check permission level (READ, WRITE, or ADMIN all grant read access)
    const hasReadPermission = [
      FilePermission.READ,
      FilePermission.WRITE,
      FilePermission.ADMIN,
    ].includes(access.permission);

    if (!hasReadPermission) continue;

    // User-level access
    if (
      access.principalType === FilePrincipalType.USER &&
      access.principalId === auth.memberId
    ) {
      return true;
    }

    // Role-level access
    if (
      access.principalType === FilePrincipalType.ROLE &&
      access.principalId === auth.globalRole
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Check if user can write (update metadata) to a file.
 */
export async function canWriteFile(
  auth: AuthContext,
  fileId: string
): Promise<boolean> {
  // Admin can write any file
  if (hasCapability(auth.globalRole, "files:manage")) {
    return true;
  }

  const file = await prisma.fileObject.findUnique({
    where: { id: fileId },
    include: {
      accessList: true,
    },
  });

  if (!file) return false;

  // Owner can write their files
  if (file.uploadedById === auth.memberId) return true;

  // Check explicit WRITE or ADMIN access grants
  const now = new Date();
  for (const access of file.accessList) {
    if (access.expiresAt && access.expiresAt < now) continue;

    const hasWritePermission = (
      [FilePermission.WRITE, FilePermission.ADMIN] as FilePermission[]
    ).includes(access.permission);

    if (!hasWritePermission) continue;

    if (
      access.principalType === FilePrincipalType.USER &&
      access.principalId === auth.memberId
    ) {
      return true;
    }

    if (
      access.principalType === FilePrincipalType.ROLE &&
      access.principalId === auth.globalRole
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Check if user can delete a file or manage its permissions.
 */
export async function canAdminFile(
  auth: AuthContext,
  fileId: string
): Promise<boolean> {
  // Admin can manage any file
  if (hasCapability(auth.globalRole, "files:manage")) {
    return true;
  }

  const file = await prisma.fileObject.findUnique({
    where: { id: fileId },
    include: {
      accessList: true,
    },
  });

  if (!file) return false;

  // Owner can manage their files
  if (file.uploadedById === auth.memberId) return true;

  // Check explicit ADMIN access grants
  const now = new Date();
  for (const access of file.accessList) {
    if (access.expiresAt && access.expiresAt < now) continue;

    if (access.permission !== FilePermission.ADMIN) continue;

    if (
      access.principalType === FilePrincipalType.USER &&
      access.principalId === auth.memberId
    ) {
      return true;
    }

    if (
      access.principalType === FilePrincipalType.ROLE &&
      access.principalId === auth.globalRole
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Build a Prisma WHERE clause for files the user can see.
 *
 * Returns a filter that matches files the user is authorized to view.
 */
export function buildFileAccessFilter(auth: AuthContext): object {
  // Admin sees all files
  if (hasCapability(auth.globalRole, "files:view_all")) {
    return {};
  }

  const now = new Date();

  return {
    OR: [
      // Public files
      { isPublic: true },
      // Files user uploaded
      { uploadedById: auth.memberId },
      // Files with explicit user access
      {
        accessList: {
          some: {
            principalType: FilePrincipalType.USER,
            principalId: auth.memberId,
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        },
      },
      // Files with role access
      {
        accessList: {
          some: {
            principalType: FilePrincipalType.ROLE,
            principalId: auth.globalRole,
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        },
      },
    ],
  };
}

/**
 * Grant access to a file for a user or role.
 */
export async function grantFileAccess(params: {
  fileId: string;
  principalType: FilePrincipalType;
  principalId: string;
  permission: FilePermission;
  grantedById: string;
  expiresAt?: Date;
}): Promise<void> {
  await prisma.fileAccess.upsert({
    where: {
      fileId_principalType_principalId_permission: {
        fileId: params.fileId,
        principalType: params.principalType,
        principalId: params.principalId,
        permission: params.permission,
      },
    },
    create: {
      fileId: params.fileId,
      principalType: params.principalType,
      principalId: params.principalId,
      permission: params.permission,
      grantedById: params.grantedById,
      expiresAt: params.expiresAt,
    },
    update: {
      grantedById: params.grantedById,
      expiresAt: params.expiresAt,
    },
  });
}

/**
 * Revoke file access.
 */
export async function revokeFileAccess(params: {
  fileId: string;
  principalType: FilePrincipalType;
  principalId: string;
  permission: FilePermission;
}): Promise<void> {
  await prisma.fileAccess.deleteMany({
    where: {
      fileId: params.fileId,
      principalType: params.principalType,
      principalId: params.principalId,
      permission: params.permission,
    },
  });
}

/**
 * Add a tag to a file.
 */
export async function addFileTag(fileId: string, tag: string): Promise<void> {
  await prisma.fileTag.upsert({
    where: {
      fileId_tag: { fileId, tag },
    },
    create: { fileId, tag },
    update: {},
  });
}

/**
 * Remove a tag from a file.
 */
export async function removeFileTag(fileId: string, tag: string): Promise<void> {
  await prisma.fileTag.deleteMany({
    where: { fileId, tag },
  });
}

/**
 * Get roles that can be granted file access.
 */
export function getGrantableRoles(): GlobalRole[] {
  return [
    "admin",
    "president",
    "past-president",
    "vp-activities",
    "event-chair",
    "webmaster",
    "secretary",
    "parliamentarian",
    "member",
  ];
}
