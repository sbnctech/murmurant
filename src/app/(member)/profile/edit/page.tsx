"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type ProfileData = {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  bio: string;
  photoUrl: string | null;
  interests: string[];
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
};

const AVAILABLE_INTERESTS = [
  "Hiking",
  "Wine Tasting",
  "Book Club",
  "Golf",
  "Tennis",
  "Bridge",
  "Cooking",
  "Photography",
  "Travel",
  "Gardening",
  "Art & Museums",
  "Theater",
  "Beach Walks",
  "Dining Out",
  "Volunteering",
  "Music & Concerts",
];

const STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

// Mock initial data - in production would come from API
const INITIAL_PROFILE: ProfileData = {
  firstName: "Jane",
  lastName: "Smith",
  phone: "(805) 555-1234",
  address: "123 State St",
  city: "Santa Barbara",
  state: "CA",
  zip: "93101",
  bio: "Newcomer to Santa Barbara, originally from the Bay Area. Love exploring local hiking trails and wine country!",
  photoUrl: null,
  interests: ["Hiking", "Wine Tasting", "Book Club"],
  emergencyContactName: "John Smith",
  emergencyContactPhone: "(805) 555-5678",
  emergencyContactRelation: "Spouse",
};

type ValidationErrors = Partial<Record<keyof ProfileData, string>>;

function validateProfile(data: ProfileData): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!data.firstName.trim()) {
    errors.firstName = "First name is required";
  }
  if (!data.lastName.trim()) {
    errors.lastName = "Last name is required";
  }
  if (data.phone && !/^[\d\s()+-]+$/.test(data.phone)) {
    errors.phone = "Invalid phone format";
  }
  if (data.zip && !/^\d{5}(-\d{4})?$/.test(data.zip)) {
    errors.zip = "Invalid ZIP code";
  }
  if (data.bio.length > 500) {
    errors.bio = "Bio must be 500 characters or less";
  }
  if (data.emergencyContactPhone && !/^[\d\s()+-]+$/.test(data.emergencyContactPhone)) {
    errors.emergencyContactPhone = "Invalid phone format";
  }

  return errors;
}

function FormField({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
        {label}
        {required && <span style={{ color: "#dc2626", marginLeft: "4px" }}>*</span>}
      </label>
      {children}
      {error && (
        <div style={{ fontSize: "13px", color: "#dc2626", marginTop: "4px" }}>{error}</div>
      )}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  error?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "12px 16px",
        fontSize: "16px",
        border: `1px solid ${error ? "#dc2626" : "#d1d5db"}`,
        borderRadius: "8px",
        boxSizing: "border-box",
        outline: "none",
      }}
    />
  );
}

export default function EditProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<ProfileData>(INITIAL_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API fetch
    const fetchProfile = async () => {
      await new Promise((r) => setTimeout(r, 500));
      setProfile(INITIAL_PROFILE);
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const updateProfile = (field: keyof ProfileData, value: string | string[]) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is edited
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const toggleInterest = (interest: string) => {
    setProfile((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, photoUrl: "Photo must be less than 5MB" }));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        setErrors((prev) => ({ ...prev, photoUrl: undefined }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    const validationErrors = validateProfile(profile);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    setSuccessMessage("Profile updated successfully!");
    setTimeout(() => {
      router.push("/my/profile");
    }, 1500);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "40px 20px", textAlign: "center", color: "#6b7280" }}>
        Loading profile...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "40px 20px" }}>
      {/* Header */}
      <header style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <Link href="/my/profile" style={{ color: "#6b7280", textDecoration: "none", fontSize: "14px" }}>
            ← Back to Profile
          </Link>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1f2937", margin: 0 }}>
          Edit Profile
        </h1>
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

      <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "32px" }}>
        {/* Profile Photo */}
        <section style={{ marginBottom: "32px", paddingBottom: "32px", borderBottom: "1px solid #e5e7eb" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#1f2937", marginBottom: "16px" }}>
            Profile Photo
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                backgroundColor: "#e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {photoPreview || profile.photoUrl ? (
                <Image
                  src={photoPreview || profile.photoUrl || ""}
                  alt="Profile"
                  fill
                  style={{ objectFit: "cover" }}
                  unoptimized={!!photoPreview}
                />
              ) : (
                <span style={{ fontSize: "36px", color: "#9ca3af" }}>
                  {profile.firstName[0]}{profile.lastName[0]}
                </span>
              )}
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: "none" }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#f3f4f6",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Upload Photo
              </button>
              <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "8px" }}>
                JPG, PNG. Max 5MB.
              </p>
              {errors.photoUrl && (
                <p style={{ fontSize: "13px", color: "#dc2626", marginTop: "4px" }}>{errors.photoUrl}</p>
              )}
            </div>
          </div>
        </section>

        {/* Personal Information */}
        <section style={{ marginBottom: "32px", paddingBottom: "32px", borderBottom: "1px solid #e5e7eb" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#1f2937", marginBottom: "16px" }}>
            Personal Information
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <FormField label="First Name" required error={errors.firstName}>
              <TextInput
                value={profile.firstName}
                onChange={(v) => updateProfile("firstName", v)}
                placeholder="First name"
                error={!!errors.firstName}
              />
            </FormField>
            <FormField label="Last Name" required error={errors.lastName}>
              <TextInput
                value={profile.lastName}
                onChange={(v) => updateProfile("lastName", v)}
                placeholder="Last name"
                error={!!errors.lastName}
              />
            </FormField>
          </div>
          <FormField label="Phone" error={errors.phone}>
            <TextInput
              value={profile.phone}
              onChange={(v) => updateProfile("phone", v)}
              placeholder="(805) 555-1234"
              type="tel"
              error={!!errors.phone}
            />
          </FormField>
          <FormField label="Street Address" error={errors.address}>
            <TextInput
              value={profile.address}
              onChange={(v) => updateProfile("address", v)}
              placeholder="123 Main St"
            />
          </FormField>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "16px" }}>
            <FormField label="City">
              <TextInput
                value={profile.city}
                onChange={(v) => updateProfile("city", v)}
                placeholder="Santa Barbara"
              />
            </FormField>
            <FormField label="State">
              <select
                value={profile.state}
                onChange={(e) => updateProfile("state", e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  fontSize: "16px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  backgroundColor: "#fff",
                }}
              >
                <option value="">--</option>
                {STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </FormField>
            <FormField label="ZIP" error={errors.zip}>
              <TextInput
                value={profile.zip}
                onChange={(v) => updateProfile("zip", v)}
                placeholder="93101"
                error={!!errors.zip}
              />
            </FormField>
          </div>
        </section>

        {/* Bio */}
        <section style={{ marginBottom: "32px", paddingBottom: "32px", borderBottom: "1px solid #e5e7eb" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#1f2937", marginBottom: "16px" }}>
            About Me
          </h2>
          <FormField label="Bio" error={errors.bio}>
            <textarea
              value={profile.bio}
              onChange={(e) => updateProfile("bio", e.target.value)}
              placeholder="Tell other members a bit about yourself..."
              rows={4}
              style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: "16px",
                border: `1px solid ${errors.bio ? "#dc2626" : "#d1d5db"}`,
                borderRadius: "8px",
                boxSizing: "border-box",
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
            <div style={{ fontSize: "13px", color: profile.bio.length > 500 ? "#dc2626" : "#6b7280", marginTop: "4px" }}>
              {profile.bio.length}/500 characters
            </div>
          </FormField>
        </section>

        {/* Interests */}
        <section style={{ marginBottom: "32px", paddingBottom: "32px", borderBottom: "1px solid #e5e7eb" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#1f2937", marginBottom: "8px" }}>
            Interests
          </h2>
          <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "16px" }}>
            Select your interests to help connect with like-minded members.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {AVAILABLE_INTERESTS.map((interest) => {
              const selected = profile.interests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: selected ? "#2563eb" : "#f3f4f6",
                    color: selected ? "#fff" : "#4b5563",
                    border: "none",
                    borderRadius: "9999px",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </section>

        {/* Emergency Contact */}
        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#1f2937", marginBottom: "8px" }}>
            Emergency Contact
          </h2>
          <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "16px" }}>
            Optional. This information is only visible to club officers.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <FormField label="Contact Name">
              <TextInput
                value={profile.emergencyContactName}
                onChange={(v) => updateProfile("emergencyContactName", v)}
                placeholder="John Doe"
              />
            </FormField>
            <FormField label="Relationship">
              <TextInput
                value={profile.emergencyContactRelation}
                onChange={(v) => updateProfile("emergencyContactRelation", v)}
                placeholder="Spouse, Friend, etc."
              />
            </FormField>
          </div>
          <FormField label="Contact Phone" error={errors.emergencyContactPhone}>
            <TextInput
              value={profile.emergencyContactPhone}
              onChange={(v) => updateProfile("emergencyContactPhone", v)}
              placeholder="(805) 555-5678"
              type="tel"
              error={!!errors.emergencyContactPhone}
            />
          </FormField>
        </section>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", paddingTop: "16px", borderTop: "1px solid #e5e7eb" }}>
          <Link
            href="/my/profile"
            style={{
              padding: "14px 28px",
              backgroundColor: "#f3f4f6",
              color: "#4b5563",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: 600,
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "14px 28px",
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
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
