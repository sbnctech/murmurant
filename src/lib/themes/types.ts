/**
 * Club Theme Type Definitions
 *
 * Defines the structure for customer-specific theming including
 * branding, colors, typography, voice, and chatbot personality.
 *
 * Copyright © 2025 Murmurant, Inc.
 */

// ============================================================================
// Logo and Branding
// ============================================================================

export type LogoConfig = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

export type BugConfig = {
  url: string;
  size: number;
};

// ============================================================================
// Color Palette
// ============================================================================

export type ColorPalette = {
  primary: string;
  primaryHover: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
};

// ============================================================================
// Typography
// ============================================================================

export type TypographyConfig = {
  fontHeading: string;
  fontBody: string;
  fontMono: string;
  baseFontSize: number;
  lineHeight: number;
};

// ============================================================================
// Shape and Style
// ============================================================================

export type BorderRadiusStyle = "none" | "sm" | "md" | "lg" | "full";
export type ButtonStyle = "square" | "rounded" | "pill";
export type CardStyle = "flat" | "raised" | "outlined";

export type ShapeConfig = {
  borderRadius: BorderRadiusStyle;
  buttonStyle: ButtonStyle;
  cardStyle: CardStyle;
};

// ============================================================================
// Voice and Terminology
// ============================================================================

export type VoiceTone = "formal" | "friendly" | "casual" | "professional";

export type Terminology = {
  member: string;
  event: string;
  dues: string;
};

export type VoiceConfig = {
  tone: VoiceTone;
  terminology: Terminology;
  greeting: string;
};

// ============================================================================
// Chatbot Configuration
// ============================================================================

export type ChatbotConfig = {
  name: string;
  personality: string;
  suggestedPrompts: string[];
};

// ============================================================================
// Complete Club Theme
// ============================================================================

export type ClubTheme = {
  id: string;
  name: string;
  logo: LogoConfig;
  bug: BugConfig;
  colors: ColorPalette;
  typography: TypographyConfig;
  shape: ShapeConfig;
  voice: VoiceConfig;
  chatbot: ChatbotConfig;
};
