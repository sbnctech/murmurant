// Copyright (c) Murmurant, Inc.
// Starling chat widget - floating button + drawer

"use client";

import React, { useState, useRef, useEffect } from "react";
import { useStarling } from "@/lib/starling";
import { ChatDrawer } from "./ChatDrawer";
import { StarlingButton } from "./StarlingButton";

interface ChatWidgetProps {
  /** Position of the floating button */
  position?: "bottom-right" | "bottom-left";
}

/**
 * Starling floating chat widget
 *
 * Renders a floating button that opens a chat drawer.
 * Place this in your root layout to make Starling available everywhere.
 *
 * @example
 * ```tsx
 * // In your layout.tsx
 * <StarlingProvider userId={user?.id}>
 *   {children}
 *   <ChatWidget />
 * </StarlingProvider>
 * ```
 */
export function ChatWidget({ position = "bottom-right" }: ChatWidgetProps) {
  const { isEnabled, isOpen, setIsOpen, isLoading } = useStarling();

  // Don't render if Starling is not enabled
  if (!isEnabled) {
    return null;
  }

  const positionClasses =
    position === "bottom-right" ? "right-4 bottom-4" : "left-4 bottom-4";

  return (
    <>
      {/* Floating button */}
      <div className={`fixed ${positionClasses} z-50`}>
        <StarlingButton
          onClick={() => setIsOpen(!isOpen)}
          isOpen={isOpen}
          isLoading={isLoading}
        />
      </div>

      {/* Chat drawer */}
      <ChatDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        position={position}
      />
    </>
  );
}

export default ChatWidget;
