/**
 * PaymentMethodSelector - Checkout Payment Method Selection
 *
 * Allows members to select a saved payment method for checkout.
 * When ACH is enabled, prominently shows the "saves the club money" messaging.
 *
 * Usage:
 * ```tsx
 * <PaymentMethodSelector
 *   selectedId={selectedPaymentMethodId}
 *   onSelect={(id) => setSelectedPaymentMethodId(id)}
 * />
 * ```
 *
 * Charter Compliance:
 * - P1: Uses authenticated API for payment methods
 * - P2: Member-scoped data only
 *
 * Copyright © 2025 Murmurant, Inc.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ============================================================================
// Types
// ============================================================================

interface PaymentMethod {
  id: string;
  type: "CARD" | "ACH";
  displayName: string;
  isDefault: boolean;
}

interface PaymentMethodSelectorProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

type LoadState = "loading" | "ready" | "error";

// ============================================================================
// Component
// ============================================================================

export function PaymentMethodSelector({
  selectedId,
  onSelect,
  disabled = false,
}: PaymentMethodSelectorProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [achEnabled, setAchEnabled] = useState(false);
  const [loadState, setLoadState] = useState<LoadState>("loading");

  // Fetch payment methods on mount
  useEffect(() => {
    async function fetchPaymentMethods() {
      try {
        const res = await fetch("/api/v1/me/payment-methods");
        if (!res.ok) {
          throw new Error("Failed to load payment methods");
        }
        const data = await res.json();
        setPaymentMethods(data.paymentMethods);
        setAchEnabled(data.achEnabled);
        setLoadState("ready");

        // Auto-select default if none selected
        if (!selectedId && data.paymentMethods.length > 0) {
          const defaultMethod = data.paymentMethods.find((pm: PaymentMethod) => pm.isDefault);
          if (defaultMethod) {
            onSelect(defaultMethod.id);
          } else {
            onSelect(data.paymentMethods[0].id);
          }
        }
      } catch {
        setLoadState("error");
      }
    }
    fetchPaymentMethods();
  }, [selectedId, onSelect]);

  // Loading state
  if (loadState === "loading") {
    return (
      <div
        style={{
          padding: "var(--token-space-md)",
          backgroundColor: "var(--token-color-surface-2)",
          borderRadius: "var(--token-radius-lg)",
        }}
      >
        <div
          style={{
            height: "60px",
            backgroundColor: "var(--token-color-surface)",
            borderRadius: "var(--token-radius-lg)",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      </div>
    );
  }

  // Error state
  if (loadState === "error") {
    return (
      <div
        style={{
          padding: "var(--token-space-md)",
          backgroundColor: "#fee2e2",
          borderRadius: "var(--token-radius-lg)",
          color: "var(--token-color-danger)",
          fontSize: "var(--token-text-sm)",
        }}
      >
        Unable to load payment methods. Please try again.
      </div>
    );
  }

  // No payment methods
  if (paymentMethods.length === 0) {
    return (
      <div
        data-test-id="checkout-no-payment-methods"
        style={{
          padding: "var(--token-space-lg)",
          backgroundColor: "var(--token-color-surface-2)",
          borderRadius: "var(--token-radius-lg)",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: "var(--token-text-base)",
            color: "var(--token-color-text)",
            marginTop: 0,
            marginBottom: "var(--token-space-md)",
          }}
        >
          No payment methods saved.
        </p>
        <Link
          href="/my/payment-methods"
          style={{
            display: "inline-block",
            padding: "var(--token-space-sm) var(--token-space-md)",
            backgroundColor: "var(--token-color-primary)",
            color: "#fff",
            borderRadius: "var(--token-radius-lg)",
            textDecoration: "none",
            fontWeight: 500,
            fontSize: "var(--token-text-sm)",
          }}
        >
          Add Payment Method
        </Link>
      </div>
    );
  }

  // Check for ACH methods
  const hasAchMethod = paymentMethods.some((pm) => pm.type === "ACH");
  const selectedMethod = paymentMethods.find((pm) => pm.id === selectedId);
  const isAchSelected = selectedMethod?.type === "ACH";

  return (
    <div data-test-id="checkout-payment-selector">
      {/* ACH Benefit Banner (if ACH available but not selected) */}
      {hasAchMethod && !isAchSelected && (
        <div
          style={{
            padding: "var(--token-space-sm) var(--token-space-md)",
            backgroundColor: "#f0fdf4",
            border: "1px solid #86efac",
            borderRadius: "var(--token-radius-lg)",
            marginBottom: "var(--token-space-md)",
            display: "flex",
            alignItems: "center",
            gap: "var(--token-space-sm)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span style={{ fontSize: "var(--token-text-sm)", color: "#166534" }}>
            <strong>Tip:</strong> Pay with ACH to help save the club money on fees!
          </span>
        </div>
      )}

      {/* Payment Methods List */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--token-space-sm)",
        }}
      >
        {paymentMethods.map((pm) => (
          <label
            key={pm.id}
            data-test-id={`checkout-payment-option-${pm.id}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--token-space-md)",
              padding: "var(--token-space-md)",
              backgroundColor:
                selectedId === pm.id ? "var(--token-color-primary-bg)" : "var(--token-color-surface)",
              border: `2px solid ${selectedId === pm.id ? "var(--token-color-primary)" : "var(--token-color-border)"}`,
              borderRadius: "var(--token-radius-lg)",
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.5 : 1,
              transition: "border-color 0.15s, background-color 0.15s",
            }}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={pm.id}
              checked={selectedId === pm.id}
              onChange={() => onSelect(pm.id)}
              disabled={disabled}
              style={{
                width: "18px",
                height: "18px",
                margin: 0,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            />

            {/* Icon */}
            {pm.type === "ACH" ? (
              <div
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: "#dbeafe",
                  borderRadius: "var(--token-radius-lg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                  <rect x="1" y="5" width="22" height="14" rx="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </div>
            ) : (
              <div
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: "#f3e8ff",
                  borderRadius: "var(--token-radius-lg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </div>
            )}

            {/* Details */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--token-space-sm)",
                }}
              >
                <span
                  style={{
                    fontSize: "var(--token-text-base)",
                    fontWeight: 500,
                    color: "var(--token-color-text)",
                  }}
                >
                  {pm.displayName}
                </span>
                {pm.type === "ACH" && (
                  <span
                    style={{
                      fontSize: "var(--token-text-xs)",
                      backgroundColor: "#dcfce7",
                      color: "#15803d",
                      padding: "2px 6px",
                      borderRadius: "var(--token-radius-lg)",
                      fontWeight: 500,
                    }}
                  >
                    Saves Money
                  </span>
                )}
                {pm.isDefault && (
                  <span
                    style={{
                      fontSize: "var(--token-text-xs)",
                      backgroundColor: "var(--token-color-surface-2)",
                      color: "var(--token-color-text-muted)",
                      padding: "2px 6px",
                      borderRadius: "var(--token-radius-lg)",
                    }}
                  >
                    Default
                  </span>
                )}
              </div>
            </div>
          </label>
        ))}
      </div>

      {/* Add new payment method link */}
      <div
        style={{
          marginTop: "var(--token-space-md)",
          textAlign: "center",
        }}
      >
        <Link
          href="/my/payment-methods"
          style={{
            fontSize: "var(--token-text-sm)",
            color: "var(--token-color-primary)",
            textDecoration: "none",
          }}
        >
          + Add new payment method
        </Link>
      </div>

      {/* ACH Promotion (if ACH enabled but no ACH methods) */}
      {achEnabled && !hasAchMethod && (
        <div
          style={{
            marginTop: "var(--token-space-md)",
            padding: "var(--token-space-md)",
            backgroundColor: "#f0fdf4",
            border: "1px solid #86efac",
            borderRadius: "var(--token-radius-lg)",
          }}
        >
          <p
            style={{
              fontSize: "var(--token-text-sm)",
              color: "#166534",
              margin: 0,
            }}
          >
            <strong>Want to help save the club money?</strong> Add a bank account (ACH) as a payment
            method. ACH transfers have much lower fees than credit cards.
          </p>
          <Link
            href="/my/payment-methods"
            style={{
              display: "inline-block",
              marginTop: "var(--token-space-sm)",
              fontSize: "var(--token-text-sm)",
              fontWeight: 500,
              color: "#15803d",
              textDecoration: "none",
            }}
          >
            Add ACH payment method →
          </Link>
        </div>
      )}
    </div>
  );
}

export default PaymentMethodSelector;
