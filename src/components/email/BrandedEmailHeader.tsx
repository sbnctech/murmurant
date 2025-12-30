/**
 * Branded Email Header Component
 *
 * Renders an email header using brand identity configuration.
 * Uses inline styles for email client compatibility.
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import type { ClubBrand } from "@/lib/brands/types";

export interface BrandedEmailHeaderProps {
  brand: ClubBrand;
}

export function BrandedEmailHeader({ brand }: BrandedEmailHeaderProps) {
  const { logo, colors } = brand.identity;

  return (
    <table
      width="100%"
      cellPadding="0"
      cellSpacing="0"
      role="presentation"
      style={{
        backgroundColor: colors.primary,
        borderRadius: "8px 8px 0 0",
      }}
    >
      <tbody>
        <tr>
          <td
            style={{
              padding: "24px",
              textAlign: "center",
            }}
          >
            <img
              src={logo.url}
              alt={logo.alt}
              width={logo.width}
              height={logo.height}
              style={{
                display: "block",
                margin: "0 auto",
                maxWidth: "100%",
                height: "auto",
              }}
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export default BrandedEmailHeader;
