// Copyright (c) Santa Barbara Newcomers Club
// Block schema definitions and rendering utilities

// Block types available in the page editor
export type BlockType =
  | "hero"
  | "text"
  | "image"
  | "cards"
  | "event-list"
  | "gallery"
  | "faq"
  | "contact"
  | "cta"
  | "divider"
  | "spacer";

// Base block structure
export type BaseBlock = {
  id: string;
  type: BlockType;
  order: number;
};

// Hero block - full width header with background
export type HeroBlock = BaseBlock & {
  type: "hero";
  data: {
    title: string;
    subtitle?: string;
    backgroundImage?: string;
    backgroundOverlay?: string; // rgba color
    textColor?: string;
    alignment?: "left" | "center" | "right";
    ctaText?: string;
    ctaLink?: string;
    ctaStyle?: "primary" | "secondary" | "outline";
  };
};

// Text block - rich text content
export type TextBlock = BaseBlock & {
  type: "text";
  data: {
    content: string; // HTML content
    alignment?: "left" | "center" | "right";
  };
};

// Image block - single image with optional caption
export type ImageBlock = BaseBlock & {
  type: "image";
  data: {
    src: string;
    alt: string;
    caption?: string;
    width?: string;
    alignment?: "left" | "center" | "right";
    linkUrl?: string;
  };
};

// Cards block - grid of content cards
export type CardsBlock = BaseBlock & {
  type: "cards";
  data: {
    columns?: 2 | 3 | 4;
    cards: Array<{
      title: string;
      description?: string;
      image?: string;
      linkUrl?: string;
      linkText?: string;
    }>;
  };
};

// Event list block - dynamic list of events
export type EventListBlock = BaseBlock & {
  type: "event-list";
  data: {
    title?: string;
    limit?: number;
    categories?: string[];
    showPastEvents?: boolean;
    layout?: "list" | "cards" | "calendar";
  };
};

// Gallery block - image gallery
export type GalleryBlock = BaseBlock & {
  type: "gallery";
  data: {
    images: Array<{
      src: string;
      alt: string;
      caption?: string;
    }>;
    columns?: 2 | 3 | 4;
    enableLightbox?: boolean;
  };
};

// FAQ block - accordion-style FAQ
export type FaqBlock = BaseBlock & {
  type: "faq";
  data: {
    title?: string;
    items: Array<{
      question: string;
      answer: string;
    }>;
  };
};

// Contact block - contact form
export type ContactBlock = BaseBlock & {
  type: "contact";
  data: {
    title?: string;
    description?: string;
    recipientEmail: string;
    fields?: Array<{
      name: string;
      label: string;
      type: "text" | "email" | "textarea" | "select";
      required?: boolean;
      options?: string[]; // for select
    }>;
    submitText?: string;
  };
};

// CTA block - call to action button
export type CtaBlock = BaseBlock & {
  type: "cta";
  data: {
    text: string;
    link: string;
    style?: "primary" | "secondary" | "outline";
    size?: "small" | "medium" | "large";
    alignment?: "left" | "center" | "right";
  };
};

// Divider block - horizontal line
export type DividerBlock = BaseBlock & {
  type: "divider";
  data: {
    style?: "solid" | "dashed" | "dotted";
    width?: "full" | "half" | "quarter";
  };
};

// Spacer block - vertical space
export type SpacerBlock = BaseBlock & {
  type: "spacer";
  data: {
    height?: "small" | "medium" | "large";
  };
};

// Union type of all blocks
export type Block =
  | HeroBlock
  | TextBlock
  | ImageBlock
  | CardsBlock
  | EventListBlock
  | GalleryBlock
  | FaqBlock
  | ContactBlock
  | CtaBlock
  | DividerBlock
  | SpacerBlock;

// Page content structure
export type PageContent = {
  schemaVersion: number;
  blocks: Block[];
};

// Block metadata for the editor
export const BLOCK_METADATA: Record<
  BlockType,
  {
    label: string;
    description: string;
    icon: string;
    category: "content" | "media" | "interactive" | "layout";
  }
> = {
  hero: {
    label: "Hero",
    description: "Full-width header with background image",
    icon: "image",
    category: "content",
  },
  text: {
    label: "Text",
    description: "Rich text content",
    icon: "type",
    category: "content",
  },
  image: {
    label: "Image",
    description: "Single image with caption",
    icon: "image",
    category: "media",
  },
  cards: {
    label: "Cards",
    description: "Grid of content cards",
    icon: "grid",
    category: "content",
  },
  "event-list": {
    label: "Event List",
    description: "Dynamic list of upcoming events",
    icon: "calendar",
    category: "interactive",
  },
  gallery: {
    label: "Gallery",
    description: "Image gallery grid",
    icon: "images",
    category: "media",
  },
  faq: {
    label: "FAQ",
    description: "Frequently asked questions",
    icon: "help-circle",
    category: "content",
  },
  contact: {
    label: "Contact Form",
    description: "Contact form with email submission",
    icon: "mail",
    category: "interactive",
  },
  cta: {
    label: "Call to Action",
    description: "Button with link",
    icon: "mouse-pointer",
    category: "interactive",
  },
  divider: {
    label: "Divider",
    description: "Horizontal line separator",
    icon: "minus",
    category: "layout",
  },
  spacer: {
    label: "Spacer",
    description: "Vertical space",
    icon: "move-vertical",
    category: "layout",
  },
};

/**
 * Create an empty block of a given type
 */
export function createEmptyBlock(type: BlockType, order: number): Block {
  const id = crypto.randomUUID();
  const base = { id, type, order };

  switch (type) {
    case "hero":
      return {
        ...base,
        type: "hero",
        data: { title: "Page Title", alignment: "center" },
      };
    case "text":
      return {
        ...base,
        type: "text",
        data: { content: "<p>Enter your content here...</p>" },
      };
    case "image":
      return {
        ...base,
        type: "image",
        data: { src: "", alt: "Image description" },
      };
    case "cards":
      return {
        ...base,
        type: "cards",
        data: { columns: 3, cards: [] },
      };
    case "event-list":
      return {
        ...base,
        type: "event-list",
        data: { limit: 5, showPastEvents: false, layout: "list" },
      };
    case "gallery":
      return {
        ...base,
        type: "gallery",
        data: { images: [], columns: 3, enableLightbox: true },
      };
    case "faq":
      return {
        ...base,
        type: "faq",
        data: { items: [] },
      };
    case "contact":
      return {
        ...base,
        type: "contact",
        data: {
          recipientEmail: "",
          fields: [
            { name: "name", label: "Name", type: "text", required: true },
            { name: "email", label: "Email", type: "email", required: true },
            { name: "message", label: "Message", type: "textarea", required: true },
          ],
          submitText: "Send Message",
        },
      };
    case "cta":
      return {
        ...base,
        type: "cta",
        data: { text: "Click Here", link: "#", style: "primary", alignment: "center" },
      };
    case "divider":
      return {
        ...base,
        type: "divider",
        data: { style: "solid", width: "full" },
      };
    case "spacer":
      return {
        ...base,
        type: "spacer",
        data: { height: "medium" },
      };
  }
}

/**
 * Validate page content structure
 */
export function validatePageContent(content: unknown): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!content || typeof content !== "object") {
    return { valid: false, errors: ["Content must be an object"] };
  }

  const c = content as Record<string, unknown>;

  if (typeof c.schemaVersion !== "number") {
    errors.push("schemaVersion must be a number");
  }

  if (!Array.isArray(c.blocks)) {
    errors.push("blocks must be an array");
  } else {
    for (let i = 0; i < c.blocks.length; i++) {
      const block = c.blocks[i] as Record<string, unknown>;
      if (!block.id || typeof block.id !== "string") {
        errors.push(`Block ${i}: missing or invalid id`);
      }
      if (!block.type || typeof block.type !== "string") {
        errors.push(`Block ${i}: missing or invalid type`);
      }
      if (typeof block.order !== "number") {
        errors.push(`Block ${i}: missing or invalid order`);
      }
      if (!block.data || typeof block.data !== "object") {
        errors.push(`Block ${i}: missing or invalid data`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Create default page content
 */
export function createDefaultPageContent(): PageContent {
  return {
    schemaVersion: 1,
    blocks: [
      createEmptyBlock("hero", 0),
      createEmptyBlock("text", 1),
    ],
  };
}
