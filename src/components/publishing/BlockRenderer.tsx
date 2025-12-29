// Copyright (c) Santa Barbara Newcomers Club
// Block renderer component for public pages
// Supports Page → Sections → Blocks hierarchy with visibility filtering

import { Block, PageContent } from "@/lib/publishing/blocks";
import {
  Section,
  VisibilityUserContext,
  normalizeToSections,
  filterVisibleSections,
} from "@/lib/publishing/visibility";

type BlockRendererProps = {
  content: PageContent;
  themeCss?: string;
  // Optional user context for visibility filtering
  user?: VisibilityUserContext | null;
};

function HeroBlock({ block }: { block: Extract<Block, { type: "hero" }> }) {
  return (
    <section
      data-block-type="hero"
      style={{
        padding: "var(--spacing-xl, 48px) var(--spacing-md, 16px)",
        textAlign: block.data.alignment || "center",
        backgroundColor: block.data.backgroundImage ? undefined : "var(--color-primary, #0066cc)",
        backgroundImage: block.data.backgroundImage ? `url(${block.data.backgroundImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: block.data.textColor || "#fff",
        position: "relative",
      }}
    >
      {block.data.backgroundOverlay && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: block.data.backgroundOverlay,
            pointerEvents: "none",
          }}
        />
      )}
      <div style={{ position: "relative", zIndex: 1 }}>
        <h1 style={{ fontSize: "var(--font-size-4xl, 36px)", marginBottom: "var(--spacing-md, 16px)" }}>
          {block.data.title}
        </h1>
        {block.data.subtitle && (
          <p style={{ fontSize: "var(--font-size-xl, 20px)", opacity: 0.9, maxWidth: "600px", margin: "0 auto" }}>
            {block.data.subtitle}
          </p>
        )}
        {block.data.ctaText && block.data.ctaLink && (
          <a
            href={block.data.ctaLink}
            style={{
              display: "inline-block",
              marginTop: "var(--spacing-lg, 24px)",
              padding: "var(--spacing-sm, 8px) var(--spacing-lg, 24px)",
              backgroundColor: block.data.ctaStyle === "outline" ? "transparent" : "#fff",
              color: block.data.ctaStyle === "outline" ? "#fff" : "var(--color-primary, #0066cc)",
              textDecoration: "none",
              borderRadius: "var(--border-radius-md, 4px)",
              fontWeight: 600,
              border: block.data.ctaStyle === "outline" ? "2px solid #fff" : "none",
            }}
          >
            {block.data.ctaText}
          </a>
        )}
      </div>
    </section>
  );
}

function TextBlock({ block }: { block: Extract<Block, { type: "text" }> }) {
  return (
    <section
      data-block-type="text"
      style={{
        padding: "var(--spacing-lg, 24px) var(--spacing-md, 16px)",
        maxWidth: "800px",
        margin: "0 auto",
        textAlign: block.data.alignment || "left",
      }}
    >
      <div
        style={{ fontSize: "var(--font-size-base, 16px)", lineHeight: 1.7 }}
        dangerouslySetInnerHTML={{ __html: block.data.content }}
      />
    </section>
  );
}

function ImageBlock({ block }: { block: Extract<Block, { type: "image" }> }) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element -- user-provided dynamic src
    <img
      src={block.data.src}
      alt={block.data.alt}
      style={{
        maxWidth: "100%",
        height: "auto",
        borderRadius: "var(--border-radius-md, 4px)",
      }}
    />
  );

  return (
    <figure
      data-block-type="image"
      style={{
        padding: "var(--spacing-lg, 24px) var(--spacing-md, 16px)",
        maxWidth: block.data.width === "full" ? "100%" : "800px",
        margin: "0 auto",
        textAlign: block.data.alignment || "center",
      }}
    >
      {block.data.linkUrl ? (
        <a href={block.data.linkUrl}>{img}</a>
      ) : (
        img
      )}
      {block.data.caption && (
        <figcaption style={{ marginTop: "var(--spacing-sm, 8px)", fontSize: "var(--font-size-sm, 14px)", color: "#666" }}>
          {block.data.caption}
        </figcaption>
      )}
    </figure>
  );
}

function CardsBlock({ block }: { block: Extract<Block, { type: "cards" }> }) {
  const columns = block.data.columns || 3;
  return (
    <section
      data-block-type="cards"
      style={{ padding: "var(--spacing-lg, 24px) var(--spacing-md, 16px)" }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: "var(--spacing-lg, 24px)",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {block.data.cards.map((card, idx) => (
          <div
            key={idx}
            style={{
              padding: "var(--spacing-lg, 24px)",
              backgroundColor: "#fff",
              borderRadius: "var(--border-radius-md, 4px)",
              boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.1))",
            }}
          >
            {card.image && (
              // eslint-disable-next-line @next/next/no-img-element -- user-provided dynamic src
              <img
                src={card.image}
                alt={card.title}
                style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "var(--border-radius-sm, 2px)", marginBottom: "var(--spacing-md, 16px)" }}
              />
            )}
            <h3 style={{ fontSize: "var(--font-size-lg, 18px)", marginBottom: "var(--spacing-sm, 8px)" }}>
              {card.title}
            </h3>
            {card.description && (
              <p style={{ fontSize: "var(--font-size-sm, 14px)", color: "#666" }}>
                {card.description}
              </p>
            )}
            {card.linkUrl && (
              <a
                href={card.linkUrl}
                style={{
                  display: "inline-block",
                  marginTop: "var(--spacing-sm, 8px)",
                  color: "var(--color-primary, #0066cc)",
                  textDecoration: "none",
                }}
              >
                {card.linkText || "Learn more"} →
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function EventListBlock({ block }: { block: Extract<Block, { type: "event-list" }> }) {
  // This would need to be a client component with data fetching for real events
  return (
    <section
      data-block-type="event-list"
      style={{ padding: "var(--spacing-lg, 24px) var(--spacing-md, 16px)", maxWidth: "800px", margin: "0 auto" }}
    >
      {block.data.title && (
        <h2 style={{ fontSize: "var(--font-size-2xl, 24px)", marginBottom: "var(--spacing-lg, 24px)" }}>
          {block.data.title}
        </h2>
      )}
      <p style={{ color: "#666", fontStyle: "italic" }}>
        Events will be displayed here (limit: {block.data.limit || 5}, layout: {block.data.layout || "list"})
      </p>
    </section>
  );
}

function GalleryBlock({ block }: { block: Extract<Block, { type: "gallery" }> }) {
  const columns = block.data.columns || 3;
  return (
    <section
      data-block-type="gallery"
      style={{ padding: "var(--spacing-lg, 24px) var(--spacing-md, 16px)" }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: "var(--spacing-sm, 8px)",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {block.data.images.map((image, idx) => (
          <figure key={idx} style={{ margin: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- user-provided dynamic src */}
            <img
              src={image.src}
              alt={image.alt}
              style={{
                width: "100%",
                aspectRatio: "1",
                objectFit: "cover",
                borderRadius: "var(--border-radius-sm, 2px)",
              }}
            />
            {image.caption && (
              <figcaption style={{ fontSize: "var(--font-size-xs, 12px)", color: "#666", marginTop: "4px" }}>
                {image.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}

function FaqBlock({ block }: { block: Extract<Block, { type: "faq" }> }) {
  return (
    <section
      data-block-type="faq"
      style={{ padding: "var(--spacing-lg, 24px) var(--spacing-md, 16px)", maxWidth: "800px", margin: "0 auto" }}
    >
      {block.data.title && (
        <h2 style={{ fontSize: "var(--font-size-2xl, 24px)", marginBottom: "var(--spacing-lg, 24px)" }}>
          {block.data.title}
        </h2>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md, 16px)" }}>
        {block.data.items.map((item, idx) => (
          <details
            key={idx}
            style={{
              padding: "var(--spacing-md, 16px)",
              backgroundColor: "#f9f9f9",
              borderRadius: "var(--border-radius-md, 4px)",
            }}
          >
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>{item.question}</summary>
            <p style={{ marginTop: "var(--spacing-sm, 8px)", color: "#666" }}>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function ContactBlock({ block }: { block: Extract<Block, { type: "contact" }> }) {
  const fields = block.data.fields || [
    { name: "name", label: "Name", type: "text" as const, required: true },
    { name: "email", label: "Email", type: "email" as const, required: true },
    { name: "message", label: "Message", type: "textarea" as const, required: true },
  ];

  return (
    <section
      data-block-type="contact"
      style={{ padding: "var(--spacing-lg, 24px) var(--spacing-md, 16px)", maxWidth: "600px", margin: "0 auto" }}
    >
      {block.data.title && (
        <h2 style={{ fontSize: "var(--font-size-2xl, 24px)", marginBottom: "var(--spacing-lg, 24px)" }}>
          {block.data.title}
        </h2>
      )}
      {block.data.description && (
        <p style={{ marginBottom: "var(--spacing-lg, 24px)", color: "#666" }}>
          {block.data.description}
        </p>
      )}
      <form
        method="POST"
        style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md, 16px)" }}
      >
        {fields.map((field, idx) => (
          <div key={idx}>
            <label style={{ display: "block", marginBottom: "var(--spacing-xs, 4px)", fontWeight: 500 }}>
              {field.label}
              {field.required && <span style={{ color: "red" }}> *</span>}
            </label>
            {field.type === "textarea" ? (
              <textarea
                name={field.name}
                required={field.required}
                style={{
                  width: "100%",
                  padding: "var(--spacing-sm, 8px)",
                  borderRadius: "var(--border-radius-sm, 2px)",
                  border: "1px solid #ccc",
                  minHeight: "120px",
                }}
              />
            ) : field.type === "select" && field.options ? (
              <select
                name={field.name}
                required={field.required}
                style={{
                  width: "100%",
                  padding: "var(--spacing-sm, 8px)",
                  borderRadius: "var(--border-radius-sm, 2px)",
                  border: "1px solid #ccc",
                }}
              >
                <option value="">Select...</option>
                {field.options.map((opt, i) => (
                  <option key={i} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                name={field.name}
                required={field.required}
                style={{
                  width: "100%",
                  padding: "var(--spacing-sm, 8px)",
                  borderRadius: "var(--border-radius-sm, 2px)",
                  border: "1px solid #ccc",
                }}
              />
            )}
          </div>
        ))}
        <button
          type="submit"
          style={{
            padding: "var(--spacing-sm, 8px) var(--spacing-lg, 24px)",
            backgroundColor: "var(--color-primary, #0066cc)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--border-radius-md, 4px)",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {block.data.submitText || "Send Message"}
        </button>
      </form>
    </section>
  );
}

function CtaBlock({ block }: { block: Extract<Block, { type: "cta" }> }) {
  const sizes = {
    small: "var(--spacing-xs, 4px) var(--spacing-md, 16px)",
    medium: "var(--spacing-sm, 8px) var(--spacing-lg, 24px)",
    large: "var(--spacing-md, 16px) var(--spacing-xl, 32px)",
  };

  return (
    <div
      data-block-type="cta"
      style={{
        padding: "var(--spacing-lg, 24px) var(--spacing-md, 16px)",
        textAlign: block.data.alignment || "center",
      }}
    >
      <a
        href={block.data.link}
        style={{
          display: "inline-block",
          padding: sizes[block.data.size || "medium"],
          backgroundColor: block.data.style === "outline" ? "transparent" : "var(--color-primary, #0066cc)",
          color: block.data.style === "outline" ? "var(--color-primary, #0066cc)" : "#fff",
          textDecoration: "none",
          borderRadius: "var(--border-radius-md, 4px)",
          fontWeight: 600,
          border: block.data.style === "outline" ? "2px solid var(--color-primary, #0066cc)" : "none",
        }}
      >
        {block.data.text}
      </a>
    </div>
  );
}

function DividerBlock({ block }: { block: Extract<Block, { type: "divider" }> }) {
  const widths = { full: "100%", half: "50%", quarter: "25%" };
  return (
    <hr
      data-block-type="divider"
      style={{
        margin: "var(--spacing-lg, 24px) auto",
        maxWidth: "800px",
        width: widths[block.data.width || "full"],
        border: "none",
        borderTop: `1px ${block.data.style || "solid"} #ddd`,
      }}
    />
  );
}

function SpacerBlock({ block }: { block: Extract<Block, { type: "spacer" }> }) {
  const heights = { small: "24px", medium: "48px", large: "96px" };
  return (
    <div
      data-block-type="spacer"
      style={{ height: heights[block.data.height || "medium"] }}
    />
  );
}

function FlipCardBlock({ block }: { block: Extract<Block, { type: "flip-card" }> }) {
  const columns = block.data.columns || 3;
  const cardSize = columns === 2 ? "300px" : columns === 4 ? "200px" : "250px";

  return (
    <section
      data-block-type="flip-card"
      style={{ padding: "var(--spacing-lg, 24px) var(--spacing-md, 16px)" }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .flip-card-container {
              perspective: 1000px;
            }
            .flip-card-inner {
              position: relative;
              width: 100%;
              height: 100%;
              transition: transform 0.6s;
              transform-style: preserve-3d;
            }
            .flip-card-container:hover .flip-card-inner,
            .flip-card-container:focus-within .flip-card-inner {
              transform: rotateY(180deg);
            }
            .flip-card-front,
            .flip-card-back {
              position: absolute;
              width: 100%;
              height: 100%;
              backface-visibility: hidden;
              border-radius: var(--border-radius-md, 4px);
              overflow: hidden;
            }
            .flip-card-back {
              transform: rotateY(180deg);
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: var(--spacing-lg, 24px);
              text-align: center;
            }
          `,
        }}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: "var(--spacing-lg, 24px)",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {block.data.cards.map((card, idx) => (
          <div
            key={idx}
            className="flip-card-container"
            tabIndex={0}
            role="button"
            aria-label={`${card.backTitle}: ${card.backDescription}`}
            style={{
              width: "100%",
              height: cardSize,
            }}
          >
            <div className="flip-card-inner">
              <div className="flip-card-front">
                {/* eslint-disable-next-line @next/next/no-img-element -- user-provided dynamic src */}
                <img
                  src={card.frontImage || "/placeholder-card.svg"}
                  alt={card.frontImageAlt}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
              <div
                className="flip-card-back"
                style={{
                  background: card.backGradient || "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: card.backTextColor || "#ffffff",
                }}
              >
                <h3
                  style={{
                    fontSize: "var(--font-size-lg, 18px)",
                    fontWeight: 600,
                    marginBottom: "var(--spacing-sm, 8px)",
                  }}
                >
                  {card.backTitle}
                </h3>
                <p
                  style={{
                    fontSize: "var(--font-size-sm, 14px)",
                    opacity: 0.9,
                    marginBottom: card.linkUrl ? "var(--spacing-md, 16px)" : 0,
                  }}
                >
                  {card.backDescription}
                </p>
                {card.linkUrl && (
                  <a
                    href={card.linkUrl}
                    style={{
                      color: card.backTextColor || "#ffffff",
                      textDecoration: "underline",
                      fontWeight: 500,
                    }}
                  >
                    {card.linkText || "Learn more"}
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function renderBlock(block: Block) {
  switch (block.type) {
    case "hero":
      return <HeroBlock key={block.id} block={block} />;
    case "text":
      return <TextBlock key={block.id} block={block} />;
    case "image":
      return <ImageBlock key={block.id} block={block} />;
    case "cards":
      return <CardsBlock key={block.id} block={block} />;
    case "event-list":
      return <EventListBlock key={block.id} block={block} />;
    case "gallery":
      return <GalleryBlock key={block.id} block={block} />;
    case "faq":
      return <FaqBlock key={block.id} block={block} />;
    case "contact":
      return <ContactBlock key={block.id} block={block} />;
    case "cta":
      return <CtaBlock key={block.id} block={block} />;
    case "divider":
      return <DividerBlock key={block.id} block={block} />;
    case "spacer":
      return <SpacerBlock key={block.id} block={block} />;
    case "flip-card":
      return <FlipCardBlock key={block.id} block={block} />;
    default:
      return null;
  }
}

/**
 * Render a section with its blocks
 */
function SectionRenderer({ section }: { section: Section }) {
  const sortedBlocks = [...section.blocks].sort((a, b) => a.order - b.order);

  // Layout styles based on section layout hint
  const layoutStyles: React.CSSProperties = {
    width: "100%",
  };

  if (section.layout === "contained") {
    layoutStyles.maxWidth = "1200px";
    layoutStyles.margin = "0 auto";
    layoutStyles.padding = "0 var(--spacing-md, 16px)";
  } else if (section.layout === "narrow") {
    layoutStyles.maxWidth = "800px";
    layoutStyles.margin = "0 auto";
    layoutStyles.padding = "0 var(--spacing-md, 16px)";
  }
  // full-width: no constraints

  return (
    <div
      data-test-id="page-section"
      data-section-id={section.id}
      data-section-name={section.name}
      style={layoutStyles}
    >
      {sortedBlocks.map(renderBlock)}
    </div>
  );
}

/**
 * Main block renderer component
 * Handles both legacy blocks[] and new sections[] format
 * Applies visibility filtering when user context is provided
 */
export default function BlockRenderer({
  content,
  themeCss,
  user,
}: BlockRendererProps) {
  // Normalize content to sections format for unified rendering
  const sections = normalizeToSections(content);

  // Apply visibility filtering if user context is provided
  const visibleSections = filterVisibleSections(sections, user ?? null);

  // Sort sections by order
  const sortedSections = [...visibleSections].sort((a, b) => a.order - b.order);

  return (
    <div data-test-id="page-content">
      {themeCss && <style dangerouslySetInnerHTML={{ __html: themeCss }} />}
      {sortedSections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </div>
  );
}
