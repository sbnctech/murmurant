/**
 * Print Templates - Themed print templates for club documents
 * Charter: P6 (human-first UI), P4 (no hidden rules)
 */

import type { ClubTheme } from "../types";
import { generatePrintBase, getPrintStyles } from "./printBase";
import { formatClubDateLong, formatClubDate } from "@/lib/timezone";

// ============================================================================
// Template Types
// ============================================================================

export interface MembershipCardData {
  memberName: string;
  memberId: string;
  membershipType: string;
  joinDate: Date;
  expirationDate?: Date;
  photoUrl?: string;
}

export interface EventTicketData {
  memberName: string;
  eventName: string;
  eventDate: Date;
  eventLocation?: string;
  ticketId: string;
  qrCodeUrl?: string;
  seatInfo?: string;
}

export interface ReceiptData {
  memberName: string;
  receiptNumber: string;
  date: Date;
  items: Array<{
    description: string;
    quantity?: number;
    unitPrice?: string;
    total: string;
  }>;
  subtotal?: string;
  tax?: string;
  total: string;
  paymentMethod?: string;
}

export interface RosterData {
  title: string;
  asOfDate: Date;
  members: Array<{
    name: string;
    email?: string;
    phone?: string;
    membershipType?: string;
    joinDate?: Date;
    status?: string;
  }>;
  showEmail?: boolean;
  showPhone?: boolean;
  showMembershipType?: boolean;
  showJoinDate?: boolean;
  showStatus?: boolean;
}

export interface NameBadgeData {
  members: Array<{
    name: string;
    title?: string;
    organization?: string;
    pronouns?: string;
  }>;
  badgeSize?: "small" | "medium" | "large";
  showLogo?: boolean;
}

// ============================================================================
// Membership Card
// ============================================================================

export function generateMembershipCard(
  theme: ClubTheme,
  data: MembershipCardData
): string {
  const terminology = theme.voice.terminology;
  const clubName = theme.name;
  const memberTerm = terminology.member;
  const joinDateStr = formatClubDate(data.joinDate);
  const expirationDateStr = data.expirationDate
    ? formatClubDate(data.expirationDate)
    : null;

  const cardContent = `
    <div style="
      width: 3.375in;
      height: 2.125in;
      border: 1pt solid ${theme.colors.primary};
      border-radius: 8pt;
      padding: 12pt;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      page-break-inside: avoid;
    ">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8pt;">
        <div>
          ${theme.logo
            ? `<img src="${theme.logo.url}" alt="${theme.logo.alt}" style="max-height: 24pt; max-width: 100pt;">`
            : `<div style="font-size: 12pt; font-weight: bold; color: ${theme.colors.primary};">${clubName}</div>`
          }
        </div>
        ${data.photoUrl ? `
        <img src="${data.photoUrl}" alt="${data.memberName}" style="
          width: 36pt;
          height: 36pt;
          border-radius: 4pt;
          object-fit: cover;
        ">
        ` : ""}
      </div>

      <div style="flex: 1;">
        <div style="font-size: 14pt; font-weight: bold; margin-bottom: 4pt;">
          ${data.memberName}
        </div>
        <div style="font-size: 9pt; color: #666666;">
          ${data.membershipType} ${memberTerm}
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 8pt; color: #666666; border-top: 0.5pt solid #cccccc; padding-top: 6pt;">
        <div>
          <div style="font-weight: 600;">ID: ${data.memberId}</div>
          <div>Since: ${joinDateStr}</div>
        </div>
        ${expirationDateStr ? `
        <div style="text-align: right;">
          <div style="font-weight: 600;">Expires</div>
          <div>${expirationDateStr}</div>
        </div>
        ` : ""}
      </div>
    </div>
  `;

  return generatePrintBase(theme, {
    title: `${memberTerm} Card`,
    content: cardContent,
    showHeader: false,
    showFooter: false,
    showPageNumbers: false,
  });
}

// ============================================================================
// Event Ticket
// ============================================================================

export function generateEventTicket(
  theme: ClubTheme,
  data: EventTicketData
): string {
  const terminology = theme.voice.terminology;
  const clubName = theme.name;
  const eventTerm = terminology.event;
  const eventDateStr = formatClubDateLong(data.eventDate);

  const ticketContent = `
    <div style="
      width: 6in;
      border: 2pt solid ${theme.colors.primary};
      border-radius: 8pt;
      overflow: hidden;
      page-break-inside: avoid;
    ">
      <div style="
        background: ${theme.colors.primary};
        color: white;
        padding: 16pt;
        text-align: center;
      ">
        ${theme.logo
          ? `<img src="${theme.logo.url}" alt="${theme.logo.alt}" style="max-height: 30pt; margin-bottom: 8pt; filter: brightness(0) invert(1);">`
          : `<div style="font-size: 14pt; font-weight: bold; margin-bottom: 8pt;">${clubName}</div>`
        }
        <div style="font-size: 18pt; font-weight: bold;">
          ${data.eventName}
        </div>
      </div>

      <div style="padding: 16pt; display: flex;">
        <div style="flex: 1;">
          <div style="margin-bottom: 12pt;">
            <div style="font-size: 9pt; color: #666666; text-transform: uppercase;">Attendee</div>
            <div style="font-size: 14pt; font-weight: bold;">${data.memberName}</div>
          </div>

          <div style="display: flex; gap: 24pt;">
            <div>
              <div style="font-size: 9pt; color: #666666; text-transform: uppercase;">Date & Time</div>
              <div style="font-size: 11pt;">${eventDateStr}</div>
            </div>
            ${data.eventLocation ? `
            <div>
              <div style="font-size: 9pt; color: #666666; text-transform: uppercase;">Location</div>
              <div style="font-size: 11pt;">${data.eventLocation}</div>
            </div>
            ` : ""}
            ${data.seatInfo ? `
            <div>
              <div style="font-size: 9pt; color: #666666; text-transform: uppercase;">Seat</div>
              <div style="font-size: 11pt;">${data.seatInfo}</div>
            </div>
            ` : ""}
          </div>
        </div>

        <div style="
          width: 80pt;
          border-left: 1pt dashed #cccccc;
          padding-left: 16pt;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        ">
          ${data.qrCodeUrl ? `
          <img src="${data.qrCodeUrl}" alt="QR Code" style="width: 64pt; height: 64pt;">
          ` : `
          <div style="
            width: 64pt;
            height: 64pt;
            border: 1pt solid #cccccc;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8pt;
            color: #999999;
          ">QR Code</div>
          `}
          <div style="font-size: 8pt; color: #666666; margin-top: 4pt;">
            ${data.ticketId}
          </div>
        </div>
      </div>
    </div>
  `;

  return generatePrintBase(theme, {
    title: `${eventTerm} Ticket`,
    content: ticketContent,
    showHeader: false,
    showFooter: false,
    showPageNumbers: false,
  });
}

// ============================================================================
// Receipt
// ============================================================================

export function generateReceipt(theme: ClubTheme, data: ReceiptData): string {
  const styles = getPrintStyles(theme);
  const clubName = theme.name;
  const dateStr = formatClubDateLong(data.date);

  const itemRows = data.items
    .map(
      (item) => `
    <tr>
      <td style="${styles.tableCell}">${item.description}</td>
      ${item.quantity !== undefined ? `<td style="${styles.tableCell}; text-align: center;">${item.quantity}</td>` : ""}
      ${item.unitPrice ? `<td style="${styles.tableCell}; text-align: right;">${item.unitPrice}</td>` : ""}
      <td style="${styles.tableCell}; text-align: right; font-weight: 600;">${item.total}</td>
    </tr>
  `
    )
    .join("");

  const hasQuantity = data.items.some((item) => item.quantity !== undefined);
  const hasUnitPrice = data.items.some((item) => item.unitPrice);

  const receiptContent = `
    <div style="max-width: 400pt; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 20pt;">
        ${theme.logo
          ? `<img src="${theme.logo.url}" alt="${theme.logo.alt}" style="max-height: 40pt; margin-bottom: 8pt;">`
          : `<div style="font-size: 18pt; font-weight: bold; color: ${theme.colors.primary};">${clubName}</div>`
        }
        <h1 style="${styles.heading1}; margin: 8pt 0;">Receipt</h1>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 16pt; padding-bottom: 12pt; border-bottom: 1pt solid #cccccc;">
        <div>
          <div style="font-size: 9pt; color: #666666;">Bill To</div>
          <div style="font-weight: 600;">${data.memberName}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 9pt; color: #666666;">Receipt #</div>
          <div style="font-weight: 600;">${data.receiptNumber}</div>
          <div style="font-size: 9pt; color: #666666; margin-top: 4pt;">${dateStr}</div>
        </div>
      </div>

      <table style="${styles.table}">
        <thead>
          <tr>
            <th style="${styles.tableHeader}">Description</th>
            ${hasQuantity ? `<th style="${styles.tableHeader}; text-align: center;">Qty</th>` : ""}
            ${hasUnitPrice ? `<th style="${styles.tableHeader}; text-align: right;">Price</th>` : ""}
            <th style="${styles.tableHeader}; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <div style="margin-top: 16pt; border-top: 1pt solid #cccccc; padding-top: 12pt;">
        ${data.subtotal ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 4pt;">
          <span>Subtotal</span>
          <span>${data.subtotal}</span>
        </div>
        ` : ""}
        ${data.tax ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 4pt;">
          <span>Tax</span>
          <span>${data.tax}</span>
        </div>
        ` : ""}
        <div style="display: flex; justify-content: space-between; font-size: 14pt; font-weight: bold; margin-top: 8pt; padding-top: 8pt; border-top: 2pt solid ${theme.colors.primary};">
          <span>Total</span>
          <span style="color: ${theme.colors.primary};">${data.total}</span>
        </div>
      </div>

      ${data.paymentMethod ? `
      <div style="margin-top: 16pt; text-align: center; font-size: 9pt; color: #666666;">
        Paid via ${data.paymentMethod}
      </div>
      ` : ""}

      <div style="margin-top: 24pt; text-align: center; font-size: 9pt; color: #666666;">
        Thank you for your payment!
      </div>
    </div>
  `;

  return generatePrintBase(theme, {
    title: "Receipt",
    content: receiptContent,
    showHeader: false,
    showFooter: false,
    showPageNumbers: false,
  });
}

// ============================================================================
// Roster
// ============================================================================

export function generateRoster(theme: ClubTheme, data: RosterData): string {
  const styles = getPrintStyles(theme);
  const asOfDateStr = formatClubDateLong(data.asOfDate);

  const headers: string[] = ["Name"];
  if (data.showEmail !== false) headers.push("Email");
  if (data.showPhone) headers.push("Phone");
  if (data.showMembershipType) headers.push("Type");
  if (data.showJoinDate) headers.push("Joined");
  if (data.showStatus) headers.push("Status");

  const headerRow = headers
    .map((h) => `<th style="${styles.tableHeader}">${h}</th>`)
    .join("");

  const memberRows = data.members
    .map((member) => {
      const cells: string[] = [
        `<td style="${styles.tableCell}; font-weight: 500;">${member.name}</td>`,
      ];

      if (data.showEmail !== false) {
        cells.push(
          `<td style="${styles.tableCell}">${member.email || "-"}</td>`
        );
      }
      if (data.showPhone) {
        cells.push(
          `<td style="${styles.tableCell}">${member.phone || "-"}</td>`
        );
      }
      if (data.showMembershipType) {
        cells.push(
          `<td style="${styles.tableCell}">${member.membershipType || "-"}</td>`
        );
      }
      if (data.showJoinDate) {
        cells.push(
          `<td style="${styles.tableCell}">${member.joinDate ? formatClubDate(member.joinDate) : "-"}</td>`
        );
      }
      if (data.showStatus) {
        cells.push(
          `<td style="${styles.tableCell}">${member.status || "-"}</td>`
        );
      }

      return `<tr>${cells.join("")}</tr>`;
    })
    .join("");

  const rosterContent = `
    <p style="${styles.mutedText}">
      As of ${asOfDateStr} &bull; ${data.members.length} member${data.members.length !== 1 ? "s" : ""}
    </p>

    <table style="${styles.table}">
      <thead>
        <tr>${headerRow}</tr>
      </thead>
      <tbody>
        ${memberRows}
      </tbody>
    </table>
  `;

  return generatePrintBase(theme, {
    title: data.title,
    content: rosterContent,
    showHeader: true,
    showFooter: true,
    showPageNumbers: true,
  });
}

// ============================================================================
// Name Badge
// ============================================================================

export function generateNameBadges(
  theme: ClubTheme,
  data: NameBadgeData
): string {
  const clubName = theme.name;
  const showLogo = data.showLogo !== false;

  const badgeSizes = {
    small: { width: "2.5in", height: "1.5in", nameSize: "14pt", titleSize: "9pt" },
    medium: { width: "3in", height: "2in", nameSize: "18pt", titleSize: "10pt" },
    large: { width: "4in", height: "3in", nameSize: "24pt", titleSize: "12pt" },
  };

  const size = badgeSizes[data.badgeSize || "medium"];

  const badges = data.members
    .map(
      (member) => `
    <div style="
      width: ${size.width};
      height: ${size.height};
      border: 1pt solid #cccccc;
      padding: 12pt;
      display: inline-flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      box-sizing: border-box;
      margin: 4pt;
      page-break-inside: avoid;
    ">
      ${showLogo ? `
      <div style="margin-bottom: 8pt;">
        ${theme.logo
          ? `<img src="${theme.logo.url}" alt="${theme.logo.alt}" style="max-height: 20pt; max-width: 80pt;">`
          : `<div style="font-size: 10pt; color: ${theme.colors.primary}; font-weight: bold;">${clubName}</div>`
        }
      </div>
      ` : ""}

      <div style="font-size: ${size.nameSize}; font-weight: bold; margin-bottom: 4pt;">
        ${member.name}
      </div>

      ${member.pronouns ? `
      <div style="font-size: ${size.titleSize}; color: #666666; margin-bottom: 4pt;">
        (${member.pronouns})
      </div>
      ` : ""}

      ${member.title ? `
      <div style="font-size: ${size.titleSize}; color: ${theme.colors.primary};">
        ${member.title}
      </div>
      ` : ""}

      ${member.organization ? `
      <div style="font-size: ${size.titleSize}; color: #666666; margin-top: 2pt;">
        ${member.organization}
      </div>
      ` : ""}
    </div>
  `
    )
    .join("");

  const badgesContent = `
    <div style="display: flex; flex-wrap: wrap; justify-content: flex-start;">
      ${badges}
    </div>
  `;

  return generatePrintBase(theme, {
    title: "Name Badges",
    content: badgesContent,
    showHeader: false,
    showFooter: false,
    showPageNumbers: false,
    margins: { top: "0.5in", right: "0.5in", bottom: "0.5in", left: "0.5in" },
  });
}
