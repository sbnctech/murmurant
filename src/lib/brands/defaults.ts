/**
 * Default Brand Configuration
 *
 * Default values for club brand when none is specified.
 *
 * Charter: P6 (human-first UI)
 */

import type { ClubBrand, BrandIdentity, BrandVoice, BrandChatbot, BrandCommunication } from "./types";

// ============================================================================
// Default Identity
// ============================================================================

export const defaultIdentity: BrandIdentity = {
  logo: {
    url: "/images/default-logo.png",
    width: 200,
    height: 60,
    alt: "Club Logo",
  },
  bug: {
    url: "/images/default-bug.png",
    size: 40,
  },
  colors: {
    primary: "#0066CC",
    primaryHover: "#0052A3",
    secondary: "#4A5568",
    accent: "#ED8936",
  },
  fonts: {
    heading: "Inter, system-ui, sans-serif",
    body: "Inter, system-ui, sans-serif",
  },
};

// ============================================================================
// Default Voice
// ============================================================================

export const defaultVoice: BrandVoice = {
  tone: "friendly",
  terminology: {
    member: "Member",
    event: "Event",
    dues: "Dues",
  },
  greeting: "Welcome!",
};

// ============================================================================
// Default Chatbot
// ============================================================================

export const defaultChatbot: BrandChatbot = {
  name: "Assistant",
  personality: "Helpful and friendly assistant for club members.",
  suggestedPrompts: [
    "What events are coming up?",
    "How do I update my profile?",
    "Tell me about membership benefits",
  ],
};

// ============================================================================
// Default Communication
// ============================================================================

export const defaultCommunication: BrandCommunication = {
  emailFromName: "Club",
  emailReplyTo: "info@example.com",
  socialLinks: undefined,
};

// ============================================================================
// Complete Default Brand
// ============================================================================

export const defaultBrand: ClubBrand = {
  id: "default",
  clubId: "default-club",
  name: "Default Club",
  themeId: "modern",
  identity: defaultIdentity,
  voice: defaultVoice,
  chatbot: defaultChatbot,
  communication: defaultCommunication,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  updatedBy: "system",
  approvedBy: undefined,
};
