"use client";

// Copyright (c) Santa Barbara Newcomers Club
// React hooks for theme context in public and member views

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import type { ThemeTokens } from "@/lib/publishing/theme";
import type { ViewContext } from "@/lib/publishing/pageTemplates";
import {
  type ThemeContext,
  DEFAULT_THEME_CONTEXT,
  buildThemeContext,
  resolvePublicTheme,
  resolveMemberTheme,
} from "@/lib/publishing/themeHooks";

// ============================================================================
// Theme Context
// ============================================================================

const ThemeCtx = createContext<ThemeContext>(DEFAULT_THEME_CONTEXT);

/**
 * Access the current theme context
 */
export function useTheme(): ThemeContext {
  return useContext(ThemeCtx);
}

// ============================================================================
// Theme Provider Props
// ============================================================================

type ThemeProviderProps = {
  children: ReactNode;
  context: ViewContext;
  siteTheme?: {
    id: string;
    tokens: ThemeTokens;
    cssText?: string;
  };
  memberThemePreference?: {
    id: string;
    tokens: ThemeTokens;
  };
};

// ============================================================================
// Theme Provider Component
// ============================================================================

/**
 * Provides theme context to child components
 * Resolves theme based on view context and optional overrides
 */
export function ThemeProvider({
  children,
  context,
  siteTheme,
  memberThemePreference,
}: ThemeProviderProps) {
  // Resolve theme based on context
  const themeContext = useMemo(() => {
    const resolution =
      context === "member"
        ? resolveMemberTheme(siteTheme, memberThemePreference)
        : resolvePublicTheme(siteTheme);

    return buildThemeContext(resolution, context);
  }, [context, siteTheme, memberThemePreference]);

  return (
    <ThemeCtx.Provider value={themeContext}>
      {/* Inject CSS variables */}
      <style dangerouslySetInnerHTML={{ __html: themeContext.cssVariables }} />
      {children}
    </ThemeCtx.Provider>
  );
}

// ============================================================================
// Context-Specific Providers
// ============================================================================

type LayoutProviderProps = {
  children: ReactNode;
  siteTheme?: {
    id: string;
    tokens: ThemeTokens;
    cssText?: string;
  };
};

/**
 * Layout provider for public pages
 * Uses site default theme
 */
export function PublicLayoutProvider({ children, siteTheme }: LayoutProviderProps) {
  return (
    <ThemeProvider context="public" siteTheme={siteTheme}>
      {children}
    </ThemeProvider>
  );
}

type MemberLayoutProviderProps = LayoutProviderProps & {
  memberThemePreference?: {
    id: string;
    tokens: ThemeTokens;
  };
};

/**
 * Layout provider for member pages
 * Uses member preference or site default
 */
export function MemberLayoutProvider({
  children,
  siteTheme,
  memberThemePreference,
}: MemberLayoutProviderProps) {
  return (
    <ThemeProvider
      context="member"
      siteTheme={siteTheme}
      memberThemePreference={memberThemePreference}
    >
      {children}
    </ThemeProvider>
  );
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Hook for public context theme
 * Returns loading context initially, then resolved theme
 */
export function usePublicTheme(): ThemeContext {
  const theme = useTheme();
  if (theme.context !== "public") {
    console.warn("usePublicTheme called outside PublicLayoutProvider");
  }
  return theme;
}

/**
 * Hook for member context theme
 * Returns loading context initially, then resolved theme
 */
export function useMemberTheme(): ThemeContext {
  const theme = useTheme();
  if (theme.context !== "member") {
    console.warn("useMemberTheme called outside MemberLayoutProvider");
  }
  return theme;
}

/**
 * Get CSS variable value from current theme
 */
export function useThemeToken<K extends keyof ThemeTokens>(
  category: K,
  token: keyof NonNullable<ThemeTokens[K]>
): string | undefined {
  const theme = useTheme();
  const categoryTokens = theme.tokens[category];
  if (!categoryTokens) return undefined;
  return (categoryTokens as Record<string, string | undefined>)[token as string];
}
