/**
 * Theme Hook
 *
 * Hook to access theme context and utility functions.
 *
 * Charter: P6 (human-first UI)
 */

"use client";

import { useContext, createContext } from "react";
import type { ClubTheme, ClubColors } from "./types";
import { defaultTheme } from "./defaults";

interface ThemeContextValue {
  theme: ClubTheme;
  setTheme: (theme: ClubTheme) => void;
  isClubOSContext: boolean;
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
      isClubOSContext: false,
    };
  }
  return context;
}

/**
 * Get a specific color from the current theme.
 */
export function useThemeColor(colorKey: keyof ClubColors): string {
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
 * Check if currently in ClubOS admin/system context.
 */
export function useIsClubOSContext(): boolean {
  const { isClubOSContext } = useTheme();
  return isClubOSContext;
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
export function getColorVar(colorKey: keyof ClubColors): string {
  const varMap: Record<keyof ClubColors, string> = {
    primary: "primary",
    primaryDark: "primary-dark",
    primaryLight: "primary-light",
    secondary: "secondary",
    secondaryDark: "secondary-dark",
    secondaryLight: "secondary-light",
    accent: "accent",
    background: "background",
    surface: "surface",
    text: "text",
    textMuted: "text-muted",
    border: "border",
    error: "error",
    warning: "warning",
    success: "success",
    info: "info",
  };
  return `var(--theme-${varMap[colorKey]})`;
}
