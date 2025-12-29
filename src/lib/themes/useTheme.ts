/**
 * Theme Hook
 *
 * Hook to access theme context and utility functions.
 *
 * Charter: P6 (human-first UI)
 */

"use client";

import { useContext, createContext } from "react";
import type { ClubTheme, ColorPalette } from "./types";
import { defaultTheme } from "./defaults";

interface ThemeContextValue {
  theme: ClubTheme;
  setTheme: (theme: ClubTheme) => void;
  isMurmurantContext: boolean;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Hook to access the current theme and theme utilities.
 * Must be used within a ThemeProvider.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return default values if not within provider (for SSR or standalone usage)
    return {
      theme: defaultTheme,
      setTheme: () => {},
      isMurmurantContext: false,
    };
  }
  return context;
}

/**
 * Get a specific color from the current theme.
 */
export function useThemeColor(colorKey: keyof ColorPalette): string {
  const { theme } = useTheme();
  return theme.colors[colorKey];
}

/**
 * Get the primary color from the current theme.
 */
export function usePrimaryColor(): string {
  return useThemeColor("primary");
}

/**
 * Check if currently in Murmurant admin/system context.
 */
export function useIsMurmurantContext(): boolean {
  const { isMurmurantContext } = useTheme();
  return isMurmurantContext;
}

/**
 * Get CSS variable reference for a theme property.
 * Useful for inline styles that should respect theming.
 */
export function getThemeVar(property: string): string {
  return `var(--theme-${property})`;
}

/**
 * Utility to get color CSS variable reference.
 */
export function getColorVar(colorKey: keyof ColorPalette): string {
  const varMap: Record<keyof ColorPalette, string> = {
    primary: "primary",
    primaryHover: "primary-hover",
    secondary: "secondary",
    accent: "accent",
    background: "background",
    surface: "surface",
    textPrimary: "text-primary",
    textSecondary: "text-secondary",
    textMuted: "text-muted",
    border: "border",
    error: "error",
    warning: "warning",
    success: "success",
  };
  return `var(--theme-${varMap[colorKey]})`;
}
