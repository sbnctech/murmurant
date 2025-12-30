/**
 * ACH Metrics Widget
 *
 * Displays ACH adoption and estimated fee savings on admin dashboard.
 * Only visible when ACH is enabled.
 *
 * Charter: P1 (finance:view capability required), P7 (admin audit context)
 *
 * Copyright © 2025 Murmurant, Inc.
 */

"use client";

import { useState, useEffect } from "react";

interface AchMetrics {
  totalMembers: number;
  membersWithAch: number;
  achAdoptionPercent: number;
  totalPaymentMethods: number;
  achPaymentMethods: number;
  cardPaymentMethods: number;
  estimatedFeeSavings: {
    description: string;
    note: string;
  };
}

interface AchMetricsResponse {
  achEnabled: boolean;
  metrics: AchMetrics | null;
}

type LoadState = "loading" | "ready" | "error" | "hidden";

export default function AchMetricsWidget() {
  const [data, setData] = useState<AchMetricsResponse | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch("/api/admin/ach-metrics");
        if (!res.ok) {
          if (res.status === 403) {
            // User doesn't have finance:view - hide the widget
            setLoadState("hidden");
            return;
          }
          throw new Error("Failed to fetch ACH metrics");
        }
        const result = await res.json();
        setData(result);
        if (!result.achEnabled) {
          setLoadState("hidden");
        } else {
          setLoadState("ready");
        }
      } catch {
        setLoadState("error");
      }
    }
    fetchMetrics();
  }, []);

  // Don't render if hidden or loading
  if (loadState === "hidden" || loadState === "loading") {
    return null;
  }

  // Error state
  if (loadState === "error") {
    return (
      <section
        data-test-id="admin-ach-metrics-section"
        style={{ marginBottom: "32px" }}
      >
        <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>
          ACH Fee Savings
        </h2>
        <div style={{ color: "#666", fontStyle: "italic" }}>
          Unable to load ACH metrics.
        </div>
      </section>
    );
  }

  const metrics = data?.metrics;
  if (!metrics) return null;

  return (
    <section
      data-test-id="admin-ach-metrics-section"
      style={{ marginBottom: "32px" }}
    >
      <h2 style={{ fontSize: "18px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
        ACH Fee Savings
        <span
          style={{
            fontSize: "12px",
            backgroundColor: "#dcfce7",
            color: "#15803d",
            padding: "2px 8px",
            borderRadius: "12px",
            fontWeight: 500,
          }}
        >
          Helping Save Money
        </span>
      </h2>
      <p style={{ marginBottom: "12px", color: "#666" }}>
        Track ACH adoption to reduce payment processing fees.
      </p>

      {/* Metrics Grid */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        <div style={{ minWidth: "180px" }}>
          <div style={{ fontSize: "14px", color: "#888" }}>ACH Adoption</div>
          <div
            data-test-id="ach-adoption-percent"
            style={{ fontSize: "24px", fontWeight: 600, color: "#15803d" }}
          >
            {metrics.achAdoptionPercent}%
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            {metrics.membersWithAch} of {metrics.totalMembers} active members
          </div>
        </div>

        <div style={{ minWidth: "180px" }}>
          <div style={{ fontSize: "14px", color: "#888" }}>ACH Methods</div>
          <div
            data-test-id="ach-payment-methods"
            style={{ fontSize: "24px", fontWeight: 600 }}
          >
            {metrics.achPaymentMethods}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            vs {metrics.cardPaymentMethods} cards saved
          </div>
        </div>

        <div style={{ minWidth: "180px" }}>
          <div style={{ fontSize: "14px", color: "#888" }}>Total Saved Methods</div>
          <div
            data-test-id="total-payment-methods"
            style={{ fontSize: "24px", fontWeight: 600 }}
          >
            {metrics.totalPaymentMethods}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            payment methods on file
          </div>
        </div>
      </div>

      {/* Fee Savings Info */}
      <div
        style={{
          padding: "12px 16px",
          backgroundColor: "#f0fdf4",
          border: "1px solid #86efac",
          borderRadius: "8px",
          maxWidth: "600px",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: "#15803d",
            marginBottom: "4px",
          }}
        >
          Estimated Fee Savings
        </div>
        <div style={{ fontSize: "13px", color: "#166534" }}>
          {metrics.estimatedFeeSavings.description}
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "#166534",
            marginTop: "4px",
            fontStyle: "italic",
          }}
        >
          {metrics.estimatedFeeSavings.note}
        </div>
      </div>

      {/* Adoption Progress Bar */}
      {metrics.totalMembers > 0 && (
        <div style={{ marginTop: "16px", maxWidth: "400px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "12px",
              color: "#666",
              marginBottom: "4px",
            }}
          >
            <span>ACH Adoption Progress</span>
            <span>{metrics.achAdoptionPercent}%</span>
          </div>
          <div
            style={{
              height: "8px",
              backgroundColor: "#e5e7eb",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.min(metrics.achAdoptionPercent, 100)}%`,
                backgroundColor: "#22c55e",
                borderRadius: "4px",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
