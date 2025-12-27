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
import { createRevision, getActionSummary, getRevisionState } from "@/lib/publishing/revisions";
import { validateBlockData } from "@/lib/publishing/blockSchemas";
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

const updateBlockSchema = z.object({
  blockId: z.string().uuid(),
  data: z.record(z.string(), z.unknown()),
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

    // Create revision before applying change (A7)
    if (content) {
      await createRevision({
        pageId: id,
        content,
        action: "reorder",
        actionSummary: getActionSummary("reorder"),
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
      before: { blockOrder: beforeOrder },
      after: { blockOrder: blockIds },
      metadata: { operation: "reorder_blocks" },
    });

    // Get updated revision state (A7)
    const revisionState = await getRevisionState(id);

    return NextResponse.json({
      page: updatedPage,
      blocks: reorderedBlocks,
      message: "Blocks reordered",
      revisionState,
    });
  }

  // Handle update block action
  if (action === "update") {
    const parsed = updateBlockSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid request", errors: parsed.error.issues },
        { status: 400 }
      );
    }

    const { blockId, data } = parsed.data;

    // Find the block to update
    const blockIndex = currentBlocks.findIndex((b) => b.id === blockId);
    if (blockIndex === -1) {
      return NextResponse.json(
        { error: "Bad Request", message: `Block not found: ${blockId}` },
        { status: 400 }
      );
    }

    const originalBlock = currentBlocks[blockIndex];
    const blockType = originalBlock.type;

    // Validate data against block type schema
    // For editable block types, strict validation is enforced
    // For read-only block types, validation is permissive (passthrough)
    const schemaValidation = validateBlockData(blockType, data);
    if (!schemaValidation.ok) {
      return NextResponse.json(
        { error: "Bad Request", message: schemaValidation.error },
        { status: 400 }
      );
    }

    // Use validated/cleaned data (schema may strip unknown keys for simple types)
    const validatedData = schemaValidation.data as Record<string, unknown>;

    // Type assertion needed because Block is a discriminated union
    const updatedBlock = {
      ...originalBlock,
      data: validatedData as typeof originalBlock.data,
    } as Block;

    // Build updated blocks array
    const updatedBlocks: Block[] = [...currentBlocks];
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
        actionSummary: getActionSummary("edit_block", blockType),
        memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
      });
    }

    // Validate overall page content structure
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
      before: { blockId, blockType: originalBlock.type, data: originalBlock.data },
      after: { blockId, blockType: updatedBlock.type, data: validatedData },
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

  // Create revision before applying change (A7)
  if (content) {
    await createRevision({
      pageId: id,
      content,
      action: "add_block",
      actionSummary: getActionSummary("add_block", type),
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
    action: "CREATE",
    resourceType: "page",
    resourceId: page.id,
    memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
    after: { blockId: newBlock.id, blockType: type, position: insertIndex },
    metadata: { operation: "add_block" },
  });

  // Get updated revision state (A7)
  const revisionState = await getRevisionState(id);

  return NextResponse.json(
    {
      page: updatedPage,
      block: newBlock,
      message: "Block added",
      revisionState,
    },
    { status: 201 }
  );
}
