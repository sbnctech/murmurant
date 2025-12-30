/**
 * ViewAsBanner - Persistent banner showing current simulated view
 *
 * Displayed at the top of the page when viewing as a different role.
 * Makes it obvious that the current view is simulated, not the actual user.
 *
 * Copyright © 2025 Murmurant, Inc.
 */

"use client";

import { useViewAs } from "./ViewAsContext";

export default function ViewAsBanner() {
  const { viewContext, setViewMode, isEnabled } = useViewAs();

  if (!isEnabled || !viewContext.isSimulated) {
    return null;
  }

  return (
    <div
      data-test-id="view-as-banner"
      style={{
        position: "sticky",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: "#f59e0b", // amber-500
        color: "#000",
        padding: "var(--token-space-xs) var(--token-space-md)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--token-space-md)",
        fontSize: "var(--token-text-sm)",
        fontWeight: 600,
      }}
    >
      <span>
        Viewing as: {viewContext.label}
        {viewContext.simulatedRole && ` (${viewContext.simulatedRole})`}
      </span>
      <button
        data-test-id="view-as-banner-reset"
        onClick={() => setViewMode("actual")}
        style={{
          padding: "2px 8px",
          backgroundColor: "#fff",
          color: "#000",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "var(--token-text-sm)",
        }}
      >
        Reset
      </button>
    </div>
  );
}
