/**
 * Santa Barbara Newcomers Club Theme
 *
 * Custom theme configuration for SBNC reflecting the coastal,
 * welcoming character of Santa Barbara.
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { ClubTheme } from "../types";

export const sbncTheme: ClubTheme = {
  id: "sbnc",
  name: "Santa Barbara Newcomers Club",

  logo: {
    url: "/themes/sbnc/logo.svg",
    width: 200,
    height: 60,
    alt: "SBNC Logo",
  },
  bug: {
    url: "/themes/sbnc/bug.svg",
    size: 32,
  },

  colors: {
    primary: "#1E40AF", // Deep blue (coastal)
    primaryHover: "#1E3A8A",
    secondary: "#059669", // Teal green (nature)
    accent: "#F59E0B", // Golden (California sun)
    background: "#FFFBEB", // Warm cream
    surface: "#FFFFFF",
    textPrimary: "#1F2937",
    textSecondary: "#4B5563",
    textMuted: "#9CA3AF",
    border: "#E5E7EB",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
  },

  typography: {
    fontHeading: "Georgia, serif",
    fontBody: "system-ui, sans-serif",
    fontMono: "monospace",
    baseFontSize: 16,
    lineHeight: 1.6,
  },

  shape: {
    borderRadius: "md",
    buttonStyle: "rounded",
    cardStyle: "raised",
  },

  voice: {
    tone: "friendly",
    terminology: {
      member: "member",
      event: "activity",
      dues: "dues",
    },
    greeting: "Welcome!",
  },

  chatbot: {
    name: "Sandy",
    personality:
      "Warm, helpful, knowledgeable about Santa Barbara. Speaks like a friendly neighbor who knows everyone.",
    suggestedPrompts: [
      "What activities are coming up this month?",
      "How do I join a committee?",
      "Tell me about upcoming luncheons",
      "How can I update my contact information?",
      "What interest groups can I join?",
    ],
  },
};
