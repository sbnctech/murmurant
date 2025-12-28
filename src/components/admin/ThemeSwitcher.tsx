"use client";

/**
 * Theme Switcher Component
 *
 * Dropdown for switching between available themes (Modern, Classic, Minimal).
 * Supports compact mode for header placement and full mode for settings page.
 *
 * Charter: P6 (human-first UI)
 */

import { useState, useRef, useEffect } from "react";

const THEMES = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean lines, bold colors, contemporary feel",
    preview: { primary: "#1E40AF", secondary: "#059669", accent: "#F59E0B" },
  },
  {
    id: "classic",
    name: "Classic",
    description: "Traditional styling, elegant typography",
    preview: { primary: "#1F2937", secondary: "#6B7280", accent: "#B45309" },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Simple, uncluttered, focused on content",
    preview: { primary: "#18181B", secondary: "#71717A", accent: "#3B82F6" },
  },
] as const;

type ThemeId = (typeof THEMES)[number]["id"];

interface ThemeSwitcherProps {
  currentTheme: string;
  onThemeChange: (themeId: string) => void;
  mode?: "compact" | "full";
}

function ThemePreviewSwatch({ colors }: { colors: { primary: string; secondary: string; accent: string } }) {
  return (
    <div style={{ display: "flex", gap: "2px", borderRadius: "4px", overflow: "hidden" }}>
      <div style={{ width: "12px", height: "12px", backgroundColor: colors.primary }} />
      <div style={{ width: "12px", height: "12px", backgroundColor: colors.secondary }} />
      <div style={{ width: "12px", height: "12px", backgroundColor: colors.accent }} />
    </div>
  );
}

export function ThemeSwitcher({ currentTheme, onThemeChange, mode = "compact" }: ThemeSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentThemeData = THEMES.find((t) => t.id === currentTheme) || THEMES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = (themeId: ThemeId) => {
    onThemeChange(themeId);
    setIsOpen(false);
  };

  if (mode === "full") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--gray-700, #374151)" }}>Theme</label>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onThemeChange(theme.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                padding: "16px",
                border: currentTheme === theme.id ? "2px solid var(--blue-600, #2563EB)" : "2px solid var(--gray-200, #E5E7EB)",
                borderRadius: "8px",
                backgroundColor: currentTheme === theme.id ? "var(--blue-50, #EFF6FF)" : "white",
                cursor: "pointer",
                minWidth: "140px",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ display: "flex", gap: "4px", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: "24px", height: "24px", backgroundColor: theme.preview.primary }} />
                <div style={{ width: "24px", height: "24px", backgroundColor: theme.preview.secondary }} />
                <div style={{ width: "24px", height: "24px", backgroundColor: theme.preview.accent }} />
              </div>
              <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--gray-900, #111827)" }}>{theme.name}</span>
              <span style={{ fontSize: "12px", color: "var(--gray-500, #6B7280)", textAlign: "center" }}>{theme.description}</span>
              {currentTheme === theme.id && <span style={{ fontSize: "11px", color: "var(--blue-600, #2563EB)", fontWeight: 500 }}>Active</span>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 12px",
          border: "1px solid var(--gray-300, #D1D5DB)",
          borderRadius: "6px",
          backgroundColor: "white",
          fontSize: "13px",
          color: "var(--gray-700, #374151)",
          cursor: "pointer",
          transition: "border-color 0.15s ease",
        }}
      >
        <ThemePreviewSwatch colors={currentThemeData.preview} />
        <span>{currentThemeData.name}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.15s ease" }}>
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {isOpen && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: "4px",
            minWidth: "200px",
            backgroundColor: "white",
            border: "1px solid var(--gray-200, #E5E7EB)",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            zIndex: 50,
            overflow: "hidden",
          }}
        >
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              role="option"
              aria-selected={currentTheme === theme.id}
              onClick={() => handleSelect(theme.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                width: "100%",
                padding: "10px 12px",
                border: "none",
                backgroundColor: currentTheme === theme.id ? "var(--blue-50, #EFF6FF)" : "transparent",
                cursor: "pointer",
                textAlign: "left",
                transition: "background-color 0.1s ease",
              }}
            >
              <ThemePreviewSwatch colors={theme.preview} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--gray-900, #111827)" }}>{theme.name}</div>
                <div style={{ fontSize: "11px", color: "var(--gray-500, #6B7280)" }}>{theme.description}</div>
              </div>
              {currentTheme === theme.id && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="var(--blue-600, #2563EB)">
                  <path d="M11.7 3.3a1 1 0 0 1 0 1.4l-5.5 5.5a1 1 0 0 1-1.4 0L2.3 7.7a1 1 0 1 1 1.4-1.4L5.5 8.1l4.8-4.8a1 1 0 0 1 1.4 0z" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
