// Copyright (c) Santa Barbara Newcomers Club
// Block management API - Add block, Reorder blocks

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/auth";
import { createAuditLog } from "@/lib/publishing/permissions";
import {
  createEmptyBlock,
  validatePageContent,
  type BlockType,
  type Block,
  type PageContent,
} from "@/lib/publishing/blocks";
import { z } from "zod";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// Validation schemas
const addBlockSchema = z.object({
  type: z.enum([
    "hero",
    "text",
    "image",
    "cards",
    "event-list",
    "gallery",
    "faq",
    "contact",
    "cta",
    "divider",
    "spacer",
  ]),
  afterBlockId: z.string().uuid().optional(),
});

const reorderSchema = z.object({
  blockIds: z.array(z.string().uuid()).min(1),
});

/**
 * POST /api/admin/content/pages/[id]/blocks
 * Add a new block to the page or reorder blocks
 * Query param: ?action=reorder for reorder operation
 * Requires publishing:manage capability
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "publishing:manage");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Handle reorder action
  if (action === "reorder") {
    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid request", errors: parsed.error.issues },
        { status: 400 }
      );
    }

    const { blockIds } = parsed.data;

    // Verify all blockIds exist in current blocks
    const existingIds = new Set(currentBlocks.map((b) => b.id));
    const missingIds = blockIds.filter((id) => !existingIds.has(id));
    if (missingIds.length > 0) {
      return NextResponse.json(
        { error: "Bad Request", message: `Block IDs not found: ${missingIds.join(", ")}` },
        { status: 400 }
      );
    }

    // Verify no blocks are missing from reorder list
    if (blockIds.length !== currentBlocks.length) {
      return NextResponse.json(
        { error: "Bad Request", message: "Reorder must include all existing block IDs" },
        { status: 400 }
      );
    }

    // Build new blocks array with updated order
    const blockMap = new Map(currentBlocks.map((b) => [b.id, b]));
    const reorderedBlocks = blockIds.map((blockId, index) => {
      const block = blockMap.get(blockId)!;
      return { ...block, order: index };
    });

    const beforeOrder = currentBlocks.map((b) => b.id);
    const newContent: PageContent = {
      schemaVersion: content?.schemaVersion || 1,
      blocks: reorderedBlocks,
    };

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
      before: { blockOrder: beforeOrder },
      after: { blockOrder: blockIds },
      metadata: { operation: "reorder_blocks" },
    });

    return NextResponse.json({
      page: updatedPage,
      blocks: reorderedBlocks,
      message: "Blocks reordered",
    });
  }

  // Handle add block action (default)
  const parsed = addBlockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid request", errors: parsed.error.issues },
      { status: 400 }
    );
  }

  const { type, afterBlockId } = parsed.data;

  // Determine insertion position
  let insertIndex = currentBlocks.length; // Default: append to end
  if (afterBlockId) {
    const afterIndex = currentBlocks.findIndex((b) => b.id === afterBlockId);
    if (afterIndex === -1) {
      return NextResponse.json(
        { error: "Bad Request", message: `Block not found: ${afterBlockId}` },
        { status: 400 }
      );
    }
    insertIndex = afterIndex + 1;
  }

  // Create new block
  const newBlock = createEmptyBlock(type as BlockType, insertIndex);

  // Update orders of blocks after insertion point
  const updatedBlocks: Block[] = [];
  for (let i = 0; i < currentBlocks.length; i++) {
    const block = currentBlocks[i];
    if (i < insertIndex) {
      updatedBlocks.push(block);
    } else {
      updatedBlocks.push({ ...block, order: block.order + 1 });
    }
  }

  // Insert new block at correct position
  updatedBlocks.splice(insertIndex, 0, newBlock);

  const newContent: PageContent = {
    schemaVersion: content?.schemaVersion || 1,
    blocks: updatedBlocks,
  };

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
    action: "CREATE",
    resourceType: "page",
    resourceId: page.id,
    memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
    after: { blockId: newBlock.id, blockType: type, position: insertIndex },
    metadata: { operation: "add_block" },
  });

  return NextResponse.json(
    {
      page: updatedPage,
      block: newBlock,
      message: "Block added",
    },
    { status: 201 }
  );
}
