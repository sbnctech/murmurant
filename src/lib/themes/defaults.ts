/**
 * Default Theme Configuration
 *
 * Default theme values for Murmurant branding.
 *
 * Charter: P6 (human-first UI)
 */

import type { ClubTheme } from "./types";

export const defaultTheme: ClubTheme = {
  id: "murmurant-default",
  name: "Murmurant Default",
  logo: {
    url: "/images/murmurant-logo.svg",
    width: 200,
    height: 60,
    alt: "Murmurant",
  },
  bug: {
    url: "/images/murmurant-bug.svg",
    size: 32,
  },
  colors: {
    primary: "#2563eb",
    primaryHover: "#1d4ed8",
    secondary: "#64748b",
    accent: "#8b5cf6",
    background: "#ffffff",
    surface: "#f8fafc",
    textPrimary: "#1e293b",
    textSecondary: "#475569",
    textMuted: "#64748b",
    border: "#e2e8f0",
    error: "#dc2626",
    warning: "#f59e0b",
    success: "#16a34a",
  },
  typography: {
    fontHeading: "system-ui, -apple-system, sans-serif",
    fontBody: "system-ui, -apple-system, sans-serif",
    fontMono: "ui-monospace, monospace",
    baseFontSize: 16,
    lineHeight: 1.5,
  },
  shape: {
    borderRadius: "md",
    buttonStyle: "rounded",
    cardStyle: "outlined",
  },
  voice: {
    tone: "friendly",
    terminology: {
      member: "Member",
      event: "Event",
      dues: "Dues",
    },
    greeting: "Welcome to Murmurant!",
  },
  chatbot: {
    name: "Murmurant Assistant",
    personality: "I am a helpful assistant for Murmurant users.",
    suggestedPrompts: [
      "How do I register for an event?",
      "What are my membership benefits?",
      "How do I update my profile?",
    ],
  },
};
