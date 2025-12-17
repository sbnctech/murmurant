"use client";

// Copyright (c) Santa Barbara Newcomers Club
// Block editor components for each block type

import { Block, HeroBlock, TextBlock, ImageBlock, CardsBlock, EventListBlock, GalleryBlock, FaqBlock, ContactBlock, CtaBlock, DividerBlock, SpacerBlock } from "@/lib/publishing/blocks";
import RichTextEditor from "./RichTextEditor";

type BlockEditorProps<T extends Block> = {
  block: T;
  onChange: (block: T) => void;
  disabled?: boolean;
};

// Form field component
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <label style={{ display: "block", fontSize: "12px", fontWeight: 500, marginBottom: "4px", color: "#555" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// Input styles
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  fontSize: "14px",
  border: "1px solid #ddd",
  borderRadius: "4px",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  backgroundColor: "#fff",
};

// Hero Block Editor
export function HeroBlockEditor({ block, onChange, disabled }: BlockEditorProps<HeroBlock>) {
  const updateData = (updates: Partial<HeroBlock["data"]>) => {
    onChange({ ...block, data: { ...block.data, ...updates } });
  };

  return (
    <div data-test-id="hero-block-editor">
      <Field label="Title">
        <input type="text" value={block.data.title} onChange={(e) => updateData({ title: e.target.value })} disabled={disabled} style={inputStyle} data-test-id="hero-title-input" />
      </Field>
      <Field label="Subtitle">
        <input type="text" value={block.data.subtitle || ""} onChange={(e) => updateData({ subtitle: e.target.value || undefined })} disabled={disabled} style={inputStyle} placeholder="Optional subtitle" />
      </Field>
      <Field label="Background Image URL">
        <input type="text" value={block.data.backgroundImage || ""} onChange={(e) => updateData({ backgroundImage: e.target.value || undefined })} disabled={disabled} style={inputStyle} placeholder="https://example.com/image.jpg" />
      </Field>
      <Field label="Text Alignment">
        <select value={block.data.alignment || "center"} onChange={(e) => updateData({ alignment: e.target.value as "left" | "center" | "right" })} disabled={disabled} style={selectStyle}>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </Field>
      <Field label="CTA Button Text">
        <input type="text" value={block.data.ctaText || ""} onChange={(e) => updateData({ ctaText: e.target.value || undefined })} disabled={disabled} style={inputStyle} placeholder="Learn More" />
      </Field>
      <Field label="CTA Button Link">
        <input type="text" value={block.data.ctaLink || ""} onChange={(e) => updateData({ ctaLink: e.target.value || undefined })} disabled={disabled} style={inputStyle} placeholder="/about" />
      </Field>
    </div>
  );
}

// Text Block Editor
export function TextBlockEditor({ block, onChange, disabled }: BlockEditorProps<TextBlock>) {
  const updateData = (updates: Partial<TextBlock["data"]>) => {
    onChange({ ...block, data: { ...block.data, ...updates } });
  };

  return (
    <div data-test-id="text-block-editor">
      <Field label="Content">
        <RichTextEditor content={block.data.content} onChange={(html) => updateData({ content: html })} disabled={disabled} placeholder="Enter your text content..." />
      </Field>
      <Field label="Alignment">
        <select value={block.data.alignment || "left"} onChange={(e) => updateData({ alignment: e.target.value as "left" | "center" | "right" })} disabled={disabled} style={selectStyle}>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </Field>
    </div>
  );
}

// Image Block Editor
export function ImageBlockEditor({ block, onChange, disabled }: BlockEditorProps<ImageBlock>) {
  const updateData = (updates: Partial<ImageBlock["data"]>) => {
    onChange({ ...block, data: { ...block.data, ...updates } });
  };

  return (
    <div data-test-id="image-block-editor">
      <Field label="Image URL">
        <input type="text" value={block.data.src} onChange={(e) => updateData({ src: e.target.value })} disabled={disabled} style={inputStyle} placeholder="https://example.com/image.jpg" data-test-id="image-src-input" />
      </Field>
      <Field label="Alt Text (for accessibility)">
        <input type="text" value={block.data.alt} onChange={(e) => updateData({ alt: e.target.value })} disabled={disabled} style={inputStyle} placeholder="Describe the image" data-test-id="image-alt-input" />
      </Field>
      <Field label="Caption">
        <input type="text" value={block.data.caption || ""} onChange={(e) => updateData({ caption: e.target.value || undefined })} disabled={disabled} style={inputStyle} placeholder="Optional caption" />
      </Field>
      <Field label="Link URL">
        <input type="text" value={block.data.linkUrl || ""} onChange={(e) => updateData({ linkUrl: e.target.value || undefined })} disabled={disabled} style={inputStyle} placeholder="Optional: make image clickable" />
      </Field>
      <Field label="Alignment">
        <select value={block.data.alignment || "center"} onChange={(e) => updateData({ alignment: e.target.value as "left" | "center" | "right" })} disabled={disabled} style={selectStyle}>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </Field>
    </div>
  );
}

// Cards Block Editor
export function CardsBlockEditor({ block, onChange, disabled }: BlockEditorProps<CardsBlock>) {
  const updateData = (updates: Partial<CardsBlock["data"]>) => {
    onChange({ ...block, data: { ...block.data, ...updates } });
  };

  const addCard = () => {
    const newCard = { title: "New Card", description: "" };
    updateData({ cards: [...block.data.cards, newCard] });
  };

  const updateCard = (index: number, updates: Partial<CardsBlock["data"]["cards"][0]>) => {
    const newCards = [...block.data.cards];
    newCards[index] = { ...newCards[index], ...updates };
    updateData({ cards: newCards });
  };

  const removeCard = (index: number) => {
    updateData({ cards: block.data.cards.filter((_, i) => i !== index) });
  };

  return (
    <div data-test-id="cards-block-editor">
      <Field label="Columns">
        <select value={block.data.columns || 3} onChange={(e) => updateData({ columns: parseInt(e.target.value) as 2 | 3 | 4 })} disabled={disabled} style={selectStyle}>
          <option value={2}>2 columns</option>
          <option value={3}>3 columns</option>
          <option value={4}>4 columns</option>
        </select>
      </Field>
      <div style={{ marginTop: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: 500, color: "#555" }}>Cards ({block.data.cards.length})</span>
          <button type="button" onClick={addCard} disabled={disabled} style={{ padding: "4px 10px", fontSize: "12px", backgroundColor: "#0066cc", color: "#fff", border: "none", borderRadius: "4px", cursor: disabled ? "not-allowed" : "pointer" }}>+ Add Card</button>
        </div>
        {block.data.cards.map((card, index) => (
          <div key={index} style={{ padding: "12px", backgroundColor: "#f9f9f9", borderRadius: "4px", marginBottom: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", color: "#666" }}>Card {index + 1}</span>
              <button type="button" onClick={() => removeCard(index)} disabled={disabled} style={{ padding: "2px 6px", fontSize: "11px", backgroundColor: "#fff", color: "#c00", border: "1px solid #ddd", borderRadius: "3px", cursor: disabled ? "not-allowed" : "pointer" }}>Remove</button>
            </div>
            <input type="text" value={card.title} onChange={(e) => updateCard(index, { title: e.target.value })} disabled={disabled} style={{ ...inputStyle, marginBottom: "6px" }} placeholder="Card title" />
            <textarea value={card.description || ""} onChange={(e) => updateCard(index, { description: e.target.value || undefined })} disabled={disabled} style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }} placeholder="Card description" />
            <input type="text" value={card.image || ""} onChange={(e) => updateCard(index, { image: e.target.value || undefined })} disabled={disabled} style={{ ...inputStyle, marginTop: "6px" }} placeholder="Image URL (optional)" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Event List Block Editor
export function EventListBlockEditor({ block, onChange, disabled }: BlockEditorProps<EventListBlock>) {
  const updateData = (updates: Partial<EventListBlock["data"]>) => {
    onChange({ ...block, data: { ...block.data, ...updates } });
  };

  return (
    <div data-test-id="event-list-block-editor">
      <Field label="Section Title">
        <input type="text" value={block.data.title || ""} onChange={(e) => updateData({ title: e.target.value || undefined })} disabled={disabled} style={inputStyle} placeholder="Upcoming Events" />
      </Field>
      <Field label="Number of Events">
        <input type="number" value={block.data.limit || 5} onChange={(e) => updateData({ limit: parseInt(e.target.value) || 5 })} disabled={disabled} style={inputStyle} min={1} max={20} />
      </Field>
      <Field label="Layout">
        <select value={block.data.layout || "list"} onChange={(e) => updateData({ layout: e.target.value as "list" | "cards" | "calendar" })} disabled={disabled} style={selectStyle}>
          <option value="list">List</option>
          <option value="cards">Cards</option>
          <option value="calendar">Calendar</option>
        </select>
      </Field>
      <Field label="Show Past Events">
        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
          <input type="checkbox" checked={block.data.showPastEvents || false} onChange={(e) => updateData({ showPastEvents: e.target.checked })} disabled={disabled} />
          <span style={{ fontSize: "14px" }}>Include past events</span>
        </label>
      </Field>
    </div>
  );
}

// Gallery Block Editor
export function GalleryBlockEditor({ block, onChange, disabled }: BlockEditorProps<GalleryBlock>) {
  const updateData = (updates: Partial<GalleryBlock["data"]>) => {
    onChange({ ...block, data: { ...block.data, ...updates } });
  };

  const addImage = () => {
    const newImage = { src: "", alt: "Image" };
    updateData({ images: [...block.data.images, newImage] });
  };

  const updateImage = (index: number, updates: Partial<GalleryBlock["data"]["images"][0]>) => {
    const newImages = [...block.data.images];
    newImages[index] = { ...newImages[index], ...updates };
    updateData({ images: newImages });
  };

  const removeImage = (index: number) => {
    updateData({ images: block.data.images.filter((_, i) => i !== index) });
  };

  return (
    <div data-test-id="gallery-block-editor">
      <Field label="Columns">
        <select value={block.data.columns || 3} onChange={(e) => updateData({ columns: parseInt(e.target.value) as 2 | 3 | 4 })} disabled={disabled} style={selectStyle}>
          <option value={2}>2 columns</option>
          <option value={3}>3 columns</option>
          <option value={4}>4 columns</option>
        </select>
      </Field>
      <Field label="Enable Lightbox">
        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
          <input type="checkbox" checked={block.data.enableLightbox ?? true} onChange={(e) => updateData({ enableLightbox: e.target.checked })} disabled={disabled} />
          <span style={{ fontSize: "14px" }}>Click to enlarge images</span>
        </label>
      </Field>
      <div style={{ marginTop: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: 500, color: "#555" }}>Images ({block.data.images.length})</span>
          <button type="button" onClick={addImage} disabled={disabled} style={{ padding: "4px 10px", fontSize: "12px", backgroundColor: "#0066cc", color: "#fff", border: "none", borderRadius: "4px", cursor: disabled ? "not-allowed" : "pointer" }}>+ Add Image</button>
        </div>
        {block.data.images.map((image, index) => (
          <div key={index} style={{ padding: "10px", backgroundColor: "#f9f9f9", borderRadius: "4px", marginBottom: "6px", display: "flex", gap: "8px", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <input type="text" value={image.src} onChange={(e) => updateImage(index, { src: e.target.value })} disabled={disabled} style={{ ...inputStyle, marginBottom: "4px" }} placeholder="Image URL" />
              <input type="text" value={image.alt} onChange={(e) => updateImage(index, { alt: e.target.value })} disabled={disabled} style={inputStyle} placeholder="Alt text" />
            </div>
            <button type="button" onClick={() => removeImage(index)} disabled={disabled} style={{ padding: "4px 8px", fontSize: "14px", backgroundColor: "#fff", color: "#c00", border: "1px solid #ddd", borderRadius: "3px", cursor: disabled ? "not-allowed" : "pointer" }}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// FAQ Block Editor
export function FaqBlockEditor({ block, onChange, disabled }: BlockEditorProps<FaqBlock>) {
  const updateData = (updates: Partial<FaqBlock["data"]>) => {
    onChange({ ...block, data: { ...block.data, ...updates } });
  };

  const addItem = () => {
    const newItem = { question: "New Question", answer: "" };
    updateData({ items: [...block.data.items, newItem] });
  };

  const updateItem = (index: number, updates: Partial<FaqBlock["data"]["items"][0]>) => {
    const newItems = [...block.data.items];
    newItems[index] = { ...newItems[index], ...updates };
    updateData({ items: newItems });
  };

  const removeItem = (index: number) => {
    updateData({ items: block.data.items.filter((_, i) => i !== index) });
  };

  return (
    <div data-test-id="faq-block-editor">
      <Field label="Section Title">
        <input type="text" value={block.data.title || ""} onChange={(e) => updateData({ title: e.target.value || undefined })} disabled={disabled} style={inputStyle} placeholder="Frequently Asked Questions" />
      </Field>
      <div style={{ marginTop: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: 500, color: "#555" }}>Questions ({block.data.items.length})</span>
          <button type="button" onClick={addItem} disabled={disabled} style={{ padding: "4px 10px", fontSize: "12px", backgroundColor: "#0066cc", color: "#fff", border: "none", borderRadius: "4px", cursor: disabled ? "not-allowed" : "pointer" }}>+ Add Question</button>
        </div>
        {block.data.items.map((item, index) => (
          <div key={index} style={{ padding: "12px", backgroundColor: "#f9f9f9", borderRadius: "4px", marginBottom: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", color: "#666" }}>Q{index + 1}</span>
              <button type="button" onClick={() => removeItem(index)} disabled={disabled} style={{ padding: "2px 6px", fontSize: "11px", backgroundColor: "#fff", color: "#c00", border: "1px solid #ddd", borderRadius: "3px", cursor: disabled ? "not-allowed" : "pointer" }}>Remove</button>
            </div>
            <input type="text" value={item.question} onChange={(e) => updateItem(index, { question: e.target.value })} disabled={disabled} style={{ ...inputStyle, marginBottom: "6px" }} placeholder="Question" />
            <textarea value={item.answer} onChange={(e) => updateItem(index, { answer: e.target.value })} disabled={disabled} style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} placeholder="Answer" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Contact Block Editor
export function ContactBlockEditor({ block, onChange, disabled }: BlockEditorProps<ContactBlock>) {
  const updateData = (updates: Partial<ContactBlock["data"]>) => {
    onChange({ ...block, data: { ...block.data, ...updates } });
  };

  return (
    <div data-test-id="contact-block-editor">
      <Field label="Section Title">
        <input type="text" value={block.data.title || ""} onChange={(e) => updateData({ title: e.target.value || undefined })} disabled={disabled} style={inputStyle} placeholder="Contact Us" />
      </Field>
      <Field label="Description">
        <textarea value={block.data.description || ""} onChange={(e) => updateData({ description: e.target.value || undefined })} disabled={disabled} style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }} placeholder="Optional description above the form" />
      </Field>
      <Field label="Recipient Email">
        <input type="email" value={block.data.recipientEmail} onChange={(e) => updateData({ recipientEmail: e.target.value })} disabled={disabled} style={inputStyle} placeholder="info@example.com" data-test-id="contact-recipient-input" />
      </Field>
      <Field label="Submit Button Text">
        <input type="text" value={block.data.submitText || ""} onChange={(e) => updateData({ submitText: e.target.value || undefined })} disabled={disabled} style={inputStyle} placeholder="Send Message" />
      </Field>
      <p style={{ fontSize: "11px", color: "#666", marginTop: "8px" }}>
        Default form fields: Name, Email, Message. Custom field configuration coming soon.
      </p>
    </div>
  );
}

// CTA Block Editor
export function CtaBlockEditor({ block, onChange, disabled }: BlockEditorProps<CtaBlock>) {
  const updateData = (updates: Partial<CtaBlock["data"]>) => {
    onChange({ ...block, data: { ...block.data, ...updates } });
  };

  return (
    <div data-test-id="cta-block-editor">
      <Field label="Button Text">
        <input type="text" value={block.data.text} onChange={(e) => updateData({ text: e.target.value })} disabled={disabled} style={inputStyle} placeholder="Click Here" data-test-id="cta-text-input" />
      </Field>
      <Field label="Link URL">
        <input type="text" value={block.data.link} onChange={(e) => updateData({ link: e.target.value })} disabled={disabled} style={inputStyle} placeholder="/signup" data-test-id="cta-link-input" />
      </Field>
      <Field label="Style">
        <select value={block.data.style || "primary"} onChange={(e) => updateData({ style: e.target.value as "primary" | "secondary" | "outline" })} disabled={disabled} style={selectStyle}>
          <option value="primary">Primary (filled)</option>
          <option value="secondary">Secondary</option>
          <option value="outline">Outline</option>
        </select>
      </Field>
      <Field label="Size">
        <select value={block.data.size || "medium"} onChange={(e) => updateData({ size: e.target.value as "small" | "medium" | "large" })} disabled={disabled} style={selectStyle}>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </Field>
      <Field label="Alignment">
        <select value={block.data.alignment || "center"} onChange={(e) => updateData({ alignment: e.target.value as "left" | "center" | "right" })} disabled={disabled} style={selectStyle}>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </Field>
    </div>
  );
}

// Divider Block Editor
export function DividerBlockEditor({ block, onChange, disabled }: BlockEditorProps<DividerBlock>) {
  const updateData = (updates: Partial<DividerBlock["data"]>) => {
    onChange({ ...block, data: { ...block.data, ...updates } });
  };

  return (
    <div data-test-id="divider-block-editor">
      <Field label="Style">
        <select value={block.data.style || "solid"} onChange={(e) => updateData({ style: e.target.value as "solid" | "dashed" | "dotted" })} disabled={disabled} style={selectStyle}>
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
        </select>
      </Field>
      <Field label="Width">
        <select value={block.data.width || "full"} onChange={(e) => updateData({ width: e.target.value as "full" | "half" | "quarter" })} disabled={disabled} style={selectStyle}>
          <option value="full">Full width</option>
          <option value="half">Half width</option>
          <option value="quarter">Quarter width</option>
        </select>
      </Field>
    </div>
  );
}

// Spacer Block Editor
export function SpacerBlockEditor({ block, onChange, disabled }: BlockEditorProps<SpacerBlock>) {
  const updateData = (updates: Partial<SpacerBlock["data"]>) => {
    onChange({ ...block, data: { ...block.data, ...updates } });
  };

  return (
    <div data-test-id="spacer-block-editor">
      <Field label="Height">
        <select value={block.data.height || "medium"} onChange={(e) => updateData({ height: e.target.value as "small" | "medium" | "large" })} disabled={disabled} style={selectStyle}>
          <option value="small">Small (24px)</option>
          <option value="medium">Medium (48px)</option>
          <option value="large">Large (96px)</option>
        </select>
      </Field>
    </div>
  );
}

// Block editor selector
export function BlockEditor({ block, onChange, disabled }: { block: Block; onChange: (block: Block) => void; disabled?: boolean }) {
  switch (block.type) {
    case "hero": return <HeroBlockEditor block={block} onChange={onChange as (b: HeroBlock) => void} disabled={disabled} />;
    case "text": return <TextBlockEditor block={block} onChange={onChange as (b: TextBlock) => void} disabled={disabled} />;
    case "image": return <ImageBlockEditor block={block} onChange={onChange as (b: ImageBlock) => void} disabled={disabled} />;
    case "cards": return <CardsBlockEditor block={block} onChange={onChange as (b: CardsBlock) => void} disabled={disabled} />;
    case "event-list": return <EventListBlockEditor block={block} onChange={onChange as (b: EventListBlock) => void} disabled={disabled} />;
    case "gallery": return <GalleryBlockEditor block={block} onChange={onChange as (b: GalleryBlock) => void} disabled={disabled} />;
    case "faq": return <FaqBlockEditor block={block} onChange={onChange as (b: FaqBlock) => void} disabled={disabled} />;
    case "contact": return <ContactBlockEditor block={block} onChange={onChange as (b: ContactBlock) => void} disabled={disabled} />;
    case "cta": return <CtaBlockEditor block={block} onChange={onChange as (b: CtaBlock) => void} disabled={disabled} />;
    case "divider": return <DividerBlockEditor block={block} onChange={onChange as (b: DividerBlock) => void} disabled={disabled} />;
    case "spacer": return <SpacerBlockEditor block={block} onChange={onChange as (b: SpacerBlock) => void} disabled={disabled} />;
    default: return <div>Unknown block type</div>;
  }
}
