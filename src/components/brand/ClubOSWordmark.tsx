// Copyright (c) Santa Barbara Newcomers Club
// ClubOS Wordmark - Text only

import React from "react";

type WordmarkSize = "sm" | "md" | "lg" | "xl";
type WordmarkVariant = "color" | "white" | "black";

interface ClubOSWordmarkProps {
  size?: WordmarkSize;
  variant?: WordmarkVariant;
  className?: string;
}

const sizeStyles: Record<WordmarkSize, { fontSize: string; letterSpacing: string }> = {
  sm: { fontSize: "16px", letterSpacing: "-0.02em" },
  md: { fontSize: "24px", letterSpacing: "-0.02em" },
  lg: { fontSize: "32px", letterSpacing: "-0.02em" },
  xl: { fontSize: "48px", letterSpacing: "-0.02em" },
};

const variantColors: Record<WordmarkVariant, string> = {
  color: "#4F46E5",
  white: "#FFFFFF",
  black: "#1F2937",
};

/**
 * ClubOS Wordmark Component
 * 
 * The "ClubOS" text in brand typography
 */
export function ClubOSWordmark({ 
  size = "md", 
  variant = "color",
  className = "" 
}: ClubOSWordmarkProps) {
  const styles = sizeStyles[size];
  const color = variantColors[variant];

  return (
    <span
      className={className}
      style={{
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontWeight: 700,
        fontSize: styles.fontSize,
        letterSpacing: styles.letterSpacing,
        color: color,
        whiteSpace: "nowrap",
      }}
    >
      Club<span style={{ fontWeight: 800 }}>OS</span>
    </span>
  );
}

export default ClubOSWordmark;
