import GadgetHost from "@/components/gadgets/GadgetHost";
import MemberWelcomeCard from "@/components/member/MemberWelcomeCard";

/**
 * MyClubPage - The member dashboard home page.
 *
 * URL: /member
 *
 * This page serves as the main landing page for authenticated club members.
 * Features:
 * - Personalized welcome card with member's name and status
 * - Upcoming events gadget
 * - My registrations gadget
 *
 * Layout:
 * - Full-width welcome card at top
 * - Responsive two-column grid for gadgets below
 */

export default function MyClubPage() {
  return (
    <div data-test-id="myclub-page">
      {/* ========================================
          PERSONALIZED WELCOME CARD
          Shows greeting, membership status, and tenure
          ======================================== */}
      <MemberWelcomeCard />

      {/* ========================================
          SECTION HEADER
          ======================================== */}
      <h2
        style={{
          fontSize: "20px",
          fontWeight: 600,
          marginTop: 0,
          marginBottom: "16px",
          color: "#374151",
        }}
      >
        Your Dashboard
      </h2>

      {/* ========================================
          GADGET GRID
          Responsive two-column layout for gadgets.
          - Wide screens: side by side
          - Narrow screens: stacked
          ======================================== */}
      <div
        data-test-id="myclub-gadget-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px",
        }}
      >
        {/* Column 1: Upcoming Events */}
        <section
          data-test-id="myclub-gadgets-primary"
          aria-label="Upcoming events"
        >
          <GadgetHost gadgetId="upcoming-events" slot="primary" />
        </section>

        {/* Column 2: My Registrations */}
        <section
          data-test-id="myclub-gadgets-secondary"
          aria-label="My registrations"
        >
          <GadgetHost gadgetId="my-registrations" slot="secondary" />
        </section>
      </div>
    </div>
  );
}
