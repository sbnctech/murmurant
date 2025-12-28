"use client";

/**
 * Theme Preview/Demo Page
 *
 * Interactive theme preview with live customization.
 *
 * Charter: P6 (human-first UI)
 */

import { useState } from "react";

// Self-contained theme types for preview page
interface PreviewTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    primaryDark: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
    error: string;
    warning: string;
    success: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  borderRadius: string;
}

const THEMES: PreviewTheme[] = [
  {
    id: "clubos-default",
    name: "ClubOS Default",
    colors: {
      primary: "#2563eb",
      primaryDark: "#1d4ed8",
      secondary: "#64748b",
      accent: "#8b5cf6",
      background: "#ffffff",
      surface: "#f8fafc",
      text: "#1e293b",
      textMuted: "#64748b",
      border: "#e2e8f0",
      error: "#dc2626",
      warning: "#f59e0b",
      success: "#16a34a",
    },
    fonts: {
      heading: "system-ui, -apple-system, sans-serif",
      body: "system-ui, -apple-system, sans-serif",
    },
    borderRadius: "8px",
  },
  {
    id: "sbnc",
    name: "SBNC",
    colors: {
      primary: "#1e40af",
      primaryDark: "#1e3a8a",
      secondary: "#059669",
      accent: "#f59e0b",
      background: "#fffbeb",
      surface: "#ffffff",
      text: "#1f2937",
      textMuted: "#6b7280",
      border: "#e5e7eb",
      error: "#ef4444",
      warning: "#f59e0b",
      success: "#10b981",
    },
    fonts: {
      heading: "Georgia, serif",
      body: "system-ui, -apple-system, sans-serif",
    },
    borderRadius: "4px",
  },
  {
    id: "demo",
    name: "Demo Theme",
    colors: {
      primary: "#7c3aed",
      primaryDark: "#6d28d9",
      secondary: "#ec4899",
      accent: "#14b8a6",
      background: "#faf5ff",
      surface: "#f3e8ff",
      text: "#1f2937",
      textMuted: "#6b7280",
      border: "#e9d5ff",
      error: "#dc2626",
      warning: "#f59e0b",
      success: "#10b981",
    },
    fonts: {
      heading: "system-ui, -apple-system, sans-serif",
      body: "system-ui, -apple-system, sans-serif",
    },
    borderRadius: "12px",
  },
];

function ColorSwatch({
  name,
  color,
}: {
  name: string;
  color: string;
}): React.ReactElement {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-8 h-8 rounded border border-gray-300"
        style={{ backgroundColor: color }}
      />
      <div>
        <div className="text-sm font-medium">{name}</div>
        <div className="text-xs text-gray-500">{color}</div>
      </div>
    </div>
  );
}

function PreviewPanel({
  theme,
  isMobile,
}: {
  theme: PreviewTheme;
  isMobile: boolean;
}): React.ReactElement {
  const { colors, fonts, borderRadius } = theme;

  return (
    <div
      className="border rounded-lg overflow-hidden"
      style={{
        width: isMobile ? "375px" : "100%",
        backgroundColor: colors.background,
        borderColor: colors.border,
        borderRadius,
      }}
    >
      {/* Header with Logo */}
      <div
        className="p-4 border-b"
        style={{
          backgroundColor: colors.primary,
          borderColor: colors.border,
        }}
      >
        <div
          className="text-xl font-bold text-white"
          style={{ fontFamily: fonts.heading }}
        >
          {theme.name}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6" style={{ backgroundColor: colors.surface }}>
        {/* Colors Section */}
        <section>
          <h3
            className="text-lg font-semibold mb-3"
            style={{ color: colors.text, fontFamily: fonts.heading }}
          >
            Colors
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <ColorSwatch name="Primary" color={colors.primary} />
            <ColorSwatch name="Primary Dark" color={colors.primaryDark} />
            <ColorSwatch name="Secondary" color={colors.secondary} />
            <ColorSwatch name="Accent" color={colors.accent} />
            <ColorSwatch name="Background" color={colors.background} />
            <ColorSwatch name="Surface" color={colors.surface} />
            <ColorSwatch name="Text" color={colors.text} />
            <ColorSwatch name="Success" color={colors.success} />
            <ColorSwatch name="Warning" color={colors.warning} />
            <ColorSwatch name="Error" color={colors.error} />
          </div>
        </section>

        {/* Typography Section */}
        <section>
          <h3
            className="text-lg font-semibold mb-3"
            style={{ color: colors.text, fontFamily: fonts.heading }}
          >
            Typography
          </h3>
          <div className="space-y-2">
            <h1
              className="text-2xl font-bold"
              style={{ color: colors.text, fontFamily: fonts.heading }}
            >
              Heading 1
            </h1>
            <h2
              className="text-xl font-semibold"
              style={{ color: colors.text, fontFamily: fonts.heading }}
            >
              Heading 2
            </h2>
            <h3
              className="text-lg font-medium"
              style={{ color: colors.text, fontFamily: fonts.heading }}
            >
              Heading 3
            </h3>
            <p style={{ color: colors.text, fontFamily: fonts.body }}>
              Body text in the primary font. This is how regular content appears.
            </p>
            <p style={{ color: colors.textMuted, fontFamily: fonts.body }}>
              Muted text for secondary information.
            </p>
          </div>
        </section>

        {/* Buttons Section */}
        <section>
          <h3
            className="text-lg font-semibold mb-3"
            style={{ color: colors.text, fontFamily: fonts.heading }}
          >
            Buttons
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              className="px-4 py-2 text-white font-medium"
              style={{
                backgroundColor: colors.primary,
                borderRadius,
              }}
            >
              Primary
            </button>
            <button
              className="px-4 py-2 font-medium border"
              style={{
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text,
                borderRadius,
              }}
            >
              Secondary
            </button>
            <button
              className="px-4 py-2 text-white font-medium"
              style={{
                backgroundColor: colors.success,
                borderRadius,
              }}
            >
              Success
            </button>
            <button
              className="px-4 py-2 text-white font-medium"
              style={{
                backgroundColor: colors.error,
                borderRadius,
              }}
            >
              Danger
            </button>
          </div>
        </section>

        {/* Card Section */}
        <section>
          <h3
            className="text-lg font-semibold mb-3"
            style={{ color: colors.text, fontFamily: fonts.heading }}
          >
            Cards
          </h3>
          <div
            className="p-4 border"
            style={{
              backgroundColor: colors.background,
              borderColor: colors.border,
              borderRadius,
            }}
          >
            <h4
              className="font-semibold mb-2"
              style={{ color: colors.text, fontFamily: fonts.heading }}
            >
              Sample Card
            </h4>
            <p style={{ color: colors.textMuted, fontFamily: fonts.body }}>
              This is a sample card component with the theme styles applied.
            </p>
            <button
              className="mt-3 px-3 py-1 text-sm text-white"
              style={{ backgroundColor: colors.primary, borderRadius }}
            >
              Action
            </button>
          </div>
        </section>

        {/* Form Section */}
        <section>
          <h3
            className="text-lg font-semibold mb-3"
            style={{ color: colors.text, fontFamily: fonts.heading }}
          >
            Form Elements
          </h3>
          <div className="space-y-3">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: colors.text }}
              >
                Text Input
              </label>
              <input
                type="text"
                placeholder="Enter text..."
                className="w-full px-3 py-2 border"
                style={{
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                  borderRadius,
                }}
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: colors.text }}
              >
                Select
              </label>
              <select
                className="w-full px-3 py-2 border"
                style={{
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                  borderRadius,
                }}
              >
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sample-checkbox"
                style={{ accentColor: colors.primary }}
              />
              <label htmlFor="sample-checkbox" style={{ color: colors.text }}>
                Checkbox option
              </label>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function ThemePreviewPage(): React.ReactElement {
  const [selectedThemeId, setSelectedThemeId] = useState<string>(THEMES[0].id);
  const [compareThemeId, setCompareThemeId] = useState<string | null>(null);
  const [isMobilePreview, setIsMobilePreview] = useState(false);

  const selectedTheme = THEMES.find((t) => t.id === selectedThemeId) || THEMES[0];
  const compareTheme = compareThemeId
    ? THEMES.find((t) => t.id === compareThemeId)
    : null;

  const handleExportJson = (): void => {
    const json = JSON.stringify(selectedTheme, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTheme.id}-theme.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = (): void => {
    setSelectedThemeId(THEMES[0].id);
    setCompareThemeId(null);
    setIsMobilePreview(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Theme Preview</h1>
        <p className="text-gray-600">
          Preview and compare ClubOS themes before applying them.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        {/* Theme Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Theme
          </label>
          <select
            value={selectedThemeId}
            onChange={(e) => setSelectedThemeId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            {THEMES.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
        </div>

        {/* Comparison Mode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Compare With
          </label>
          <select
            value={compareThemeId || ""}
            onChange={(e) => setCompareThemeId(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">None</option>
            {THEMES.filter((t) => t.id !== selectedThemeId).map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
        </div>

        {/* Mobile Preview Toggle */}
        <div className="flex items-end">
          <button
            onClick={() => setIsMobilePreview(!isMobilePreview)}
            className={`px-4 py-2 rounded-md font-medium ${
              isMobilePreview
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-300 text-gray-700"
            }`}
          >
            {isMobilePreview ? "Mobile View" : "Desktop View"}
          </button>
        </div>

        {/* Export JSON */}
        <div className="flex items-end">
          <button
            onClick={handleExportJson}
            className="px-4 py-2 bg-green-600 text-white rounded-md font-medium"
          >
            Export JSON
          </button>
        </div>

        {/* Reset */}
        <div className="flex items-end">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md font-medium"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Preview Panels */}
      <div
        className={`grid gap-6 ${
          compareTheme ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
        }`}
      >
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            {selectedTheme.name}
          </h2>
          <PreviewPanel theme={selectedTheme} isMobile={isMobilePreview} />
        </div>

        {compareTheme && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              {compareTheme.name}
            </h2>
            <PreviewPanel theme={compareTheme} isMobile={isMobilePreview} />
          </div>
        )}
      </div>

      {/* Theme JSON Display */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Theme Configuration
        </h3>
        <pre className="p-4 bg-gray-900 text-green-400 rounded-md overflow-auto text-sm">
          {JSON.stringify(selectedTheme, null, 2)}
        </pre>
      </div>
    </div>
  );
}
