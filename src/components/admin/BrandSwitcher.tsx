"use client";

/**
 * Brand Switcher Component
 *
 * Dropdown for switching between available brands (for demo/testing purposes).
 * Brands represent per-club customization including identity, voice, and chatbot.
 *
 * Charter: P6 (human-first UI)
 */

import { useState, useRef, useEffect } from "react";

const BRANDS = [
  {
    id: "sbnc",
    name: "Santa Barbara Newcomers",
    shortName: "SBNC",
    description: "Coastal, welcoming community club",
    colors: { primary: "#1E40AF", secondary: "#059669" },
  },
  {
    id: "demo",
    name: "Demo Club",
    shortName: "Demo",
    description: "Default demonstration brand",
    colors: { primary: "#6366F1", secondary: "#8B5CF6" },
  },
] as const;

type BrandId = (typeof BRANDS)[number]["id"];

interface BrandSwitcherProps {
  currentBrand: string;
  onBrandChange: (brandId: string) => void;
  mode?: "compact" | "full";
}

function BrandPreviewBadge({ colors, shortName }: { colors: { primary: string; secondary: string }; shortName: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "28px",
        height: "28px",
        borderRadius: "6px",
        backgroundColor: colors.primary,
        color: "white",
        fontSize: "10px",
        fontWeight: 600,
        letterSpacing: "-0.02em",
      }}
    >
      {shortName.slice(0, 2)}
    </div>
  );
}

export function BrandSwitcher({ currentBrand, onBrandChange, mode = "compact" }: BrandSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentBrandData = BRANDS.find((b) => b.id === currentBrand) || BRANDS[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = (brandId: BrandId) => {
    onBrandChange(brandId);
    setIsOpen(false);
  };

  if (mode === "full") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--gray-700, #374151)" }}>Brand</label>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          {BRANDS.map((brand) => (
            <button
              key={brand.id}
              onClick={() => onBrandChange(brand.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                padding: "16px",
                border: currentBrand === brand.id ? "2px solid var(--blue-600, #2563EB)" : "2px solid var(--gray-200, #E5E7EB)",
                borderRadius: "8px",
                backgroundColor: currentBrand === brand.id ? "var(--blue-50, #EFF6FF)" : "white",
                cursor: "pointer",
                minWidth: "160px",
                transition: "all 0.15s ease",
              }}
            >
              <BrandPreviewBadge colors={brand.colors} shortName={brand.shortName} />
              <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--gray-900, #111827)" }}>{brand.shortName}</span>
              <span style={{ fontSize: "12px", color: "var(--gray-500, #6B7280)", textAlign: "center" }}>{brand.description}</span>
              {currentBrand === brand.id && <span style={{ fontSize: "11px", color: "var(--blue-600, #2563EB)", fontWeight: 500 }}>Active</span>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 12px",
          border: "1px solid var(--gray-300, #D1D5DB)",
          borderRadius: "6px",
          backgroundColor: "white",
          fontSize: "13px",
          color: "var(--gray-700, #374151)",
          cursor: "pointer",
          transition: "border-color 0.15s ease",
        }}
      >
        <BrandPreviewBadge colors={currentBrandData.colors} shortName={currentBrandData.shortName} />
        <span>{currentBrandData.shortName}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.15s ease" }}>
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {isOpen && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: "4px",
            minWidth: "240px",
            backgroundColor: "white",
            border: "1px solid var(--gray-200, #E5E7EB)",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            zIndex: 50,
            overflow: "hidden",
          }}
        >
          {BRANDS.map((brand) => (
            <button
              key={brand.id}
              role="option"
              aria-selected={currentBrand === brand.id}
              onClick={() => handleSelect(brand.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                width: "100%",
                padding: "10px 12px",
                border: "none",
                backgroundColor: currentBrand === brand.id ? "var(--blue-50, #EFF6FF)" : "transparent",
                cursor: "pointer",
                textAlign: "left",
                transition: "background-color 0.1s ease",
              }}
            >
              <BrandPreviewBadge colors={brand.colors} shortName={brand.shortName} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--gray-900, #111827)" }}>{brand.name}</div>
                <div style={{ fontSize: "11px", color: "var(--gray-500, #6B7280)" }}>{brand.description}</div>
              </div>
              {currentBrand === brand.id && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="var(--blue-600, #2563EB)">
                  <path d="M11.7 3.3a1 1 0 0 1 0 1.4l-5.5 5.5a1 1 0 0 1-1.4 0L2.3 7.7a1 1 0 1 1 1.4-1.4L5.5 8.1l4.8-4.8a1 1 0 0 1 1.4 0z" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
