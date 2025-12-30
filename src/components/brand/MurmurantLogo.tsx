// Copyright © 2025 Murmurant, Inc.
// Murmurant Logo - Full horizontal logo with symbol and wordmark

"use client";

import React from "react";
import { MurmurantBug } from "./MurmurantBug";
import { MurmurantWordmark } from "./MurmurantWordmark";

type LogoSize = "sm" | "md" | "lg" | "xl";
type LogoVariant = "color" | "white" | "black";

interface MurmurantLogoProps {
  size?: LogoSize;
  variant?: LogoVariant;
  className?: string;
}

const sizeConfig: Record<LogoSize, { bug: 16 | 24 | 32 | 48 | 64; wordmark: "sm" | "md" | "lg" | "xl"; gap: string }> = {
  sm: { bug: 24, wordmark: "sm", gap: "6px" },
  md: { bug: 32, wordmark: "md", gap: "8px" },
  lg: { bug: 48, wordmark: "lg", gap: "10px" },
  xl: { bug: 64, wordmark: "xl", gap: "12px" },
};

/**
 * Murmurant Logo Component
 * 
 * Full horizontal logo combining:
 * - The "Gathering" symbol (MurmurantBug)
 * - The "Murmurant" wordmark
 * 
 * The Gathering represents diverse people converging and uniting
 */
export function MurmurantLogo({ 
  size = "md", 
  variant = "color",
  className = "" 
}: MurmurantLogoProps) {
  const config = sizeConfig[size];

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: config.gap,
      }}
    >
      <MurmurantBug size={config.bug} variant={variant} />
      <MurmurantWordmark size={config.wordmark} variant={variant} />
    </div>
  );
}

export default MurmurantLogo;
