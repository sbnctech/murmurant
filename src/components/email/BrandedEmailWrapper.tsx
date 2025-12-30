/**
 * Branded Email Wrapper Component
 *
 * Combines header, content, and footer into a complete branded email.
 * Uses inline styles for email client compatibility.
 *
 * Usage:
 *   <BrandedEmailWrapper brand={sbncBrand}>
 *     <h1>Welcome!</h1>
 *     <p>Thanks for joining...</p>
 *   </BrandedEmailWrapper>
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import type { ReactNode } from "react";
import type { ClubBrand } from "@/lib/brands/types";
import { BrandedEmailHeader } from "./BrandedEmailHeader";
import { BrandedEmailFooter } from "./BrandedEmailFooter";

export interface BrandedEmailWrapperProps {
  brand: ClubBrand;
  children: ReactNode;
  unsubscribeUrl?: string;
  previewText?: string;
}

export function BrandedEmailWrapper({
  brand,
  children,
  unsubscribeUrl,
  previewText,
}: BrandedEmailWrapperProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{brand.name}</title>
        {/* Preview text for email clients */}
        {previewText && (
          <span
            style={{
              display: "none",
              fontSize: "1px",
              color: "#ffffff",
              lineHeight: "1px",
              maxHeight: 0,
              maxWidth: 0,
              opacity: 0,
              overflow: "hidden",
            }}
          >
            {previewText}
          </span>
        )}
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#f1f5f9",
          fontFamily: brand.identity.fonts.body,
        }}
      >
        <table
          width="100%"
          cellPadding="0"
          cellSpacing="0"
          role="presentation"
          style={{
            backgroundColor: "#f1f5f9",
            padding: "24px 0",
          }}
        >
          <tbody>
            <tr>
              <td align="center">
                <table
                  width="600"
                  cellPadding="0"
                  cellSpacing="0"
                  role="presentation"
                  style={{
                    maxWidth: "600px",
                    width: "100%",
                    backgroundColor: "#ffffff",
                    borderRadius: "8px",
                    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
                  }}
                >
                  <tbody>
                    {/* Header */}
                    <tr>
                      <td>
                        <BrandedEmailHeader brand={brand} />
                      </td>
                    </tr>

                    {/* Content */}
                    <tr>
                      <td
                        style={{
                          padding: "32px 24px",
                          color: "#0f172a",
                          fontSize: "16px",
                          lineHeight: "1.625",
                          fontFamily: brand.identity.fonts.body,
                        }}
                      >
                        {children}
                      </td>
                    </tr>

                    {/* Footer */}
                    <tr>
                      <td>
                        <BrandedEmailFooter
                          brand={brand}
                          unsubscribeUrl={unsubscribeUrl}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

export default BrandedEmailWrapper;
