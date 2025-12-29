// Copyright (c) Murmurant, Inc.
// Drag-and-drop sortable block list component
// A2: DnD ordering with accessibility and keyboard fallback

"use client";

import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  UniqueIdentifier,
  DraggableAttributes,
} from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Block, BlockType } from "@/lib/publishing/blocks";
import { BLOCK_METADATA } from "@/lib/publishing/blocks";

type SortableBlockListProps = {
  blocks: Block[];
  onReorder: (newBlocks: Block[]) => void;
  disabled?: boolean;
  renderBlock: (
    block: Block,
    index: number,
    dragHandleProps: DragHandleProps
  ) => React.ReactNode;
};

export type DragHandleProps = {
  attributes: DraggableAttributes;
  listeners: SyntheticListenerMap | undefined;
  isDragging: boolean;
};

/**
 * Sortable block list with drag-and-drop support
 * Integrates with @dnd-kit for accessible drag-and-drop
 */
export function SortableBlockList({
  blocks,
  onReorder,
  disabled = false,
  renderBlock,
}: SortableBlockListProps) {
  const [activeId, setActiveId] = React.useState<UniqueIdentifier | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before starting drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(blocks, oldIndex, newIndex).map((b, i) => ({
          ...b,
          order: i,
        }));
        onReorder(reordered);
      }
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeBlock = activeId
    ? blocks.find((b) => b.id === activeId)
    : null;

  if (blocks.length === 0) {
    return (
      <p
        data-test-id="page-editor-empty"
        style={{ color: "#666", fontStyle: "italic" }}
      >
        No blocks yet. Add a block to get started.
      </p>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={blocks.map((b) => b.id)}
        strategy={verticalListSortingStrategy}
        disabled={disabled}
      >
        <ul
          data-test-id="page-editor-block-list"
          style={{ listStyle: "none", margin: 0, padding: 0 }}
          role="listbox"
          aria-label="Page blocks"
        >
          {blocks.map((block, index) => (
            <SortableBlockItem
              key={block.id}
              block={block}
              index={index}
              disabled={disabled}
              renderBlock={renderBlock}
            />
          ))}
        </ul>
      </SortableContext>

      {/* Drag overlay for visual feedback */}
      <DragOverlay>
        {activeBlock ? (
          <DragOverlayBlock block={activeBlock} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

type SortableBlockItemProps = {
  block: Block;
  index: number;
  disabled: boolean;
  renderBlock: (
    block: Block,
    index: number,
    dragHandleProps: DragHandleProps
  ) => React.ReactNode;
};

function SortableBlockItem({
  block,
  index,
  disabled,
  renderBlock,
}: SortableBlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
    position: "relative" as const,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      data-test-id="page-editor-block-item"
      data-block-id={block.id}
      data-block-type={block.type}
      role="option"
      aria-selected={isDragging}
      aria-describedby={`block-${block.id}-instructions`}
    >
      <span id={`block-${block.id}-instructions`} className="sr-only">
        Press space to pick up, use arrow keys to reorder, press space to drop
      </span>
      {renderBlock(block, index, {
        attributes,
        listeners,
        isDragging,
      })}
    </li>
  );
}

/**
 * Drag handle component for use within block items
 */
export function DragHandle({
  attributes,
  listeners,
  disabled,
}: {
  attributes: DraggableAttributes;
  listeners: SyntheticListenerMap | undefined;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      data-test-id="block-drag-handle"
      {...attributes}
      {...listeners}
      disabled={disabled}
      aria-label="Drag to reorder"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "24px",
        height: "40px",
        cursor: disabled ? "not-allowed" : "grab",
        opacity: disabled ? 0.4 : 1,
        border: "none",
        backgroundColor: "transparent",
        color: "#666",
        padding: 0,
        touchAction: "none",
      }}
    >
      {/* Grip icon (6 dots) */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
      >
        <circle cx="5" cy="3" r="1.5" />
        <circle cx="11" cy="3" r="1.5" />
        <circle cx="5" cy="8" r="1.5" />
        <circle cx="11" cy="8" r="1.5" />
        <circle cx="5" cy="13" r="1.5" />
        <circle cx="11" cy="13" r="1.5" />
      </svg>
    </button>
  );
}

/**
 * Block preview shown during drag
 */
function DragOverlayBlock({ block }: { block: Block }) {
  const meta = BLOCK_METADATA[block.type];

  return (
    <div
      style={{
        backgroundColor: "#fff",
        border: "2px solid #0066cc",
        borderRadius: "4px",
        padding: "12px 16px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        cursor: "grabbing",
      }}
    >
      <div
        style={{
          width: "16px",
          height: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#666",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="5" cy="3" r="1.5" />
          <circle cx="11" cy="3" r="1.5" />
          <circle cx="5" cy="8" r="1.5" />
          <circle cx="11" cy="8" r="1.5" />
          <circle cx="5" cy="13" r="1.5" />
          <circle cx="11" cy="13" r="1.5" />
        </svg>
      </div>
      <div>
        <div style={{ fontWeight: 500, fontSize: "14px" }}>
          {meta?.label || block.type}
        </div>
        <div style={{ fontSize: "12px", color: "#666" }}>
          {meta?.description || `Block type: ${block.type}`}
        </div>
      </div>
    </div>
  );
}

export default SortableBlockList;
