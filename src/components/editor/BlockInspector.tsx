"use client";

// Copyright (c) Santa Barbara Newcomers Club
// Block inspector panel for editing block properties

import { useState, useEffect, useCallback, useRef } from "react";
import { BLOCK_METADATA, type Block } from "@/lib/publishing/blocks";

type BlockInspectorProps = {
  block: Block | null;
  onUpdate: (blockId: string, data: Record<string, unknown>) => void;
  isSaving?: boolean;
};

// Wrapper component that remounts when block changes
function BlockInspectorContent({
  block,
  onUpdate,
  isSaving,
}: {
  block: Block;
  onUpdate: (blockId: string, data: Record<string, unknown>) => void;
  isSaving?: boolean;
}) {
  // Initialize state from block data on mount
  const [localData, setLocalData] = useState<Record<string, unknown>>(
    block.data as Record<string, unknown>
  );
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>(JSON.stringify(block.data));

  // Debounced save
  useEffect(() => {
    const currentData = JSON.stringify(localData);
    if (currentData !== lastSavedRef.current) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        onUpdate(block.id, localData);
        lastSavedRef.current = currentData;
      }, 500);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [localData, block.id, onUpdate]);

  const handleChange = useCallback((key: string, value: unknown) => {
    setLocalData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const meta = BLOCK_METADATA[block.type];

  return (
    <div className="p-4" data-testid="block-inspector">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{meta.label}</h3>
        {isSaving && (
          <span className="text-xs text-gray-500" data-testid="save-status">
            Saving...
          </span>
        )}
      </div>

      <div className="space-y-4">
        {renderBlockFields(block.type, localData, handleChange)}
      </div>
    </div>
  );
}

export default function BlockInspector({ block, onUpdate, isSaving }: BlockInspectorProps) {
  if (!block) {
    return (
      <div className="p-4 text-center text-gray-500" data-testid="inspector-empty">
        <p className="text-sm">Select a block to edit its properties</p>
      </div>
    );
  }

  // Use key to remount when block changes, avoiding setState-in-effect
  return (
    <BlockInspectorContent
      key={block.id}
      block={block}
      onUpdate={onUpdate}
      isSaving={isSaving}
    />
  );
}

function renderBlockFields(
  type: Block["type"],
  data: Record<string, unknown>,
  onChange: (key: string, value: unknown) => void
) {
  switch (type) {
    case "hero":
      return (
        <>
          <TextField
            label="Title"
            value={(data.title as string) || ""}
            onChange={(v) => onChange("title", v)}
            required
          />
          <TextField
            label="Subtitle"
            value={(data.subtitle as string) || ""}
            onChange={(v) => onChange("subtitle", v)}
          />
          <TextField
            label="Background Image URL"
            value={(data.backgroundImage as string) || ""}
            onChange={(v) => onChange("backgroundImage", v)}
            placeholder="https://..."
          />
          <SelectField
            label="Text Alignment"
            value={(data.alignment as string) || "center"}
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ]}
            onChange={(v) => onChange("alignment", v)}
          />
          <TextField
            label="CTA Button Text"
            value={(data.ctaText as string) || ""}
            onChange={(v) => onChange("ctaText", v)}
          />
          <TextField
            label="CTA Button Link"
            value={(data.ctaLink as string) || ""}
            onChange={(v) => onChange("ctaLink", v)}
            placeholder="/path or https://..."
          />
        </>
      );

    case "text":
      return (
        <>
          <TextAreaField
            label="Content (HTML)"
            value={(data.content as string) || ""}
            onChange={(v) => onChange("content", v)}
            rows={6}
          />
          <SelectField
            label="Alignment"
            value={(data.alignment as string) || "left"}
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ]}
            onChange={(v) => onChange("alignment", v)}
          />
        </>
      );

    case "image":
      return (
        <>
          <TextField
            label="Image URL"
            value={(data.src as string) || ""}
            onChange={(v) => onChange("src", v)}
            required
            placeholder="https://..."
          />
          <TextField
            label="Alt Text"
            value={(data.alt as string) || ""}
            onChange={(v) => onChange("alt", v)}
            required
            placeholder="Describe the image for accessibility"
          />
          <TextField
            label="Caption"
            value={(data.caption as string) || ""}
            onChange={(v) => onChange("caption", v)}
          />
          <TextField
            label="Link URL"
            value={(data.linkUrl as string) || ""}
            onChange={(v) => onChange("linkUrl", v)}
            placeholder="/path or https://..."
          />
          <SelectField
            label="Alignment"
            value={(data.alignment as string) || "center"}
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ]}
            onChange={(v) => onChange("alignment", v)}
          />
        </>
      );

    case "cta":
      return (
        <>
          <TextField
            label="Button Text"
            value={(data.text as string) || ""}
            onChange={(v) => onChange("text", v)}
            required
          />
          <TextField
            label="Link URL"
            value={(data.link as string) || ""}
            onChange={(v) => onChange("link", v)}
            required
            placeholder="/path or https://..."
          />
          <SelectField
            label="Style"
            value={(data.style as string) || "primary"}
            options={[
              { value: "primary", label: "Primary" },
              { value: "secondary", label: "Secondary" },
              { value: "outline", label: "Outline" },
            ]}
            onChange={(v) => onChange("style", v)}
          />
          <SelectField
            label="Size"
            value={(data.size as string) || "medium"}
            options={[
              { value: "small", label: "Small" },
              { value: "medium", label: "Medium" },
              { value: "large", label: "Large" },
            ]}
            onChange={(v) => onChange("size", v)}
          />
          <SelectField
            label="Alignment"
            value={(data.alignment as string) || "center"}
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ]}
            onChange={(v) => onChange("alignment", v)}
          />
        </>
      );

    case "divider":
      return (
        <>
          <SelectField
            label="Style"
            value={(data.style as string) || "solid"}
            options={[
              { value: "solid", label: "Solid" },
              { value: "dashed", label: "Dashed" },
              { value: "dotted", label: "Dotted" },
            ]}
            onChange={(v) => onChange("style", v)}
          />
          <SelectField
            label="Width"
            value={(data.width as string) || "full"}
            options={[
              { value: "full", label: "Full" },
              { value: "half", label: "Half" },
              { value: "quarter", label: "Quarter" },
            ]}
            onChange={(v) => onChange("width", v)}
          />
        </>
      );

    case "spacer":
      return (
        <SelectField
          label="Height"
          value={(data.height as string) || "medium"}
          options={[
            { value: "small", label: "Small (24px)" },
            { value: "medium", label: "Medium (48px)" },
            { value: "large", label: "Large (96px)" },
          ]}
          onChange={(v) => onChange("height", v)}
        />
      );

    default:
      return (
        <p className="text-sm text-gray-500">
          Editing not yet supported for this block type.
        </p>
      );
  }
}

// Field components
type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
};

function TextField({ label, value, onChange, placeholder, required }: TextFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
        data-testid={`field-${label.toLowerCase().replace(/\s+/g, "-")}`}
      />
    </div>
  );
}

type TextAreaFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
};

function TextAreaField({ label, value, onChange, rows = 4 }: TextAreaFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 font-mono"
        data-testid={`field-${label.toLowerCase().replace(/\s+/g, "-")}`}
      />
    </div>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
};

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
        data-testid={`field-${label.toLowerCase().replace(/\s+/g, "-")}`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
