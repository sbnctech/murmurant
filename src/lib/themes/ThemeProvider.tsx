/**
 * Theme Provider Component
 *
 * React context provider for club theming.
 * Applies theme CSS variables to document root and provides theme context.
 *
 * Charter: P6 (human-first UI)
 */

"use client";

import { useEffect, useState } from "react";
import type { ClubTheme } from "./types";
import { defaultTheme } from "./defaults";
import { applyTheme } from "./applyTheme";
import { ThemeContext } from "./useTheme";

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: ClubTheme;
  /** True for admin/login pages that should use ClubOS branding */
  isClubOSContext?: boolean;
}

/**
 * Provides theme context to child components and applies theme CSS variables.
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * <ThemeProvider initialTheme={clubTheme}>
 *   {children}
 * </ThemeProvider>
 *
 * // For admin pages
 * <ThemeProvider isClubOSContext>
 *   {children}
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({
  children,
  initialTheme,
  isClubOSContext = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<ClubTheme>(initialTheme || defaultTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isClubOSContext }}>
      {children}
    </ThemeContext.Provider>
  );
}

export { ThemeContext } from "./useTheme";
export type { ClubTheme } from "./types";
