// Copyright (c) Murmurant, Inc.
// Starling chat API endpoint

import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ChatRequest, ChatResponse, ChatMessage, PageContext } from "@/lib/starling";
import { callLLM, buildSystemPrompt, parseResponse, getRAGContext } from "@/lib/starling";
import { nanoid } from "nanoid";

/**
 * POST /api/starling/chat
 * Send a message to Starling and get a response
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ChatRequest = await req.json();
    const { message, conversationId, pageContext } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Get or create conversation
    let conversation = conversationId
      ? await prisma.starlingConversation.findUnique({
          where: { id: conversationId },
        })
      : null;

    if (!conversation) {
      conversation = await prisma.starlingConversation.create({
        data: {
          id: `conv_${nanoid(12)}`,
          userId: session.userAccountId,
        },
      });
    }

    // Store user message
    await prisma.starlingMessage.create({
      data: {
        id: `msg_${nanoid(12)}`,
        conversationId: conversation.id,
        role: "user",
        content: message,
        pageContext: pageContext as object | undefined,
      },
    });

    // Process message and generate response
    const response = await processMessage(message, pageContext, session.userAccountId, conversation.id);

    // Store assistant message
    await prisma.starlingMessage.create({
      data: {
        id: response.id,
        conversationId: conversation.id,
        role: "assistant",
        content: response.content,
        intent: response.intent,
        confidence: response.confidence,
        actionType: response.actionType,
        pageContext: pageContext as object | undefined,
      },
    });

    // Audit log
    await prisma.starlingAudit.create({
      data: {
        id: `aud_${nanoid(12)}`,
        userId: session.userAccountId,
        conversationId: conversation.id,
        action: "message",
        userMessage: message,
        assistantResponse: response.content,
        intent: response.intent,
        pageContext: pageContext as object | undefined,
      },
    });

    const chatResponse: ChatResponse = {
      conversationId: conversation.id,
      message: response,
    };

    return NextResponse.json(chatResponse);
  } catch (error) {
    console.error("Starling chat error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}

/**
 * Process a message and generate a response using RAG + LLM
 */
async function processMessage(
  message: string,
  context: PageContext | undefined,
  userId: string,
  conversationId: string
): Promise<ChatMessage> {
  try {
    // Get conversation history for context
    const recentMessages = await prisma.starlingMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: 10, // Last 10 messages for context
    });

    // Retrieve relevant knowledge
    let retrievedDocs: string[] = [];
    try {
      const rag = await getRAGContext(message, {
        limit: 3,
        minSimilarity: 0.7,
      });
      retrievedDocs = rag.context;
    } catch (ragError) {
      // RAG may fail if pgvector not set up - continue without it
      console.warn("RAG retrieval failed:", ragError);
    }

    // Build messages for LLM
    const systemPrompt = buildSystemPrompt(context, retrievedDocs);
    const llmMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history (oldest first)
    for (const msg of recentMessages.reverse()) {
      llmMessages.push({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      });
    }

    // Add current message
    llmMessages.push({ role: "user", content: message });

    // Call LLM
    const llmResponse = await callLLM(llmMessages);
    const parsed = parseResponse(llmResponse);

    // Determine action type from response
    const actionType = determineActionType(parsed.message, context);

    return {
      id: `msg_${nanoid(12)}`,
      role: "assistant",
      content: parsed.message,
      timestamp: new Date(),
      intent: parsed.intent,
      confidence: 0.85,
      actionType,
    };
  } catch (error) {
    console.error("LLM processing error:", error);

    // Fallback to a helpful error message
    return {
      id: `msg_${nanoid(12)}`,
      role: "assistant",
      content:
        "I'm having trouble processing your request right now. " +
        "Please try again in a moment, or reach out to support if this continues.",
      timestamp: new Date(),
      intent: "error:llm",
      confidence: 1.0,
      actionType: "answer",
    };
  }
}

/**
 * Determine the action type from the response content
 */
function determineActionType(
  response: string,
  context: PageContext | undefined
): ChatMessage["actionType"] {
  const lowerResponse = response.toLowerCase();

  // Check for navigation indicators
  if (
    lowerResponse.includes("take you to") ||
    lowerResponse.includes("go to") ||
    lowerResponse.includes("navigate to")
  ) {
    return "navigate";
  }

  // Check for staging indicators
  if (
    lowerResponse.includes("fill out") ||
    lowerResponse.includes("pre-fill") ||
    lowerResponse.includes("stage")
  ) {
    return "stage";
  }

  // Check for clarification questions
  if (
    lowerResponse.includes("which") ||
    lowerResponse.includes("would you like") ||
    lowerResponse.includes("could you specify")
  ) {
    return "clarify";
  }

  // Check for escalation
  if (
    lowerResponse.includes("contact support") ||
    lowerResponse.includes("reach out to") ||
    lowerResponse.includes("administrator")
  ) {
    return "escalate";
  }

  return "answer";
}
