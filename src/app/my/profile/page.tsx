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
 * - Clear save state feedback
 * - Last updated display
 *
 * Charter Compliance:
 * - P1: Identity via session (API enforces)
 * - P2: Only allowed fields editable (API allowlist)
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

"use client";

import { useState, useEffect, FormEvent } from "react";
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

      // Reset success state after 3 seconds
      setTimeout(() => setSaveState("idle"), 3000);
    } catch (err) {
      setSaveState("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to save profile");
    }
  }

  // Loading state
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--token-color-surface-2)" }}>
        <ProfileHeader />
        <Stripe padding="md">
          <div
            style={{
              textAlign: "center",
              padding: "var(--token-space-xl)",
              color: "var(--token-color-text-muted)",
            }}
          >
            Loading profile...
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
                      First Name *
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      data-test-id="profile-firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                      maxLength={100}
                      style={{
                        width: "100%",
                        padding: "var(--token-space-sm) var(--token-space-md)",
                        fontSize: "var(--token-text-base)",
                        border: "1px solid var(--token-color-border)",
                        borderRadius: "var(--token-radius-lg)",
                        backgroundColor: "var(--token-color-surface)",
                        color: "var(--token-color-text)",
                        boxSizing: "border-box",
                      }}
                    />
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
                      Last Name *
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      data-test-id="profile-lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                      maxLength={100}
                      style={{
                        width: "100%",
                        padding: "var(--token-space-sm) var(--token-space-md)",
                        fontSize: "var(--token-text-base)",
                        border: "1px solid var(--token-color-border)",
                        borderRadius: "var(--token-radius-lg)",
                        backgroundColor: "var(--token-color-surface)",
                        color: "var(--token-color-text)",
                        boxSizing: "border-box",
                      }}
                    />
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
                      Phone
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      data-test-id="profile-phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      maxLength={20}
                      placeholder="(555) 123-4567"
                      style={{
                        width: "100%",
                        padding: "var(--token-space-sm) var(--token-space-md)",
                        fontSize: "var(--token-text-base)",
                        border: "1px solid var(--token-color-border)",
                        borderRadius: "var(--token-radius-lg)",
                        backgroundColor: "var(--token-color-surface)",
                        color: "var(--token-color-text)",
                        boxSizing: "border-box",
                      }}
                    />
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
                      padding: "var(--token-space-sm) var(--token-space-md)",
                      backgroundColor: "#dcfce7",
                      color: "var(--token-color-success)",
                      borderRadius: "var(--token-radius-lg)",
                      fontSize: "var(--token-text-sm)",
                    }}
                  >
                    Profile updated successfully!
                  </div>
                )}

                {/* Submit Button */}
                <div style={{ marginTop: "var(--token-space-lg)" }}>
                  <button
                    type="submit"
                    data-test-id="profile-save-button"
                    disabled={saveState === "saving"}
                    style={{
                      width: "100%",
                      padding: "var(--token-space-sm) var(--token-space-md)",
                      fontSize: "var(--token-text-base)",
                      fontWeight: 600,
                      backgroundColor:
                        saveState === "saving"
                          ? "var(--token-color-text-muted)"
                          : "var(--token-color-primary)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "var(--token-radius-lg)",
                      cursor: saveState === "saving" ? "not-allowed" : "pointer",
                    }}
                  >
                    {saveState === "saving" ? "Saving..." : "Save Changes"}
                  </button>
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
