// Copyright © 2025 Murmurant, Inc.
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
  | "spacer"
  | "flip-card"
  | "accordion"
  | "tabs"
  | "testimonial"
  | "stats"
  | "timeline"
  | "before-after"
  | "gadget";

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

// FlipCard block - 3D flip card with image front, text back
export type FlipCardBlock = BaseBlock & {
  type: "flip-card";
  data: {
    cards: Array<{
      frontImage: string;
      frontImageAlt: string;
      backTitle: string;
      backDescription: string;
      backGradient?: string; // CSS gradient e.g. "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      backTextColor?: string;
      linkUrl?: string;
      linkText?: string;
    }>;
    columns?: 2 | 3 | 4;
  };
};

// Accordion block - expandable/collapsible content sections
export type AccordionBlock = BaseBlock & {
  type: "accordion";
  data: {
    title?: string;
    allowMultiple?: boolean; // Allow multiple panels open at once
    items: Array<{
      title: string;
      content: string; // HTML content
      defaultOpen?: boolean;
    }>;
  };
};

// Tabs block - tabbed content panels
export type TabsBlock = BaseBlock & {
  type: "tabs";
  data: {
    tabs: Array<{
      label: string;
      content: string; // HTML content
    }>;
    alignment?: "left" | "center" | "right";
  };
};

// Testimonial block - rotating quotes/testimonials
export type TestimonialBlock = BaseBlock & {
  type: "testimonial";
  data: {
    title?: string;
    autoRotate?: boolean;
    rotateIntervalMs?: number;
    testimonials: Array<{
      quote: string;
      author: string;
      role?: string;
      image?: string;
    }>;
  };
};

// Stats block - animated number counters
export type StatsBlock = BaseBlock & {
  type: "stats";
  data: {
    title?: string;
    columns?: 2 | 3 | 4;
    stats: Array<{
      value: number;
      suffix?: string; // e.g., "+", "%", "k"
      prefix?: string; // e.g., "$"
      label: string;
    }>;
  };
};

// Timeline block - vertical chronological layout
export type TimelineBlock = BaseBlock & {
  type: "timeline";
  data: {
    title?: string;
    events: Array<{
      date: string;
      title: string;
      description: string;
      image?: string;
    }>;
  };
};

// BeforeAfter block - draggable slider comparing two images
export type BeforeAfterBlock = BaseBlock & {
  type: "before-after";
  data: {
    title?: string;
    beforeImage: string;
    beforeAlt: string;
    beforeLabel?: string; // e.g., "Before"
    afterImage: string;
    afterAlt: string;
    afterLabel?: string; // e.g., "After"
    initialPosition?: number; // 0-100, default 50
    aspectRatio?: "16:9" | "4:3" | "1:1" | "3:2";
  };
};

// Gadget block - interactive dashboard widget
export type GadgetBlock = BaseBlock & {
  type: "gadget";
  data: {
    gadgetId: string; // "upcoming-events", "my-registrations", etc.
    title?: string; // Override default title
    showTitle?: boolean; // Show/hide title (default: true)
    layout?: "card" | "inline"; // Card with border or inline
    maxItems?: number; // For list gadgets
    // RBAC visibility settings
    visibility?: "public" | "members" | "officers" | "roles"; // Who can see this gadget
    allowedRoles?: string[]; // Specific roles when visibility="roles"
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
  | SpacerBlock
  | FlipCardBlock
  | AccordionBlock
  | TabsBlock
  | TestimonialBlock
  | StatsBlock
  | TimelineBlock
  | BeforeAfterBlock
  | GadgetBlock;

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
  "flip-card": {
    label: "Flip Cards",
    description: "Interactive cards that flip on hover",
    icon: "layers",
    category: "interactive",
  },
  accordion: {
    label: "Accordion",
    description: "Expandable/collapsible content sections",
    icon: "chevrons-down",
    category: "interactive",
  },
  tabs: {
    label: "Tabs",
    description: "Tabbed content panels",
    icon: "folder",
    category: "interactive",
  },
  testimonial: {
    label: "Testimonials",
    description: "Rotating quotes and testimonials",
    icon: "quote",
    category: "content",
  },
  stats: {
    label: "Stats Counter",
    description: "Animated number counters",
    icon: "bar-chart",
    category: "content",
  },
  timeline: {
    label: "Timeline",
    description: "Vertical chronological layout",
    icon: "clock",
    category: "content",
  },
  "before-after": {
    label: "Before/After",
    description: "Draggable slider comparing two images",
    icon: "columns",
    category: "interactive",
  },
  gadget: {
    label: "Gadget",
    description: "Interactive widget (events, registrations, etc.)",
    icon: "zap",
    category: "interactive",
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
    case "flip-card":
      return {
        ...base,
        type: "flip-card",
        data: {
          columns: 3,
          cards: [
            {
              frontImage: "",
              frontImageAlt: "Card image",
              backTitle: "Card Title",
              backDescription: "Description shown on hover",
              backGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              backTextColor: "#ffffff",
            },
          ],
        },
      };
    case "accordion":
      return {
        ...base,
        type: "accordion",
        data: {
          allowMultiple: false,
          items: [
            { title: "Section 1", content: "<p>Content for section 1</p>", defaultOpen: true },
            { title: "Section 2", content: "<p>Content for section 2</p>" },
          ],
        },
      };
    case "tabs":
      return {
        ...base,
        type: "tabs",
        data: {
          alignment: "left",
          tabs: [
            { label: "Tab 1", content: "<p>Content for tab 1</p>" },
            { label: "Tab 2", content: "<p>Content for tab 2</p>" },
          ],
        },
      };
    case "testimonial":
      return {
        ...base,
        type: "testimonial",
        data: {
          autoRotate: true,
          rotateIntervalMs: 5000,
          testimonials: [
            { quote: "This is a great organization!", author: "Jane Doe", role: "Member since 2020" },
          ],
        },
      };
    case "stats":
      return {
        ...base,
        type: "stats",
        data: {
          columns: 3,
          stats: [
            { value: 500, suffix: "+", label: "Members" },
            { value: 50, label: "Events per Year" },
            { value: 30, label: "Interest Groups" },
          ],
        },
      };
    case "timeline":
      return {
        ...base,
        type: "timeline",
        data: {
          events: [
            { date: "2020", title: "Founded", description: "Our organization was established" },
            { date: "2022", title: "Milestone", description: "Reached 500 members" },
          ],
        },
      };
    case "before-after":
      return {
        ...base,
        type: "before-after",
        data: {
          beforeImage: "",
          beforeAlt: "Before image",
          beforeLabel: "Before",
          afterImage: "",
          afterAlt: "After image",
          afterLabel: "After",
          initialPosition: 50,
          aspectRatio: "16:9",
        },
      };
    case "gadget":
      return {
        ...base,
        type: "gadget",
        data: {
          gadgetId: "upcoming-events",
          showTitle: true,
          layout: "card",
          visibility: "members", // Default to members-only
        },
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
