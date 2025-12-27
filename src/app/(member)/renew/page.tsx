"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatClubDate } from "@/lib/timezone";

/**
 * Membership Renewal Page
 *
 * Allows members to:
 * - View current membership status and expiration
 * - Renew at same tier or upgrade
 * - Compare tier pricing
 * - Select payment method
 * - Enable auto-renewal
 * - Confirm renewal
 */

type MembershipTier = "REGULAR" | "ASSOCIATE" | "HONORARY" | "LIFETIME";

type TierInfo = {
  id: MembershipTier;
  name: string;
  price: number;
  renewalPrice: number;
  benefits: string[];
  isUpgrade: boolean;
};

type CurrentMembership = {
  tier: MembershipTier;
  expirationDate: Date;
  isAutoRenew: boolean;
  memberSince: Date;
};

type PaymentMethod = {
  id: string;
  type: "CARD" | "ACH";
  last4: string;
  isDefault: boolean;
};

// Mock data
const MOCK_MEMBERSHIP: CurrentMembership = {
  tier: "REGULAR",
  expirationDate: new Date("2025-06-30"),
  isAutoRenew: false,
  memberSince: new Date("2022-03-15"),
};

const MOCK_TIERS: TierInfo[] = [
  {
    id: "REGULAR",
    name: "Regular Membership",
    price: 75,
    renewalPrice: 65,
    benefits: [
      "Access to all club events",
      "Monthly newsletter",
      "Member directory access",
      "Interest group participation",
    ],
    isUpgrade: false,
  },
  {
    id: "ASSOCIATE",
    name: "Associate Membership",
    price: 50,
    renewalPrice: 45,
    benefits: [
      "Access to social events",
      "Monthly newsletter",
      "Limited interest group access",
    ],
    isUpgrade: false,
  },
  {
    id: "LIFETIME",
    name: "Lifetime Membership",
    price: 500,
    renewalPrice: 500,
    benefits: [
      "All Regular benefits",
      "Never renew again",
      "Priority event registration",
      "Recognition in annual report",
    ],
    isUpgrade: true,
  },
];

const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  { id: "pm-1", type: "CARD", last4: "4242", isDefault: true },
  { id: "pm-2", type: "ACH", last4: "9876", isDefault: false },
];

type Step = "select" | "payment" | "confirm" | "success";

export default function RenewalPage() {
  const [currentStep, setCurrentStep] = useState<Step>("select");
  const [selectedTier, setSelectedTier] = useState<MembershipTier>(MOCK_MEMBERSHIP.tier);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(
    MOCK_PAYMENT_METHODS.find((p) => p.isDefault)?.id || ""
  );
  const [autoRenew, setAutoRenew] = useState(MOCK_MEMBERSHIP.isAutoRenew);
  const [processing, setProcessing] = useState(false);

  const membership = MOCK_MEMBERSHIP;
  const tiers = MOCK_TIERS;
  const paymentMethods = MOCK_PAYMENT_METHODS;

  const selectedTierInfo = tiers.find((t) => t.id === selectedTier);
  const isUpgrade = selectedTier !== membership.tier;
  const price = selectedTierInfo?.renewalPrice || 0;

  const { daysUntilExpiration, isExpiringSoon, isExpired } = useMemo(() => {
    const now = new Date();
    const days = Math.ceil(
      (membership.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return {
      daysUntilExpiration: days,
      isExpiringSoon: days <= 30 && days > 0,
      isExpired: days <= 0,
    };
  }, [membership.expirationDate]);

  const handleContinueToPayment = () => {
    setCurrentStep("payment");
  };

  const handleContinueToConfirm = () => {
    setCurrentStep("confirm");
  };

  const handleBack = () => {
    if (currentStep === "payment") setCurrentStep("select");
    if (currentStep === "confirm") setCurrentStep("payment");
  };

  const handleSubmitRenewal = async () => {
    setProcessing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setProcessing(false);
    setCurrentStep("success");
  };

  // Success screen
  if (currentStep === "success") {
    return (
      <div style={{ padding: 24, maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundColor: "#10B981",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            fontSize: 40,
          }}
        >
          &#10003;
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 16 }}>
          {isUpgrade ? "Upgrade Complete!" : "Renewal Complete!"}
        </h1>
        <p style={{ color: "#6B7280", marginBottom: 24 }}>
          Your {selectedTierInfo?.name} is now active through June 30, 2026.
          {autoRenew && " Auto-renewal is enabled."}
        </p>
        <Link
          href="/member"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            backgroundColor: "#2563EB",
            color: "white",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>
        Membership Renewal
      </h1>
      <p style={{ color: "#6B7280", marginBottom: 32 }}>
        Renew your membership or upgrade to a different tier
      </p>

      {/* Current Status Banner */}
      <div
        style={{
          padding: 16,
          borderRadius: 8,
          marginBottom: 32,
          backgroundColor: isExpired ? "#FEE2E2" : isExpiringSoon ? "#FEF3C7" : "#ECFDF5",
          border: `1px solid ${isExpired ? "#FECACA" : isExpiringSoon ? "#FDE68A" : "#A7F3D0"}`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>
              Current: {tiers.find((t) => t.id === membership.tier)?.name}
            </p>
            <p style={{ fontSize: 14, color: "#6B7280" }}>
              Member since {formatClubDate(membership.memberSince)}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p
              style={{
                fontWeight: 600,
                color: isExpired ? "#DC2626" : isExpiringSoon ? "#D97706" : "#059669",
              }}
            >
              {isExpired
                ? "Expired"
                : isExpiringSoon
                  ? `Expires in ${daysUntilExpiration} days`
                  : `Expires ${formatClubDate(membership.expirationDate)}`}
            </p>
            <p style={{ fontSize: 14, color: "#6B7280" }}>
              Auto-renew: {membership.isAutoRenew ? "On" : "Off"}
            </p>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div style={{ display: "flex", marginBottom: 32, gap: 8 }}>
        {(["select", "payment", "confirm"] as Step[]).map((step, index) => (
          <div
            key={step}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor:
                currentStep === step
                  ? "#2563EB"
                  : ["select", "payment", "confirm"].indexOf(currentStep) > index
                    ? "#10B981"
                    : "#E5E7EB",
            }}
          />
        ))}
      </div>

      {/* Step 1: Select Tier */}
      {currentStep === "select" && (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
            Select Membership Tier
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {tiers.map((tier) => {
              const isCurrent = tier.id === membership.tier;
              const isSelected = tier.id === selectedTier;

              return (
                <div
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id)}
                  style={{
                    padding: 20,
                    borderRadius: 12,
                    border: `2px solid ${isSelected ? "#2563EB" : "#E5E7EB"}`,
                    backgroundColor: isSelected ? "#EFF6FF" : "white",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 18 }}>{tier.name}</span>
                      {isCurrent && (
                        <span
                          style={{
                            marginLeft: 8,
                            padding: "2px 8px",
                            backgroundColor: "#DBEAFE",
                            color: "#1D4ED8",
                            borderRadius: 4,
                            fontSize: 12,
                          }}
                        >
                          Current
                        </span>
                      )}
                      {tier.isUpgrade && (
                        <span
                          style={{
                            marginLeft: 8,
                            padding: "2px 8px",
                            backgroundColor: "#FEF3C7",
                            color: "#92400E",
                            borderRadius: 4,
                            fontSize: 12,
                          }}
                        >
                          Upgrade
                        </span>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontWeight: 600, fontSize: 24, color: "#1F2937" }}>
                        ${tier.renewalPrice}
                      </p>
                      {tier.renewalPrice !== tier.price && (
                        <p style={{ fontSize: 12, color: "#6B7280", textDecoration: "line-through" }}>
                          ${tier.price}
                        </p>
                      )}
                    </div>
                  </div>

                  <ul style={{ margin: 0, paddingLeft: 20, color: "#6B7280", fontSize: 14 }}>
                    {tier.benefits.map((benefit, i) => (
                      <li key={i} style={{ marginBottom: 4 }}>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleContinueToPayment}
            style={{
              marginTop: 24,
              width: "100%",
              padding: "14px 24px",
              backgroundColor: "#2563EB",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Continue to Payment
          </button>
        </div>
      )}

      {/* Step 2: Payment */}
      {currentStep === "payment" && (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
            Payment Method
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                onClick={() => setSelectedPaymentMethod(method.id)}
                style={{
                  padding: 16,
                  borderRadius: 8,
                  border: `2px solid ${selectedPaymentMethod === method.id ? "#2563EB" : "#E5E7EB"}`,
                  backgroundColor: selectedPaymentMethod === method.id ? "#EFF6FF" : "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 24 }}>
                  {method.type === "CARD" ? "💳" : "🏦"}
                </span>
                <div>
                  <p style={{ fontWeight: 500 }}>
                    {method.type === "CARD" ? "Credit Card" : "Bank Account"} ending in {method.last4}
                  </p>
                  {method.isDefault && (
                    <p style={{ fontSize: 12, color: "#6B7280" }}>Default payment method</p>
                  )}
                </div>
              </div>
            ))}

            <button
              style={{
                padding: 16,
                borderRadius: 8,
                border: "2px dashed #E5E7EB",
                backgroundColor: "white",
                cursor: "pointer",
                color: "#6B7280",
              }}
            >
              + Add new payment method
            </button>
          </div>

          {/* Auto-renew toggle */}
          <div
            style={{
              padding: 16,
              borderRadius: 8,
              backgroundColor: "#F9FAFB",
              marginBottom: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p style={{ fontWeight: 500, marginBottom: 4 }}>Enable Auto-Renewal</p>
              <p style={{ fontSize: 14, color: "#6B7280" }}>
                Automatically renew your membership each year
              </p>
            </div>
            <button
              onClick={() => setAutoRenew(!autoRenew)}
              style={{
                width: 48,
                height: 28,
                borderRadius: 14,
                border: "none",
                backgroundColor: autoRenew ? "#2563EB" : "#E5E7EB",
                cursor: "pointer",
                position: "relative",
                transition: "background-color 0.2s",
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  backgroundColor: "white",
                  position: "absolute",
                  top: 4,
                  left: autoRenew ? 24 : 4,
                  transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}
              />
            </button>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={handleBack}
              style={{
                flex: 1,
                padding: "14px 24px",
                backgroundColor: "white",
                color: "#374151",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Back
            </button>
            <button
              onClick={handleContinueToConfirm}
              style={{
                flex: 2,
                padding: "14px 24px",
                backgroundColor: "#2563EB",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Review Order
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {currentStep === "confirm" && (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
            Confirm Your {isUpgrade ? "Upgrade" : "Renewal"}
          </h2>

          <div
            style={{
              padding: 20,
              borderRadius: 12,
              backgroundColor: "#F9FAFB",
              marginBottom: 24,
            }}
          >
            <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #E5E7EB" }}>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>{selectedTierInfo?.name}</p>
              <p style={{ fontSize: 14, color: "#6B7280" }}>
                {isUpgrade ? "Upgrade from " + membership.tier : "Renewal"} - Valid through June 30, 2026
              </p>
            </div>

            <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #E5E7EB" }}>
              <p style={{ fontWeight: 500, marginBottom: 4 }}>Payment Method</p>
              <p style={{ fontSize: 14, color: "#6B7280" }}>
                {paymentMethods.find((p) => p.id === selectedPaymentMethod)?.type === "CARD"
                  ? "Credit Card"
                  : "Bank Account"}{" "}
                ending in {paymentMethods.find((p) => p.id === selectedPaymentMethod)?.last4}
              </p>
            </div>

            <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #E5E7EB" }}>
              <p style={{ fontWeight: 500, marginBottom: 4 }}>Auto-Renewal</p>
              <p style={{ fontSize: 14, color: "#6B7280" }}>
                {autoRenew ? "Enabled - will renew automatically each year" : "Disabled"}
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontWeight: 600, fontSize: 18 }}>Total</p>
              <p style={{ fontWeight: 600, fontSize: 24, color: "#1F2937" }}>${price}</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={handleBack}
              style={{
                flex: 1,
                padding: "14px 24px",
                backgroundColor: "white",
                color: "#374151",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Back
            </button>
            <button
              onClick={handleSubmitRenewal}
              disabled={processing}
              style={{
                flex: 2,
                padding: "14px 24px",
                backgroundColor: processing ? "#9CA3AF" : "#10B981",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                cursor: processing ? "not-allowed" : "pointer",
              }}
            >
              {processing ? "Processing..." : `Pay $${price} and ${isUpgrade ? "Upgrade" : "Renew"}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
