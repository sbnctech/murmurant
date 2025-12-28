/**
 * Print Templates Tests
 * Tests for themed print template generation
 */

import { describe, it, expect } from "vitest";
import { defaultTheme } from "@/lib/themes/defaults";
import {
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
} from "@/lib/themes/templates/printTemplates";

describe("Print Templates", () => {
  // ============================================================================
  // Membership Card
  // ============================================================================

  describe("generateMembershipCard", () => {
    const cardData: MembershipCardData = {
      memberName: "Jane Smith",
      memberId: "MEM-001",
      membershipType: "Regular",
      joinDate: new Date("2024-01-15"),
    };

    it("generates valid HTML", () => {
      const html = generateMembershipCard(defaultTheme, cardData);
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<html");
      expect(html).toContain("</html>");
    });

    it("includes member name", () => {
      const html = generateMembershipCard(defaultTheme, cardData);
      expect(html).toContain("Jane Smith");
    });

    it("includes member ID", () => {
      const html = generateMembershipCard(defaultTheme, cardData);
      expect(html).toContain("MEM-001");
    });

    it("includes membership type", () => {
      const html = generateMembershipCard(defaultTheme, cardData);
      expect(html).toContain("Regular");
    });

    it("includes theme primary color in border", () => {
      const html = generateMembershipCard(defaultTheme, cardData);
      expect(html).toContain(defaultTheme.colors.primary);
    });

    it("handles optional photo URL", () => {
      const dataWithPhoto: MembershipCardData = {
        ...cardData,
        photoUrl: "/photos/jane.jpg",
      };
      const html = generateMembershipCard(defaultTheme, dataWithPhoto);
      expect(html).toContain("/photos/jane.jpg");
    });

    it("handles optional expiration date", () => {
      const dataWithExpiration: MembershipCardData = {
        ...cardData,
        expirationDate: new Date("2025-01-15"),
      };
      const html = generateMembershipCard(defaultTheme, dataWithExpiration);
      expect(html).toContain("Expires");
    });

    it("uses theme terminology for member", () => {
      const html = generateMembershipCard(defaultTheme, cardData);
      expect(html).toContain(defaultTheme.voice.terminology.member);
    });

    it("includes print media styles", () => {
      const html = generateMembershipCard(defaultTheme, cardData);
      expect(html).toContain("@media print");
    });
  });

  // ============================================================================
  // Event Ticket
  // ============================================================================

  describe("generateEventTicket", () => {
    const ticketData: EventTicketData = {
      memberName: "John Doe",
      eventName: "Annual Gala 2024",
      eventDate: new Date("2024-06-15T18:00:00"),
      ticketId: "TKT-12345",
    };

    it("generates valid HTML", () => {
      const html = generateEventTicket(defaultTheme, ticketData);
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<html");
      expect(html).toContain("</html>");
    });

    it("includes attendee name", () => {
      const html = generateEventTicket(defaultTheme, ticketData);
      expect(html).toContain("John Doe");
    });

    it("includes event name", () => {
      const html = generateEventTicket(defaultTheme, ticketData);
      expect(html).toContain("Annual Gala 2024");
    });

    it("includes ticket ID", () => {
      const html = generateEventTicket(defaultTheme, ticketData);
      expect(html).toContain("TKT-12345");
    });

    it("includes theme primary color in header", () => {
      const html = generateEventTicket(defaultTheme, ticketData);
      expect(html).toContain(`background: ${defaultTheme.colors.primary}`);
    });

    it("handles optional location", () => {
      const dataWithLocation: EventTicketData = {
        ...ticketData,
        eventLocation: "Grand Ballroom, 123 Main St",
      };
      const html = generateEventTicket(defaultTheme, dataWithLocation);
      expect(html).toContain("Grand Ballroom, 123 Main St");
      expect(html).toContain("Location");
    });

    it("handles optional seat info", () => {
      const dataWithSeat: EventTicketData = {
        ...ticketData,
        seatInfo: "Table 5",
      };
      const html = generateEventTicket(defaultTheme, dataWithSeat);
      expect(html).toContain("Table 5");
      expect(html).toContain("Seat");
    });

    it("handles optional QR code", () => {
      const dataWithQR: EventTicketData = {
        ...ticketData,
        qrCodeUrl: "/qr/TKT-12345.png",
      };
      const html = generateEventTicket(defaultTheme, dataWithQR);
      expect(html).toContain("/qr/TKT-12345.png");
    });

    it("shows placeholder when no QR code", () => {
      const html = generateEventTicket(defaultTheme, ticketData);
      expect(html).toContain("QR Code");
    });
  });

  // ============================================================================
  // Receipt
  // ============================================================================

  describe("generateReceipt", () => {
    const receiptData: ReceiptData = {
      memberName: "Alice Johnson",
      receiptNumber: "RCP-2024-001",
      date: new Date("2024-03-20"),
      items: [
        { description: "Annual Membership", total: "$75.00" },
        { description: "Event Registration", total: "$25.00" },
      ],
      total: "$100.00",
    };

    it("generates valid HTML", () => {
      const html = generateReceipt(defaultTheme, receiptData);
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<html");
      expect(html).toContain("</html>");
    });

    it("includes member name", () => {
      const html = generateReceipt(defaultTheme, receiptData);
      expect(html).toContain("Alice Johnson");
    });

    it("includes receipt number", () => {
      const html = generateReceipt(defaultTheme, receiptData);
      expect(html).toContain("RCP-2024-001");
    });

    it("includes line items", () => {
      const html = generateReceipt(defaultTheme, receiptData);
      expect(html).toContain("Annual Membership");
      expect(html).toContain("$75.00");
      expect(html).toContain("Event Registration");
      expect(html).toContain("$25.00");
    });

    it("includes total amount", () => {
      const html = generateReceipt(defaultTheme, receiptData);
      expect(html).toContain("$100.00");
    });

    it("handles optional quantity and unit price", () => {
      const dataWithDetails: ReceiptData = {
        ...receiptData,
        items: [
          {
            description: "Event Tickets",
            quantity: 2,
            unitPrice: "$15.00",
            total: "$30.00",
          },
        ],
        total: "$30.00",
      };
      const html = generateReceipt(defaultTheme, dataWithDetails);
      expect(html).toContain("Qty");
      expect(html).toContain("Price");
    });

    it("handles optional subtotal and tax", () => {
      const dataWithTax: ReceiptData = {
        ...receiptData,
        subtotal: "$100.00",
        tax: "$8.50",
        total: "$108.50",
      };
      const html = generateReceipt(defaultTheme, dataWithTax);
      expect(html).toContain("Subtotal");
      expect(html).toContain("Tax");
      expect(html).toContain("$8.50");
    });

    it("handles optional payment method", () => {
      const dataWithPayment: ReceiptData = {
        ...receiptData,
        paymentMethod: "Credit Card",
      };
      const html = generateReceipt(defaultTheme, dataWithPayment);
      expect(html).toContain("Paid via Credit Card");
    });

    it("includes thank you message", () => {
      const html = generateReceipt(defaultTheme, receiptData);
      expect(html).toContain("Thank you for your payment!");
    });
  });

  // ============================================================================
  // Roster
  // ============================================================================

  describe("generateRoster", () => {
    const rosterData: RosterData = {
      title: "Active Members",
      asOfDate: new Date("2024-03-01"),
      members: [
        { name: "Alice Johnson", email: "alice@example.com" },
        { name: "Bob Smith", email: "bob@example.com" },
        { name: "Carol White", email: "carol@example.com" },
      ],
    };

    it("generates valid HTML", () => {
      const html = generateRoster(defaultTheme, rosterData);
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<html");
      expect(html).toContain("</html>");
    });

    it("includes roster title", () => {
      const html = generateRoster(defaultTheme, rosterData);
      expect(html).toContain("Active Members");
    });

    it("includes member count", () => {
      const html = generateRoster(defaultTheme, rosterData);
      expect(html).toContain("3 members");
    });

    it("includes all member names", () => {
      const html = generateRoster(defaultTheme, rosterData);
      expect(html).toContain("Alice Johnson");
      expect(html).toContain("Bob Smith");
      expect(html).toContain("Carol White");
    });

    it("includes email column by default", () => {
      const html = generateRoster(defaultTheme, rosterData);
      expect(html).toContain("Email");
      expect(html).toContain("alice@example.com");
    });

    it("hides email when showEmail is false", () => {
      const dataNoEmail: RosterData = {
        ...rosterData,
        showEmail: false,
      };
      const html = generateRoster(defaultTheme, dataNoEmail);
      expect(html).not.toContain("alice@example.com");
    });

    it("shows optional phone column", () => {
      const dataWithPhone: RosterData = {
        ...rosterData,
        showPhone: true,
        members: [
          { name: "Alice Johnson", email: "alice@example.com", phone: "555-1234" },
        ],
      };
      const html = generateRoster(defaultTheme, dataWithPhone);
      expect(html).toContain("Phone");
      expect(html).toContain("555-1234");
    });

    it("shows optional membership type column", () => {
      const dataWithType: RosterData = {
        ...rosterData,
        showMembershipType: true,
        members: [
          { name: "Alice Johnson", email: "alice@example.com", membershipType: "Premium" },
        ],
      };
      const html = generateRoster(defaultTheme, dataWithType);
      expect(html).toContain("Type");
      expect(html).toContain("Premium");
    });

    it("shows optional join date column", () => {
      const dataWithJoinDate: RosterData = {
        ...rosterData,
        showJoinDate: true,
        members: [
          { name: "Alice Johnson", email: "alice@example.com", joinDate: new Date("2023-06-01") },
        ],
      };
      const html = generateRoster(defaultTheme, dataWithJoinDate);
      expect(html).toContain("Joined");
    });

    it("shows optional status column", () => {
      const dataWithStatus: RosterData = {
        ...rosterData,
        showStatus: true,
        members: [
          { name: "Alice Johnson", email: "alice@example.com", status: "Active" },
        ],
      };
      const html = generateRoster(defaultTheme, dataWithStatus);
      expect(html).toContain("Status");
      expect(html).toContain("Active");
    });

    it("shows header and footer", () => {
      const html = generateRoster(defaultTheme, rosterData);
      // Roster should have header/footer enabled
      expect(html).toContain(defaultTheme.name);
    });

    it("handles singular member count", () => {
      const singleMember: RosterData = {
        ...rosterData,
        members: [{ name: "Alice Johnson", email: "alice@example.com" }],
      };
      const html = generateRoster(defaultTheme, singleMember);
      expect(html).toContain("1 member");
      expect(html).not.toContain("1 members");
    });
  });

  // ============================================================================
  // Name Badges
  // ============================================================================

  describe("generateNameBadges", () => {
    const badgeData: NameBadgeData = {
      members: [
        { name: "Alice Johnson" },
        { name: "Bob Smith", title: "President" },
        { name: "Carol White", pronouns: "she/her" },
      ],
    };

    it("generates valid HTML", () => {
      const html = generateNameBadges(defaultTheme, badgeData);
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<html");
      expect(html).toContain("</html>");
    });

    it("includes all member names", () => {
      const html = generateNameBadges(defaultTheme, badgeData);
      expect(html).toContain("Alice Johnson");
      expect(html).toContain("Bob Smith");
      expect(html).toContain("Carol White");
    });

    it("includes optional title", () => {
      const html = generateNameBadges(defaultTheme, badgeData);
      expect(html).toContain("President");
    });

    it("includes optional pronouns", () => {
      const html = generateNameBadges(defaultTheme, badgeData);
      expect(html).toContain("(she/her)");
    });

    it("includes optional organization", () => {
      const dataWithOrg: NameBadgeData = {
        members: [{ name: "Alice Johnson", organization: "SBNC" }],
      };
      const html = generateNameBadges(defaultTheme, dataWithOrg);
      expect(html).toContain("SBNC");
    });

    it("shows logo by default", () => {
      const html = generateNameBadges(defaultTheme, badgeData);
      expect(html).toContain(defaultTheme.logo.url);
    });

    it("hides logo when showLogo is false", () => {
      const dataNoLogo: NameBadgeData = {
        ...badgeData,
        showLogo: false,
      };
      const html = generateNameBadges(defaultTheme, dataNoLogo);
      // Should not contain logo section structure
      expect(html).not.toContain('max-height: 20pt');
    });

    it("uses medium badge size by default", () => {
      const html = generateNameBadges(defaultTheme, badgeData);
      expect(html).toContain("width: 3in");
      expect(html).toContain("height: 2in");
    });

    it("supports small badge size", () => {
      const smallBadges: NameBadgeData = {
        ...badgeData,
        badgeSize: "small",
      };
      const html = generateNameBadges(defaultTheme, smallBadges);
      expect(html).toContain("width: 2.5in");
      expect(html).toContain("height: 1.5in");
    });

    it("supports large badge size", () => {
      const largeBadges: NameBadgeData = {
        ...badgeData,
        badgeSize: "large",
      };
      const html = generateNameBadges(defaultTheme, largeBadges);
      expect(html).toContain("width: 4in");
      expect(html).toContain("height: 3in");
    });

    it("includes page-break-inside: avoid for badges", () => {
      const html = generateNameBadges(defaultTheme, badgeData);
      expect(html).toContain("page-break-inside: avoid");
    });
  });
});
