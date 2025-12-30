// Copyright © 2025 Murmurant, Inc.
// Theme editor page - visual theme customization tool

"use client";

import React, { useState, useCallback } from "react";

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
}

interface ThemeTypography {
  fontFamily: string;
  headingFont: string;
  baseSize: number;
}

interface ThemeShape {
  borderRadius: number;
  buttonStyle: "sharp" | "rounded" | "pill";
  cardStyle: "flat" | "raised" | "bordered";
}

interface ThemeVoice {
  tone: "formal" | "friendly" | "casual";
  terminology: Record<string, string>;
  greeting: string;
}

interface ChatbotSettings {
  name: string;
  personality: string;
  suggestedPrompts: string[];
}

interface ThemeConfig {
  colors: ThemeColors;
  typography: ThemeTypography;
  shape: ThemeShape;
  voice: ThemeVoice;
  chatbot: ChatbotSettings;
  logoUrl: string;
  bugUrl: string;
}

const defaultTheme: ThemeConfig = {
  colors: {
    primary: "#2563eb",
    secondary: "#64748b",
    accent: "#8b5cf6",
    background: "#ffffff",
    surface: "#f9fafb",
    textPrimary: "#1f2937",
    textSecondary: "#6b7280",
    textMuted: "#9ca3af",
  },
  typography: {
    fontFamily: "Inter",
    headingFont: "Inter",
    baseSize: 16,
  },
  shape: {
    borderRadius: 8,
    buttonStyle: "rounded",
    cardStyle: "raised",
  },
  voice: {
    tone: "friendly",
    terminology: {
      member: "Member",
      event: "Event",
      group: "Interest Group",
    },
    greeting: "Welcome to our community!",
  },
  chatbot: {
    name: "Clover",
    personality: "Helpful, knowledgeable, efficient, and warm. Professional but friendly, like a capable colleague.",
    suggestedPrompts: [
      "What events are coming up?",
      "How do I register for an event?",
      "Tell me about interest groups",
      "How do I renew my membership?",
    ],
  },
  logoUrl: "",
  bugUrl: "",
};

const googleFonts = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Raleway",
  "Nunito",
  "Source Sans Pro",
  "Playfair Display",
  "Merriweather",
  "PT Serif",
];

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <label
        style={{
          display: "block",
          fontSize: "13px",
          fontWeight: 500,
          color: "#374151",
          marginBottom: "4px",
        }}
      >
        {label}
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "40px",
            height: "40px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            cursor: "pointer",
            padding: "2px",
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            padding: "8px 12px",
            fontSize: "14px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            fontFamily: "monospace",
          }}
        />
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "4px",
        }}
      >
        <label style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>
          {label}
        </label>
        <span style={{ fontSize: "13px", color: "#6b7280" }}>
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%" }}
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        padding: "20px",
        marginBottom: "16px",
      }}
    >
      <h3
        style={{
          fontSize: "16px",
          fontWeight: 600,
          color: "#1f2937",
          marginBottom: "16px",
          paddingBottom: "12px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function ThemeEditorPage() {
  const [theme, setTheme] = useState<ThemeConfig>(defaultTheme);
  const [newPrompt, setNewPrompt] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const updateColors = useCallback((key: keyof ThemeColors, value: string) => {
    setTheme((prev) => ({
      ...prev,
      colors: { ...prev.colors, [key]: value },
    }));
  }, []);

  const updateTypography = useCallback(
    (key: keyof ThemeTypography, value: string | number) => {
      setTheme((prev) => ({
        ...prev,
        typography: { ...prev.typography, [key]: value },
      }));
    },
    []
  );

  const updateShape = useCallback(
    (key: keyof ThemeShape, value: number | string) => {
      setTheme((prev) => ({
        ...prev,
        shape: { ...prev.shape, [key]: value },
      }));
    },
    []
  );

  const updateVoice = useCallback(
    (key: keyof ThemeVoice, value: string | Record<string, string>) => {
      setTheme((prev) => ({
        ...prev,
        voice: { ...prev.voice, [key]: value },
      }));
    },
    []
  );

  const updateChatbot = useCallback(
    (key: keyof ChatbotSettings, value: string | string[]) => {
      setTheme((prev) => ({
        ...prev,
        chatbot: { ...prev.chatbot, [key]: value },
      }));
    },
    []
  );

  const addPrompt = useCallback(() => {
    if (newPrompt.trim()) {
      setTheme((prev) => ({
        ...prev,
        chatbot: {
          ...prev.chatbot,
          suggestedPrompts: [...prev.chatbot.suggestedPrompts, newPrompt.trim()],
        },
      }));
      setNewPrompt("");
    }
  }, [newPrompt]);

  const removePrompt = useCallback((index: number) => {
    setTheme((prev) => ({
      ...prev,
      chatbot: {
        ...prev.chatbot,
        suggestedPrompts: prev.chatbot.suggestedPrompts.filter((_, i) => i !== index),
      },
    }));
  }, []);

  const movePrompt = useCallback((index: number, direction: "up" | "down") => {
    setTheme((prev) => {
      const prompts = [...prev.chatbot.suggestedPrompts];
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prompts.length) return prev;
      [prompts[index], prompts[newIndex]] = [prompts[newIndex], prompts[index]];
      return {
        ...prev,
        chatbot: { ...prev.chatbot, suggestedPrompts: prompts },
      };
    });
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveMessage("");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaveMessage("Theme saved successfully!");
    setIsSaving(false);
    setTimeout(() => setSaveMessage(""), 3000);
  }, []);

  const handleReset = useCallback(() => {
    if (confirm("Reset all theme settings to defaults?")) {
      setTheme(defaultTheme);
    }
  }, []);

  const handleExport = useCallback(() => {
    const json = JSON.stringify(theme, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "theme-config.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [theme]);

  return (
    <div data-test-id="theme-editor-page" style={{ display: "flex", gap: "24px", padding: "24px" }}>
      {/* Editor Panel */}
      <div style={{ flex: 1, maxWidth: "600px" }}>
        <header style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1f2937", marginBottom: "8px" }}>
            Theme Editor
          </h1>
          <p style={{ color: "#6b7280" }}>Customize the look and feel of your club portal</p>
        </header>

        {/* Logo Upload */}
        <Section title="Logo & Branding">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>
                Main Logo
              </label>
              <div
                style={{
                  border: "2px dashed #d1d5db",
                  borderRadius: "8px",
                  padding: "24px",
                  textAlign: "center",
                  backgroundColor: "#f9fafb",
                  position: "relative",
                }}
              >
                {theme.logoUrl ? (
                  <img src={theme.logoUrl} alt="Logo" style={{ maxHeight: "60px" }} />
                ) : (
                  <div style={{ color: "#6b7280", fontSize: "14px" }}>
                    <div style={{ fontSize: "24px", marginBottom: "8px" }}>+</div>
                    Upload Logo
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setTheme((prev) => ({ ...prev, logoUrl: url }));
                    }
                  }}
                  style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>
                Bug / Icon
              </label>
              <div
                style={{
                  border: "2px dashed #d1d5db",
                  borderRadius: "8px",
                  padding: "24px",
                  textAlign: "center",
                  backgroundColor: "#f9fafb",
                  position: "relative",
                }}
              >
                {theme.bugUrl ? (
                  <img src={theme.bugUrl} alt="Bug" style={{ maxHeight: "40px" }} />
                ) : (
                  <div style={{ color: "#6b7280", fontSize: "14px" }}>
                    <div style={{ fontSize: "24px", marginBottom: "8px" }}>+</div>
                    Upload Bug
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setTheme((prev) => ({ ...prev, bugUrl: url }));
                    }
                  }}
                  style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* Colors */}
        <Section title="Colors">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <h4 style={{ fontSize: "13px", fontWeight: 600, color: "#6b7280", marginBottom: "12px", textTransform: "uppercase" }}>
                Brand Colors
              </h4>
              <ColorPicker label="Primary" value={theme.colors.primary} onChange={(v) => updateColors("primary", v)} />
              <ColorPicker label="Secondary" value={theme.colors.secondary} onChange={(v) => updateColors("secondary", v)} />
              <ColorPicker label="Accent" value={theme.colors.accent} onChange={(v) => updateColors("accent", v)} />
            </div>
            <div>
              <h4 style={{ fontSize: "13px", fontWeight: 600, color: "#6b7280", marginBottom: "12px", textTransform: "uppercase" }}>
                Backgrounds & Text
              </h4>
              <ColorPicker label="Background" value={theme.colors.background} onChange={(v) => updateColors("background", v)} />
              <ColorPicker label="Surface" value={theme.colors.surface} onChange={(v) => updateColors("surface", v)} />
              <ColorPicker label="Text Primary" value={theme.colors.textPrimary} onChange={(v) => updateColors("textPrimary", v)} />
              <ColorPicker label="Text Secondary" value={theme.colors.textSecondary} onChange={(v) => updateColors("textSecondary", v)} />
              <ColorPicker label="Text Muted" value={theme.colors.textMuted} onChange={(v) => updateColors("textMuted", v)} />
            </div>
          </div>
        </Section>

        {/* Typography */}
        <Section title="Typography">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "4px" }}>
                Body Font
              </label>
              <select
                value={theme.typography.fontFamily}
                onChange={(e) => updateTypography("fontFamily", e.target.value)}
                style={{ width: "100%", padding: "8px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px" }}
              >
                {googleFonts.map((font) => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "4px" }}>
                Heading Font
              </label>
              <select
                value={theme.typography.headingFont}
                onChange={(e) => updateTypography("headingFont", e.target.value)}
                style={{ width: "100%", padding: "8px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px" }}
              >
                {googleFonts.map((font) => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ marginTop: "16px" }}>
            <Slider label="Base Font Size" value={theme.typography.baseSize} min={12} max={20} unit="px" onChange={(v) => updateTypography("baseSize", v)} />
          </div>
        </Section>

        {/* Shape */}
        <Section title="Shape & Style">
          <Slider label="Border Radius" value={theme.shape.borderRadius} min={0} max={24} unit="px" onChange={(v) => updateShape("borderRadius", v)} />
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>
              Button Style
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              {(["sharp", "rounded", "pill"] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => updateShape("buttonStyle", style)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    fontSize: "14px",
                    fontWeight: 500,
                    border: `2px solid ${theme.shape.buttonStyle === style ? "#2563eb" : "#d1d5db"}`,
                    borderRadius: style === "sharp" ? "0" : style === "rounded" ? "6px" : "20px",
                    backgroundColor: theme.shape.buttonStyle === style ? "#eff6ff" : "white",
                    color: theme.shape.buttonStyle === style ? "#2563eb" : "#374151",
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>
              Card Style
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              {(["flat", "raised", "bordered"] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => updateShape("cardStyle", style)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    fontSize: "14px",
                    fontWeight: 500,
                    border: style === "bordered" || theme.shape.cardStyle === style ? `2px solid ${theme.shape.cardStyle === style ? "#2563eb" : "#d1d5db"}` : "2px solid transparent",
                    borderRadius: "6px",
                    backgroundColor: theme.shape.cardStyle === style ? "#eff6ff" : "white",
                    boxShadow: style === "raised" ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                    color: theme.shape.cardStyle === style ? "#2563eb" : "#374151",
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Voice Settings */}
        <Section title="Voice & Terminology">
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>
              Communication Tone
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              {(["formal", "friendly", "casual"] as const).map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => updateVoice("tone", tone)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    fontSize: "14px",
                    fontWeight: 500,
                    border: `2px solid ${theme.voice.tone === tone ? "#2563eb" : "#d1d5db"}`,
                    borderRadius: "6px",
                    backgroundColor: theme.voice.tone === tone ? "#eff6ff" : "white",
                    color: theme.voice.tone === tone ? "#2563eb" : "#374151",
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>
              Custom Terminology
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {Object.entries(theme.voice.terminology).map(([key, value]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "100px", fontSize: "13px", color: "#6b7280", textTransform: "capitalize" }}>{key}:</span>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => updateVoice("terminology", { ...theme.voice.terminology, [key]: e.target.value })}
                    style={{ flex: 1, padding: "8px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "4px" }}>
              Greeting Message
            </label>
            <input
              type="text"
              value={theme.voice.greeting}
              onChange={(e) => updateVoice("greeting", e.target.value)}
              style={{ width: "100%", padding: "8px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px" }}
            />
          </div>
        </Section>

        {/* Chatbot Settings */}
        <Section title="Chatbot Settings">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "4px" }}>
                Chatbot Name
              </label>
              <input
                type="text"
                value={theme.chatbot.name}
                onChange={(e) => updateChatbot("name", e.target.value)}
                style={{ width: "100%", padding: "8px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px" }}
              />
            </div>
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "4px" }}>
              Personality Description
            </label>
            <textarea
              value={theme.chatbot.personality}
              onChange={(e) => updateChatbot("personality", e.target.value)}
              rows={3}
              style={{ width: "100%", padding: "8px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", resize: "vertical" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>
              Suggested Prompts
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {theme.chatbot.suggestedPrompts.map((prompt, index) => (
                <div
                  key={index}
                  style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#f9fafb", padding: "8px 12px", borderRadius: "6px" }}
                >
                  <span style={{ flex: 1, fontSize: "14px" }}>{prompt}</span>
                  <button type="button" onClick={() => movePrompt(index, "up")} disabled={index === 0} style={{ padding: "4px 8px", fontSize: "12px", border: "none", backgroundColor: "transparent", cursor: index === 0 ? "not-allowed" : "pointer", opacity: index === 0 ? 0.3 : 1 }}>
                    Up
                  </button>
                  <button type="button" onClick={() => movePrompt(index, "down")} disabled={index === theme.chatbot.suggestedPrompts.length - 1} style={{ padding: "4px 8px", fontSize: "12px", border: "none", backgroundColor: "transparent", cursor: index === theme.chatbot.suggestedPrompts.length - 1 ? "not-allowed" : "pointer", opacity: index === theme.chatbot.suggestedPrompts.length - 1 ? 0.3 : 1 }}>
                    Down
                  </button>
                  <button type="button" onClick={() => removePrompt(index)} style={{ padding: "4px 8px", fontSize: "12px", color: "#dc2626", border: "none", backgroundColor: "transparent", cursor: "pointer" }}>
                    Remove
                  </button>
                </div>
              ))}
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  placeholder="Add a suggested prompt..."
                  onKeyDown={(e) => e.key === "Enter" && addPrompt()}
                  style={{ flex: 1, padding: "8px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                />
                <button type="button" onClick={addPrompt} style={{ padding: "8px 16px", fontSize: "14px", fontWeight: 500, color: "#2563eb", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "6px", cursor: "pointer" }}>
                  Add
                </button>
              </div>
            </div>
          </div>
        </Section>

        {/* Actions */}
        <div style={{ display: "flex", gap: "12px", padding: "20px", backgroundColor: "#f9fafb", borderRadius: "8px", position: "sticky", bottom: "24px" }}>
          <button type="button" onClick={handleSave} disabled={isSaving} data-test-id="save-theme-button" style={{ flex: 1, padding: "12px 24px", fontSize: "14px", fontWeight: 600, color: "white", backgroundColor: isSaving ? "#93c5fd" : "#2563eb", border: "none", borderRadius: "6px", cursor: isSaving ? "not-allowed" : "pointer" }}>
            {isSaving ? "Saving..." : "Save Theme"}
          </button>
          <button type="button" onClick={handleReset} data-test-id="reset-theme-button" style={{ padding: "12px 24px", fontSize: "14px", fontWeight: 500, color: "#374151", backgroundColor: "white", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer" }}>
            Reset
          </button>
          <button type="button" onClick={handleExport} data-test-id="export-theme-button" style={{ padding: "12px 24px", fontSize: "14px", fontWeight: 500, color: "#374151", backgroundColor: "white", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer" }}>
            Export JSON
          </button>
        </div>

        {saveMessage && (
          <div style={{ marginTop: "12px", padding: "12px", backgroundColor: "#d1fae5", color: "#065f46", borderRadius: "6px", fontSize: "14px", textAlign: "center" }}>
            {saveMessage}
          </div>
        )}
      </div>

      {/* Live Preview */}
      <div data-test-id="theme-preview" style={{ flex: 1, position: "sticky", top: "24px", alignSelf: "flex-start", maxWidth: "500px" }}>
        <div style={{ backgroundColor: theme.colors.background, borderRadius: `${theme.shape.borderRadius}px`, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <div style={{ padding: "16px", backgroundColor: theme.colors.surface, borderBottom: "1px solid #e5e7eb" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: theme.colors.textPrimary, fontFamily: theme.typography.headingFont }}>
              Live Preview
            </h3>
          </div>
          <div style={{ padding: "20px" }}>
            <div
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: `${theme.shape.borderRadius}px`,
                border: theme.shape.cardStyle === "bordered" ? "1px solid #e5e7eb" : "none",
                boxShadow: theme.shape.cardStyle === "raised" ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                padding: "16px",
                marginBottom: "16px",
              }}
            >
              <h4 style={{ fontSize: `${theme.typography.baseSize + 2}px`, fontWeight: 600, color: theme.colors.textPrimary, fontFamily: theme.typography.headingFont, marginBottom: "8px" }}>
                Sample Event
              </h4>
              <p style={{ fontSize: `${theme.typography.baseSize}px`, color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily, marginBottom: "12px" }}>
                Join us for our monthly gathering
              </p>
              <button
                type="button"
                style={{
                  padding: "8px 16px",
                  fontSize: `${theme.typography.baseSize - 2}px`,
                  fontWeight: 500,
                  color: "white",
                  backgroundColor: theme.colors.primary,
                  border: "none",
                  borderRadius: theme.shape.buttonStyle === "sharp" ? "0" : theme.shape.buttonStyle === "rounded" ? `${theme.shape.borderRadius}px` : "20px",
                  cursor: "pointer",
                }}
              >
                Register Now
              </button>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontSize: `${theme.typography.baseSize}px`, color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily, marginBottom: "4px" }}>
                {theme.voice.greeting}
              </p>
              <p style={{ fontSize: `${theme.typography.baseSize - 2}px`, color: theme.colors.textMuted, fontFamily: theme.typography.fontFamily }}>
                This is muted helper text
              </p>
            </div>
            <div style={{ backgroundColor: theme.colors.surface, borderRadius: `${theme.shape.borderRadius}px`, border: "1px solid #e5e7eb", padding: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: theme.colors.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "14px", fontWeight: 600 }}>
                  {theme.chatbot.name.charAt(0)}
                </div>
                <span style={{ fontWeight: 600, color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }}>
                  {theme.chatbot.name}
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {theme.chatbot.suggestedPrompts.slice(0, 2).map((prompt, i) => (
                  <span key={i} style={{ fontSize: "12px", padding: "6px 12px", backgroundColor: theme.colors.background, border: `1px solid ${theme.colors.primary}`, borderRadius: "16px", color: theme.colors.primary }}>
                    {prompt}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
