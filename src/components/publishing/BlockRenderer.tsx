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

function AccordionBlock({ block }: { block: Extract<Block, { type: "accordion" }> }) {
  return (
    <section
      data-block-type="accordion"
      style={{ padding: "var(--spacing-lg, 24px) var(--spacing-md, 16px)", maxWidth: "800px", margin: "0 auto" }}
    >
      {block.data.title && (
        <h2 style={{ fontSize: "var(--font-size-2xl, 24px)", marginBottom: "var(--spacing-lg, 24px)" }}>
          {block.data.title}
        </h2>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-sm, 8px)" }}>
        {block.data.items.map((item, idx) => (
          <details
            key={idx}
            open={item.defaultOpen}
            style={{
              padding: "var(--spacing-md, 16px)",
              backgroundColor: "#f9f9f9",
              borderRadius: "var(--border-radius-md, 4px)",
              border: "1px solid #e0e0e0",
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "var(--font-size-lg, 18px)",
                listStyle: "none",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {item.title}
              <span style={{ fontSize: "var(--font-size-sm, 14px)" }}>▼</span>
            </summary>
            <div
              style={{ marginTop: "var(--spacing-md, 16px)", color: "#444", lineHeight: 1.6 }}
              dangerouslySetInnerHTML={{ __html: item.content }}
            />
          </details>
        ))}
      </div>
    </section>
  );
}

function TabsBlock({ block }: { block: Extract<Block, { type: "tabs" }> }) {
  // Note: This is a server component, so tabs default to first tab
  // Client-side interactivity would need to be added for tab switching
  return (
    <section
      data-block-type="tabs"
      style={{
        padding: "var(--spacing-lg, 24px) var(--spacing-md, 16px)",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <div
        role="tablist"
        style={{
          display: "flex",
          gap: "var(--spacing-xs, 4px)",
          borderBottom: "2px solid #e0e0e0",
          marginBottom: "var(--spacing-lg, 24px)",
          justifyContent: block.data.alignment === "center" ? "center" : block.data.alignment === "right" ? "flex-end" : "flex-start",
        }}
      >
        {block.data.tabs.map((tab, idx) => (
          <button
            key={idx}
            role="tab"
            aria-selected={idx === 0}
            style={{
              padding: "var(--spacing-sm, 8px) var(--spacing-lg, 24px)",
              backgroundColor: idx === 0 ? "#fff" : "transparent",
              border: "none",
              borderBottom: idx === 0 ? "2px solid var(--color-primary, #0066cc)" : "2px solid transparent",
              marginBottom: "-2px",
              cursor: "pointer",
              fontWeight: idx === 0 ? 600 : 400,
              color: idx === 0 ? "var(--color-primary, #0066cc)" : "#666",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Show first tab content by default */}
      {block.data.tabs[0] && (
        <div
          role="tabpanel"
          style={{ lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: block.data.tabs[0].content }}
        />
      )}
    </section>
  );
}

function TestimonialBlock({ block }: { block: Extract<Block, { type: "testimonial" }> }) {
  // Show first testimonial by default (rotation requires client-side JS)
  const testimonial = block.data.testimonials[0];
  if (!testimonial) return null;

  return (
    <section
      data-block-type="testimonial"
      style={{
        padding: "var(--spacing-xl, 48px) var(--spacing-md, 16px)",
        textAlign: "center",
        backgroundColor: "#f9f9f9",
      }}
    >
      {block.data.title && (
        <h2 style={{ fontSize: "var(--font-size-2xl, 24px)", marginBottom: "var(--spacing-xl, 48px)" }}>
          {block.data.title}
        </h2>
      )}
      <blockquote style={{ maxWidth: "700px", margin: "0 auto" }}>
        <p
          style={{
            fontSize: "var(--font-size-xl, 20px)",
            fontStyle: "italic",
            lineHeight: 1.6,
            marginBottom: "var(--spacing-lg, 24px)",
            color: "#333",
          }}
        >
          &ldquo;{testimonial.quote}&rdquo;
        </p>
        <footer style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--spacing-md, 16px)" }}>
          {testimonial.image && (
            // eslint-disable-next-line @next/next/no-img-element -- user-provided dynamic src
            <img
              src={testimonial.image}
              alt={testimonial.author}
              style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover" }}
            />
          )}
          <div>
            <cite style={{ fontStyle: "normal", fontWeight: 600, display: "block" }}>{testimonial.author}</cite>
            {testimonial.role && (
              <span style={{ fontSize: "var(--font-size-sm, 14px)", color: "#666" }}>{testimonial.role}</span>
            )}
          </div>
        </footer>
      </blockquote>
      {block.data.testimonials.length > 1 && (
        <div style={{ marginTop: "var(--spacing-lg, 24px)", display: "flex", justifyContent: "center", gap: "var(--spacing-xs, 4px)" }}>
          {block.data.testimonials.map((_, idx) => (
            <span
              key={idx}
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: idx === 0 ? "var(--color-primary, #0066cc)" : "#ccc",
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function StatsBlock({ block }: { block: Extract<Block, { type: "stats" }> }) {
  const columns = block.data.columns || 3;

  return (
    <section
      data-block-type="stats"
      style={{
        padding: "var(--spacing-xl, 48px) var(--spacing-md, 16px)",
        backgroundColor: "var(--color-primary, #0066cc)",
        color: "#fff",
      }}
    >
      {block.data.title && (
        <h2 style={{ fontSize: "var(--font-size-2xl, 24px)", marginBottom: "var(--spacing-xl, 48px)", textAlign: "center" }}>
          {block.data.title}
        </h2>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: "var(--spacing-xl, 48px)",
          maxWidth: "1000px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        {block.data.stats.map((stat, idx) => (
          <div key={idx}>
            <div style={{ fontSize: "var(--font-size-4xl, 48px)", fontWeight: 700, marginBottom: "var(--spacing-sm, 8px)" }}>
              {stat.prefix}{new Intl.NumberFormat("en-US").format(stat.value)}{stat.suffix}
            </div>
            <div style={{ fontSize: "var(--font-size-lg, 18px)", opacity: 0.9 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TimelineBlock({ block }: { block: Extract<Block, { type: "timeline" }> }) {
  return (
    <section
      data-block-type="timeline"
      style={{ padding: "var(--spacing-lg, 24px) var(--spacing-md, 16px)", maxWidth: "800px", margin: "0 auto" }}
    >
      {block.data.title && (
        <h2 style={{ fontSize: "var(--font-size-2xl, 24px)", marginBottom: "var(--spacing-xl, 48px)", textAlign: "center" }}>
          {block.data.title}
        </h2>
      )}
      <div style={{ position: "relative", paddingLeft: "var(--spacing-xl, 48px)" }}>
        {/* Vertical line */}
        <div
          style={{
            position: "absolute",
            left: "8px",
            top: 0,
            bottom: 0,
            width: "2px",
            backgroundColor: "#e0e0e0",
          }}
        />
        {block.data.events.map((event, idx) => (
          <div
            key={idx}
            style={{
              position: "relative",
              marginBottom: "var(--spacing-xl, 48px)",
            }}
          >
            {/* Dot */}
            <div
              style={{
                position: "absolute",
                left: "-40px",
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                backgroundColor: "var(--color-primary, #0066cc)",
                border: "3px solid #fff",
                boxShadow: "0 0 0 2px var(--color-primary, #0066cc)",
              }}
            />
            <div style={{ fontSize: "var(--font-size-sm, 14px)", color: "var(--color-primary, #0066cc)", fontWeight: 600, marginBottom: "var(--spacing-xs, 4px)" }}>
              {event.date}
            </div>
            <h3 style={{ fontSize: "var(--font-size-lg, 18px)", fontWeight: 600, marginBottom: "var(--spacing-sm, 8px)" }}>
              {event.title}
            </h3>
            <p style={{ color: "#666", lineHeight: 1.6 }}>
              {event.description}
            </p>
            {event.image && (
              // eslint-disable-next-line @next/next/no-img-element -- user-provided dynamic src
              <img
                src={event.image}
                alt={event.title}
                style={{ marginTop: "var(--spacing-md, 16px)", maxWidth: "100%", borderRadius: "var(--border-radius-md, 4px)" }}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function BeforeAfterBlock({ block }: { block: Extract<Block, { type: "before-after" }> }) {
  const aspectRatios: Record<string, string> = {
    "16:9": "56.25%",
    "4:3": "75%",
    "1:1": "100%",
    "3:2": "66.67%",
  };
  const paddingBottom = aspectRatios[block.data.aspectRatio || "16:9"];
  const initialPos = block.data.initialPosition ?? 50;
  const uniqueId = `before-after-${block.id.replace(/-/g, "")}`;

  return (
    <section
      data-block-type="before-after"
      style={{ padding: "var(--spacing-lg, 24px) var(--spacing-md, 16px)", maxWidth: "900px", margin: "0 auto" }}
    >
      {block.data.title && (
        <h2 style={{ fontSize: "var(--font-size-2xl, 24px)", marginBottom: "var(--spacing-lg, 24px)", textAlign: "center" }}>
          {block.data.title}
        </h2>
      )}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .${uniqueId} {
              position: relative;
              width: 100%;
              overflow: hidden;
              border-radius: var(--border-radius-md, 4px);
              cursor: ew-resize;
              user-select: none;
              -webkit-user-select: none;
            }
            .${uniqueId} .ba-after {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
            }
            .${uniqueId} .ba-after img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            .${uniqueId} .ba-before {
              position: absolute;
              top: 0;
              left: 0;
              width: ${initialPos}%;
              height: 100%;
              overflow: hidden;
            }
            .${uniqueId} .ba-before img {
              width: 100%;
              height: 100%;
              object-fit: cover;
              /* Make image width match parent container, not clipped width */
              min-width: calc(100vw * 0.9);
              max-width: 900px;
            }
            .${uniqueId} .ba-slider {
              position: absolute;
              top: 0;
              left: ${initialPos}%;
              width: 4px;
              height: 100%;
              background: #fff;
              cursor: ew-resize;
              transform: translateX(-50%);
              box-shadow: 0 0 8px rgba(0,0,0,0.3);
            }
            .${uniqueId} .ba-slider::before {
              content: '';
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 40px;
              height: 40px;
              background: #fff;
              border-radius: 50%;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            }
            .${uniqueId} .ba-slider::after {
              content: '◀ ▶';
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              font-size: 12px;
              color: #333;
              white-space: nowrap;
            }
            .${uniqueId} .ba-label {
              position: absolute;
              top: var(--spacing-md, 16px);
              padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
              background: rgba(0,0,0,0.6);
              color: #fff;
              font-size: var(--font-size-sm, 14px);
              border-radius: var(--border-radius-sm, 2px);
              pointer-events: none;
            }
            .${uniqueId} .ba-label-before {
              left: var(--spacing-md, 16px);
            }
            .${uniqueId} .ba-label-after {
              right: var(--spacing-md, 16px);
            }
          `,
        }}
      />
      <div
        className={uniqueId}
        style={{ paddingBottom }}
        onMouseDown={(e) => {
          const container = e.currentTarget;
          const rect = container.getBoundingClientRect();
          const updatePosition = (clientX: number) => {
            const x = clientX - rect.left;
            const percent = Math.min(100, Math.max(0, (x / rect.width) * 100));
            const before = container.querySelector(".ba-before") as HTMLElement;
            const slider = container.querySelector(".ba-slider") as HTMLElement;
            if (before) before.style.width = `${percent}%`;
            if (slider) slider.style.left = `${percent}%`;
          };
          updatePosition(e.clientX);
          const handleMouseMove = (ev: MouseEvent) => updatePosition(ev.clientX);
          const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
          };
          document.addEventListener("mousemove", handleMouseMove);
          document.addEventListener("mouseup", handleMouseUp);
        }}
        onTouchStart={(e) => {
          const container = e.currentTarget;
          const rect = container.getBoundingClientRect();
          const updatePosition = (clientX: number) => {
            const x = clientX - rect.left;
            const percent = Math.min(100, Math.max(0, (x / rect.width) * 100));
            const before = container.querySelector(".ba-before") as HTMLElement;
            const slider = container.querySelector(".ba-slider") as HTMLElement;
            if (before) before.style.width = `${percent}%`;
            if (slider) slider.style.left = `${percent}%`;
          };
          const touch = e.touches[0];
          if (touch) updatePosition(touch.clientX);
          const handleTouchMove = (ev: TouchEvent) => {
            const t = ev.touches[0];
            if (t) updatePosition(t.clientX);
          };
          const handleTouchEnd = () => {
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("touchend", handleTouchEnd);
          };
          document.addEventListener("touchmove", handleTouchMove, { passive: true });
          document.addEventListener("touchend", handleTouchEnd);
        }}
      >
        {/* After image (background) */}
        <div className="ba-after">
          {/* eslint-disable-next-line @next/next/no-img-element -- user-provided dynamic src */}
          <img src={block.data.afterImage || "/placeholder-image.svg"} alt={block.data.afterAlt} />
        </div>
        {/* Before image (foreground, clipped) */}
        <div className="ba-before">
          {/* eslint-disable-next-line @next/next/no-img-element -- user-provided dynamic src */}
          <img src={block.data.beforeImage || "/placeholder-image.svg"} alt={block.data.beforeAlt} />
        </div>
        {/* Slider handle */}
        <div className="ba-slider" />
        {/* Labels */}
        {block.data.beforeLabel && (
          <span className="ba-label ba-label-before">{block.data.beforeLabel}</span>
        )}
        {block.data.afterLabel && (
          <span className="ba-label ba-label-after">{block.data.afterLabel}</span>
        )}
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
    case "accordion":
      return <AccordionBlock key={block.id} block={block} />;
    case "tabs":
      return <TabsBlock key={block.id} block={block} />;
    case "testimonial":
      return <TestimonialBlock key={block.id} block={block} />;
    case "stats":
      return <StatsBlock key={block.id} block={block} />;
    case "timeline":
      return <TimelineBlock key={block.id} block={block} />;
    case "before-after":
      return <BeforeAfterBlock key={block.id} block={block} />;
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
