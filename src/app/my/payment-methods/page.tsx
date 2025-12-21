/**
 * My Payment Methods Page
 *
 * URL: /my/payment-methods
 *
 * Allows authenticated members to view and manage their payment methods.
 * When ACH is enabled, shows the "Help Save the Club Money" messaging.
 *
 * Charter Compliance:
 * - P1: Identity via session (API enforces)
 * - P2: Member-scoped, no enumeration
 * - P7: All actions audit logged
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { Stripe } from "@/components/sections";
import {  } from "@/lib/timezone";
import { formatDateLocale } from "@/lib/timezone";

// ============================================================================
// Types
// ============================================================================

interface PaymentMethod {
  id: string;
  type: "CARD" | "ACH";
  status: "ACTIVE" | "REVOKED";
  displayName: string;
  isDefault: boolean;
  createdAt: string;
}

type LoadState = "loading" | "ready" | "error";
type FormState = "idle" | "open" | "submitting" | "success" | "error";

// ============================================================================
// Payment Methods Page Component
// ============================================================================

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [achEnabled, setAchEnabled] = useState(false);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ACH form state
  const [formState, setFormState] = useState<FormState>("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [last4, setLast4] = useState("");

  // Revoke state
  const [revoking, setRevoking] = useState<string | null>(null);

  // Fetch payment methods on mount
  useEffect(() => {
    async function fetchPaymentMethods() {
      try {
        const res = await fetch("/api/v1/me/payment-methods");
        if (!res.ok) {
          if (res.status === 401) {
            window.location.href = "/login";
            return;
          }
          throw new Error("Failed to load payment methods");
        }
        const data = await res.json();
        setPaymentMethods(data.paymentMethods);
        setAchEnabled(data.achEnabled);
        setLoadState("ready");
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Failed to load payment methods");
        setLoadState("error");
      }
    }
    fetchPaymentMethods();
  }, []);

  // Handle ACH form submission
  async function handleAddAch(e: FormEvent) {
    e.preventDefault();
    setFormState("submitting");
    setFormError(null);

    try {
      const res = await fetch("/api/v1/me/payment-methods/ach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: nickname.trim() || undefined,
          last4: last4.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to add payment method");
      }

      const data = await res.json();
      setPaymentMethods((prev) => [...prev, data.paymentMethod]);
      setFormState("success");
      setNickname("");
      setLast4("");

      // Reset success state after 3 seconds
      setTimeout(() => setFormState("idle"), 3000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add payment method");
      setFormState("error");
    }
  }

  // Handle revoke payment method
  async function handleRevoke(id: string) {
    if (!confirm("Are you sure you want to remove this payment method?")) {
      return;
    }

    setRevoking(id);
    try {
      const res = await fetch(`/api/v1/me/payment-methods/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to remove payment method");
      }

      setPaymentMethods((prev) => prev.filter((pm) => pm.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove payment method");
    } finally {
      setRevoking(null);
    }
  }

  // Format date
  function formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    return formatDateLocale(date, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  // Loading state
  if (loadState === "loading") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--token-color-surface-2)" }}>
        <PageHeader />
        <Stripe padding="md">
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            <LoadingSkeleton />
          </div>
        </Stripe>
      </div>
    );
  }

  // Error state
  if (loadState === "error") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--token-color-surface-2)" }}>
        <PageHeader />
        <Stripe padding="md">
          <div
            style={{
              backgroundColor: "var(--token-color-surface)",
              padding: "var(--token-space-lg)",
              borderRadius: "var(--token-radius-lg)",
              border: "1px solid var(--token-color-danger)",
              textAlign: "center",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            <p style={{ color: "var(--token-color-danger)", marginBottom: "var(--token-space-md)" }}>
              {errorMessage || "Failed to load payment methods"}
            </p>
            <Link
              href="/my"
              style={{
                color: "var(--token-color-primary)",
                textDecoration: "none",
              }}
            >
              Back to My SBNC
            </Link>
          </div>
        </Stripe>
      </div>
    );
  }

  const hasAchMethod = paymentMethods.some((pm) => pm.type === "ACH");

  return (
    <div
      data-test-id="payment-methods-page"
      style={{ minHeight: "100vh", backgroundColor: "var(--token-color-surface-2)" }}
    >
      <PageHeader />

      {/* Page Title */}
      <Stripe padding="md" testId="payment-methods-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1
              style={{
                fontSize: "var(--token-text-2xl)",
                fontWeight: "var(--token-weight-bold)",
                color: "var(--token-color-text)",
                margin: 0,
              }}
            >
              Payment Methods
            </h1>
            <p
              style={{
                fontSize: "var(--token-text-base)",
                color: "var(--token-color-text-muted)",
                marginTop: "var(--token-space-xs)",
                marginBottom: 0,
              }}
            >
              Manage your saved payment methods
            </p>
          </div>
          <Link
            href="/my"
            style={{
              padding: "var(--token-space-xs) var(--token-space-md)",
              backgroundColor: "var(--token-color-surface)",
              border: "1px solid var(--token-color-border)",
              borderRadius: "var(--token-radius-lg)",
              fontSize: "var(--token-text-sm)",
              color: "var(--token-color-text)",
              textDecoration: "none",
            }}
          >
            Back to My SBNC
          </Link>
        </div>
      </Stripe>

      {/* ACH Promotion Banner (if enabled and no ACH method yet) */}
      {achEnabled && !hasAchMethod && (
        <Stripe padding="md" testId="ach-promo-banner">
          <div
            style={{
              maxWidth: "600px",
              margin: "0 auto",
              padding: "var(--token-space-lg)",
              backgroundColor: "#f0fdf4",
              border: "1px solid #86efac",
              borderRadius: "var(--token-radius-lg)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--token-space-md)" }}>
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#16a34a"
                strokeWidth="2"
                style={{ flexShrink: 0 }}
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <div>
                <h3
                  style={{
                    fontSize: "var(--token-text-lg)",
                    fontWeight: 600,
                    color: "#15803d",
                    marginTop: 0,
                    marginBottom: "var(--token-space-xs)",
                  }}
                >
                  Help Save the Club Money!
                </h3>
                <p
                  style={{
                    fontSize: "var(--token-text-base)",
                    color: "#166534",
                    margin: 0,
                    marginBottom: "var(--token-space-sm)",
                  }}
                >
                  Paying by bank transfer (ACH) helps the club keep more of every dollar. Credit card
                  companies charge fees on every transaction, but ACH transfers are much cheaper.
                </p>
                <p
                  style={{
                    fontSize: "var(--token-text-sm)",
                    color: "#166534",
                    margin: 0,
                    fontStyle: "italic",
                  }}
                >
                  Add a bank authorization below to use ACH for future payments.
                </p>
              </div>
            </div>
          </div>
        </Stripe>
      )}

      {/* Payment Methods List */}
      <Stripe padding="md" background="muted">
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          {/* Existing Payment Methods */}
          <div
            style={{
              backgroundColor: "var(--token-color-surface)",
              borderRadius: "var(--token-radius-lg)",
              border: "1px solid var(--token-color-border)",
              overflow: "hidden",
              marginBottom: "var(--token-space-lg)",
            }}
          >
            <div
              style={{
                padding: "var(--token-space-md)",
                borderBottom: "1px solid var(--token-color-border)",
              }}
            >
              <h2
                style={{
                  fontSize: "var(--token-text-lg)",
                  fontWeight: 600,
                  color: "var(--token-color-text)",
                  margin: 0,
                }}
              >
                Saved Payment Methods
              </h2>
            </div>

            {paymentMethods.length === 0 ? (
              <div
                style={{
                  padding: "var(--token-space-xl)",
                  textAlign: "center",
                  color: "var(--token-color-text-muted)",
                }}
              >
                <p style={{ margin: 0 }}>No payment methods saved yet.</p>
              </div>
            ) : (
              <div>
                {paymentMethods.map((pm) => (
                  <div
                    key={pm.id}
                    data-test-id={`payment-method-${pm.id}`}
                    style={{
                      padding: "var(--token-space-md)",
                      borderBottom: "1px solid var(--token-color-border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--token-space-md)" }}>
                      {/* Icon */}
                      {pm.type === "ACH" ? (
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            backgroundColor: "#dbeafe",
                            borderRadius: "var(--token-radius-lg)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                            <rect x="1" y="5" width="22" height="14" rx="2" />
                            <line x1="1" y1="10" x2="23" y2="10" />
                          </svg>
                        </div>
                      ) : (
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            backgroundColor: "#f3e8ff",
                            borderRadius: "var(--token-radius-lg)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2">
                            <rect x="1" y="4" width="22" height="16" rx="2" />
                            <line x1="1" y1="10" x2="23" y2="10" />
                          </svg>
                        </div>
                      )}

                      {/* Details */}
                      <div>
                        <p
                          style={{
                            fontSize: "var(--token-text-base)",
                            fontWeight: 500,
                            color: "var(--token-color-text)",
                            margin: 0,
                          }}
                        >
                          {pm.displayName}
                          {pm.isDefault && (
                            <span
                              style={{
                                marginLeft: "var(--token-space-sm)",
                                fontSize: "var(--token-text-xs)",
                                backgroundColor: "var(--token-color-primary)",
                                color: "#fff",
                                padding: "2px 8px",
                                borderRadius: "var(--token-radius-lg)",
                              }}
                            >
                              Default
                            </span>
                          )}
                        </p>
                        <p
                          style={{
                            fontSize: "var(--token-text-sm)",
                            color: "var(--token-color-text-muted)",
                            margin: 0,
                          }}
                        >
                          Added {formatDate(pm.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Revoke Button */}
                    <button
                      onClick={() => handleRevoke(pm.id)}
                      disabled={revoking === pm.id}
                      data-test-id={`revoke-${pm.id}`}
                      style={{
                        padding: "var(--token-space-xs) var(--token-space-md)",
                        backgroundColor: "transparent",
                        border: "1px solid var(--token-color-border)",
                        borderRadius: "var(--token-radius-lg)",
                        fontSize: "var(--token-text-sm)",
                        color: "var(--token-color-text-muted)",
                        cursor: revoking === pm.id ? "not-allowed" : "pointer",
                        opacity: revoking === pm.id ? 0.5 : 1,
                      }}
                    >
                      {revoking === pm.id ? "Removing..." : "Remove"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add ACH Payment Method (if enabled) */}
          {achEnabled && (
            <div
              style={{
                backgroundColor: "var(--token-color-surface)",
                borderRadius: "var(--token-radius-lg)",
                border: "1px solid var(--token-color-border)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "var(--token-space-md)",
                  borderBottom: "1px solid var(--token-color-border)",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--token-space-sm)",
                }}
              >
                <h2
                  style={{
                    fontSize: "var(--token-text-lg)",
                    fontWeight: 600,
                    color: "var(--token-color-text)",
                    margin: 0,
                  }}
                >
                  Add Bank Account (ACH)
                </h2>
                <span
                  style={{
                    fontSize: "var(--token-text-xs)",
                    backgroundColor: "#dcfce7",
                    color: "#15803d",
                    padding: "2px 8px",
                    borderRadius: "var(--token-radius-lg)",
                    fontWeight: 500,
                  }}
                >
                  Saves the Club Money
                </span>
              </div>

              <div style={{ padding: "var(--token-space-md)" }}>
                {formState === "idle" || formState === "error" ? (
                  <form onSubmit={handleAddAch}>
                    <div style={{ marginBottom: "var(--token-space-md)" }}>
                      <label
                        htmlFor="nickname"
                        style={{
                          display: "block",
                          fontSize: "var(--token-text-sm)",
                          fontWeight: 500,
                          color: "var(--token-color-text)",
                          marginBottom: "var(--token-space-xs)",
                        }}
                      >
                        Nickname{" "}
                        <span style={{ color: "var(--token-color-text-muted)", fontWeight: 400 }}>
                          (optional)
                        </span>
                      </label>
                      <input
                        id="nickname"
                        type="text"
                        data-test-id="ach-nickname"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="e.g., My Checking Account"
                        maxLength={50}
                        style={{
                          width: "100%",
                          padding: "var(--token-space-sm) var(--token-space-md)",
                          fontSize: "var(--token-text-base)",
                          border: "1px solid var(--token-color-border)",
                          borderRadius: "var(--token-radius-lg)",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: "var(--token-space-md)" }}>
                      <label
                        htmlFor="last4"
                        style={{
                          display: "block",
                          fontSize: "var(--token-text-sm)",
                          fontWeight: 500,
                          color: "var(--token-color-text)",
                          marginBottom: "var(--token-space-xs)",
                        }}
                      >
                        Last 4 digits of account <span style={{ color: "var(--token-color-danger)" }}>*</span>
                      </label>
                      <input
                        id="last4"
                        type="text"
                        data-test-id="ach-last4"
                        value={last4}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                          setLast4(val);
                        }}
                        placeholder="1234"
                        maxLength={4}
                        required
                        style={{
                          width: "100%",
                          padding: "var(--token-space-sm) var(--token-space-md)",
                          fontSize: "var(--token-text-base)",
                          border: "1px solid var(--token-color-border)",
                          borderRadius: "var(--token-radius-lg)",
                          boxSizing: "border-box",
                        }}
                      />
                      <p
                        style={{
                          fontSize: "var(--token-text-sm)",
                          color: "var(--token-color-text-muted)",
                          marginTop: "var(--token-space-xs)",
                          marginBottom: 0,
                        }}
                      >
                        For display purposes only - used to identify this payment method
                      </p>
                    </div>

                    {formState === "error" && formError && (
                      <div
                        data-test-id="ach-error"
                        style={{
                          marginBottom: "var(--token-space-md)",
                          padding: "var(--token-space-sm) var(--token-space-md)",
                          backgroundColor: "#fee2e2",
                          color: "var(--token-color-danger)",
                          borderRadius: "var(--token-radius-lg)",
                          fontSize: "var(--token-text-sm)",
                        }}
                      >
                        {formError}
                      </div>
                    )}

                    <button
                      type="submit"
                      data-test-id="ach-submit"
                      disabled={last4.length !== 4}
                      style={{
                        width: "100%",
                        padding: "var(--token-space-sm) var(--token-space-md)",
                        fontSize: "var(--token-text-base)",
                        fontWeight: 600,
                        backgroundColor: last4.length === 4 ? "var(--token-color-primary)" : "var(--token-color-text-muted)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "var(--token-radius-lg)",
                        cursor: last4.length === 4 ? "pointer" : "not-allowed",
                      }}
                    >
                      Add Bank Authorization
                    </button>

                    <p
                      style={{
                        fontSize: "var(--token-text-sm)",
                        color: "var(--token-color-text-muted)",
                        marginTop: "var(--token-space-md)",
                        marginBottom: 0,
                        textAlign: "center",
                      }}
                    >
                      This is a demo - no real bank information is collected.
                    </p>
                  </form>
                ) : formState === "submitting" ? (
                  <div style={{ textAlign: "center", padding: "var(--token-space-lg)" }}>
                    <p style={{ color: "var(--token-color-text-muted)" }}>Adding payment method...</p>
                  </div>
                ) : formState === "success" ? (
                  <div
                    data-test-id="ach-success"
                    style={{
                      textAlign: "center",
                      padding: "var(--token-space-lg)",
                      backgroundColor: "#dcfce7",
                      borderRadius: "var(--token-radius-lg)",
                    }}
                  >
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#16a34a"
                      strokeWidth="2"
                      style={{ marginBottom: "var(--token-space-sm)" }}
                    >
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                    <p
                      style={{
                        fontSize: "var(--token-text-lg)",
                        fontWeight: 600,
                        color: "#15803d",
                        margin: 0,
                      }}
                    >
                      Bank authorization added!
                    </p>
                    <p
                      style={{
                        fontSize: "var(--token-text-sm)",
                        color: "#166534",
                        margin: 0,
                        marginTop: "var(--token-space-xs)",
                      }}
                    >
                      Thank you for helping save the club money.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Security Note */}
          <div
            style={{
              marginTop: "var(--token-space-lg)",
              padding: "var(--token-space-md)",
              backgroundColor: "var(--token-color-surface)",
              borderRadius: "var(--token-radius-lg)",
              border: "1px solid var(--token-color-border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--token-space-sm)" }}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--token-color-text-muted)"
                strokeWidth="2"
                style={{ flexShrink: 0, marginTop: "2px" }}
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <div>
                <p
                  style={{
                    fontSize: "var(--token-text-sm)",
                    color: "var(--token-color-text-muted)",
                    margin: 0,
                  }}
                >
                  <strong style={{ color: "var(--token-color-text)" }}>Your security is important.</strong>{" "}
                  Payment method details are securely stored and never shared. You can remove a payment
                  method at any time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Stripe>
    </div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

function PageHeader() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        backgroundColor: "var(--token-color-surface)",
        borderBottom: "1px solid var(--token-color-border)",
        padding: "var(--token-space-sm) var(--token-space-md)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Link
        href="/"
        style={{
          fontSize: "var(--token-text-lg)",
          fontWeight: 700,
          color: "var(--token-color-text)",
          textDecoration: "none",
        }}
      >
        SBNC
      </Link>

      <nav style={{ display: "flex", alignItems: "center", gap: "var(--token-space-md)" }}>
        <Link
          href="/my"
          style={{
            fontSize: "var(--token-text-sm)",
            color: "var(--token-color-text-muted)",
            textDecoration: "none",
          }}
        >
          My SBNC
        </Link>
        <Link
          href="/my/payment-methods"
          style={{
            fontSize: "var(--token-text-sm)",
            color: "var(--token-color-primary)",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Payment Methods
        </Link>
      </nav>
    </header>
  );
}

function LoadingSkeleton() {
  return (
    <div
      style={{
        backgroundColor: "var(--token-color-surface)",
        borderRadius: "var(--token-radius-lg)",
        border: "1px solid var(--token-color-border)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "var(--token-space-md)",
          borderBottom: "1px solid var(--token-color-border)",
        }}
      >
        <div
          style={{
            width: "180px",
            height: "24px",
            backgroundColor: "var(--token-color-surface-2)",
            borderRadius: "var(--token-radius-lg)",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      </div>
      <div style={{ padding: "var(--token-space-md)" }}>
        {[1, 2].map((i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--token-space-md)",
              padding: "var(--token-space-sm) 0",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                backgroundColor: "var(--token-color-surface-2)",
                borderRadius: "var(--token-radius-lg)",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  width: "200px",
                  height: "18px",
                  backgroundColor: "var(--token-color-surface-2)",
                  borderRadius: "var(--token-radius-lg)",
                  marginBottom: "var(--token-space-xs)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
              <div
                style={{
                  width: "100px",
                  height: "14px",
                  backgroundColor: "var(--token-color-surface-2)",
                  borderRadius: "var(--token-radius-lg)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
