/**
 * Email Templates - Themed email templates for common club communications
 * Charter: P6 (human-first UI), P4 (no hidden rules)
 */

import type { ClubTheme } from "../types";
import {
  generateEmailBase,
  getEmailStyles,
  getGreeting,
  getSignOff,
} from "./emailBase";
import { formatClubDateLong } from "@/lib/timezone";

// ============================================================================
// Template Types
// ============================================================================

export interface WelcomeEmailData {
  memberName: string;
  membershipType?: string;
  loginUrl: string;
  contactEmail?: string;
}

export interface RenewalReminderData {
  memberName: string;
  expirationDate: Date;
  renewalUrl: string;
  membershipType?: string;
  duesAmount?: string;
}

export interface EventConfirmationData {
  memberName: string;
  eventName: string;
  eventDate: Date;
  eventLocation?: string;
  eventDescription?: string;
  calendarUrl?: string;
  cancellationUrl?: string;
}

export interface EventReminderData {
  memberName: string;
  eventName: string;
  eventDate: Date;
  eventLocation?: string;
  eventUrl?: string;
}

export interface PasswordResetData {
  memberName?: string;
  resetUrl: string;
  expirationMinutes?: number;
}

export interface AnnouncementData {
  memberName?: string;
  subject: string;
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
}

// ============================================================================
// Welcome Email
// ============================================================================

export function generateWelcomeEmail(
  theme: ClubTheme,
  data: WelcomeEmailData
): string {
  const styles = getEmailStyles(theme);
  const terminology = theme.voice.terminology;
  const memberTerm = terminology.member;
  const clubName = theme.name;

  const greeting = getGreeting(theme, data.memberName);
  const signOff = getSignOff(theme);

  const content = `
    <p style="${styles.paragraph}">${greeting}</p>

    <p style="${styles.paragraph}">
      Welcome to ${clubName}! We're thrilled to have you as our newest ${memberTerm}.
      ${data.membershipType ? `You've joined as a <strong>${data.membershipType}</strong> ${memberTerm}.` : ""}
    </p>

    <p style="${styles.paragraph}">
      Your ${memberTerm} account is now active and ready to use. You can log in to access
      your ${memberTerm} benefits, view upcoming ${terminology.event}s, and connect with other ${memberTerm}s.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.loginUrl}" style="${styles.button}">
        Access Your Account
      </a>
    </div>

    <p style="${styles.paragraph}">
      Here are a few things you can do to get started:
    </p>

    <ul style="${styles.paragraph}">
      <li>Complete your ${memberTerm} profile</li>
      <li>Browse upcoming ${terminology.event}s and activities</li>
      <li>Explore ${memberTerm} resources and benefits</li>
      <li>Connect with other ${memberTerm}s</li>
    </ul>

    ${data.contactEmail ? `
    <p style="${styles.paragraph}">
      If you have any questions, feel free to reach out to us at
      <a href="mailto:${data.contactEmail}" style="${styles.link}">${data.contactEmail}</a>.
    </p>
    ` : ""}

    <p style="${styles.paragraph}">${signOff}</p>
  `;

  return generateEmailBase(theme, {
    subject: `Welcome to ${clubName}!`,
    preheader: `Your ${memberTerm} account is ready`,
    content,
  });
}

// ============================================================================
// Renewal Reminder
// ============================================================================

export function generateRenewalReminderEmail(
  theme: ClubTheme,
  data: RenewalReminderData
): string {
  const styles = getEmailStyles(theme);
  const terminology = theme.voice.terminology;
  const memberTerm = terminology.member;
  const clubName = theme.name;
  const duesTerm = terminology.dues;

  const greeting = getGreeting(theme, data.memberName);
  const signOff = getSignOff(theme);
  const expirationDateStr = formatClubDateLong(data.expirationDate);

  const content = `
    <p style="${styles.paragraph}">${greeting}</p>

    <p style="${styles.paragraph}">
      This is a friendly reminder that your ${memberTerm} membership with ${clubName}
      ${data.membershipType ? `(${data.membershipType})` : ""} will expire on
      <strong>${expirationDateStr}</strong>.
    </p>

    ${data.duesAmount ? `
    <div style="${styles.card}">
      <p style="margin: 0; ${styles.mutedText}">Renewal ${duesTerm}:</p>
      <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: ${theme.colors.primary};">
        ${data.duesAmount}
      </p>
    </div>
    ` : ""}

    <p style="${styles.paragraph}">
      Renewing your membership ensures you continue to enjoy all the benefits
      and stay connected with our community.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.renewalUrl}" style="${styles.button}">
        Renew Your Membership
      </a>
    </div>

    <p style="${styles.paragraph}">
      Thank you for being a valued ${memberTerm} of ${clubName}!
    </p>

    <p style="${styles.paragraph}">${signOff}</p>
  `;

  return generateEmailBase(theme, {
    subject: `Your membership renewal reminder`,
    preheader: `Expires ${expirationDateStr}`,
    content,
  });
}

// ============================================================================
// Event Confirmation
// ============================================================================

export function generateEventConfirmationEmail(
  theme: ClubTheme,
  data: EventConfirmationData
): string {
  const styles = getEmailStyles(theme);
  const terminology = theme.voice.terminology;
  const eventTerm = terminology.event;

  const greeting = getGreeting(theme, data.memberName);
  const signOff = getSignOff(theme);
  const eventDateStr = formatClubDateLong(data.eventDate);

  const content = `
    <p style="${styles.paragraph}">${greeting}</p>

    <p style="${styles.paragraph}">
      You're registered! Here are the details for your upcoming ${eventTerm}:
    </p>

    <div style="${styles.card}">
      <h2 style="${styles.heading2}; margin-top: 0;">${data.eventName}</h2>
      <p style="${styles.paragraph}; margin-bottom: 5px;">
        <strong>Date:</strong> ${eventDateStr}
      </p>
      ${data.eventLocation ? `
      <p style="${styles.paragraph}; margin-bottom: 5px;">
        <strong>Location:</strong> ${data.eventLocation}
      </p>
      ` : ""}
      ${data.eventDescription ? `
      <p style="${styles.paragraph}; margin-bottom: 0;">
        ${data.eventDescription}
      </p>
      ` : ""}
    </div>

    <div style="text-align: center; margin: 30px 0;">
      ${data.calendarUrl ? `
      <a href="${data.calendarUrl}" style="${styles.button}; margin-right: 10px;">
        Add to Calendar
      </a>
      ` : ""}
      ${data.cancellationUrl ? `
      <a href="${data.cancellationUrl}" style="${styles.buttonSecondary}">
        Cancel Registration
      </a>
      ` : ""}
    </div>

    <p style="${styles.paragraph}">
      We look forward to seeing you there!
    </p>

    <p style="${styles.paragraph}">${signOff}</p>
  `;

  return generateEmailBase(theme, {
    subject: `You're registered: ${data.eventName}`,
    preheader: `${eventDateStr}${data.eventLocation ? ` at ${data.eventLocation}` : ""}`,
    content,
  });
}

// ============================================================================
// Event Reminder
// ============================================================================

export function generateEventReminderEmail(
  theme: ClubTheme,
  data: EventReminderData
): string {
  const styles = getEmailStyles(theme);
  const terminology = theme.voice.terminology;
  const eventTerm = terminology.event;

  const greeting = getGreeting(theme, data.memberName);
  const signOff = getSignOff(theme);
  const eventDateStr = formatClubDateLong(data.eventDate);

  const content = `
    <p style="${styles.paragraph}">${greeting}</p>

    <p style="${styles.paragraph}">
      Just a friendly reminder about your upcoming ${eventTerm}:
    </p>

    <div style="${styles.card}">
      <h2 style="${styles.heading2}; margin-top: 0;">${data.eventName}</h2>
      <p style="${styles.paragraph}; margin-bottom: 5px;">
        <strong>When:</strong> ${eventDateStr}
      </p>
      ${data.eventLocation ? `
      <p style="${styles.paragraph}; margin-bottom: 0;">
        <strong>Where:</strong> ${data.eventLocation}
      </p>
      ` : ""}
    </div>

    ${data.eventUrl ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.eventUrl}" style="${styles.button}">
        View ${eventTerm} Details
      </a>
    </div>
    ` : ""}

    <p style="${styles.paragraph}">
      We look forward to seeing you!
    </p>

    <p style="${styles.paragraph}">${signOff}</p>
  `;

  return generateEmailBase(theme, {
    subject: `Reminder: ${data.eventName}`,
    preheader: `Coming up: ${eventDateStr}`,
    content,
  });
}

// ============================================================================
// Password Reset
// ============================================================================

export function generatePasswordResetEmail(
  theme: ClubTheme,
  data: PasswordResetData
): string {
  const styles = getEmailStyles(theme);
  const clubName = theme.name;
  const expirationMinutes = data.expirationMinutes || 60;

  const greeting = data.memberName
    ? getGreeting(theme, data.memberName)
    : "Hello,";
  const signOff = getSignOff(theme);

  const content = `
    <p style="${styles.paragraph}">${greeting}</p>

    <p style="${styles.paragraph}">
      We received a request to reset your password for your ${clubName} account.
      Click the button below to create a new password:
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.resetUrl}" style="${styles.button}">
        Reset Your Password
      </a>
    </div>

    <p style="${styles.paragraph}">
      This link will expire in ${expirationMinutes} minutes for security purposes.
    </p>

    <p style="${styles.paragraph}">
      If you didn't request a password reset, you can safely ignore this email.
      Your password will remain unchanged.
    </p>

    <hr style="${styles.divider}">

    <p style="${styles.mutedText}">
      If the button above doesn't work, copy and paste this link into your browser:
      <br>
      <a href="${data.resetUrl}" style="${styles.link}; word-break: break-all;">
        ${data.resetUrl}
      </a>
    </p>

    <p style="${styles.paragraph}">${signOff}</p>
  `;

  return generateEmailBase(theme, {
    subject: "Reset your password",
    preheader: `Password reset link (expires in ${expirationMinutes} minutes)`,
    content,
    showUnsubscribe: false,
  });
}

// ============================================================================
// Announcement
// ============================================================================

export function generateAnnouncementEmail(
  theme: ClubTheme,
  data: AnnouncementData
): string {
  const styles = getEmailStyles(theme);

  const greeting = data.memberName
    ? getGreeting(theme, data.memberName)
    : getGreeting(theme);
  const signOff = getSignOff(theme);

  const content = `
    <p style="${styles.paragraph}">${greeting}</p>

    ${data.bodyHtml}

    ${data.ctaText && data.ctaUrl ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.ctaUrl}" style="${styles.button}">
        ${data.ctaText}
      </a>
    </div>
    ` : ""}

    <p style="${styles.paragraph}">${signOff}</p>
  `;

  return generateEmailBase(theme, {
    subject: data.subject,
    preheader: data.bodyHtml.replace(/<[^>]*>/g, "").slice(0, 100),
    content,
  });
}
