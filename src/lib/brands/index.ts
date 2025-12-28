/**
 * Brand Module Exports
 *
 * Central export point for brand functionality.
 * Brand = per-club customization (identity, voice, chatbot).
 */

// Types
export type {
  BrandLogo,
  BrandBug,
  BrandColors,
  BrandFonts,
  BrandIdentity,
  VoiceTone,
  BrandTerminology,
  BrandVoice,
  BrandChatbot,
  BrandCommunication,
  ClubBrand,
  PartialClubBrand,
  BrandColorKey,
  ThemeId,
} from "./types";

// Schemas and Validation
export {
  brandLogoSchema,
  brandBugSchema,
  brandColorsSchema,
  brandFontsSchema,
  brandIdentitySchema,
  voiceToneSchema,
  brandTerminologySchema,
  brandVoiceSchema,
  brandChatbotSchema,
  brandCommunicationSchema,
  themeIdSchema,
  clubBrandSchema,
  partialClubBrandSchema,
  validateBrand,
  validatePartialBrand,
  isValidBrand,
  isValidHexColor,
} from "./schema";
export type { ValidatedClubBrand, ValidatedPartialBrand } from "./schema";

// Defaults
export {
  defaultIdentity,
  defaultVoice,
  defaultChatbot,
  defaultCommunication,
  defaultBrand,
} from "./defaults";

// Customer Brands
export { sbncBrand } from "./customers/sbnc";

// Provider
export { BrandProvider, useBrand, BrandContext } from "./BrandProvider";
