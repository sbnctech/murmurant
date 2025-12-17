"use client";

/**
 * Authorization-Aware Navigation Component
 *
 * Renders navigation items based on user's capabilities.
 * Items requiring capabilities the user lacks are hidden.
 *
 * Charter Compliance:
 * - P2: UI reflects actual authorization (server still enforces)
 * - P7: Navigation shows only what user can access
 * - N3: No UI-only gating - server still validates
 */

import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Capability } from "@/lib/auth";

// ============================================================================
// Types
// ============================================================================

export interface NavItem {
  /** Display label */
  label: string;
  /** Link href */
  href: string;
  /** Test ID for E2E testing */
  testId?: string;
  /** Required capability to see this item (user needs at least one) */
  requiredCapability?: Capability | Capability[];
  /** Icon (optional) */
  icon?: React.ReactNode;
  /** Badge text (e.g., count) */
  badge?: string | number;
  /** Whether this is currently active */
  active?: boolean;
}

interface AuthorizedNavProps {
  /** Navigation items to render */
  items: NavItem[];
  /** CSS style for the nav container */
  style?: React.CSSProperties;
  /** CSS style for each link */
  linkStyle?: React.CSSProperties;
  /** CSS class for the nav container */
  className?: string;
  /** Render as vertical list (default horizontal) */
  vertical?: boolean;
  /** Hide items instead of disabling (default true) */
  hideUnauthorized?: boolean;
  /** Show loading placeholder while checking auth */
  showLoading?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export default function AuthorizedNav({
  items,
  style,
  linkStyle,
  className,
  vertical = false,
  hideUnauthorized = true,
  showLoading = false,
}: AuthorizedNavProps) {
  const { loading, hasCapability, hasAnyCapability } = useCurrentUser();

  // Check if user has required capability for an item
  const canAccess = (item: NavItem): boolean => {
    if (!item.requiredCapability) return true;

    if (Array.isArray(item.requiredCapability)) {
      return hasAnyCapability(item.requiredCapability);
    }

    return hasCapability(item.requiredCapability);
  };

  // Filter items based on authorization
  const visibleItems = hideUnauthorized
    ? items.filter(canAccess)
    : items;

  // Loading state
  if (loading && showLoading) {
    return (
      <nav
        data-test-id="authorized-nav-loading"
        style={{
          display: "flex",
          flexDirection: vertical ? "column" : "row",
          gap: "16px",
          ...style,
        }}
        className={className}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: "80px",
              height: "20px",
              backgroundColor: "#e5e7eb",
              borderRadius: "4px",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        ))}
      </nav>
    );
  }

  const defaultLinkStyle: React.CSSProperties = {
    color: "#0066cc",
    textDecoration: "none",
    fontSize: "14px",
    padding: "4px 0",
  };

  return (
    <nav
      data-test-id="authorized-nav"
      style={{
        display: "flex",
        flexDirection: vertical ? "column" : "row",
        flexWrap: vertical ? undefined : "wrap",
        gap: "16px",
        ...style,
      }}
      className={className}
    >
      {visibleItems.map((item) => {
        const isAuthorized = canAccess(item);
        const isDisabled = !hideUnauthorized && !isAuthorized;

        return (
          <a
            key={item.href}
            href={isDisabled ? undefined : item.href}
            data-test-id={item.testId}
            aria-disabled={isDisabled}
            style={{
              ...defaultLinkStyle,
              ...linkStyle,
              cursor: isDisabled ? "not-allowed" : "pointer",
              opacity: isDisabled ? 0.5 : 1,
              pointerEvents: isDisabled ? "none" : "auto",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: item.active ? 600 : 400,
            }}
          >
            {item.icon}
            {item.label}
            {item.badge !== undefined && (
              <span
                style={{
                  backgroundColor: "#e5e7eb",
                  color: "#374151",
                  fontSize: "11px",
                  fontWeight: 500,
                  padding: "2px 6px",
                  borderRadius: "9999px",
                }}
              >
                {item.badge}
              </span>
            )}
          </a>
        );
      })}
    </nav>
  );
}

// ============================================================================
// Pre-configured Admin Nav Items
// ============================================================================

/**
 * Standard admin navigation items with capability requirements.
 * Use this with AuthorizedNav for consistent admin navigation.
 */
export const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    testId: "admin-nav-dashboard",
  },
  {
    label: "Members",
    href: "/admin/members",
    testId: "admin-nav-members",
    requiredCapability: "members:view",
  },
  {
    label: "Events",
    href: "/admin/events",
    testId: "admin-nav-events",
    requiredCapability: "events:view",
  },
  {
    label: "Registrations",
    href: "/admin/registrations",
    testId: "admin-nav-registrations",
    requiredCapability: "registrations:view",
  },
  {
    label: "Service History",
    href: "/admin/service-history",
    testId: "admin-nav-service-history",
    requiredCapability: "members:history",
  },
  {
    label: "Transitions",
    href: "/admin/transitions",
    testId: "admin-nav-transitions",
    requiredCapability: "transitions:view",
  },
  {
    label: "Content",
    href: "/admin/content/pages",
    testId: "admin-nav-content",
    requiredCapability: "publishing:manage",
  },
  {
    label: "Communications",
    href: "/admin/comms/lists",
    testId: "admin-nav-comms",
    requiredCapability: "comms:manage",
  },
];

/**
 * Officer portal navigation items.
 */
export const OFFICER_NAV_ITEMS: NavItem[] = [
  {
    label: "Secretary Dashboard",
    href: "/officer/secretary",
    testId: "officer-nav-secretary",
    requiredCapability: ["meetings:minutes:draft:create", "meetings:minutes:draft:edit"],
  },
  {
    label: "Parliamentarian Dashboard",
    href: "/officer/parliamentarian",
    testId: "officer-nav-parliamentarian",
    requiredCapability: "governance:rules:manage",
  },
  {
    label: "Board Records",
    href: "/officer/board-records",
    testId: "officer-nav-board-records",
    requiredCapability: "board_records:read",
  },
];
