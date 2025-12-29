// Copyright © 2025 Murmurant, Inc. All rights reserved.
"use client";

/**
 * RefreshButton - Manual refresh trigger for WA-synced data.
 *
 * Per architecture doc section 3.3, provides a refresh button
 * for manual cache invalidation when users want fresh data.
 *
 * Features:
 * - Loading spinner during refresh
 * - Disabled state during loading
 * - Success/error feedback
 * - Accessible button with aria attributes
 */

import { useState, useCallback, CSSProperties } from "react";

interface RefreshButtonProps {
  /** Async function to call on refresh */
  onRefresh: () => Promise<void>;

  /** Button label */
  label?: string;

  /** Show label text (vs icon only) */
  showLabel?: boolean;

  /** Size variant */
  size?: "sm" | "md" | "lg";

  /** Variant style */
  variant?: "primary" | "secondary" | "ghost";

  /** Additional CSS class */
  className?: string;

  /** Disabled state */
  disabled?: boolean;
}

/**
 * Refresh icon SVG.
 */
function RefreshIcon({ size, spinning }: { size: number; spinning: boolean }) {
  const spinStyle: CSSProperties = spinning
    ? {
        animation: "spin 1s linear infinite",
      }
    : {};

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={spinStyle}
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

/**
 * Size configuration.
 */
const SIZE_CONFIG = {
  sm: { icon: 14, padding: "4px 8px", font: "0.75rem", gap: "4px" },
  md: { icon: 16, padding: "6px 12px", font: "0.875rem", gap: "6px" },
  lg: { icon: 20, padding: "8px 16px", font: "1rem", gap: "8px" },
};

/**
 * Variant styles.
 */
const VARIANT_STYLES: Record<
  "primary" | "secondary" | "ghost",
  { bg: string; bgHover: string; text: string; border: string }
> = {
  primary: {
    bg: "#2563eb",
    bgHover: "#1d4ed8",
    text: "#ffffff",
    border: "transparent",
  },
  secondary: {
    bg: "#f3f4f6",
    bgHover: "#e5e7eb",
    text: "#374151",
    border: "#d1d5db",
  },
  ghost: {
    bg: "transparent",
    bgHover: "#f3f4f6",
    text: "#6b7280",
    border: "transparent",
  },
};

export function RefreshButton({
  onRefresh,
  label = "Refresh",
  showLabel = true,
  size = "md",
  variant = "secondary",
  className,
  disabled = false,
}: RefreshButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<"success" | "error" | null>(null);

  const sizeConfig = SIZE_CONFIG[size];
  const variantStyle = VARIANT_STYLES[variant];

  const handleClick = useCallback(async () => {
    if (isLoading || disabled) return;

    setIsLoading(true);
    setLastResult(null);

    try {
      await onRefresh();
      setLastResult("success");

      // Clear success state after 2 seconds
      setTimeout(() => setLastResult(null), 2000);
    } catch {
      setLastResult("error");

      // Clear error state after 3 seconds
      setTimeout(() => setLastResult(null), 3000);
    } finally {
      setIsLoading(false);
    }
  }, [onRefresh, isLoading, disabled]);

  const buttonStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: sizeConfig.gap,
    padding: showLabel ? sizeConfig.padding : sizeConfig.padding.split(" ")[0],
    fontSize: sizeConfig.font,
    fontWeight: 500,
    color: variantStyle.text,
    backgroundColor: variantStyle.bg,
    border: `1px solid ${variantStyle.border}`,
    borderRadius: "6px",
    cursor: disabled || isLoading ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "background-color 0.15s ease",
  };

  // Feedback colors
  if (lastResult === "success") {
    buttonStyle.backgroundColor = "#dcfce7";
    buttonStyle.color = "#166534";
    buttonStyle.borderColor = "#86efac";
  } else if (lastResult === "error") {
    buttonStyle.backgroundColor = "#fee2e2";
    buttonStyle.color = "#991b1b";
    buttonStyle.borderColor = "#fca5a5";
  }

  const ariaLabel = isLoading
    ? "Refreshing data..."
    : lastResult === "success"
      ? "Data refreshed successfully"
      : lastResult === "error"
        ? "Refresh failed"
        : label;

  return (
    <>
      {/* Keyframe animation for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isLoading}
        style={buttonStyle}
        className={className}
        aria-label={ariaLabel}
        aria-busy={isLoading}
      >
        <RefreshIcon size={sizeConfig.icon} spinning={isLoading} />
        {showLabel && (
          <span>
            {isLoading
              ? "Refreshing..."
              : lastResult === "success"
                ? "Updated!"
                : lastResult === "error"
                  ? "Failed"
                  : label}
          </span>
        )}
      </button>
    </>
  );
}

/**
 * Icon-only refresh button (compact version).
 */
export function RefreshIconButton({
  onRefresh,
  size = "md",
  disabled = false,
  className,
}: Omit<RefreshButtonProps, "label" | "showLabel" | "variant">) {
  return (
    <RefreshButton
      onRefresh={onRefresh}
      showLabel={false}
      size={size}
      variant="ghost"
      disabled={disabled}
      className={className}
    />
  );
}

export default RefreshButton;
