/**
 * Santa Barbara Newcomers Club Brand
 *
 * Custom brand configuration for SBNC reflecting the coastal,
 * welcoming character of Santa Barbara.
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import type { ClubBrand } from "../types";

export const sbncBrand: ClubBrand = {
  id: "sbnc",
  clubId: "sbnc",
  name: "Santa Barbara Newcomers Club",
  themeId: "modern",
  identity: {
    logo: {
      url: "/brands/sbnc/logo.svg",
      width: 200,
      height: 60,
      alt: "SBNC Logo",
    },
    bug: {
      url: "/brands/sbnc/bug.svg",
      size: 32,
    },
    colors: {
      primary: "#1E40AF",
      primaryHover: "#1E3A8A",
      secondary: "#059669",
      accent: "#F59E0B",
    },
    fonts: {
      heading: "Georgia, serif",
      body: "system-ui, sans-serif",
    },
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
  communication: {
    emailFromName: "Santa Barbara Newcomers Club",
    emailReplyTo: "info@sbnewcomers.org",
    socialLinks: {
      facebook: "https://facebook.com/sbnewcomers",
    },
  },
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-12-27"),
  updatedBy: "system",
};
