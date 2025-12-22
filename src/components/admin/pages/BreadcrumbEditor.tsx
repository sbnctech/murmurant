/**
 * BreadcrumbEditor - Manual breadcrumb trail editor for pages
 *
 * Features:
 * - Toggle to enable/disable breadcrumbs
 * - List editor with Label (required), Link (optional)
 * - Add/Remove/Move up/down controls
 *
 * Data rules:
 * - Toggle OFF -> breadcrumb = null
 * - Toggle ON + empty -> []
 * - Invalid rows blocked at save (validation in parent form)
 *
 * Charter: N4 (no hidden rules - explicit opt-in, no auto-generation)
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

"use client";

import React from "react";

/** Single breadcrumb item */
export interface BreadcrumbItem {
  label: string;
  link?: string;
}

interface BreadcrumbEditorProps {
  /** null = breadcrumbs disabled, array = enabled */
  value: BreadcrumbItem[] | null;
  /** Called when breadcrumb data changes */
  onChange: (value: BreadcrumbItem[] | null) => void;
  /** Disable editing */
  disabled?: boolean;
}

const styles = {
  container: {
    marginBottom: "16px",
  },
  toggleRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
  },
  toggleLabel: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#374151",
  },
  checkbox: {
    width: "18px",
    height: "18px",
    cursor: "pointer",
  },
  helpText: {
    fontSize: "12px",
    color: "#6b7280",
    marginTop: "4px",
  },
  listContainer: {
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    backgroundColor: "#f9fafb",
    padding: "12px",
  },
  itemRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
    padding: "8px",
    backgroundColor: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "4px",
  },
  itemIndex: {
    fontSize: "12px",
    color: "#9ca3af",
    minWidth: "20px",
    textAlign: "center" as const,
  },
  input: {
    flex: 1,
    padding: "6px 10px",
    fontSize: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    outline: "none",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  labelInput: {
    minWidth: "120px",
    maxWidth: "200px",
  },
  linkInput: {
    minWidth: "150px",
    flex: 2,
  },
  button: {
    padding: "4px 8px",
    fontSize: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    backgroundColor: "#fff",
    cursor: "pointer",
    color: "#374151",
  },
  buttonDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  addButton: {
    marginTop: "8px",
    padding: "8px 12px",
    fontSize: "14px",
    backgroundColor: "#f3f4f6",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    cursor: "pointer",
    color: "#374151",
  },
  emptyState: {
    padding: "16px",
    textAlign: "center" as const,
    color: "#6b7280",
    fontSize: "14px",
  },
  fieldLabel: {
    fontSize: "11px",
    color: "#6b7280",
    marginBottom: "2px",
    display: "block",
  },
  fieldContainer: {
    display: "flex",
    flexDirection: "column" as const,
    flex: 1,
  },
};

export default function BreadcrumbEditor({
  value,
  onChange,
  disabled = false,
}: BreadcrumbEditorProps) {
  const isEnabled = value !== null;
  const items = value ?? [];

  const handleToggle = () => {
    if (isEnabled) {
      // Turning off - set to null
      onChange(null);
    } else {
      // Turning on - set to empty array
      onChange([]);
    }
  };

  const handleAddItem = () => {
    onChange([...items, { label: "", link: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    onChange(newItems);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    onChange(newItems);
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    onChange(newItems);
  };

  const handleItemChange = (index: number, field: "label" | "link", newValue: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: newValue };
    onChange(newItems);
  };

  return (
    <div style={styles.container} data-test-id="breadcrumb-editor">
      {/* Toggle */}
      <div style={styles.toggleRow}>
        <input
          type="checkbox"
          id="breadcrumb-toggle"
          checked={isEnabled}
          onChange={handleToggle}
          disabled={disabled}
          style={styles.checkbox}
          data-test-id="breadcrumb-toggle"
        />
        <label htmlFor="breadcrumb-toggle" style={styles.toggleLabel}>
          Show breadcrumbs on this page
        </label>
      </div>

      {/* List editor (only shown when enabled) */}
      {isEnabled && (
        <div style={styles.listContainer} data-test-id="breadcrumb-list">
          {items.length === 0 ? (
            <div style={styles.emptyState}>
              No breadcrumb items. Add items to create a navigation trail.
            </div>
          ) : (
            items.map((item, index) => (
              <div key={index} style={styles.itemRow} data-test-id={`breadcrumb-item-${index}`}>
                <span style={styles.itemIndex}>{index + 1}</span>

                {/* Label field */}
                <div style={{ ...styles.fieldContainer, ...styles.labelInput }}>
                  <span style={styles.fieldLabel}>Label *</span>
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => handleItemChange(index, "label", e.target.value)}
                    placeholder="Home"
                    disabled={disabled}
                    style={{
                      ...styles.input,
                      ...(item.label.trim() === "" ? styles.inputError : {}),
                    }}
                    data-test-id={`breadcrumb-label-${index}`}
                  />
                </div>

                {/* Link field */}
                <div style={{ ...styles.fieldContainer, ...styles.linkInput }}>
                  <span style={styles.fieldLabel}>Link (optional)</span>
                  <input
                    type="text"
                    value={item.link ?? ""}
                    onChange={(e) => handleItemChange(index, "link", e.target.value)}
                    placeholder="/path or https://..."
                    disabled={disabled}
                    style={styles.input}
                    data-test-id={`breadcrumb-link-${index}`}
                  />
                </div>

                {/* Move up */}
                <button
                  type="button"
                  onClick={() => handleMoveUp(index)}
                  disabled={disabled || index === 0}
                  style={{
                    ...styles.button,
                    ...(index === 0 ? styles.buttonDisabled : {}),
                  }}
                  title="Move up"
                  data-test-id={`breadcrumb-up-${index}`}
                >
                  &uarr;
                </button>

                {/* Move down */}
                <button
                  type="button"
                  onClick={() => handleMoveDown(index)}
                  disabled={disabled || index === items.length - 1}
                  style={{
                    ...styles.button,
                    ...(index === items.length - 1 ? styles.buttonDisabled : {}),
                  }}
                  title="Move down"
                  data-test-id={`breadcrumb-down-${index}`}
                >
                  &darr;
                </button>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  disabled={disabled}
                  style={{ ...styles.button, color: "#dc2626" }}
                  title="Remove"
                  data-test-id={`breadcrumb-remove-${index}`}
                >
                  &times;
                </button>
              </div>
            ))
          )}

          {/* Add button */}
          <button
            type="button"
            onClick={handleAddItem}
            disabled={disabled}
            style={styles.addButton}
            data-test-id="breadcrumb-add"
          >
            + Add breadcrumb item
          </button>

          <p style={styles.helpText}>
            Breadcrumbs appear at the top of the page as a navigation trail.
            The last item is typically the current page (no link needed).
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Validate breadcrumb items before save.
 * Returns error message if invalid, or null if valid.
 */
export function validateBreadcrumbs(value: BreadcrumbItem[] | null): string | null {
  if (value === null) {
    // Disabled is valid
    return null;
  }

  if (value.length === 0) {
    // Enabled but empty is valid
    return null;
  }

  // Check each item has a label
  for (let i = 0; i < value.length; i++) {
    if (!value[i].label || value[i].label.trim() === "") {
      return `Breadcrumb item ${i + 1} is missing a label`;
    }
  }

  return null;
}
