"use client";

// Copyright (c) Santa Barbara Newcomers Club
// Block palette for adding new blocks to the page

import { BLOCK_METADATA, type BlockType } from "@/lib/publishing/blocks";

// v1 supported block types (as specified in PAGE_EDITOR_V1.md)
const V1_BLOCK_TYPES: BlockType[] = [
  "text",
  "image",
  "hero",
  "cta",
  "divider",
  "spacer",
];

type BlockPaletteProps = {
  onAddBlock: (type: BlockType) => void;
  disabled?: boolean;
};

// Simple icon components
const icons: Record<string, React.ReactNode> = {
  type: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7V4h16v3M9 20h6M12 4v16" />
    </svg>
  ),
  image: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  ),
  "mouse-pointer": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      <path d="M13 13l6 6" />
    </svg>
  ),
  minus: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  "move-vertical": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="8 18 12 22 16 18" />
      <polyline points="8 6 12 2 16 6" />
      <line x1="12" y1="2" x2="12" y2="22" />
    </svg>
  ),
};

function getIcon(iconName: string): React.ReactNode {
  return icons[iconName] || icons.type;
}

export default function BlockPalette({ onAddBlock, disabled }: BlockPaletteProps) {
  const categories = {
    content: V1_BLOCK_TYPES.filter(
      (t) => BLOCK_METADATA[t].category === "content"
    ),
    media: V1_BLOCK_TYPES.filter(
      (t) => BLOCK_METADATA[t].category === "media"
    ),
    interactive: V1_BLOCK_TYPES.filter(
      (t) => BLOCK_METADATA[t].category === "interactive"
    ),
    layout: V1_BLOCK_TYPES.filter(
      (t) => BLOCK_METADATA[t].category === "layout"
    ),
  };

  const categoryLabels: Record<string, string> = {
    content: "Content",
    media: "Media",
    interactive: "Interactive",
    layout: "Layout",
  };

  return (
    <div className="p-4" data-testid="block-palette">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Block</h3>

      {Object.entries(categories).map(
        ([category, blockTypes]) =>
          blockTypes.length > 0 && (
            <div key={category} className="mb-4">
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                {categoryLabels[category]}
              </h4>
              <div className="space-y-1">
                {blockTypes.map((type) => {
                  const meta = BLOCK_METADATA[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => onAddBlock(type)}
                      disabled={disabled}
                      className={`
                        w-full flex items-center p-2 rounded-md text-left
                        ${disabled
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-gray-100 cursor-pointer"
                        }
                      `}
                      data-testid={`add-block-${type}`}
                    >
                      <span className="text-gray-500 mr-3">
                        {getIcon(meta.icon)}
                      </span>
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {meta.label}
                        </span>
                        <p className="text-xs text-gray-500">
                          {meta.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )
      )}
    </div>
  );
}
