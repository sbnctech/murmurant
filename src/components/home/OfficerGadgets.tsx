/**
 * OfficerGadgets - Role-specific officer gadgets
 *
 * Displays role-aware gadgets for officers:
 * - VP Membership: Pending approvals
 * - Event Chair: My Events summary
 * - President: Governance summary
 *
 * Copyright © 2025 Murmurant, Inc.
 */

"use client";

import Link from "next/link";
import SectionCard from "@/components/layout/SectionCard";
import type { GlobalRole } from "@/lib/auth";

// ============================================================================
// VP Membership Gadget
// ============================================================================

export function VPMembershipGadget() {
  return (
    <SectionCard
      title="VP Membership"
      subtitle="Membership oversight"
      testId="vp-membership-gadget"
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--token-space-sm)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "var(--token-space-sm)",
            backgroundColor: "var(--token-color-surface-2)",
            borderRadius: "var(--token-radius-lg)",
          }}
        >
          <span>Pending Approvals</span>
          <span
            style={{
              fontWeight: 700,
              color: "var(--token-color-primary)",
            }}
          >
            2
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "var(--token-space-sm)",
            backgroundColor: "var(--token-color-surface-2)",
            borderRadius: "var(--token-radius-lg)",
          }}
        >
          <span>Expiring This Month</span>
          <span
            style={{
              fontWeight: 700,
              color: "var(--token-color-warning)",
            }}
          >
            5
          </span>
        </div>
        <Link
          href="/admin/members"
          style={{
            display: "block",
            textAlign: "center",
            padding: "var(--token-space-xs)",
            color: "var(--token-color-primary)",
            fontSize: "var(--token-text-sm)",
            textDecoration: "none",
          }}
        >
          View Members Dashboard
        </Link>
      </div>
    </SectionCard>
  );
}

// ============================================================================
// Event Chair Gadget
// ============================================================================

export function EventChairGadget() {
  return (
    <SectionCard
      title="My Events"
      subtitle="Events you manage"
      testId="event-chair-gadget"
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--token-space-sm)",
        }}
      >
        <div
          style={{
            padding: "var(--token-space-sm)",
            backgroundColor: "var(--token-color-surface-2)",
            borderRadius: "var(--token-radius-lg)",
          }}
        >
          <div style={{ fontWeight: 600 }}>Book Club</div>
          <div
            style={{
              fontSize: "var(--token-text-sm)",
              color: "var(--token-color-text-muted)",
            }}
          >
            Next: Jan 22 - 8 registered
          </div>
        </div>
        <Link
          href="/admin/events"
          style={{
            display: "block",
            textAlign: "center",
            padding: "var(--token-space-xs)",
            color: "var(--token-color-primary)",
            fontSize: "var(--token-text-sm)",
            textDecoration: "none",
          }}
        >
          Manage Events
        </Link>
      </div>
    </SectionCard>
  );
}

// ============================================================================
// President Gadget
// ============================================================================

export function PresidentGadget() {
  return (
    <SectionCard
      title="Governance Summary"
      subtitle="Board oversight"
      testId="president-gadget"
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--token-space-sm)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "var(--token-space-sm)",
            backgroundColor: "var(--token-color-surface-2)",
            borderRadius: "var(--token-radius-lg)",
          }}
        >
          <span>Open Flags</span>
          <span
            style={{
              fontWeight: 700,
              color: "var(--token-color-warning)",
            }}
          >
            1
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "var(--token-space-sm)",
            backgroundColor: "var(--token-color-surface-2)",
            borderRadius: "var(--token-radius-lg)",
          }}
        >
          <span>Pending Minutes</span>
          <span style={{ fontWeight: 700 }}>0</span>
        </div>
        <Link
          href="/admin/governance"
          style={{
            display: "block",
            textAlign: "center",
            padding: "var(--token-space-xs)",
            color: "var(--token-color-primary)",
            fontSize: "var(--token-text-sm)",
            textDecoration: "none",
          }}
        >
          View Governance Dashboard
        </Link>
      </div>
    </SectionCard>
  );
}

// ============================================================================
// Tech Lead Gadget
// ============================================================================

export function TechLeadGadget() {
  return (
    <SectionCard
      title="System Status"
      subtitle="Tech lead overview"
      testId="tech-lead-gadget"
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--token-space-sm)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "var(--token-space-sm)",
            backgroundColor: "#dcfce7",
            borderRadius: "var(--token-radius-lg)",
          }}
        >
          <span>System Status</span>
          <span
            style={{
              fontWeight: 700,
              color: "var(--token-color-success)",
            }}
          >
            Healthy
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "var(--token-space-sm)",
            backgroundColor: "var(--token-color-surface-2)",
            borderRadius: "var(--token-radius-lg)",
          }}
        >
          <span>Demo Mode</span>
          <span style={{ fontWeight: 700 }}>Active</span>
        </div>
        <Link
          href="/admin"
          style={{
            display: "block",
            textAlign: "center",
            padding: "var(--token-space-xs)",
            color: "var(--token-color-primary)",
            fontSize: "var(--token-text-sm)",
            textDecoration: "none",
          }}
        >
          Admin Dashboard
        </Link>
      </div>
    </SectionCard>
  );
}

// ============================================================================
// Role-based Gadget Selector
// ============================================================================

interface OfficerGadgetSelectorProps {
  role: GlobalRole;
}

export default function OfficerGadgetSelector({ role }: OfficerGadgetSelectorProps) {
  switch (role) {
    case "president":
      return <PresidentGadget />;
    case "vp-activities":
      return <VPMembershipGadget />;
    case "event-chair":
      return <EventChairGadget />;
    case "admin":
      return <TechLeadGadget />;
    case "secretary":
    case "parliamentarian":
      return <PresidentGadget />; // Show governance summary
    default:
      return null;
  }
}
