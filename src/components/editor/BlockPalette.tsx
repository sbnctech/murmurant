"use client";

// Copyright (c) Santa Barbara Newcomers Club
// Block palette component for adding new blocks to a page

import { BlockType, BLOCK_METADATA } from "@/lib/publishing/blocks";

type BlockPaletteProps = {
  onAddBlock: (type: BlockType) => void;
  disabled?: boolean;
};

const BLOCK_ICONS: Record<BlockType, string> = {
  hero: "⬜",
  text: "📝",
  image: "🖼️",
  cards: "🃏",
  "event-list": "📅",
  gallery: "🖼️",
  faq: "❓",
  contact: "✉️",
  cta: "👆",
  divider: "➖",
  spacer: "↕️",
};

const CATEGORIES = ["content", "media", "interactive", "layout"] as const;
const CATEGORY_LABELS: Record<string, string> = {
  content: "Content",
  media: "Media",
  interactive: "Interactive",
  layout: "Layout",
};

export default function BlockPalette({ onAddBlock, disabled }: BlockPaletteProps) {
  const blocksByCategory = CATEGORIES.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    blocks: (Object.entries(BLOCK_METADATA) as [BlockType, typeof BLOCK_METADATA[BlockType]][])
      .filter(([, meta]) => meta.category === category),
  }));

  return (
    <div
      data-test-id="block-palette"
      style={{
        backgroundColor: "#f9f9f9",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "16px",
      }}
    >
      <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 600, color: "#333" }}>
        Add Block
      </h3>
      {blocksByCategory.map(({ category, label, blocks }) => (
        <div key={category} style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "11px", color: "#666", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {label}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {blocks.map(([type, meta]) => (
              <button
                key={type}
                data-test-id={`add-block-${type}`}
                onClick={() => onAddBlock(type)}
                disabled={disabled}
                title={meta.description}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 10px",
                  fontSize: "12px",
                  backgroundColor: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  cursor: disabled ? "not-allowed" : "pointer",
                  opacity: disabled ? 0.5 : 1,
                  transition: "all 0.15s ease",
                }}
                onMouseOver={(e) => {
                  if (!disabled) {
                    e.currentTarget.style.backgroundColor = "#f0f0f0";
                    e.currentTarget.style.borderColor = "#bbb";
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "#fff";
                  e.currentTarget.style.borderColor = "#ddd";
                }}
              >
                <span>{BLOCK_ICONS[type]}</span>
                <span>{meta.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
