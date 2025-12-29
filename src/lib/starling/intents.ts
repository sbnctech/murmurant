// Copyright (c) Murmurant, Inc.
// Intent detection and handling for Starling

import type { PageContext, DetectedIntent, ActionPlan } from "./types";
import { prisma } from "@/lib/prisma";
import { formatClubDateLong } from "@/lib/timezone";

/**
 * Intent patterns for detection
 */
interface IntentPattern {
  intent: string;
  patterns: RegExp[];
  requiredEntities?: string[];
  confidence: number;
}

/**
 * Known intent patterns
 * The LLM handles nuanced understanding; these are for quick local detection
 */
const INTENT_PATTERNS: IntentPattern[] = [
  // Event intents
  {
    intent: "event:list",
    patterns: [
      /what.*events/i,
      /upcoming.*events/i,
      /events.*happening/i,
      /show.*events/i,
      /list.*events/i,
      /find.*events/i,
      /what's.*going on/i,
      /activities.*this/i,
    ],
    confidence: 0.85,
  },
  {
    intent: "event:register",
    patterns: [
      /register.*for/i,
      /sign.*up.*for/i,
      /rsvp/i,
      /attend.*event/i,
      /join.*event/i,
      /book.*spot/i,
    ],
    requiredEntities: ["eventName"],
    confidence: 0.8,
  },
  {
    intent: "event:details",
    patterns: [
      /tell.*about.*event/i,
      /details.*event/i,
      /when.*is.*event/i,
      /where.*is.*event/i,
      /more.*about.*event/i,
    ],
    requiredEntities: ["eventName"],
    confidence: 0.8,
  },
  {
    intent: "event:cancel",
    patterns: [
      /cancel.*registration/i,
      /unregister/i,
      /can't.*make.*it/i,
      /remove.*from.*event/i,
    ],
    requiredEntities: ["eventName"],
    confidence: 0.75,
  },

  // Navigation intents
  {
    intent: "nav:events",
    patterns: [
      /go.*to.*events/i,
      /take.*me.*events/i,
      /show.*events.*page/i,
      /events.*page/i,
    ],
    confidence: 0.9,
  },
  {
    intent: "nav:profile",
    patterns: [
      /go.*to.*profile/i,
      /my.*profile/i,
      /edit.*profile/i,
      /update.*my.*info/i,
      /change.*my.*email/i,
    ],
    confidence: 0.85,
  },
  {
    intent: "nav:home",
    patterns: [
      /go.*home/i,
      /take.*me.*home/i,
      /main.*page/i,
      /dashboard/i,
    ],
    confidence: 0.9,
  },

  // Help intents
  {
    intent: "help:general",
    patterns: [
      /help/i,
      /what.*can.*you.*do/i,
      /how.*do.*i/i,
      /i.*need.*help/i,
    ],
    confidence: 0.9,
  },
  {
    intent: "help:greeting",
    patterns: [
      /^hi$/i,
      /^hello$/i,
      /^hey$/i,
      /good.*morning/i,
      /good.*afternoon/i,
    ],
    confidence: 0.95,
  },
];

/**
 * Detect intent from user message
 * Returns the best matching intent with confidence
 */
export function detectIntent(
  message: string,
  context?: PageContext
): DetectedIntent | null {
  const lowerMessage = message.toLowerCase().trim();

  // Check against known patterns
  for (const pattern of INTENT_PATTERNS) {
    for (const regex of pattern.patterns) {
      if (regex.test(message)) {
        // Extract entities if needed
        const entities = pattern.requiredEntities
          ? extractEntities(message, pattern.requiredEntities)
          : {};

        // Boost confidence if we're on a relevant page
        let confidence = pattern.confidence;
        if (context) {
          if (
            pattern.intent.startsWith("event:") &&
            context.page.includes("event")
          ) {
            confidence = Math.min(1.0, confidence + 0.1);
          }
        }

        return {
          intent: pattern.intent,
          entities,
          confidence,
          rawMessage: message,
        };
      }
    }
  }

  return null;
}

/**
 * Extract entities from message
 * Simple extraction - LLM handles more complex cases
 */
function extractEntities(
  message: string,
  requiredEntities: string[]
): Record<string, string> {
  const entities: Record<string, string> = {};

  // Try to extract event name (quoted text or after "for" keyword)
  if (requiredEntities.includes("eventName")) {
    // Look for quoted text
    const quotedMatch = message.match(/["']([^"']+)["']/);
    if (quotedMatch) {
      entities.eventName = quotedMatch[1];
    } else {
      // Look for text after "for" or "to"
      const forMatch = message.match(/(?:for|to)\s+(?:the\s+)?(.+?)(?:\s+event)?$/i);
      if (forMatch) {
        entities.eventName = forMatch[1].trim();
      }
    }
  }

  // Try to extract date references
  if (requiredEntities.includes("date")) {
    const datePatterns = [
      { pattern: /today/i, value: "today" },
      { pattern: /tomorrow/i, value: "tomorrow" },
      { pattern: /this\s+week/i, value: "this_week" },
      { pattern: /next\s+week/i, value: "next_week" },
      { pattern: /this\s+month/i, value: "this_month" },
    ];

    for (const { pattern, value } of datePatterns) {
      if (pattern.test(message)) {
        entities.date = value;
        break;
      }
    }
  }

  return entities;
}

/**
 * Generate an action plan based on detected intent
 */
export async function generateActionPlan(
  intent: DetectedIntent,
  context: PageContext | undefined,
  userId: string
): Promise<ActionPlan | null> {
  switch (intent.intent) {
    case "event:list":
      return await handleEventList(intent, userId);

    case "event:register":
      return await handleEventRegister(intent, context, userId);

    case "event:details":
      return await handleEventDetails(intent);

    case "nav:events":
      return {
        type: "navigate",
        target: "/events",
        description: "Navigate to Events page",
      };

    case "nav:profile":
      return {
        type: "navigate",
        target: "/profile",
        description: "Navigate to Profile page",
      };

    case "nav:home":
      return {
        type: "navigate",
        target: "/",
        description: "Navigate to Home page",
      };

    case "help:greeting":
    case "help:general":
      return {
        type: "answer",
        description: "Provide help information",
      };

    default:
      return null;
  }
}

/**
 * Handle event:list intent
 */
async function handleEventList(
  intent: DetectedIntent,
  userId: string
): Promise<ActionPlan> {
  // Fetch upcoming events
  const now = new Date();
  const events = await prisma.event.findMany({
    where: {
      startTime: { gte: now },
      status: "PUBLISHED",
    },
    orderBy: { startTime: "asc" },
    take: 5,
    select: {
      id: true,
      title: true,
      startTime: true,
      location: true,
      category: true,
    },
  });

  return {
    type: "answer",
    description: "List upcoming events",
    data: { events },
  };
}

/**
 * Handle event:register intent
 */
async function handleEventRegister(
  intent: DetectedIntent,
  context: PageContext | undefined,
  userId: string
): Promise<ActionPlan> {
  const eventName = intent.entities.eventName;

  // If we're on an event page, use that event
  if (context?.entity?.type === "event" && context.entity.id) {
    return {
      type: "stage",
      target: `/events/${context.entity.id}/register`,
      formData: {
        eventId: context.entity.id,
        registrationType: "member",
      },
      description: `Register for ${context.entity.name}`,
    };
  }

  // Try to find the event by name
  if (eventName) {
    const event = await prisma.event.findFirst({
      where: {
        title: { contains: eventName, mode: "insensitive" },
        status: "PUBLISHED",
        startTime: { gte: new Date() },
      },
      select: { id: true, title: true },
    });

    if (event) {
      return {
        type: "stage",
        target: `/events/${event.id}/register`,
        formData: {
          eventId: event.id,
          registrationType: "member",
        },
        description: `Register for ${event.title}`,
      };
    }
  }

  // Need clarification
  return {
    type: "clarify",
    description: "Which event would you like to register for?",
    suggestions: ["Show me upcoming events", "Search for an event"],
  };
}

/**
 * Handle event:details intent
 */
async function handleEventDetails(intent: DetectedIntent): Promise<ActionPlan> {
  const eventName = intent.entities.eventName;

  if (!eventName) {
    return {
      type: "clarify",
      description: "Which event would you like to know more about?",
      suggestions: ["Show me upcoming events"],
    };
  }

  // Try to find the event
  const event = await prisma.event.findFirst({
    where: {
      title: { contains: eventName, mode: "insensitive" },
    },
    select: {
      id: true,
      title: true,
      description: true,
      startTime: true,
      endTime: true,
      location: true,
      category: true,
    },
  });

  if (event) {
    return {
      type: "navigate",
      target: `/events/${event.id}`,
      description: `Show details for ${event.title}`,
      data: { event },
    };
  }

  return {
    type: "answer",
    description: `I couldn't find an event matching "${eventName}"`,
    suggestions: ["Show me upcoming events", "Search differently"],
  };
}

/**
 * Format events for display in chat
 */
export function formatEventsForChat(
  events: Array<{
    id: string;
    title: string;
    startTime: Date;
    location?: string | null;
    category?: string | null;
  }>
): string {
  if (events.length === 0) {
    return "No upcoming events found.";
  }

  let response = "Here are the upcoming events:\n\n";

  for (const event of events) {
    const date = formatClubDateLong(event.startTime);
    response += `• **${event.title}**\n`;
    response += `  ${date}`;
    if (event.location) {
      response += ` at ${event.location}`;
    }
    response += "\n\n";
  }

  response += "Would you like to register for any of these events?";

  return response;
}
