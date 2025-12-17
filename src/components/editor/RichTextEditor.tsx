"use client";

// Copyright (c) Santa Barbara Newcomers Club
// Rich text editor component using Tiptap

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";

type RichTextEditorProps = {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Start typing...",
  disabled,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update content when it changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div data-test-id="rich-text-editor">
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px",
          padding: "8px",
          backgroundColor: "#f5f5f5",
          borderRadius: "4px 4px 0 0",
          border: "1px solid #ddd",
          borderBottom: "none",
        }}
      >
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          disabled={disabled}
          title="Bold"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          disabled={disabled}
          title="Italic"
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          disabled={disabled}
          title="Strikethrough"
        >
          <s>S</s>
        </ToolbarButton>
        <div style={{ width: "1px", backgroundColor: "#ddd", margin: "0 4px" }} />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          disabled={disabled}
          title="Heading 2"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          disabled={disabled}
          title="Heading 3"
        >
          H3
        </ToolbarButton>
        <div style={{ width: "1px", backgroundColor: "#ddd", margin: "0 4px" }} />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          disabled={disabled}
          title="Bullet List"
        >
          •
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          disabled={disabled}
          title="Numbered List"
        >
          1.
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          disabled={disabled}
          title="Quote"
        >
          &quot;
        </ToolbarButton>
        <div style={{ width: "1px", backgroundColor: "#ddd", margin: "0 4px" }} />
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={disabled || !editor.can().undo()}
          title="Undo"
        >
          ↩
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={disabled || !editor.can().redo()}
          title="Redo"
        >
          ↪
        </ToolbarButton>
      </div>

      {/* Editor content */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "0 0 4px 4px",
          minHeight: "150px",
          backgroundColor: disabled ? "#f9f9f9" : "#fff",
        }}
      >
        <EditorContent
          editor={editor}
          style={{
            padding: "12px",
          }}
        />
      </div>

      <style>{`
        .tiptap {
          outline: none;
          min-height: 120px;
        }
        .tiptap p {
          margin: 0 0 0.75em 0;
        }
        .tiptap p:last-child {
          margin-bottom: 0;
        }
        .tiptap h2, .tiptap h3, .tiptap h4 {
          margin: 1em 0 0.5em 0;
        }
        .tiptap h2:first-child, .tiptap h3:first-child, .tiptap h4:first-child {
          margin-top: 0;
        }
        .tiptap ul, .tiptap ol {
          margin: 0 0 0.75em 0;
          padding-left: 1.5em;
        }
        .tiptap blockquote {
          border-left: 3px solid #ddd;
          margin: 0 0 0.75em 0;
          padding-left: 1em;
          color: #666;
        }
        .tiptap p.is-editor-empty:first-child::before {
          color: #aaa;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

type ToolbarButtonProps = {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
};

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        padding: "4px 8px",
        fontSize: "12px",
        fontWeight: 500,
        backgroundColor: active ? "#0066cc" : "#fff",
        color: active ? "#fff" : "#333",
        border: "1px solid #ddd",
        borderRadius: "3px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        minWidth: "28px",
      }}
    >
      {children}
    </button>
  );
}
