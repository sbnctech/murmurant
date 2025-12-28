/**
 * Branded Name Badge Component
 *
 * Renders a printable name badge for events.
 * Standard badge size (4" x 3" or 3" x 4" portrait).
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import type { ClubBrand } from "@/lib/brands/types";

export interface BadgeData {
  attendeeName: string;
  eventName: string;
  organization?: string;
  tableAssignment?: string;
  role?: string;
  pronouns?: string;
}

export interface BrandedNameBadgeProps {
  brand: ClubBrand;
  badge: BadgeData;
  orientation?: "landscape" | "portrait";
}

export function BrandedNameBadge({
  brand,
  badge,
  orientation = "landscape",
}: BrandedNameBadgeProps) {
  const { identity, name: clubName } = brand;
  const { logo, colors, fonts } = identity;

  const isLandscape = orientation === "landscape";
  const width = isLandscape ? "4in" : "3in";
  const height = isLandscape ? "3in" : "4in";
  const screenWidth = isLandscape ? "384px" : "288px";
  const screenHeight = isLandscape ? "288px" : "384px";

  return (
    <>
      <style>
        {`
          @media print {
            .branded-name-badge {
              width: ${width};
              height: ${height};
              margin: 0;
              padding: 0;
              page-break-inside: avoid;
            }
          }
          @media screen {
            .branded-name-badge {
              width: ${screenWidth};
              height: ${screenHeight};
            }
          }
        `}
      </style>
      <div
        className="branded-name-badge"
        style={{
          fontFamily: fonts.body,
          border: `3px solid ${colors.primary}`,
          borderRadius: "8px",
          overflow: "hidden",
          backgroundColor: "white",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header with Event Name */}
        <div
          style={{
            backgroundColor: colors.primary,
            color: "white",
            padding: "12px 16px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              fontWeight: 600,
              fontFamily: fonts.heading,
              letterSpacing: "0.5px",
            }}
          >
            {badge.eventName}
          </p>
        </div>

        {/* Main Content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            position: "relative",
          }}
        >
          {/* Logo in corner */}
          <div
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
            }}
          >
            <img
              src={logo.url}
              alt={logo.alt}
              style={{
                width: "48px",
                height: "auto",
                maxHeight: "24px",
                objectFit: "contain",
                opacity: 0.7,
              }}
            />
          </div>

          {/* Role Badge (if any) */}
          {badge.role && (
            <div
              style={{
                backgroundColor: colors.accent,
                color: "#0f172a",
                padding: "4px 12px",
                borderRadius: "12px",
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "8px",
              }}
            >
              {badge.role}
            </div>
          )}

          {/* Attendee Name - Large */}
          <h1
            style={{
              margin: 0,
              fontSize: isLandscape ? "32px" : "28px",
              fontWeight: 700,
              fontFamily: fonts.heading,
              color: "#0f172a",
              textAlign: "center",
              lineHeight: 1.2,
            }}
          >
            {badge.attendeeName}
          </h1>

          {/* Pronouns */}
          {badge.pronouns && (
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "12px",
                color: "#64748b",
              }}
            >
              ({badge.pronouns})
            </p>
          )}

          {/* Organization */}
          {badge.organization && (
            <p
              style={{
                margin: "8px 0 0",
                fontSize: "14px",
                color: "#475569",
                textAlign: "center",
              }}
            >
              {badge.organization}
            </p>
          )}
        </div>

        {/* Footer with Table Assignment */}
        {badge.tableAssignment && (
          <div
            style={{
              backgroundColor: "#f8fafc",
              borderTop: "1px solid #e2e8f0",
              padding: "12px 16px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "11px",
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Table
            </p>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: "18px",
                fontWeight: 700,
                color: colors.primary,
                fontFamily: fonts.heading,
              }}
            >
              {badge.tableAssignment}
            </p>
          </div>
        )}

        {/* Club Name Footer */}
        <div
          style={{
            padding: "6px 16px",
            textAlign: "center",
            borderTop: badge.tableAssignment ? "none" : "1px solid #e2e8f0",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "10px",
              color: "#94a3b8",
            }}
          >
            {clubName}
          </p>
        </div>
      </div>
    </>
  );
}

export default BrandedNameBadge;
