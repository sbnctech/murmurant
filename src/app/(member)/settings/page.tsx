// Copyright © 2025 Murmurant, Inc.
// Member settings and preferences page

"use client";

import React, { useState } from "react";
import Link from "next/link";

interface ToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function Toggle({ label, description, checked, onChange }: ToggleProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: "16px 0",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, color: "#1f2937", marginBottom: "4px" }}>
          {label}
        </div>
        <div style={{ fontSize: "14px", color: "#6b7280" }}>{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: "44px",
          height: "24px",
          borderRadius: "12px",
          backgroundColor: checked ? "#2563eb" : "#d1d5db",
          border: "none",
          cursor: "pointer",
          position: "relative",
          transition: "background-color 0.2s",
          flexShrink: 0,
          marginLeft: "16px",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "2px",
            left: checked ? "22px" : "2px",
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            backgroundColor: "white",
            transition: "left 0.2s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        />
      </button>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <section
      style={{
        backgroundColor: "white",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        padding: "24px",
        marginBottom: "24px",
      }}
    >
      <h2
        style={{
          fontSize: "18px",
          fontWeight: 600,
          color: "#1f2937",
          marginBottom: "16px",
          paddingBottom: "12px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function MemberSettingsPage() {
  // Email notification preferences
  const [eventReminders, setEventReminders] = useState(true);
  const [newsletterEmails, setNewsletterEmails] = useState(true);
  const [registrationConfirmations, setRegistrationConfirmations] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  // Privacy settings
  const [showInDirectory, setShowInDirectory] = useState(true);
  const [showEmailToMembers, setShowEmailToMembers] = useState(false);
  const [showPhoneToMembers, setShowPhoneToMembers] = useState(false);

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSaving(false);
    setSaveSuccess(true);

    // Clear success message after 3 seconds
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div data-test-id="member-settings-page" style={{ maxWidth: "700px" }}>
      <h1
        style={{
          fontSize: "28px",
          fontWeight: 700,
          marginBottom: "8px",
          color: "#1f2937",
        }}
      >
        Settings
      </h1>
      <p
        style={{
          fontSize: "16px",
          color: "#6b7280",
          marginBottom: "32px",
        }}
      >
        Manage your notification and privacy preferences
      </p>

      {/* Email Notifications */}
      <Section title="Email Notifications">
        <Toggle
          label="Event Reminders"
          description="Receive reminders before events you've registered for"
          checked={eventReminders}
          onChange={setEventReminders}
        />
        <Toggle
          label="Newsletter"
          description="Receive the club newsletter and announcements"
          checked={newsletterEmails}
          onChange={setNewsletterEmails}
        />
        <Toggle
          label="Registration Confirmations"
          description="Receive confirmation emails when you register for events"
          checked={registrationConfirmations}
          onChange={setRegistrationConfirmations}
        />
        <Toggle
          label="Weekly Digest"
          description="Receive a weekly summary of upcoming events and club news"
          checked={weeklyDigest}
          onChange={setWeeklyDigest}
        />
      </Section>

      {/* Privacy Settings */}
      <Section title="Privacy">
        <Toggle
          label="Show in Member Directory"
          description="Allow other members to find you in the member directory"
          checked={showInDirectory}
          onChange={setShowInDirectory}
        />
        <Toggle
          label="Show Email to Members"
          description="Allow other members to see your email address"
          checked={showEmailToMembers}
          onChange={setShowEmailToMembers}
        />
        <Toggle
          label="Show Phone to Members"
          description="Allow other members to see your phone number"
          checked={showPhoneToMembers}
          onChange={setShowPhoneToMembers}
        />
      </Section>

      {/* Account Section */}
      <Section title="Account">
        <div style={{ padding: "8px 0" }}>
          <Link
            href="/member/change-password"
            style={{
              color: "#2563eb",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Change Password
          </Link>
          <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>
            Update your account password
          </p>
        </div>
      </Section>

      {/* Connected Accounts */}
      <Section title="Connected Accounts">
        <div
          style={{
            padding: "16px",
            backgroundColor: "#f9fafb",
            borderRadius: "6px",
            textAlign: "center",
            color: "#6b7280",
          }}
        >
          <p style={{ marginBottom: "8px" }}>No connected accounts</p>
          <p style={{ fontSize: "14px" }}>
            Social login options may be added in a future update
          </p>
        </div>
      </Section>

      {/* Save Button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginTop: "8px",
        }}
      >
        <button
          onClick={handleSave}
          disabled={isSaving}
          data-test-id="settings-save-button"
          style={{
            padding: "12px 32px",
            fontSize: "16px",
            fontWeight: 500,
            color: "white",
            backgroundColor: isSaving ? "#93c5fd" : "#2563eb",
            border: "none",
            borderRadius: "8px",
            cursor: isSaving ? "not-allowed" : "pointer",
            transition: "background-color 0.2s",
          }}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>

        {saveSuccess && (
          <span
            data-test-id="settings-save-success"
            style={{
              color: "#059669",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span style={{ fontSize: "18px" }}>✓</span>
            Settings saved successfully
          </span>
        )}
      </div>
    </div>
  );
}
