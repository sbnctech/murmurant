/**
 * ViewAsControl - UI control for switching view modes
 *
 * Displays a dropdown in the top-right corner to switch between
 * simulated viewer contexts. Only visible when view-as is enabled.
 *
 * Copyright © 2025 Murmurant, Inc.
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { useViewAs } from "./ViewAsContext";
import type { ViewMode } from "@/lib/view-context";
import { getAvailableViewModes } from "@/lib/view-context";

export default function ViewAsControl() {
  const { viewContext, setViewMode, isEnabled } = useViewAs();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isEnabled) {
    return null;
  }

  const viewModes = getAvailableViewModes();

  return (
    <div
      ref={dropdownRef}
      data-test-id="view-as-control"
      style={{
        position: "relative",
        display: "inline-block",
      }}
    >
      {/* Trigger button */}
      <button
        data-test-id="view-as-trigger"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--token-space-xs)",
          padding: "var(--token-space-xs) var(--token-space-sm)",
          backgroundColor: viewContext.isSimulated
            ? "var(--token-color-warning)"
            : "var(--token-color-surface-2)",
          border: "1px solid var(--token-color-border)",
          borderRadius: "var(--token-radius-lg)",
          fontSize: "var(--token-text-sm)",
          color: viewContext.isSimulated
            ? "#000"
            : "var(--token-color-text-muted)",
          cursor: "pointer",
          fontWeight: viewContext.isSimulated ? "600" : "400",
        }}
      >
        <span style={{ fontSize: "12px" }}>
          {viewContext.isSimulated ? "!" : ""}
        </span>
        <span>Viewing as: {viewContext.label}</span>
        <span style={{ fontSize: "10px" }}>{isOpen ? "\u25B2" : "\u25BC"}</span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          data-test-id="view-as-dropdown"
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: "var(--token-space-xs)",
            backgroundColor: "var(--token-color-surface)",
            border: "1px solid var(--token-color-border)",
            borderRadius: "var(--token-radius-lg)",
            boxShadow: "var(--token-shadow-lg)",
            minWidth: "180px",
            zIndex: 1000,
            overflow: "hidden",
          }}
        >
          {viewModes.map((option) => (
            <button
              key={option.value}
              data-test-id={`view-as-option-${option.value}`}
              onClick={() => {
                setViewMode(option.value as ViewMode);
                setIsOpen(false);
              }}
              style={{
                display: "block",
                width: "100%",
                padding: "var(--token-space-sm) var(--token-space-md)",
                backgroundColor:
                  viewContext.mode === option.value
                    ? "var(--token-color-primary)"
                    : "transparent",
                color:
                  viewContext.mode === option.value
                    ? "#fff"
                    : "var(--token-color-text)",
                border: "none",
                textAlign: "left",
                cursor: "pointer",
                fontSize: "var(--token-text-sm)",
              }}
            >
              {option.label}
              {option.value === "actual" && " (default)"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
