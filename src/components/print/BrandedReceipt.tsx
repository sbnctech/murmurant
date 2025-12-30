/**
 * Branded Receipt Component
 *
 * Renders a printable payment receipt with club branding.
 * Uses @media print styles for proper printing.
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import type { ClubBrand } from "@/lib/brands/types";
import { formatClubDateLong } from "@/lib/timezone";

export interface PaymentData {
  receiptNumber: string;
  date: Date;
  description: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax?: number;
  total: number;
  paymentMethod: string;
  memberName: string;
  memberEmail: string;
}

export interface BrandedReceiptProps {
  brand: ClubBrand;
  payment: PaymentData;
}

export function BrandedReceipt({ brand, payment }: BrandedReceiptProps) {
  const { identity, name, communication } = brand;
  const { logo, colors, fonts } = identity;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  const formatDate = (date: Date) => formatClubDateLong(date);

  return (
    <>
      <style>
        {`
          @media print {
            .branded-receipt {
              width: 100%;
              max-width: 8.5in;
              margin: 0 auto;
              padding: 0.5in;
              font-size: 12pt;
            }
            .branded-receipt-header {
              border-bottom: 2px solid ${colors.primary} !important;
            }
            .no-print {
              display: none !important;
            }
          }
          @media screen {
            .branded-receipt {
              max-width: 600px;
              margin: 0 auto;
              padding: 24px;
              background: white;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              border-radius: 8px;
            }
          }
        `}
      </style>
      <div
        className="branded-receipt"
        style={{
          fontFamily: fonts.body,
          color: "#0f172a",
        }}
      >
        {/* Header */}
        <div
          className="branded-receipt-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            paddingBottom: "16px",
            marginBottom: "24px",
            borderBottom: `2px solid ${colors.primary}`,
          }}
        >
          <div>
            <img
              src={logo.url}
              alt={logo.alt}
              style={{
                width: `${logo.width}px`,
                height: `${logo.height}px`,
                maxWidth: "150px",
                objectFit: "contain",
              }}
            />
            <p
              style={{
                margin: "8px 0 0",
                fontSize: "14px",
                color: "#64748b",
              }}
            >
              {name}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <h1
              style={{
                margin: 0,
                fontSize: "24px",
                fontFamily: fonts.heading,
                color: colors.primary,
              }}
            >
              Receipt
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#64748b" }}>
              #{payment.receiptNumber}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#64748b" }}>
              {formatDate(payment.date)}
            </p>
          </div>
        </div>

        {/* Member Info */}
        <div
          style={{
            marginBottom: "24px",
            padding: "16px",
            backgroundColor: "#f8fafc",
            borderRadius: "4px",
          }}
        >
          <p style={{ margin: 0, fontWeight: 600 }}>{payment.memberName}</p>
          <p style={{ margin: "4px 0 0", color: "#64748b" }}>
            {payment.memberEmail}
          </p>
        </div>

        {/* Line Items Table */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "24px",
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: `1px solid ${colors.primary}`,
              }}
            >
              <th
                style={{
                  textAlign: "left",
                  padding: "8px 0",
                  fontWeight: 600,
                }}
              >
                Description
              </th>
              <th
                style={{
                  textAlign: "center",
                  padding: "8px 0",
                  fontWeight: 600,
                  width: "80px",
                }}
              >
                Qty
              </th>
              <th
                style={{
                  textAlign: "right",
                  padding: "8px 0",
                  fontWeight: 600,
                  width: "100px",
                }}
              >
                Price
              </th>
              <th
                style={{
                  textAlign: "right",
                  padding: "8px 0",
                  fontWeight: 600,
                  width: "100px",
                }}
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {payment.lineItems.map((item, index) => (
              <tr
                key={index}
                style={{
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <td style={{ padding: "12px 0" }}>{item.description}</td>
                <td style={{ padding: "12px 0", textAlign: "center" }}>
                  {item.quantity}
                </td>
                <td style={{ padding: "12px 0", textAlign: "right" }}>
                  {formatCurrency(item.unitPrice)}
                </td>
                <td style={{ padding: "12px 0", textAlign: "right" }}>
                  {formatCurrency(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "200px",
              padding: "8px 0",
            }}
          >
            <span>Subtotal:</span>
            <span>{formatCurrency(payment.subtotal)}</span>
          </div>
          {payment.tax !== undefined && payment.tax > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "200px",
                padding: "8px 0",
              }}
            >
              <span>Tax:</span>
              <span>{formatCurrency(payment.tax)}</span>
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "200px",
              padding: "8px 0",
              borderTop: `2px solid ${colors.primary}`,
              fontWeight: 700,
              fontSize: "18px",
            }}
          >
            <span>Total:</span>
            <span>{formatCurrency(payment.total)}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div
          style={{
            padding: "16px",
            backgroundColor: "#f0fdf4",
            borderRadius: "4px",
            marginBottom: "24px",
          }}
        >
          <p style={{ margin: 0, color: "#16a34a", fontWeight: 600 }}>
            Payment received via {payment.paymentMethod}
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            paddingTop: "16px",
            borderTop: "1px solid #e2e8f0",
            color: "#64748b",
            fontSize: "12px",
          }}
        >
          <p style={{ margin: "0 0 4px" }}>Thank you for your payment!</p>
          <p style={{ margin: 0 }}>
            Questions? Contact us at {communication.emailReplyTo}
          </p>
        </div>
      </div>
    </>
  );
}

export default BrandedReceipt;
