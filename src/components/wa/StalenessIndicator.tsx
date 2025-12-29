// Copyright © 2025 Murmurant, Inc. All rights reserved.
"use client";

/**
 * StalenessIndicator - Visual indicator for data freshness from Wild Apricot.
 *
 * Per architecture doc section 3.3, displays:
 * - Green dot: Fresh from WA (< 5 min)
 * - Yellow dot: Cached (5-60 min)
 * - Orange dot: Stale (> 60 min) or fallback
 *
 * Used to show users when data was last synced with Wild Apricot.
 */

import { CSSProperties } from "react";
import type { CachedData, CacheSource } from "@/lib/wa/memberSync";
import { getStalenessIndicator, getStalenessLabel } from "@/lib/wa/memberSync";

export type StalenessLevel = "fresh" | "cached" | "stale";

interface StalenessIndicatorProps {
  /** Cached data object with staleness info */
  cachedData?: CachedData<unknown>;

  /** Or provide staleness level directly */
  level?: StalenessLevel;

  /** Custom label override */
  label?: string;

  /** Show tooltip on hover */
  showTooltip?: boolean;

  /** Size variant */
  size?: "sm" | "md" | "lg";

  /** Additional CSS class */
  className?: string;
}

/**
 * Color configuration for each staleness level.
 */
const STALENESS_COLORS: Record<StalenessLevel, { dot: string; bg: string; text: string }> = {
  fresh: {
    dot: "#22c55e", // green-500
    bg: "#dcfce7", // green-100
    text: "#166534", // green-800
  },
  cached: {
    dot: "#eab308", // yellow-500
    bg: "#fef9c3", // yellow-100
    text: "#854d0e", // yellow-800
  },
  stale: {
    dot: "#f97316", // orange-500
    bg: "#ffedd5", // orange-100
    text: "#9a3412", // orange-800
  },
};

/**
 * Size configuration for the indicator.
 */
const SIZE_CONFIG: Record<"sm" | "md" | "lg", { dot: number; font: string; padding: string }> = {
  sm: { dot: 6, font: "0.75rem", padding: "2px 6px" },
  md: { dot: 8, font: "0.875rem", padding: "4px 8px" },
  lg: { dot: 10, font: "1rem", padding: "6px 12px" },
};

/**
 * Dot-only staleness indicator.
 */
export function StalenessDot({
  level,
  size = "md",
  title,
}: {
  level: StalenessLevel;
  size?: "sm" | "md" | "lg";
  title?: string;
}) {
  const colors = STALENESS_COLORS[level];
  const sizeConfig = SIZE_CONFIG[size];

  const dotStyle: CSSProperties = {
    width: sizeConfig.dot,
    height: sizeConfig.dot,
    borderRadius: "50%",
    backgroundColor: colors.dot,
    display: "inline-block",
    flexShrink: 0,
  };

  return <span style={dotStyle} title={title} aria-label={title} />;
}

/**
 * Full staleness indicator with label.
 */
export function StalenessIndicator({
  cachedData,
  level: levelProp,
  label: labelProp,
  showTooltip = true,
  size = "md",
  className,
}: StalenessIndicatorProps) {
  // Determine staleness level
  const level: StalenessLevel = levelProp ?? (cachedData ? getStalenessIndicator(cachedData) : "stale");

  // Determine label
  const label = labelProp ?? (cachedData ? getStalenessLabel(cachedData) : "Unknown");

  const colors = STALENESS_COLORS[level];
  const sizeConfig = SIZE_CONFIG[size];

  const containerStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: sizeConfig.padding,
    backgroundColor: colors.bg,
    borderRadius: "9999px",
    fontSize: sizeConfig.font,
    color: colors.text,
    fontWeight: 500,
  };

  return (
    <span
      style={containerStyle}
      className={className}
      title={showTooltip ? label : undefined}
      role="status"
      aria-live="polite"
    >
      <StalenessDot level={level} size={size} />
      <span>{label}</span>
    </span>
  );
}

/**
 * Compact staleness badge (dot + short text).
 */
export function StalenessCompact({
  cachedData,
  level: levelProp,
  size = "sm",
}: {
  cachedData?: CachedData<unknown>;
  level?: StalenessLevel;
  size?: "sm" | "md";
}) {
  const level: StalenessLevel = levelProp ?? (cachedData ? getStalenessIndicator(cachedData) : "stale");

  const shortLabels: Record<StalenessLevel, string> = {
    fresh: "Live",
    cached: "Cached",
    stale: "Stale",
  };

  const colors = STALENESS_COLORS[level];
  const sizeConfig = SIZE_CONFIG[size];

  const fullLabel = cachedData ? getStalenessLabel(cachedData) : shortLabels[level];

  const containerStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontSize: sizeConfig.font,
    color: colors.text,
  };

  return (
    <span style={containerStyle} title={fullLabel} role="status">
      <StalenessDot level={level} size={size} />
      <span>{shortLabels[level]}</span>
    </span>
  );
}

/**
 * Source badge showing where data came from.
 */
export function DataSourceBadge({
  source,
  size = "sm",
}: {
  source: CacheSource;
  size?: "sm" | "md";
}) {
  const sourceLabels: Record<CacheSource, { label: string; level: StalenessLevel }> = {
    wa_live: { label: "Wild Apricot", level: "fresh" },
    wa_cached: { label: "Cached", level: "cached" },
    mm_fallback: { label: "Local", level: "stale" },
  };

  const { label, level } = sourceLabels[source];
  const colors = STALENESS_COLORS[level];
  const sizeConfig = SIZE_CONFIG[size];

  const containerStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: sizeConfig.padding,
    backgroundColor: colors.bg,
    borderRadius: "4px",
    fontSize: sizeConfig.font,
    color: colors.text,
  };

  return (
    <span style={containerStyle} role="status">
      <StalenessDot level={level} size={size} />
      <span>{label}</span>
    </span>
  );
}

export default StalenessIndicator;
