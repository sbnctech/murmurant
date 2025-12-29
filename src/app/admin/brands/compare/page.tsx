"use client";

import React, { useState } from "react";

type Brand = {
  id: string;
  name: string;
  logo: string;
  bug: string;
  colors: { primary: string; primaryHover: string; secondary: string; accent: string };
  fonts: { heading: string; body: string };
  voice: { tone: string; greeting: string };
  chatbot: { name: string; personality: string };
};

const brands: Record<string, Brand> = {
  murmurant: {
    id: "murmurant",
    name: "Murmurant Default",
    logo: "/brand/murmurant-logo.svg",
    bug: "/brand/murmurant-bug.svg",
    colors: { primary: "#4F46E5", primaryHover: "#4338CA", secondary: "#8B5CF6", accent: "#F59E0B" },
    fonts: { heading: "system-ui, sans-serif", body: "system-ui, sans-serif" },
    voice: { tone: "friendly", greeting: "Welcome to Murmurant!" },
    chatbot: { name: "Claude", personality: "Helpful and knowledgeable assistant." },
  },
  sbnc: {
    id: "sbnc",
    name: "Santa Barbara Newcomers",
    logo: "/brands/sbnc/logo.svg",
    bug: "/brands/sbnc/bug.svg",
    colors: { primary: "#1E40AF", primaryHover: "#1E3A8A", secondary: "#60A5FA", accent: "#F97316" },
    fonts: { heading: "Georgia, serif", body: "system-ui, sans-serif" },
    voice: { tone: "warm", greeting: "Welcome to the Santa Barbara Newcomers Club!" },
    chatbot: { name: "Sandy", personality: "Warm, welcoming, knows Santa Barbara well." },
  },
  "garden-club": {
    id: "garden-club",
    name: "Sunrise Garden Society",
    logo: "/brands/garden-club/logo.svg",
    bug: "/brands/garden-club/bug.svg",
    colors: { primary: "#16A34A", primaryHover: "#15803D", secondary: "#A855F7", accent: "#FBBF24" },
    fonts: { heading: "Playfair Display, serif", body: "Lato, sans-serif" },
    voice: { tone: "formal", greeting: "Welcome, fellow gardener!" },
    chatbot: { name: "Rose", personality: "Knowledgeable about plants, gentle and nurturing." },
  },
};

function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "6px",
          backgroundColor: color,
          border: "1px solid #e5e7eb",
        }}
      />
      <div>
        <div style={{ fontSize: "12px", color: "#6b7280" }}>{label}</div>
        <div style={{ fontSize: "13px", fontFamily: "monospace" }}>{color}</div>
      </div>
    </div>
  );
}

function BrandColumn({ brand, otherBrand }: { brand: Brand; otherBrand: Brand }) {
  const isDifferent = (a: string, b: string) => a !== b;

  return (
    <div style={{ flex: 1, padding: "20px", backgroundColor: "white", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
      {/* Logo & Bug */}
      <div style={{ marginBottom: "24px", textAlign: "center" }}>
        <img src={brand.logo} alt={brand.name} style={{ height: "60px", marginBottom: "12px" }} />
        <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
          <img src={brand.bug} alt="Bug" style={{ width: "32px", height: "32px" }} />
        </div>
      </div>

      {/* Colors */}
      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", color: "#374151" }}>Colors</h3>
        <ColorSwatch color={brand.colors.primary} label="Primary" />
        <ColorSwatch color={brand.colors.primaryHover} label="Primary Hover" />
        <ColorSwatch color={brand.colors.secondary} label="Secondary" />
        <ColorSwatch color={brand.colors.accent} label="Accent" />
      </div>

      {/* Typography */}
      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", color: "#374151" }}>Typography</h3>
        <div style={{ marginBottom: "8px" }}>
          <div style={{ fontSize: "12px", color: "#6b7280" }}>Heading</div>
          <div style={{ fontFamily: brand.fonts.heading, fontSize: "18px", fontWeight: 600 }}>Sample Heading</div>
        </div>
        <div>
          <div style={{ fontSize: "12px", color: "#6b7280" }}>Body</div>
          <div style={{ fontFamily: brand.fonts.body, fontSize: "14px" }}>Sample body text for comparison.</div>
        </div>
      </div>

      {/* Voice */}
      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", color: "#374151" }}>Voice</h3>
        <div style={{ marginBottom: "8px" }}>
          <span style={{ fontSize: "12px", color: "#6b7280" }}>Tone: </span>
          <span
            style={{
              fontSize: "13px",
              padding: "2px 8px",
              borderRadius: "12px",
              backgroundColor: isDifferent(brand.voice.tone, otherBrand.voice.tone) ? "#fef3c7" : "#f3f4f6",
            }}
          >
            {brand.voice.tone}
          </span>
        </div>
        <div>
          <div style={{ fontSize: "12px", color: "#6b7280" }}>Greeting</div>
          <div
            style={{
              fontSize: "14px",
              fontStyle: "italic",
              padding: "8px",
              backgroundColor: isDifferent(brand.voice.greeting, otherBrand.voice.greeting) ? "#fef3c7" : "#f9fafb",
              borderRadius: "6px",
            }}
          >
            &quot;{brand.voice.greeting}&quot;
          </div>
        </div>
      </div>

      {/* Chatbot */}
      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", color: "#374151" }}>Chatbot</h3>
        <div style={{ marginBottom: "8px" }}>
          <span style={{ fontSize: "12px", color: "#6b7280" }}>Name: </span>
          <span style={{ fontSize: "14px", fontWeight: 500 }}>{brand.chatbot.name}</span>
        </div>
        <div style={{ fontSize: "13px", color: "#4b5563" }}>{brand.chatbot.personality}</div>
      </div>

      {/* Sample Button */}
      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", color: "#374151" }}>Sample Button</h3>
        <button
          type="button"
          style={{
            padding: "10px 20px",
            backgroundColor: brand.colors.primary,
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Join Now
        </button>
      </div>

      {/* Apply Button */}
      <button
        type="button"
        onClick={() => alert(`Demo: Would apply "${brand.name}" brand to club`)}
        style={{
          width: "100%",
          padding: "12px",
          backgroundColor: "#f3f4f6",
          color: "#374151",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        Apply to Club
      </button>
    </div>
  );
}

export default function BrandComparisonPage() {
  const [leftBrand, setLeftBrand] = useState<string>("murmurant");
  const [rightBrand, setRightBrand] = useState<string>("sbnc");

  const brandOptions = Object.values(brands);

  return (
    <div data-test-id="brand-comparison-page" style={{ maxWidth: "1200px" }}>
      <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px", color: "#1f2937" }}>
        Brand Comparison
      </h1>
      <p style={{ fontSize: "16px", color: "#6b7280", marginBottom: "24px" }}>
        Compare brand configurations side-by-side
      </p>

      {/* Brand Selectors */}
      <div style={{ display: "flex", gap: "24px", marginBottom: "24px" }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "8px", display: "block" }}>
            Left Brand
          </label>
          <select
            value={leftBrand}
            onChange={(e) => setLeftBrand(e.target.value)}
            style={{ width: "100%", padding: "10px", fontSize: "14px", borderRadius: "8px", border: "1px solid #d1d5db" }}
          >
            {brandOptions.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "8px", display: "block" }}>
            Right Brand
          </label>
          <select
            value={rightBrand}
            onChange={(e) => setRightBrand(e.target.value)}
            style={{ width: "100%", padding: "10px", fontSize: "14px", borderRadius: "8px", border: "1px solid #d1d5db" }}
          >
            {brandOptions.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Columns */}
      <div style={{ display: "flex", gap: "24px" }}>
        <BrandColumn brand={brands[leftBrand]} otherBrand={brands[rightBrand]} />
        <BrandColumn brand={brands[rightBrand]} otherBrand={brands[leftBrand]} />
      </div>
    </div>
  );
}
