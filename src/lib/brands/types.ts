/**
 * Brand Type Definitions
 *
 * ClubBrand represents per-club customization (identity, voice, chatbot).
 * Separate from Theme, which is the reusable layout/structure template.
 *
 * Charter: P6 (human-first UI), P8 (stable contracts)
 */

// ============================================================================
// Logo and Visual Identity
// ============================================================================

export interface BrandLogo {
  url: string;
  width: number;
  height: number;
  alt: string;
}

export interface BrandBug {
  url: string;
  size: number;
}

export interface BrandColors {
  primary: string;
  primaryHover: string;
  secondary: string;
  accent: string;
}

export interface BrandFonts {
  heading: string;
  body: string;
}

export interface BrandIdentity {
  logo: BrandLogo;
  bug: BrandBug;
  colors: BrandColors;
  fonts: BrandFonts;
}

// ============================================================================
// Voice and Terminology
// ============================================================================

export type VoiceTone = "formal" | "friendly" | "casual" | "professional";

export interface BrandTerminology {
  member: string;
  event: string;
  dues: string;
}

export interface BrandVoice {
  tone: VoiceTone;
  terminology: BrandTerminology;
  greeting: string;
}

// ============================================================================
// Chatbot Configuration
// ============================================================================

export interface BrandChatbot {
  name: string;
  personality: string;
  suggestedPrompts: string[];
}

// ============================================================================
// Communication Settings
// ============================================================================

export interface BrandCommunication {
  emailFromName: string;
  emailReplyTo: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}

// ============================================================================
// Complete Club Brand
// ============================================================================

export interface ClubBrand {
  id: string;
  clubId: string;
  name: string;
  themeId: "modern" | "classic" | "minimal";
  identity: BrandIdentity;
  voice: BrandVoice;
  chatbot: BrandChatbot;
  communication: BrandCommunication;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
  approvedBy?: string[];
}

// ============================================================================
// Helper Types
// ============================================================================

export type PartialClubBrand = Partial<ClubBrand> & { id: string };

export type BrandColorKey = keyof BrandColors;

export type ThemeId = ClubBrand["themeId"];
