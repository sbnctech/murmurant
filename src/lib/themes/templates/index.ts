/**
 * Theme Templates - Barrel exports
 *
 * Provides themed email and print templates for club communications.
 */

// Email base utilities
export {
  generateEmailBase,
  getEmailStyles,
  getGreeting,
  getSignOff,
  type EmailBaseOptions,
  type EmailStyles,
} from "./emailBase";

// Print base utilities
export {
  generatePrintBase,
  getPrintStyles,
  wrapInPage,
  addPageBreak,
  type PrintBaseOptions,
  type PrintStyles,
  type PaperSize,
  type Orientation,
} from "./printBase";

// Email templates
export {
  generateWelcomeEmail,
  generateRenewalReminderEmail,
  generateEventConfirmationEmail,
  generateEventReminderEmail,
  generatePasswordResetEmail,
  generateAnnouncementEmail,
  type WelcomeEmailData,
  type RenewalReminderData,
  type EventConfirmationData,
  type EventReminderData,
  type PasswordResetData,
  type AnnouncementData,
} from "./emailTemplates";

// Print templates
export {
  generateMembershipCard,
  generateEventTicket,
  generateReceipt,
  generateRoster,
  generateNameBadges,
  type MembershipCardData,
  type EventTicketData,
  type ReceiptData,
  type RosterData,
  type NameBadgeData,
} from "./printTemplates";
