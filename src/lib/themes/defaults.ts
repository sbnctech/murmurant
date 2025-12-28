/**
 * Default Theme Configuration
 *
 * Default theme values for ClubOS branding.
 *
 * Charter: P6 (human-first UI)
 */

import type { ClubTheme } from "./types";

export const defaultTheme: ClubTheme = {
  id: "clubos-default",
  name: "ClubOS Default",
  colors: {
    primary: "#2563eb",
    primaryDark: "#1d4ed8",
    primaryLight: "#3b82f6",
    secondary: "#64748b",
    secondaryDark: "#475569",
    secondaryLight: "#94a3b8",
    accent: "#8b5cf6",
    background: "#ffffff",
    surface: "#f8fafc",
    text: "#1e293b",
    textMuted: "#64748b",
    border: "#e2e8f0",
    error: "#dc2626",
    warning: "#f59e0b",
    success: "#16a34a",
    info: "#0ea5e9",
  },
  fonts: {
    heading: "system-ui, -apple-system, sans-serif",
    body: "system-ui, -apple-system, sans-serif",
    mono: "ui-monospace, monospace",
  },
  branding: {
    clubName: "ClubOS",
  },
  borderRadius: "8px",
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
  },
};
