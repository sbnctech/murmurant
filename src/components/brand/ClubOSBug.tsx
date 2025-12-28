// Copyright (c) Santa Barbara Newcomers Club
// ClubOS Bug - The "Gathering" symbol only

import React from "react";

type BugSize = 16 | 24 | 32 | 48 | 64;
type BugVariant = "color" | "white" | "black";

interface ClubOSBugProps {
  size?: BugSize;
  variant?: BugVariant;
  className?: string;
}

const sizeMap: Record<BugSize, number> = {
  16: 16,
  24: 24,
  32: 32,
  48: 48,
  64: 64,
};

const variantColors: Record<BugVariant, string> = {
  color: "#4F46E5",
  white: "#FFFFFF",
  black: "#1F2937",
};

/**
 * ClubOS Bug Component
 * 
 * The "Gathering" symbol: 4 curved shapes converging toward center
 * Represents diverse people uniting in community
 */
export function ClubOSBug({ 
  size = 32, 
  variant = "color",
  className = "" 
}: ClubOSBugProps) {
  const pixelSize = sizeMap[size];
  const fillColor = variantColors[variant];

  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ClubOS"
      role="img"
    >
      {/* Top-left curve - converging to center */}
      <path
        d="M8 8 C8 24, 24 32, 32 32 C24 32, 8 24, 8 8"
        fill={fillColor}
        opacity="0.9"
      />
      {/* Top-right curve */}
      <path
        d="M56 8 C56 24, 40 32, 32 32 C40 32, 56 24, 56 8"
        fill={fillColor}
        opacity="0.8"
      />
      {/* Bottom-left curve */}
      <path
        d="M8 56 C8 40, 24 32, 32 32 C24 32, 8 40, 8 56"
        fill={fillColor}
        opacity="0.7"
      />
      {/* Bottom-right curve */}
      <path
        d="M56 56 C56 40, 40 32, 32 32 C40 32, 56 40, 56 56"
        fill={fillColor}
        opacity="0.85"
      />
      {/* Center convergence point */}
      <circle cx="32" cy="32" r="4" fill={fillColor} />
    </svg>
  );
}

export default ClubOSBug;
