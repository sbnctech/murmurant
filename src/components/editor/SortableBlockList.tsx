"use client";

// Copyright (c) Santa Barbara Newcomers Club
// Sortable block list with drag-drop reordering

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Block, BLOCK_METADATA } from "@/lib/publishing/blocks";

type SortableBlockListProps = {
  blocks: Block[];
  onReorder: (blocks: Block[]) => void;
  onSelectBlock: (blockId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  selectedBlockId: string | null;
  disabled?: boolean;
};

type SortableBlockItemProps = {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  disabled?: boolean;
};

function SortableBlockItem({ block, isSelected, onSelect, onDelete, disabled }: SortableBlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const meta = BLOCK_METADATA[block.type];
  const blockPreview = getBlockPreview(block);

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-test-id={`block-item-${block.id}`}
      onClick={onSelect}
    >
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          backgroundColor: isSelected ? "#e8f4fc" : "#fff",
          border: isSelected ? "2px solid #0066cc" : "1px solid #ddd",
          borderRadius: "6px",
          marginBottom: "8px",
          overflow: "hidden",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
      >
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            backgroundColor: "#f5f5f5",
            borderRight: "1px solid #eee",
            cursor: disabled ? "not-allowed" : "grab",
            color: "#999",
            fontSize: "14px",
          }}
          title="Drag to reorder"
        >
          ⋮⋮
        </div>

        {/* Block info */}
        <div style={{ flex: 1, padding: "10px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span
              style={{
                fontSize: "11px",
                backgroundColor: "#e0e0e0",
                padding: "2px 6px",
                borderRadius: "3px",
                textTransform: "uppercase",
                fontWeight: 500,
              }}
            >
              {meta.label}
            </span>
          </div>
          <div
            style={{
              fontSize: "13px",
              color: "#666",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "300px",
            }}
          >
            {blockPreview}
          </div>
        </div>

        {/* Delete button */}
        <button
          data-test-id={`delete-block-${block.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={disabled}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            backgroundColor: "transparent",
            border: "none",
            borderLeft: "1px solid #eee",
            cursor: disabled ? "not-allowed" : "pointer",
            color: "#999",
            fontSize: "16px",
            transition: "all 0.15s ease",
          }}
          title="Delete block"
          onMouseOver={(e) => {
            if (!disabled) {
              e.currentTarget.style.backgroundColor = "#fee";
              e.currentTarget.style.color = "#c00";
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "#999";
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

function getBlockPreview(block: Block): string {
  switch (block.type) {
    case "hero":
      return block.data.title || "Untitled hero";
    case "text": {
      // Strip HTML and truncate
      const text = block.data.content.replace(/<[^>]*>/g, "");
      return text.slice(0, 60) + (text.length > 60 ? "..." : "") || "Empty text";
    }
    case "image":
      return block.data.alt || block.data.src || "No image";
    case "cards":
      return `${block.data.cards.length} card(s)`;
    case "event-list":
      return block.data.title || `Showing ${block.data.limit || 5} events`;
    case "gallery":
      return `${block.data.images.length} image(s)`;
    case "faq":
      return block.data.title || `${block.data.items.length} question(s)`;
    case "contact":
      return block.data.title || "Contact form";
    case "cta":
      return block.data.text || "Button";
    case "divider":
      return `${block.data.style || "solid"} line`;
    case "spacer":
      return `${block.data.height || "medium"} space`;
    default:
      return "Block";
  }
}

export default function SortableBlockList({
  blocks,
  onReorder,
  onSelectBlock,
  onDeleteBlock,
  selectedBlockId,
  disabled,
}: SortableBlockListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);

      const newBlocks = arrayMove(blocks, oldIndex, newIndex).map((block, idx) => ({
        ...block,
        order: idx,
      }));

      onReorder(newBlocks);
    }
  }

  if (blocks.length === 0) {
    return (
      <div
        data-test-id="empty-blocks-state"
        style={{
          padding: "40px 20px",
          textAlign: "center",
          color: "#999",
          backgroundColor: "#f9f9f9",
          borderRadius: "8px",
          border: "2px dashed #ddd",
        }}
      >
        <p style={{ margin: 0, fontSize: "14px" }}>No blocks yet. Add a block from the palette above.</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <div data-test-id="sortable-block-list">
          {blocks.map((block) => (
            <SortableBlockItem
              key={block.id}
              block={block}
              isSelected={selectedBlockId === block.id}
              onSelect={() => onSelectBlock(block.id)}
              onDelete={() => onDeleteBlock(block.id)}
              disabled={disabled}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
