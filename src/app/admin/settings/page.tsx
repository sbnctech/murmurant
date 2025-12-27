"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

type ClubSettings = {
  clubName: string;
  clubDescription: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  logoUrl: string | null;
  timezone: string;
  emailFromAddress: string;
  emailReplyTo: string;
  demoMode: boolean;
  registrationOpen: boolean;
  maintenanceMode: boolean;
};

const INITIAL_SETTINGS: ClubSettings = {
  clubName: "Santa Barbara Newcomers Club",
  clubDescription: "Making friends since 1962. A welcoming community for newcomers to Santa Barbara.",
  contactEmail: "info@sbnewcomers.org",
  contactPhone: "(805) 555-1962",
  address: "P.O. Box 30651",
  city: "Santa Barbara",
  state: "CA",
  zip: "93130",
  logoUrl: null,
  timezone: "America/Los_Angeles",
  emailFromAddress: "noreply@sbnewcomers.org",
  emailReplyTo: "info@sbnewcomers.org",
  demoMode: true,
  registrationOpen: true,
  maintenanceMode: false,
};

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "32px" }}>
      <h2
        style={{
          fontSize: "18px",
          fontWeight: 600,
          color: "#1f2937",
          marginBottom: "16px",
          paddingBottom: "8px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
        {label}
      </label>
      {children}
      {hint && (
        <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>{hint}</p>
      )}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "10px 14px",
        fontSize: "15px",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        boxSizing: "border-box",
        backgroundColor: disabled ? "#f3f4f6" : "#fff",
        color: disabled ? "#6b7280" : "#1f2937",
      }}
    />
  );
}

function Toggle({
  enabled,
  onChange,
  disabled,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      style={{
        width: "48px",
        height: "26px",
        borderRadius: "13px",
        backgroundColor: enabled ? "#16a34a" : "#d1d5db",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        position: "relative",
        transition: "background-color 0.2s",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "3px",
          left: enabled ? "25px" : "3px",
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          backgroundColor: "#fff",
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}

export default function SystemSettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<ClubSettings>(INITIAL_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API fetch
    const fetchSettings = async () => {
      await new Promise((r) => setTimeout(r, 500));
      setSettings(INITIAL_SETTINGS);
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const updateSetting = <K extends keyof ClubSettings>(key: K, value: ClubSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Logo must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    setSuccessMessage("Settings saved successfully!");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  if (loading) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", color: "#6b7280" }}>
        Loading settings...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
      {/* Header */}
      <header style={{ marginBottom: 32 }}>
        <nav style={{ marginBottom: "12px", fontSize: "14px" }}>
          <Link href="/admin" style={{ color: "#6b7280", textDecoration: "none" }}>
            Admin
          </Link>
          <span style={{ margin: "0 8px", color: "#9ca3af" }}>/</span>
          <span style={{ color: "#1f2937" }}>Settings</span>
        </nav>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1f2937", margin: 0 }}>
          System Settings
        </h1>
        <p style={{ color: "#6b7280", marginTop: "8px" }}>
          Configure club-wide settings and preferences.
        </p>
      </header>

      {/* Success Message */}
      {successMessage && (
        <div
          style={{
            padding: "16px 20px",
            backgroundColor: "#ecfdf5",
            border: "1px solid #a7f3d0",
            borderRadius: "8px",
            marginBottom: "24px",
            color: "#065f46",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {successMessage}
        </div>
      )}

      {/* Demo Mode Banner */}
      {settings.demoMode && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "#fef3c7",
            border: "1px solid #fcd34d",
            borderRadius: "8px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span style={{ color: "#92400e", fontWeight: 500 }}>
            Demo Mode is enabled. Some features may behave differently.
          </span>
        </div>
      )}

      <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "32px" }}>
        {/* Club Information */}
        <FormSection title="Club Information">
          <FormField label="Club Name">
            <TextInput
              value={settings.clubName}
              onChange={(v) => updateSetting("clubName", v)}
              placeholder="Enter club name"
            />
          </FormField>

          <FormField label="Club Description" hint="A brief description shown on the public website.">
            <textarea
              value={settings.clubDescription}
              onChange={(e) => updateSetting("clubDescription", e.target.value)}
              placeholder="Describe your club..."
              rows={3}
              style={{
                width: "100%",
                padding: "10px 14px",
                fontSize: "15px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                boxSizing: "border-box",
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </FormField>

          {/* Logo Upload */}
          <FormField label="Club Logo" hint="Recommended: 200x200px PNG or JPG, max 2MB.">
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "8px",
                  backgroundColor: "#f3f4f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px dashed #d1d5db",
                  overflow: "hidden",
                }}
              >
                {logoPreview || settings.logoUrl ? (
                  <img
                    src={logoPreview || settings.logoUrl || ""}
                    alt="Logo preview"
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#f3f4f6",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Upload Logo
                </button>
              </div>
            </div>
          </FormField>
        </FormSection>

        {/* Contact Information */}
        <FormSection title="Contact Information">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <FormField label="Contact Email">
              <TextInput
                value={settings.contactEmail}
                onChange={(v) => updateSetting("contactEmail", v)}
                placeholder="info@example.org"
                type="email"
              />
            </FormField>
            <FormField label="Contact Phone">
              <TextInput
                value={settings.contactPhone}
                onChange={(v) => updateSetting("contactPhone", v)}
                placeholder="(555) 555-5555"
                type="tel"
              />
            </FormField>
          </div>

          <FormField label="Mailing Address">
            <TextInput
              value={settings.address}
              onChange={(v) => updateSetting("address", v)}
              placeholder="123 Main St or P.O. Box"
            />
          </FormField>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "16px" }}>
            <FormField label="City">
              <TextInput
                value={settings.city}
                onChange={(v) => updateSetting("city", v)}
                placeholder="City"
              />
            </FormField>
            <FormField label="State">
              <TextInput
                value={settings.state}
                onChange={(v) => updateSetting("state", v)}
                placeholder="CA"
              />
            </FormField>
            <FormField label="ZIP">
              <TextInput
                value={settings.zip}
                onChange={(v) => updateSetting("zip", v)}
                placeholder="12345"
              />
            </FormField>
          </div>
        </FormSection>

        {/* Timezone */}
        <FormSection title="Timezone">
          <FormField label="Club Timezone" hint="All event times are displayed in this timezone.">
            <div
              style={{
                padding: "12px 16px",
                backgroundColor: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontWeight: 500, color: "#1f2937" }}>{settings.timezone}</div>
                <div style={{ fontSize: "13px", color: "#6b7280" }}>Pacific Time (PT)</div>
              </div>
              <span
                style={{
                  padding: "4px 10px",
                  backgroundColor: "#dbeafe",
                  color: "#1e40af",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 500,
                }}
              >
                System Default
              </span>
            </div>
          </FormField>
        </FormSection>

        {/* Email Settings */}
        <FormSection title="Email Settings">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <FormField label="From Address" hint="Emails will appear to come from this address.">
              <TextInput
                value={settings.emailFromAddress}
                onChange={(v) => updateSetting("emailFromAddress", v)}
                placeholder="noreply@example.org"
                type="email"
              />
            </FormField>
            <FormField label="Reply-To Address" hint="Replies will go to this address.">
              <TextInput
                value={settings.emailReplyTo}
                onChange={(v) => updateSetting("emailReplyTo", v)}
                placeholder="info@example.org"
                type="email"
              />
            </FormField>
          </div>
        </FormSection>

        {/* Feature Toggles */}
        <FormSection title="Feature Toggles">
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px",
                backgroundColor: "#f9fafb",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
              }}
            >
              <div>
                <div style={{ fontWeight: 500, color: "#1f2937" }}>Demo Mode</div>
                <div style={{ fontSize: "13px", color: "#6b7280" }}>
                  When enabled, the system operates with sample data. Contact support to disable.
                </div>
              </div>
              <Toggle
                enabled={settings.demoMode}
                onChange={() => {}}
                disabled
              />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px",
                backgroundColor: "#f9fafb",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
              }}
            >
              <div>
                <div style={{ fontWeight: 500, color: "#1f2937" }}>Open Registration</div>
                <div style={{ fontSize: "13px", color: "#6b7280" }}>
                  Allow new members to register through the website.
                </div>
              </div>
              <Toggle
                enabled={settings.registrationOpen}
                onChange={(v) => updateSetting("registrationOpen", v)}
              />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px",
                backgroundColor: settings.maintenanceMode ? "#fef2f2" : "#f9fafb",
                borderRadius: "8px",
                border: `1px solid ${settings.maintenanceMode ? "#fecaca" : "#e5e7eb"}`,
              }}
            >
              <div>
                <div style={{ fontWeight: 500, color: settings.maintenanceMode ? "#dc2626" : "#1f2937" }}>
                  Maintenance Mode
                </div>
                <div style={{ fontSize: "13px", color: "#6b7280" }}>
                  When enabled, only admins can access the site. Members see a maintenance message.
                </div>
              </div>
              <Toggle
                enabled={settings.maintenanceMode}
                onChange={(v) => updateSetting("maintenanceMode", v)}
              />
            </div>
          </div>
        </FormSection>

        {/* Save Button */}
        <div style={{ paddingTop: "16px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "12px 32px",
              backgroundColor: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
