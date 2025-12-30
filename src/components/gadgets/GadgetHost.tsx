/**
 * GadgetHost - Container component that renders gadgets.
 *
 * This component acts as the "slot" where gadgets live.
 * It maps gadgetId values to actual gadget components using a registry.
 *
 * For implemented gadgets, it renders the real component.
 * For unimplemented gadgets, it renders placeholder content.
 *
 * Props:
 *   gadgetId - Unique identifier for the gadget to render
 *   slot     - Optional layout slot name (for styling/positioning hints)
 */

import UpcomingEventsGadget from "./UpcomingEventsGadget";
import MyRegistrationsGadget from "./MyRegistrationsGadget";
import { GadgetProps } from "./types";

type GadgetHostProps = {
  gadgetId: string;
  slot?: string;
  /** Optional title override (defaults to registry title) */
  title?: string;
  /** Whether to show the title (defaults to true) */
  showTitle?: boolean;
};

/**
 * GADGET REGISTRY
 *
 * Maps gadgetId strings to their implementing components.
 * Add new gadgets here as they are implemented.
 *
 * null = gadget ID is reserved but not yet implemented
 */
const GADGET_REGISTRY: Record<
  string,
  React.ComponentType<GadgetProps> | null
> = {
  "upcoming-events": UpcomingEventsGadget,
  "my-registrations": MyRegistrationsGadget,
  // Future gadgets (not yet implemented):
  announcements: null,
  "presidents-message": null,
  "recent-photos": null,
  tasks: null,
  "quick-actions": null,
};

/**
 * GADGET TITLES
 *
 * Display titles for each gadget, used in the card header.
 * Every gadget ID should have a corresponding title.
 */
const GADGET_TITLES: Record<string, string> = {
  "upcoming-events": "Upcoming Events",
  "my-registrations": "My Registrations",
  announcements: "Announcements",
  "presidents-message": "President's Message",
  "recent-photos": "Recent Photos",
  tasks: "My Tasks",
  "quick-actions": "Quick Actions",
};

export default function GadgetHost({
  gadgetId,
  slot,
  title: titleOverride,
  showTitle = true,
}: GadgetHostProps) {
  // Look up the gadget component and title
  const GadgetComponent = GADGET_REGISTRY[gadgetId];
  const defaultTitle = GADGET_TITLES[gadgetId] || "Unknown Gadget";
  const title = titleOverride || defaultTitle;
  const isUnknown = !(gadgetId in GADGET_REGISTRY);

  return (
    <div
      data-test-id={`gadget-host-${gadgetId}`}
      data-gadget-id={gadgetId}
      data-slot={slot}
      style={{
        backgroundColor: "#ffffff",
        border: isUnknown ? "2px dashed #ef4444" : "1px solid #e2e8f0",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: isUnknown ? "none" : "0 1px 3px rgba(0,0,0,0.05)",
        transition: "box-shadow 0.2s, transform 0.2s",
      }}
    >
      {/* Gadget title - conditionally rendered */}
      {showTitle && (
        <h3
          data-test-id={`gadget-title-${gadgetId}`}
          style={{
            fontSize: "17px",
            fontWeight: 600,
            marginTop: 0,
            marginBottom: "16px",
            color: isUnknown ? "#ef4444" : "#1e293b",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "4px",
              height: "20px",
              background: isUnknown ? "#ef4444" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "2px",
            }}
          />
          {title}
        </h3>
      )}

      {/* Gadget content area */}
      <div data-test-id={`gadget-content-${gadgetId}`}>
        {GadgetComponent ? (
          // Render the actual gadget component
          <GadgetComponent slot={slot} />
        ) : (
          // Render placeholder for unknown or unimplemented gadgets
          <p
            style={{
              color: isUnknown ? "#ef4444" : "#64748b",
              fontStyle: "italic",
              margin: 0,
              padding: "20px 0",
              textAlign: "center",
            }}
          >
            {isUnknown ? `Unknown gadget: ${gadgetId}` : "Coming soon..."}
          </p>
        )}
      </div>
    </div>
  );
}
