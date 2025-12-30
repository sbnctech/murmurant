// Copyright © 2025 Murmurant, Inc.
// GadgetBlock - Client component for rendering gadgets in page content
"use client";

import { GadgetBlock as GadgetBlockType } from "@/lib/publishing/blocks";
import { GlobalRole } from "@/lib/auth";
import GadgetHost from "@/components/gadgets/GadgetHost";
import {
  isGadgetImplemented,
  canViewGadget,
  isRoleRestrictedGadget,
  GadgetVisibility,
} from "@/components/gadgets/gadget-registry";

type GadgetBlockProps = {
  block: GadgetBlockType;
  userRole?: GlobalRole | null;
};

/**
 * GadgetBlock renderer for page content
 *
 * Features:
 * - Renders gadgets via GadgetHost
 * - Supports RBAC visibility settings
 * - Role-gates officer gadgets
 * - Shows placeholder for unimplemented gadgets
 */
export default function GadgetBlock({ block, userRole = null }: GadgetBlockProps) {
  const {
    gadgetId,
    title,
    showTitle = true,
    layout = "card",
    visibility,
    allowedRoles,
  } = block.data;

  // Check if user can view this gadget (RBAC)
  const canView = canViewGadget(
    gadgetId,
    userRole,
    visibility as GadgetVisibility | undefined,
    allowedRoles
  );

  // If user cannot view this gadget, render nothing
  if (!canView) {
    return null;
  }

  // Check if gadget is implemented
  if (!isGadgetImplemented(gadgetId)) {
    return (
      <div
        data-block-type="gadget"
        data-gadget-id={gadgetId}
        style={{
          padding: "var(--spacing-lg, 24px)",
          backgroundColor: "#f9fafb",
          border: "1px dashed #d1d5db",
          borderRadius: "var(--border-radius-md, 8px)",
          textAlign: "center",
          color: "#6b7280",
        }}
      >
        <p style={{ margin: 0, fontStyle: "italic" }}>
          Gadget &quot;{gadgetId}&quot; is coming soon...
        </p>
      </div>
    );
  }

  // Render the gadget
  return (
    <div
      data-block-type="gadget"
      data-gadget-id={gadgetId}
      className={`gadget-block gadget-layout-${layout}`}
      style={{
        // Inline layout removes the card styling
        ...(layout === "inline"
          ? {}
          : {
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "var(--border-radius-lg, 16px)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }),
      }}
    >
      <GadgetHost
        gadgetId={gadgetId}
        title={title}
        showTitle={showTitle}
      />
      {/* Role indicator for officer gadgets (only in development) */}
      {process.env.NODE_ENV === "development" && isRoleRestrictedGadget(gadgetId) && (
        <div
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            fontSize: "10px",
            backgroundColor: "#fef3c7",
            color: "#92400e",
            padding: "2px 6px",
            borderRadius: "4px",
          }}
        >
          🔒 Officer only
        </div>
      )}
    </div>
  );
}
