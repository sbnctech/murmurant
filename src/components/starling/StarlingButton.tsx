// Copyright (c) Murmurant, Inc.
// Starling floating button with murmuration animation

"use client";

import React from "react";

interface StarlingButtonProps {
  onClick: () => void;
  isOpen: boolean;
  isLoading: boolean;
}

/**
 * Animated Starling button with murmuration pattern
 */
export function StarlingButton({
  onClick,
  isOpen,
  isLoading,
}: StarlingButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative w-14 h-14 rounded-full
        bg-[#1a365d] hover:bg-[#1e40af]
        shadow-lg hover:shadow-xl
        transition-all duration-300
        flex items-center justify-center
        focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:ring-offset-2
        ${isOpen ? "rotate-0" : ""}
      `}
      aria-label={isOpen ? "Close Starling" : "Open Starling assistant"}
      title="Starling - Murmurant Assistant"
    >
      {isOpen ? (
        // Close icon when open
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ) : (
        // Murmuration pattern when closed
        <MurmurationIcon isLoading={isLoading} />
      )}
    </button>
  );
}

/**
 * Animated murmuration icon
 */
function MurmurationIcon({ isLoading }: { isLoading: boolean }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      className={isLoading ? "animate-pulse" : ""}
    >
      {/* Flowing dot pattern representing murmuration */}
      <g className={isLoading ? "" : "starling-dots"}>
        {/* Row 1 */}
        <circle cx="6" cy="8" r="2" fill="white" opacity="0.9">
          <animate
            attributeName="cy"
            values="8;7;8"
            dur="2s"
            repeatCount="indefinite"
            begin="0s"
          />
        </circle>
        <circle cx="11" cy="6" r="1.5" fill="white" opacity="0.7">
          <animate
            attributeName="cy"
            values="6;5;6"
            dur="2s"
            repeatCount="indefinite"
            begin="0.2s"
          />
        </circle>
        <circle cx="16" cy="7" r="2" fill="white" opacity="0.85">
          <animate
            attributeName="cy"
            values="7;6;7"
            dur="2s"
            repeatCount="indefinite"
            begin="0.4s"
          />
        </circle>
        <circle cx="22" cy="9" r="1.5" fill="white" opacity="0.6">
          <animate
            attributeName="cy"
            values="9;8;9"
            dur="2s"
            repeatCount="indefinite"
            begin="0.6s"
          />
        </circle>

        {/* Row 2 */}
        <circle cx="4" cy="14" r="1.5" fill="white" opacity="0.6">
          <animate
            attributeName="cx"
            values="4;5;4"
            dur="2.5s"
            repeatCount="indefinite"
            begin="0.3s"
          />
        </circle>
        <circle cx="9" cy="13" r="2.5" fill="white" opacity="1">
          <animate
            attributeName="cy"
            values="13;12;13"
            dur="2s"
            repeatCount="indefinite"
            begin="0.1s"
          />
        </circle>
        <circle cx="15" cy="14" r="2" fill="white" opacity="0.8">
          <animate
            attributeName="cy"
            values="14;13;14"
            dur="2s"
            repeatCount="indefinite"
            begin="0.5s"
          />
        </circle>
        <circle cx="20" cy="12" r="1.5" fill="white" opacity="0.7">
          <animate
            attributeName="cy"
            values="12;11;12"
            dur="2s"
            repeatCount="indefinite"
            begin="0.7s"
          />
        </circle>
        <circle cx="25" cy="15" r="1" fill="white" opacity="0.5">
          <animate
            attributeName="cy"
            values="15;14;15"
            dur="2s"
            repeatCount="indefinite"
            begin="0.9s"
          />
        </circle>

        {/* Row 3 */}
        <circle cx="7" cy="20" r="1.5" fill="white" opacity="0.7">
          <animate
            attributeName="cy"
            values="20;21;20"
            dur="2s"
            repeatCount="indefinite"
            begin="0.4s"
          />
        </circle>
        <circle cx="13" cy="21" r="2" fill="white" opacity="0.85">
          <animate
            attributeName="cy"
            values="21;22;21"
            dur="2s"
            repeatCount="indefinite"
            begin="0.2s"
          />
        </circle>
        <circle cx="19" cy="19" r="1.5" fill="white" opacity="0.6">
          <animate
            attributeName="cy"
            values="19;20;19"
            dur="2s"
            repeatCount="indefinite"
            begin="0.6s"
          />
        </circle>
        <circle cx="24" cy="21" r="1" fill="white" opacity="0.5">
          <animate
            attributeName="cy"
            values="21;22;21"
            dur="2s"
            repeatCount="indefinite"
            begin="0.8s"
          />
        </circle>
      </g>
    </svg>
  );
}

export default StarlingButton;
