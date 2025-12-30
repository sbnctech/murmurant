/**
 * Branded Member Card Component
 *
 * Renders a printable membership card with club branding.
 * Standard credit card dimensions (3.375" x 2.125").
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import type { ClubBrand } from "@/lib/brands/types";
import { formatClubMonthYear } from "@/lib/timezone";

export interface MemberCardData {
  memberId: string;
  name: string;
  tier: "standard" | "premium" | "lifetime" | "honorary";
  joinDate: Date;
  expirationDate?: Date;
  photoUrl?: string;
}

export interface BrandedMemberCardProps {
  brand: ClubBrand;
  member: MemberCardData;
  showQrPlaceholder?: boolean;
}

const tierLabels: Record<MemberCardData["tier"], string> = {
  standard: "Member",
  premium: "Premium Member",
  lifetime: "Lifetime Member",
  honorary: "Honorary Member",
};

const tierColors: Record<MemberCardData["tier"], string> = {
  standard: "#64748b",
  premium: "#7c3aed",
  lifetime: "#ca8a04",
  honorary: "#0891b2",
};

export function BrandedMemberCard({
  brand,
  member,
  showQrPlaceholder = true,
}: BrandedMemberCardProps) {
  const { identity, name: clubName } = brand;
  const { logo, colors, fonts } = identity;

  const formatDate = (date: Date) => formatClubMonthYear(date);

  const tierColor = tierColors[member.tier];

  return (
    <>
      <style>
        {`
          @media print {
            .branded-member-card {
              width: 3.375in;
              height: 2.125in;
              margin: 0;
              padding: 0;
              page-break-inside: avoid;
            }
          }
          @media screen {
            .branded-member-card {
              width: 324px;
              height: 204px;
            }
          }
        `}
      </style>
      <div
        className="branded-member-card"
        style={{
          fontFamily: fonts.body,
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryHover} 100%)`,
          color: "white",
          position: "relative",
        }}
      >
        {/* Background Pattern */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage: `radial-gradient(circle at 20% 80%, white 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }}
        />

        {/* Card Content */}
        <div
          style={{
            position: "relative",
            padding: "16px",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header Row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "auto",
            }}
          >
            {/* Logo */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "6px",
                padding: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={logo.url}
                alt={logo.alt}
                style={{
                  width: "60px",
                  height: "auto",
                  maxHeight: "24px",
                  objectFit: "contain",
                }}
              />
            </div>

            {/* Tier Badge */}
            <div
              style={{
                backgroundColor: tierColor,
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "10px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {tierLabels[member.tier]}
            </div>
          </div>

          {/* Member Info */}
          <div style={{ marginTop: "12px" }}>
            <p
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 700,
                fontFamily: fonts.heading,
                letterSpacing: "0.5px",
              }}
            >
              {member.name}
            </p>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "11px",
                opacity: 0.9,
              }}
            >
              ID: {member.memberId}
            </p>
          </div>

          {/* Footer Row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginTop: "auto",
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: "9px",
                  opacity: 0.7,
                  textTransform: "uppercase",
                }}
              >
                Member Since
              </p>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                {formatDate(member.joinDate)}
              </p>
            </div>

            {member.expirationDate && (
              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: "9px",
                    opacity: 0.7,
                    textTransform: "uppercase",
                  }}
                >
                  Valid Through
                </p>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: "11px",
                    fontWeight: 600,
                  }}
                >
                  {formatDate(member.expirationDate)}
                </p>
              </div>
            )}

            {showQrPlaceholder && (
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: "white",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "8px",
                  color: colors.primary,
                  fontWeight: 600,
                }}
              >
                QR
              </div>
            )}
          </div>

          {/* Club Name Watermark */}
          <p
            style={{
              position: "absolute",
              bottom: "4px",
              left: "16px",
              margin: 0,
              fontSize: "8px",
              opacity: 0.5,
            }}
          >
            {clubName}
          </p>
        </div>
      </div>
    </>
  );
}

export default BrandedMemberCard;
