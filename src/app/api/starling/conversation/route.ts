// Copyright (c) Murmurant, Inc.
// Starling conversation API - retrieve current conversation

import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Conversation, ChatMessage } from "@/lib/starling";

/**
 * GET /api/starling/conversation
 * Get the user's most recent conversation
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the most recent conversation for this user
    const dbConversation = await prisma.starlingConversation.findFirst({
      where: { userId: session.userAccountId },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!dbConversation) {
      return NextResponse.json({ conversation: null });
    }

    // Transform to API format
    const conversation: Conversation = {
      id: dbConversation.id,
      userId: dbConversation.userId,
      createdAt: dbConversation.createdAt,
      updatedAt: dbConversation.updatedAt,
      messages: dbConversation.messages.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: m.createdAt,
        intent: m.intent ?? undefined,
        confidence: m.confidence ?? undefined,
        actionType: m.actionType as ChatMessage["actionType"],
      })),
    };

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("Starling conversation retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve conversation" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/starling/conversation
 * Clear the user's conversation history
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete all conversations for this user
    await prisma.starlingConversation.deleteMany({
      where: { userId: session.userAccountId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Starling conversation deletion error:", error);
    return NextResponse.json(
      { error: "Failed to clear conversation" },
      { status: 500 }
    );
  }
}
