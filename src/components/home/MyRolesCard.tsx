/**
 * MyRolesCard - Shows officer roles and their quick actions
 *
 * Displayed only for members with officer or committee roles.
 * Part of the "My SBNC" member home page utility column.
 *
 * Copyright © 2025 Murmurant, Inc.
 */

"use client";

import SectionCard from "@/components/layout/SectionCard";
import type { GlobalRole } from "@/lib/auth";

interface RoleInfo {
  role: GlobalRole;
  displayName: string;
  quickAction?: {
    label: string;
    href: string;
  };
  badge?: {
    count: number;
    label: string;
  };
}

interface MyRolesCardProps {
  /** Current user's role */
  role: GlobalRole;
}

const ROLE_CONFIGS: Partial<Record<GlobalRole, RoleInfo>> = {
  president: {
    role: "president",
    displayName: "President",
    quickAction: {
      label: "View Dashboard",
      href: "/admin",
    },
  },
  "vp-activities": {
    role: "vp-activities",
    displayName: "VP Activities",
    quickAction: {
      label: "Manage Events",
      href: "/admin/events",
    },
    badge: {
      count: 3,
      label: "pending reviews",
    },
  },
  "event-chair": {
    role: "event-chair",
    displayName: "Event Chair",
    quickAction: {
      label: "My Events",
      href: "/admin/events",
    },
  },
  secretary: {
    role: "secretary",
    displayName: "Secretary",
    quickAction: {
      label: "Meeting Minutes",
      href: "/admin/governance",
    },
  },
  parliamentarian: {
    role: "parliamentarian",
    displayName: "Parliamentarian",
    quickAction: {
      label: "Governance",
      href: "/admin/governance",
    },
  },
  webmaster: {
    role: "webmaster",
    displayName: "Webmaster",
    quickAction: {
      label: "Content",
      href: "/admin/content",
    },
  },
  admin: {
    role: "admin",
    displayName: "Tech Lead",
    quickAction: {
      label: "Admin Dashboard",
      href: "/admin",
    },
  },
};

export default function MyRolesCard({ role }: MyRolesCardProps) {
  const roleConfig = ROLE_CONFIGS[role];

  // Don't render for regular members
  if (!roleConfig || role === "member") {
    return null;
  }

  return (
    <SectionCard
      title="My Roles"
      testId="my-roles-card"
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--token-space-md)",
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 600,
              color: "var(--token-color-text)",
              marginBottom: "var(--token-space-xs)",
            }}
          >
            {roleConfig.displayName}
          </div>
          {roleConfig.badge && (
            <div
              style={{
                fontSize: "var(--token-text-sm)",
                color: "var(--token-color-primary)",
              }}
            >
              {roleConfig.badge.count} {roleConfig.badge.label}
            </div>
          )}
        </div>

        {roleConfig.quickAction && (
          <a
            href={roleConfig.quickAction.href}
            data-test-id="role-quick-action"
            style={{
              padding: "var(--token-space-xs) var(--token-space-sm)",
              backgroundColor: "var(--token-color-primary)",
              color: "#fff",
              borderRadius: "var(--token-radius-lg)",
              fontSize: "var(--token-text-sm)",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            {roleConfig.quickAction.label}
          </a>
        )}
      </div>
    </SectionCard>
  );
}
