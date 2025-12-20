/**
 * My Profile Page - View and Edit Member Profile
 *
 * URL: /my/profile
 *
 * Allows authenticated members to view and update their profile information.
 * Uses the /api/v1/me/profile endpoint for data operations.
 *
 * Features:
 * - View current profile data
 * - Edit allowed fields (firstName, lastName, phone)
 * - Profile completeness indicator
 * - Inline validation with friendly messages
 * - Save confirmation with visual feedback
 * - Preview link ("View how others see this")
 *
 * Charter Compliance:
 * - P1: Identity via session (API enforces)
 * - P2: Only allowed fields editable (API allowlist)
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

"use client";

import { useState, useEffect, FormEvent, useMemo } from "react";
import Link from "next/link";
import { Stripe } from "@/components/stripes";
import { ViewAsControl } from "@/components/view-as";
import { formatClubDate } from "@/lib/timezone";
import type { ProfileResponse } from "@/lib/profile";

// ============================================================================
// Types
// ============================================================================

type SaveState = "idle" | "saving" | "success" | "error";

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
}

interface FieldValidation {
  isValid: boolean;
  message: string;
}

interface CompletenessItem {
  label: string;
  complete: boolean;
  required?: boolean;
}

// ============================================================================
// Validation Functions
// ============================================================================

function validateFirstName(value: string): FieldValidation {
  const trimmed = value.trim();
  if (!trimmed) {
    return { isValid: false, message: "Please enter your first name" };
  }
  if (trimmed.length < 2) {
    return { isValid: false, message: "First name should be at least 2 characters" };
  }
  if (trimmed.length > 100) {
    return { isValid: false, message: "First name is too long" };
  }
  return { isValid: true, message: "" };
}

function validateLastName(value: string): FieldValidation {
  const trimmed = value.trim();
  if (!trimmed) {
    return { isValid: false, message: "Please enter your last name" };
  }
  if (trimmed.length < 2) {
    return { isValid: false, message: "Last name should be at least 2 characters" };
  }
  if (trimmed.length > 100) {
    return { isValid: false, message: "Last name is too long" };
  }
  return { isValid: true, message: "" };
}

function validatePhone(value: string): FieldValidation {
  const trimmed = value.trim();
  if (!trimmed) {
    // Phone is optional
    return { isValid: true, message: "" };
  }
  if (trimmed.length > 20) {
    return { isValid: false, message: "Phone number is too long" };
  }
  // Allow digits, spaces, dashes, parens, plus
  const phonePattern = /^[\d\s\-()+ ]+$/;
  if (!phonePattern.test(trimmed)) {
    return { isValid: false, message: "Please use only numbers, spaces, and dashes" };
  }
  return { isValid: true, message: "" };
}

// ============================================================================
// Profile Page Component
// ============================================================================

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Compute validation state
  const validation = useMemo(() => ({
    firstName: validateFirstName(formData.firstName),
    lastName: validateLastName(formData.lastName),
    phone: validatePhone(formData.phone),
  }), [formData]);

  // Check if form is valid
  const isFormValid = validation.firstName.isValid &&
                      validation.lastName.isValid &&
                      validation.phone.isValid;

  // Compute profile completeness
  const completeness = useMemo((): CompletenessItem[] => {
    if (!profile) return [];
    return [
      { label: "First name", complete: !!formData.firstName.trim(), required: true },
      { label: "Last name", complete: !!formData.lastName.trim(), required: true },
      { label: "Email", complete: !!profile.email, required: true },
      { label: "Phone number", complete: !!formData.phone.trim(), required: false },
    ];
  }, [profile, formData]);

  const completenessPercent = useMemo(() => {
    if (completeness.length === 0) return 0;
    const completed = completeness.filter(item => item.complete).length;
    return Math.round((completed / completeness.length) * 100);
  }, [completeness]);

  // Track changes from original profile
  useEffect(() => {
    if (profile) {
      const changed =
        formData.firstName !== profile.firstName ||
        formData.lastName !== profile.lastName ||
        (formData.phone || "") !== (profile.phone || "");
      setHasChanges(changed);
    }
  }, [formData, profile]);

  // Fetch profile on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/v1/me/profile");
        if (!res.ok) {
          if (res.status === 401) {
            // Not authenticated - redirect to login
            window.location.href = "/login";
            return;
          }
          throw new Error("Failed to load profile");
        }
        const data = await res.json();
        setProfile(data.profile);
        setFormData({
          firstName: data.profile.firstName,
          lastName: data.profile.lastName,
          phone: data.profile.phone || "",
        });
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  // Handle form submission
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaveState("saving");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/v1/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to save profile");
      }

      const data = await res.json();
      setProfile(data.profile);
      setSaveState("success");
      setTouched({});
      setHasChanges(false);

      // Reset success state after 4 seconds
      setTimeout(() => setSaveState("idle"), 4000);
    } catch (err) {
      setSaveState("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to save profile");
    }
  }

  // Loading state with skeleton form
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--token-color-surface-2)" }}>
        <ProfileHeader />
        <Stripe padding="md" testId="profile-header">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div
                style={{
                  width: "150px",
                  height: "32px",
                  backgroundColor: "var(--token-color-surface)",
                  borderRadius: "var(--token-radius-lg)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
              <div
                style={{
                  width: "250px",
                  height: "18px",
                  marginTop: "var(--token-space-sm)",
                  backgroundColor: "var(--token-color-surface)",
                  borderRadius: "var(--token-radius-lg)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            </div>
          </div>
        </Stripe>
        <Stripe padding="md" background="muted">
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
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
              <div
                style={{
                  padding: "var(--token-space-md)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--token-space-md)",
                }}
              >
                {[1, 2, 3, 4].map((i) => (
                  <div key={i}>
                    <div
                      style={{
                        width: "80px",
                        height: "14px",
                        backgroundColor: "var(--token-color-surface-2)",
                        borderRadius: "var(--token-radius-lg)",
                        marginBottom: "var(--token-space-xs)",
                        animation: "pulse 1.5s ease-in-out infinite",
                      }}
                    />
                    <div
                      style={{
                        width: "100%",
                        height: "44px",
                        backgroundColor: "var(--token-color-surface-2)",
                        borderRadius: "var(--token-radius-lg)",
                        animation: "pulse 1.5s ease-in-out infinite",
                      }}
                    />
                  </div>
                ))}
                <div
                  style={{
                    width: "100%",
                    height: "44px",
                    marginTop: "var(--token-space-md)",
                    backgroundColor: "var(--token-color-surface-2)",
                    borderRadius: "var(--token-radius-lg)",
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
              </div>
            </div>
          </div>
        </Stripe>
      </div>
    );
  }

  // Error state (no profile loaded)
  if (!profile) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--token-color-surface-2)" }}>
        <ProfileHeader />
        <Stripe padding="md">
          <div
            style={{
              backgroundColor: "var(--token-color-surface)",
              padding: "var(--token-space-lg)",
              borderRadius: "var(--token-radius-lg)",
              border: "1px solid var(--token-color-danger)",
              textAlign: "center",
            }}
          >
            <p style={{ color: "var(--token-color-danger)", marginBottom: "var(--token-space-md)" }}>
              {errorMessage || "Failed to load profile"}
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

  return (
    <div
      data-test-id="profile-page"
      style={{ minHeight: "100vh", backgroundColor: "var(--token-color-surface-2)" }}
    >
      <ProfileHeader />

      {/* Page Title */}
      <Stripe padding="md" testId="profile-header">
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
              My Profile
            </h1>
            <p
              style={{
                fontSize: "var(--token-text-base)",
                color: "var(--token-color-text-muted)",
                marginTop: "var(--token-space-xs)",
                marginBottom: 0,
              }}
            >
              View and update your profile information
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

        {/* Profile Completeness Indicator */}
        <div
          data-test-id="profile-completeness"
          style={{
            marginTop: "var(--token-space-md)",
            padding: "var(--token-space-md)",
            backgroundColor: "var(--token-color-surface)",
            borderRadius: "var(--token-radius-lg)",
            border: "1px solid var(--token-color-border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--token-space-sm)" }}>
            <span style={{ fontSize: "var(--token-text-sm)", fontWeight: 600, color: "var(--token-color-text)" }}>
              Profile Completeness
            </span>
            <span
              data-test-id="completeness-percent"
              style={{
                fontSize: "var(--token-text-sm)",
                fontWeight: 600,
                color: completenessPercent === 100 ? "var(--token-color-success)" : "var(--token-color-primary)",
              }}
            >
              {completenessPercent}%
            </span>
          </div>

          {/* Progress Bar */}
          <div
            style={{
              height: "8px",
              backgroundColor: "var(--token-color-surface-2)",
              borderRadius: "var(--token-radius-lg)",
              overflow: "hidden",
              marginBottom: "var(--token-space-sm)",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${completenessPercent}%`,
                backgroundColor: completenessPercent === 100 ? "var(--token-color-success)" : "var(--token-color-primary)",
                borderRadius: "var(--token-radius-lg)",
                transition: "width 0.3s ease",
              }}
            />
          </div>

          {/* Checklist */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--token-space-sm)" }}>
            {completeness.map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--token-space-xs)",
                  fontSize: "var(--token-text-sm)",
                  color: item.complete ? "var(--token-color-success)" : "var(--token-color-text-muted)",
                }}
              >
                {item.complete ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                )}
                <span>{item.label}{item.required ? "" : " (optional)"}</span>
              </div>
            ))}
          </div>
        </div>
      </Stripe>

      {/* Profile Form */}
      <Stripe padding="md" background="muted">
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          <form onSubmit={handleSubmit}>
            {/* Form Card */}
            <div
              style={{
                backgroundColor: "var(--token-color-surface)",
                borderRadius: "var(--token-radius-lg)",
                border: "1px solid var(--token-color-border)",
                overflow: "hidden",
              }}
            >
              {/* Card Header */}
              <div
                style={{
                  padding: "var(--token-space-md)",
                  borderBottom: "1px solid var(--token-color-border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
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
                  Profile Information
                </h2>
                <span
                  style={{
                    fontSize: "var(--token-text-sm)",
                    color: "var(--token-color-text-muted)",
                  }}
                >
                  Last updated: {formatDate(profile.updatedAt)}
                </span>
              </div>

              {/* Form Fields */}
              <div style={{ padding: "var(--token-space-md)" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--token-space-md)",
                  }}
                >
                  {/* First Name */}
                  <div>
                    <label
                      htmlFor="firstName"
                      style={{
                        display: "block",
                        fontSize: "var(--token-text-sm)",
                        fontWeight: 500,
                        color: "var(--token-color-text)",
                        marginBottom: "var(--token-space-xs)",
                      }}
                    >
                      First Name <span style={{ color: "var(--token-color-danger)" }}>*</span>
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      data-test-id="profile-firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      onBlur={() => setTouched({ ...touched, firstName: true })}
                      required
                      maxLength={100}
                      style={{
                        width: "100%",
                        padding: "var(--token-space-sm) var(--token-space-md)",
                        fontSize: "var(--token-text-base)",
                        border: `1px solid ${touched.firstName && !validation.firstName.isValid ? "var(--token-color-danger)" : "var(--token-color-border)"}`,
                        borderRadius: "var(--token-radius-lg)",
                        backgroundColor: "var(--token-color-surface)",
                        color: "var(--token-color-text)",
                        boxSizing: "border-box",
                        outline: "none",
                        transition: "border-color 0.2s",
                      }}
                    />
                    {touched.firstName && !validation.firstName.isValid && (
                      <p
                        style={{
                          fontSize: "var(--token-text-sm)",
                          color: "var(--token-color-danger)",
                          marginTop: "var(--token-space-xs)",
                          marginBottom: 0,
                        }}
                      >
                        {validation.firstName.message}
                      </p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label
                      htmlFor="lastName"
                      style={{
                        display: "block",
                        fontSize: "var(--token-text-sm)",
                        fontWeight: 500,
                        color: "var(--token-color-text)",
                        marginBottom: "var(--token-space-xs)",
                      }}
                    >
                      Last Name <span style={{ color: "var(--token-color-danger)" }}>*</span>
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      data-test-id="profile-lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      onBlur={() => setTouched({ ...touched, lastName: true })}
                      required
                      maxLength={100}
                      style={{
                        width: "100%",
                        padding: "var(--token-space-sm) var(--token-space-md)",
                        fontSize: "var(--token-text-base)",
                        border: `1px solid ${touched.lastName && !validation.lastName.isValid ? "var(--token-color-danger)" : "var(--token-color-border)"}`,
                        borderRadius: "var(--token-radius-lg)",
                        backgroundColor: "var(--token-color-surface)",
                        color: "var(--token-color-text)",
                        boxSizing: "border-box",
                        outline: "none",
                        transition: "border-color 0.2s",
                      }}
                    />
                    {touched.lastName && !validation.lastName.isValid && (
                      <p
                        style={{
                          fontSize: "var(--token-text-sm)",
                          color: "var(--token-color-danger)",
                          marginTop: "var(--token-space-xs)",
                          marginBottom: 0,
                        }}
                      >
                        {validation.lastName.message}
                      </p>
                    )}
                  </div>

                  {/* Email (read-only) */}
                  <div>
                    <label
                      htmlFor="email"
                      style={{
                        display: "block",
                        fontSize: "var(--token-text-sm)",
                        fontWeight: 500,
                        color: "var(--token-color-text)",
                        marginBottom: "var(--token-space-xs)",
                      }}
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      data-test-id="profile-email"
                      value={profile.email}
                      disabled
                      style={{
                        width: "100%",
                        padding: "var(--token-space-sm) var(--token-space-md)",
                        fontSize: "var(--token-text-base)",
                        border: "1px solid var(--token-color-border)",
                        borderRadius: "var(--token-radius-lg)",
                        backgroundColor: "var(--token-color-surface-2)",
                        color: "var(--token-color-text-muted)",
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
                      Contact support to change your email address
                    </p>
                  </div>

                  {/* Phone */}
                  <div>
                    <label
                      htmlFor="phone"
                      style={{
                        display: "block",
                        fontSize: "var(--token-text-sm)",
                        fontWeight: 500,
                        color: "var(--token-color-text)",
                        marginBottom: "var(--token-space-xs)",
                      }}
                    >
                      Phone <span style={{ color: "var(--token-color-text-muted)", fontWeight: 400 }}>(optional)</span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      data-test-id="profile-phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      onBlur={() => setTouched({ ...touched, phone: true })}
                      maxLength={20}
                      placeholder="(555) 123-4567"
                      style={{
                        width: "100%",
                        padding: "var(--token-space-sm) var(--token-space-md)",
                        fontSize: "var(--token-text-base)",
                        border: `1px solid ${touched.phone && !validation.phone.isValid ? "var(--token-color-danger)" : "var(--token-color-border)"}`,
                        borderRadius: "var(--token-radius-lg)",
                        backgroundColor: "var(--token-color-surface)",
                        color: "var(--token-color-text)",
                        boxSizing: "border-box",
                        outline: "none",
                        transition: "border-color 0.2s",
                      }}
                    />
                    {touched.phone && !validation.phone.isValid && (
                      <p
                        style={{
                          fontSize: "var(--token-text-sm)",
                          color: "var(--token-color-danger)",
                          marginTop: "var(--token-space-xs)",
                          marginBottom: 0,
                        }}
                      >
                        {validation.phone.message}
                      </p>
                    )}
                    <p
                      style={{
                        fontSize: "var(--token-text-sm)",
                        color: "var(--token-color-text-muted)",
                        marginTop: "var(--token-space-xs)",
                        marginBottom: 0,
                      }}
                    >
                      Your phone number is only visible to club administrators
                    </p>
                  </div>

                  {/* Membership Info (read-only) */}
                  <div
                    style={{
                      padding: "var(--token-space-md)",
                      backgroundColor: "var(--token-color-surface-2)",
                      borderRadius: "var(--token-radius-lg)",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "var(--token-text-sm)",
                        fontWeight: 600,
                        color: "var(--token-color-text)",
                        marginTop: 0,
                        marginBottom: "var(--token-space-sm)",
                      }}
                    >
                      Membership
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "var(--token-text-sm)",
                      }}
                    >
                      <span style={{ color: "var(--token-color-text-muted)" }}>Status</span>
                      <span
                        data-test-id="profile-membership-status"
                        style={{ fontWeight: 500, color: "var(--token-color-text)" }}
                      >
                        {profile.membershipStatus.label}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "var(--token-text-sm)",
                        marginTop: "var(--token-space-xs)",
                      }}
                    >
                      <span style={{ color: "var(--token-color-text-muted)" }}>Member Since</span>
                      <span
                        data-test-id="profile-member-since"
                        style={{ fontWeight: 500, color: "var(--token-color-text)" }}
                      >
                        {profile.memberSince}
                      </span>
                    </div>
                    {profile.membershipTier && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "var(--token-text-sm)",
                          marginTop: "var(--token-space-xs)",
                        }}
                      >
                        <span style={{ color: "var(--token-color-text-muted)" }}>Tier</span>
                        <span
                          data-test-id="profile-membership-tier"
                          style={{ fontWeight: 500, color: "var(--token-color-text)" }}
                        >
                          {profile.membershipTier.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Message */}
                {saveState === "error" && errorMessage && (
                  <div
                    data-test-id="profile-error"
                    style={{
                      marginTop: "var(--token-space-md)",
                      padding: "var(--token-space-sm) var(--token-space-md)",
                      backgroundColor: "#fee2e2",
                      color: "var(--token-color-danger)",
                      borderRadius: "var(--token-radius-lg)",
                      fontSize: "var(--token-text-sm)",
                    }}
                  >
                    {errorMessage}
                  </div>
                )}

                {/* Success Message */}
                {saveState === "success" && (
                  <div
                    data-test-id="profile-success"
                    style={{
                      marginTop: "var(--token-space-md)",
                      padding: "var(--token-space-md)",
                      backgroundColor: "#dcfce7",
                      color: "var(--token-color-success)",
                      borderRadius: "var(--token-radius-lg)",
                      fontSize: "var(--token-text-base)",
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--token-space-sm)",
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                    <span>Your profile was updated</span>
                  </div>
                )}

                {/* Submit Button */}
                <div style={{ marginTop: "var(--token-space-lg)" }}>
                  <button
                    type="submit"
                    data-test-id="profile-save-button"
                    disabled={saveState === "saving" || !isFormValid || !hasChanges}
                    style={{
                      width: "100%",
                      padding: "var(--token-space-sm) var(--token-space-md)",
                      fontSize: "var(--token-text-base)",
                      fontWeight: 600,
                      backgroundColor:
                        saveState === "saving" || !isFormValid || !hasChanges
                          ? "var(--token-color-text-muted)"
                          : "var(--token-color-primary)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "var(--token-radius-lg)",
                      cursor: saveState === "saving" || !isFormValid || !hasChanges ? "not-allowed" : "pointer",
                      transition: "background-color 0.2s",
                    }}
                  >
                    {saveState === "saving" ? (
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--token-space-sm)" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                          <circle cx="12" cy="12" r="10" strokeDasharray="50 20" />
                        </svg>
                        Saving...
                      </span>
                    ) : hasChanges ? (
                      "Save Changes"
                    ) : (
                      "No changes to save"
                    )}
                  </button>
                </div>

                {/* Preview Public Profile Link */}
                <div
                  style={{
                    marginTop: "var(--token-space-lg)",
                    padding: "var(--token-space-md)",
                    backgroundColor: "var(--token-color-surface-2)",
                    borderRadius: "var(--token-radius-lg)",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      fontSize: "var(--token-text-sm)",
                      color: "var(--token-color-text-muted)",
                      margin: 0,
                      marginBottom: "var(--token-space-sm)",
                    }}
                  >
                    Want to see how your profile looks to other members?
                  </p>
                  <Link
                    href={`/member/directory/${profile.id}`}
                    data-test-id="view-public-profile-link"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "var(--token-space-xs)",
                      fontSize: "var(--token-text-sm)",
                      fontWeight: 500,
                      color: "var(--token-color-primary)",
                      textDecoration: "none",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    Preview as others see it
                  </Link>
                </div>
              </div>
            </div>
          </form>
        </div>
      </Stripe>
    </div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

function ProfileHeader() {
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
          href="/my/profile"
          style={{
            fontSize: "var(--token-text-sm)",
            color: "var(--token-color-primary)",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Profile
        </Link>
        <ViewAsControl />
      </nav>
    </header>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDate(isoDate: string): string {
  return formatClubDate(new Date(isoDate));
}
