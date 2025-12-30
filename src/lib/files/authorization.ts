/**
 * File Authorization Functions
 *
 * Copyright © 2025 Murmurant, Inc.
 *
 * Charter Principles:
 * - P2: Default deny, least privilege
 * - P9: Fail closed (no access without explicit grant)
 *
 * Access is granted through FileAccess entries or:
 * - Uploader always has ADMIN permission on their files
 * - Public files (isPublic=true) grant READ to everyone
 * - admin:full capability bypasses access checks
 */

import { prisma } from "@/lib/prisma";
import {
  FilePrincipalType,
  FilePermission,
  FileAccess,
} from "@prisma/client";
import { GlobalRole, hasCapability } from "@/lib/auth";

// ============================================================================
// Permission Hierarchy
// ============================================================================

/**
 * Permission hierarchy: ADMIN > WRITE > READ
 * Higher permissions implicitly include lower permissions.
 */
const PERMISSION_HIERARCHY: Record<FilePermission, FilePermission[]> = {
  ADMIN: ["ADMIN", "WRITE", "READ"],
  WRITE: ["WRITE", "READ"],
  READ: ["READ"],
};

/**
 * Check if a permission level satisfies the required permission.
 */
function permissionSatisfies(
  granted: FilePermission,
  required: FilePermission
): boolean {
  return PERMISSION_HIERARCHY[granted].includes(required);
}

// ============================================================================
// Authorization Check Functions
// ============================================================================

/**
 * Check if a member can access a file with the required permission level.
 *
 * Access is granted if ANY of the following is true:
 * 1. Member has admin:full capability (full admin)
 * 2. Member is the file uploader (implicit ADMIN)
 * 3. File is public AND required permission is READ
 * 4. Member has a direct USER access grant
 * 5. Member's role has a ROLE access grant
 * 6. Member is in a GROUP with access grant
 *
 * Charter P2/P9: Default deny - all checks must pass.
 */
export async function canAccessFile(
  fileId: string,
  memberId: string,
  memberRole: GlobalRole,
  requiredPermission: FilePermission
): Promise<boolean> {
  // 1. Admin bypass
  if (hasCapability(memberRole, "admin:full")) {
    return true;
  }

  // Fetch file and access entries in one query
  const file = await prisma.fileObject.findUnique({
    where: { id: fileId },
    include: {
      accessList: {
        where: {
          OR: [
            // Not expired
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      },
    },
  });

  if (!file) {
    return false;
  }

  // 2. Uploader has implicit ADMIN
  if (file.uploadedById === memberId) {
    return true; // Uploader can do anything
  }

  // 3. Public files grant READ to everyone
  if (file.isPublic && requiredPermission === "READ") {
    return true;
  }

  // 4. Check direct USER grant
  const userGrant = file.accessList.find(
    (access: FileAccess) =>
      access.principalType === "USER" &&
      access.principalId === memberId &&
      permissionSatisfies(access.permission, requiredPermission)
  );
  if (userGrant) {
    return true;
  }

  // 5. Check ROLE grant
  const roleGrant = file.accessList.find(
    (access: FileAccess) =>
      access.principalType === "ROLE" &&
      access.principalId === memberRole &&
      permissionSatisfies(access.permission, requiredPermission)
  );
  if (roleGrant) {
    return true;
  }

  // 6. Check GROUP grants (requires fetching member's groups)
  // For now, GROUP is a placeholder for future committee/custom group support
  // Groups would be resolved through a separate membership table

  // Default deny
  return false;
}

/**
 * Get all files a member can access with at least READ permission.
 * Returns file IDs that the member is authorized to see.
 *
 * This is used for the "authorized files" endpoint.
 * Uses a single efficient query to find accessible files.
 */
export async function getAuthorizedFileIds(
  memberId: string,
  memberRole: GlobalRole
): Promise<string[]> {
  // Admin sees everything
  if (hasCapability(memberRole, "admin:full")) {
    const allFiles = await prisma.fileObject.findMany({
      select: { id: true },
    });
    return allFiles.map((f: { id: string }) => f.id);
  }

  // Build the query for authorized files
  // A file is authorized if:
  // 1. Member uploaded it
  // 2. File is public
  // 3. Member has a USER access grant
  // 4. Member's role has a ROLE access grant

  const now = new Date();

  const authorizedFiles = await prisma.fileObject.findMany({
    where: {
      OR: [
        // Uploaded by this member
        { uploadedById: memberId },
        // Public files
        { isPublic: true },
        // Has USER access grant
        {
          accessList: {
            some: {
              principalType: "USER",
              principalId: memberId,
              OR: [
                { expiresAt: null },
                { expiresAt: { gt: now } },
              ],
            },
          },
        },
        // Has ROLE access grant for member's role
        {
          accessList: {
            some: {
              principalType: "ROLE",
              principalId: memberRole,
              OR: [
                { expiresAt: null },
                { expiresAt: { gt: now } },
              ],
            },
          },
        },
      ],
    },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });

  return authorizedFiles.map((f: { id: string }) => f.id);
}

/**
 * Get the highest permission level a member has on a file.
 * Returns null if no access.
 */
export async function getEffectivePermission(
  fileId: string,
  memberId: string,
  memberRole: GlobalRole
): Promise<FilePermission | null> {
  // Admin has ADMIN on everything
  if (hasCapability(memberRole, "admin:full")) {
    return "ADMIN";
  }

  const file = await prisma.fileObject.findUnique({
    where: { id: fileId },
    include: {
      accessList: {
        where: {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      },
    },
  });

  if (!file) {
    return null;
  }

  // Uploader has ADMIN
  if (file.uploadedById === memberId) {
    return "ADMIN";
  }

  // Collect all applicable grants
  const permissions: FilePermission[] = [];

  // Public files grant READ
  if (file.isPublic) {
    permissions.push("READ");
  }

  // USER grants
  file.accessList
    .filter((a: FileAccess) => a.principalType === "USER" && a.principalId === memberId)
    .forEach((a: FileAccess) => permissions.push(a.permission));

  // ROLE grants
  file.accessList
    .filter((a: FileAccess) => a.principalType === "ROLE" && a.principalId === memberRole)
    .forEach((a: FileAccess) => permissions.push(a.permission));

  // Return highest permission
  if (permissions.includes("ADMIN")) return "ADMIN";
  if (permissions.includes("WRITE")) return "WRITE";
  if (permissions.includes("READ")) return "READ";

  return null;
}

// ============================================================================
// Access Grant Management
// ============================================================================

/**
 * Grant access to a file.
 * Requires ADMIN permission on the file.
 */
export async function grantFileAccess(
  fileId: string,
  principalType: FilePrincipalType,
  principalId: string,
  permission: FilePermission,
  grantedById: string,
  expiresAt?: Date
) {
  return prisma.fileAccess.upsert({
    where: {
      fileId_principalType_principalId_permission: {
        fileId,
        principalType,
        principalId,
        permission,
      },
    },
    create: {
      fileId,
      principalType,
      principalId,
      permission,
      grantedById,
      expiresAt,
    },
    update: {
      grantedById,
      expiresAt,
    },
  });
}

/**
 * Revoke access from a file.
 * If permission is not specified, revokes all permissions for the principal.
 */
export async function revokeFileAccess(
  fileId: string,
  principalType: FilePrincipalType,
  principalId: string,
  permission?: FilePermission
) {
  if (permission) {
    // Revoke specific permission
    return prisma.fileAccess.deleteMany({
      where: {
        fileId,
        principalType,
        principalId,
        permission,
      },
    });
  } else {
    // Revoke all permissions for this principal
    return prisma.fileAccess.deleteMany({
      where: {
        fileId,
        principalType,
        principalId,
      },
    });
  }
}

/**
 * List all access grants for a file.
 */
export async function listFileAccess(fileId: string) {
  return prisma.fileAccess.findMany({
    where: { fileId },
    include: {
      grantedBy: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}
