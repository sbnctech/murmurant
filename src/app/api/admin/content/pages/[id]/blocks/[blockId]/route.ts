// Copyright (c) Santa Barbara Newcomers Club
// Individual block management API - Update block, Delete block

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/auth";
import { createAuditLog } from "@/lib/publishing/permissions";
import {
  validatePageContent,
  type Block,
  type PageContent,
} from "@/lib/publishing/blocks";
import { createRevision, getActionSummary, getRevisionState } from "@/lib/publishing/revisions";
import { z } from "zod";

type RouteParams = {
  params: Promise<{ id: string; blockId: string }>;
};

// URL validation - rejects javascript:, vbscript:, data: (except images)
function isValidUrl(url: string): boolean {
  if (!url) return true; // Empty is allowed for optional fields

  // Allow relative paths, anchors, and mailto
  if (url.startsWith("/") || url.startsWith("#") || url.startsWith("mailto:")) {
    return true;
  }

  // Allow http/https
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return true;
  }

  // Allow data URLs only for images
  if (url.startsWith("data:image/")) {
    return true;
  }

  // Reject everything else (javascript:, vbscript:, data:text, etc.)
  return false;
}

// Recursively validate URLs in block data
function validateBlockUrls(data: unknown): string[] {
  const errors: string[] = [];

  if (!data || typeof data !== "object") return errors;

  const urlFields = ["link", "linkUrl", "src", "backgroundImage", "ctaLink", "href"];

  function checkObject(obj: Record<string, unknown>, path: string) {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      if (urlFields.includes(key) && typeof value === "string" && value) {
        if (!isValidUrl(value)) {
          errors.push(`Invalid URL in ${currentPath}: unsafe protocol`);
        }
      }

      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (item && typeof item === "object") {
            checkObject(item as Record<string, unknown>, `${currentPath}[${index}]`);
          }
        });
      } else if (value && typeof value === "object") {
        checkObject(value as Record<string, unknown>, currentPath);
      }
    }
  }

  checkObject(data as Record<string, unknown>, "");
  return errors;
}

// Update block schema - only data can be updated, not id/type/order
const updateBlockSchema = z.object({
  data: z.record(z.string(), z.unknown()),
});

/**
 * PATCH /api/admin/content/pages/[id]/blocks/[blockId]
 * Update a block's content data
 * Requires publishing:manage capability
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "publishing:manage");
  if (!auth.ok) return auth.response;

  const { id, blockId } = await params;

  // Get existing page
  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) {
    return NextResponse.json(
      { error: "Not Found", message: "Page not found" },
      { status: 404 }
    );
  }

  // Parse and validate existing content
  const content = page.content as PageContent | null;
  const currentBlocks: Block[] = content?.blocks || [];

  // Find the block to update
  const blockIndex = currentBlocks.findIndex((b) => b.id === blockId);
  if (blockIndex === -1) {
    return NextResponse.json(
      { error: "Not Found", message: "Block not found" },
      { status: 404 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = updateBlockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid request", errors: parsed.error.issues },
      { status: 400 }
    );
  }

  const { data: newData } = parsed.data;

  // Validate URLs in the new data
  const urlErrors = validateBlockUrls(newData);
  if (urlErrors.length > 0) {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid URLs detected", errors: urlErrors },
      { status: 400 }
    );
  }

  // Update the block
  const existingBlock = currentBlocks[blockIndex];
  const beforeData = existingBlock.data;
  const updatedBlock: Block = {
    ...existingBlock,
    data: newData,
  } as Block;

  // Build new blocks array
  const updatedBlocks = [...currentBlocks];
  updatedBlocks[blockIndex] = updatedBlock;

  const newContent: PageContent = {
    schemaVersion: content?.schemaVersion || 1,
    blocks: updatedBlocks,
  };

  // Create revision before applying change (A7)
  if (content) {
    await createRevision({
      pageId: id,
      content,
      action: "edit_block",
      actionSummary: getActionSummary("edit_block", existingBlock.type),
      memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
    });
  }

  // Validate new content
  const validation = validatePageContent(newContent);
  if (!validation.valid) {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid content", errors: validation.errors },
      { status: 400 }
    );
  }

  // Update page
  const updatedPage = await prisma.page.update({
    where: { id },
    data: {
      content: newContent as object,
      updatedById: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
    },
  });

  // Audit log
  await createAuditLog({
    action: "UPDATE",
    resourceType: "page",
    resourceId: page.id,
    memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
    before: { blockId, blockType: existingBlock.type, data: beforeData },
    after: { blockId, blockType: existingBlock.type, data: newData },
    metadata: { operation: "update_block" },
  });

  // Get updated revision state (A7)
  const revisionState = await getRevisionState(id);

  return NextResponse.json({
    page: updatedPage,
    block: updatedBlock,
    message: "Block updated",
    revisionState,
  });
}

/**
 * DELETE /api/admin/content/pages/[id]/blocks/[blockId]
 * Remove a block from the page
 * Requires publishing:manage capability
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "publishing:manage");
  if (!auth.ok) return auth.response;

  const { id, blockId } = await params;

  // Get existing page
  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) {
    return NextResponse.json(
      { error: "Not Found", message: "Page not found" },
      { status: 404 }
    );
  }

  // Parse and validate existing content
  const content = page.content as PageContent | null;
  const currentBlocks: Block[] = content?.blocks || [];

  // Find the block to delete
  const blockIndex = currentBlocks.findIndex((b) => b.id === blockId);
  if (blockIndex === -1) {
    return NextResponse.json(
      { error: "Not Found", message: "Block not found" },
      { status: 404 }
    );
  }

  const deletedBlock = currentBlocks[blockIndex];

  // Remove block and reorder remaining
  const updatedBlocks = currentBlocks
    .filter((b) => b.id !== blockId)
    .map((block, index) => ({ ...block, order: index }));

  const newContent: PageContent = {
    schemaVersion: content?.schemaVersion || 1,
    blocks: updatedBlocks,
  };

  // Create revision before applying change (A7)
  if (content) {
    await createRevision({
      pageId: id,
      content,
      action: "remove_block",
      actionSummary: getActionSummary("remove_block", deletedBlock.type),
      memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
    });
  }

  // Validate new content (should always pass after delete)
  const validation = validatePageContent(newContent);
  if (!validation.valid) {
    return NextResponse.json(
      { error: "Internal Error", message: "Content validation failed", errors: validation.errors },
      { status: 500 }
    );
  }

  // Update page
  const updatedPage = await prisma.page.update({
    where: { id },
    data: {
      content: newContent as object,
      updatedById: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
    },
  });

  // Audit log
  await createAuditLog({
    action: "DELETE",
    resourceType: "page",
    resourceId: page.id,
    memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
    before: { blockId, blockType: deletedBlock.type, position: blockIndex },
    metadata: { operation: "delete_block" },
  });

  // Get updated revision state (A7)
  const revisionState = await getRevisionState(id);

  return NextResponse.json({
    page: updatedPage,
    deletedBlockId: blockId,
    message: "Block deleted",
    revisionState,
  });
}
