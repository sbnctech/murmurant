"use client";

/**
 * Brand Context Provider
 *
 * Provides brand configuration to components via React context.
 * Brand = per-club customization (identity, voice, chatbot).
 *
 * Charter: P6 (human-first UI)
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { ClubBrand, BrandColors } from "./types";
import { defaultBrand } from "./defaults";

// ============================================================================
// Context Types
// ============================================================================

interface BrandContextValue {
  brand: ClubBrand;
  colors: BrandColors;
  getBrandColor: (key: keyof BrandColors) => string;
  getBrandVar: (key: keyof BrandColors) => string;
}

// ============================================================================
// Context
// ============================================================================

export const BrandContext = createContext<BrandContextValue | null>(null);

// ============================================================================
// Provider Props
// ============================================================================

interface BrandProviderProps {
  brand?: ClubBrand;
  children: ReactNode;
}

// ============================================================================
// Provider Component
// ============================================================================

export function BrandProvider({
  brand = defaultBrand,
  children,
}: BrandProviderProps): React.ReactElement {
  const value = useMemo<BrandContextValue>(() => {
    const colors = brand.identity.colors;

    return {
      brand,
      colors,
      getBrandColor: (key: keyof BrandColors) => colors[key],
      getBrandVar: (key: keyof BrandColors) => {
        const varMap: Record<keyof BrandColors, string> = {
          primary: "--brand-primary",
          primaryHover: "--brand-primary-hover",
          secondary: "--brand-secondary",
          accent: "--brand-accent",
        };
        return `var(${varMap[key]})`;
      },
    };
  }, [brand]);

  return (
    <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useBrand(): BrandContextValue {
  const context = useContext(BrandContext);
  if (!context) {
    // Return default values if not within provider
    return {
      brand: defaultBrand,
      colors: defaultBrand.identity.colors,
      getBrandColor: (key: keyof BrandColors) =>
        defaultBrand.identity.colors[key],
      getBrandVar: (key: keyof BrandColors) => {
        const varMap: Record<keyof BrandColors, string> = {
          primary: "--brand-primary",
          primaryHover: "--brand-primary-hover",
          secondary: "--brand-secondary",
          accent: "--brand-accent",
        };
        return `var(${varMap[key]})`;
      },
    };
  }
  return context;
}
