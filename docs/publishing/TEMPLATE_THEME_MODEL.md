# Template and Theme Model

This document details the template and theme system for ClubOS publishing.
It covers block types, theme tokens, CSS variable generation, and template
structure.

---

## Table of Contents

- [Overview](#overview)
- [Block System](#block-system)
- [Theme Tokens](#theme-tokens)
- [CSS Variable Generation](#css-variable-generation)
- [Template Structure](#template-structure)
- [Security](#security)
- [API Reference](#api-reference)

---

## Overview

The ClubOS publishing system uses three interconnected models:

- **Blocks** - Content building units (hero, text, cards, etc.)
- **Templates** - Reusable page structures with preset blocks
- **Themes** - Visual styling via CSS custom properties (tokens)

### Hierarchy

```
Theme (site-wide styling)
    |
    v
Template (page structure blueprint)
    |
    v
Page (specific content instance)
    |
    v
Blocks (individual content units)
```

---

## Block System

### Available Block Types

| Type | Category | Description |
|------|----------|-------------|
| hero | content | Full-width header with background, title, CTA |
| text | content | Rich text (HTML) content |
| image | media | Single image with caption and optional link |
| cards | content | Grid of content cards (2-4 columns) |
| event-list | interactive | Dynamic list of upcoming events |
| gallery | media | Image gallery grid with lightbox |
| faq | content | Accordion-style Q&A section |
| contact | interactive | Contact form with email submission |
| cta | interactive | Call-to-action button |
| divider | layout | Horizontal separator line |
| spacer | layout | Vertical whitespace |

### Block Structure

All blocks share a base structure:

```typescript
type BaseBlock = {
  id: string;       // UUID, auto-generated
  type: BlockType;  // One of the block types above
  order: number;    // Position in page (0-indexed)
};
```

Each block type adds a `data` field with type-specific properties.

### Hero Block

Full-width header section with optional background image and CTA.

```typescript
type HeroBlock = BaseBlock & {
  type: "hero";
  data: {
    title: string;
    subtitle?: string;
    backgroundImage?: string;      // URL
    backgroundOverlay?: string;    // rgba color
    textColor?: string;            // CSS color
    alignment?: "left" | "center" | "right";
    ctaText?: string;
    ctaLink?: string;
    ctaStyle?: "primary" | "secondary" | "outline";
  };
};
```

### Text Block

Rich text content rendered as HTML.

```typescript
type TextBlock = BaseBlock & {
  type: "text";
  data: {
    content: string;  // HTML content (sanitized)
    alignment?: "left" | "center" | "right";
  };
};
```

### Image Block

Single image with optional caption and link.

```typescript
type ImageBlock = BaseBlock & {
  type: "image";
  data: {
    src: string;       // Image URL
    alt: string;       // Alt text (required for a11y)
    caption?: string;
    width?: string;    // CSS width (e.g., "100%", "500px")
    alignment?: "left" | "center" | "right";
    linkUrl?: string;  // Optional click target
  };
};
```

### Cards Block

Grid of content cards for feature highlights.

```typescript
type CardsBlock = BaseBlock & {
  type: "cards";
  data: {
    columns?: 2 | 3 | 4;  // Default: 3
    cards: Array<{
      title: string;
      description?: string;
      image?: string;      // Card image URL
      linkUrl?: string;
      linkText?: string;
    }>;
  };
};
```

### Event List Block

Dynamic display of events from the database.

```typescript
type EventListBlock = BaseBlock & {
  type: "event-list";
  data: {
    title?: string;                    // Section heading
    limit?: number;                    // Max events (default: 5)
    categories?: string[];             // Filter by category
    showPastEvents?: boolean;          // Default: false
    layout?: "list" | "cards" | "calendar";
  };
};
```

### Gallery Block

Image gallery with optional lightbox.

```typescript
type GalleryBlock = BaseBlock & {
  type: "gallery";
  data: {
    images: Array<{
      src: string;
      alt: string;
      caption?: string;
    }>;
    columns?: 2 | 3 | 4;
    enableLightbox?: boolean;  // Default: true
  };
};
```

### FAQ Block

Accordion-style frequently asked questions.

```typescript
type FaqBlock = BaseBlock & {
  type: "faq";
  data: {
    title?: string;
    items: Array<{
      question: string;
      answer: string;  // HTML content
    }>;
  };
};
```

### Contact Block

Contact form with configurable fields.

```typescript
type ContactBlock = BaseBlock & {
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
      options?: string[];  // For select fields
    }>;
    submitText?: string;  // Default: "Send Message"
  };
};
```

### CTA Block

Call-to-action button.

```typescript
type CtaBlock = BaseBlock & {
  type: "cta";
  data: {
    text: string;
    link: string;
    style?: "primary" | "secondary" | "outline";
    size?: "small" | "medium" | "large";
    alignment?: "left" | "center" | "right";
  };
};
```

### Divider Block

Horizontal separator line.

```typescript
type DividerBlock = BaseBlock & {
  type: "divider";
  data: {
    style?: "solid" | "dashed" | "dotted";
    width?: "full" | "half" | "quarter";
  };
};
```

### Spacer Block

Vertical whitespace for layout control.

```typescript
type SpacerBlock = BaseBlock & {
  type: "spacer";
  data: {
    height?: "small" | "medium" | "large";
  };
};
```

### Page Content Structure

Page content is stored as JSON:

```typescript
type PageContent = {
  schemaVersion: number;  // Currently: 1
  blocks: Block[];        // Array of blocks, ordered by 'order' field
};
```

---

## Theme Tokens

Themes define design tokens that generate CSS custom properties.

### Token Categories

| Category | Purpose | Example Variables |
|----------|---------|-------------------|
| colors | Color palette | --color-primary, --color-text |
| typography | Fonts and sizes | --font-family, --font-size-h1 |
| spacing | Margins and padding | --spacing-md, --spacing-xl |
| borderRadius | Corner rounding | --border-radius-md |
| shadows | Box shadows | --shadow-md, --shadow-lg |

### ThemeTokens Type

```typescript
type ThemeTokens = {
  colors?: {
    primary?: string;       // Brand primary color
    primaryHover?: string;  // Primary hover state
    secondary?: string;     // Accent color
    background?: string;    // Page background
    backgroundAlt?: string; // Alternate background (cards, etc.)
    text?: string;          // Main text color
    textMuted?: string;     // Secondary text
    border?: string;        // Border color
    error?: string;         // Error state
    success?: string;       // Success state
    warning?: string;       // Warning state
    link?: string;          // Link color
    linkHover?: string;     // Link hover color
  };
  typography?: {
    fontFamily?: string;        // Body font stack
    fontFamilyHeading?: string; // Heading font stack
    fontSizeBase?: string;      // Base size (e.g., "16px")
    fontSizeSmall?: string;     // Small text
    fontSizeLarge?: string;     // Large text
    fontSizeH1?: string;        // H1 size
    fontSizeH2?: string;        // H2 size
    fontSizeH3?: string;        // H3 size
    lineHeight?: string;        // Body line height
    headingLineHeight?: string; // Heading line height
  };
  spacing?: {
    xs?: string;   // 4px
    sm?: string;   // 8px
    md?: string;   // 16px
    lg?: string;   // 24px
    xl?: string;   // 32px
    xxl?: string;  // 48px
  };
  borderRadius?: {
    sm?: string;   // 4px
    md?: string;   // 8px
    lg?: string;   // 16px
    full?: string; // 9999px (pill shape)
  };
  shadows?: {
    sm?: string;   // Subtle shadow
    md?: string;   // Medium shadow
    lg?: string;   // Large shadow
  };
};
```

### Default Theme Tokens

The default theme uses Santa Barbara Newcomers Club brand colors:

```typescript
const DEFAULT_THEME_TOKENS: ThemeTokens = {
  colors: {
    primary: "#1a5f7a",      // Ocean blue
    primaryHover: "#134a5e",
    secondary: "#f5a623",    // Sunset gold
    background: "#ffffff",
    backgroundAlt: "#f8f9fa",
    text: "#333333",
    textMuted: "#666666",
    border: "#e0e0e0",
    error: "#dc3545",
    success: "#28a745",
    warning: "#ffc107",
    link: "#1a5f7a",
    linkHover: "#134a5e",
  },
  typography: {
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontFamilyHeading: "system-ui, -apple-system, sans-serif",
    fontSizeBase: "16px",
    fontSizeSmall: "14px",
    fontSizeLarge: "18px",
    fontSizeH1: "32px",
    fontSizeH2: "24px",
    fontSizeH3: "20px",
    lineHeight: "1.6",
    headingLineHeight: "1.3",
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    xxl: "48px",
  },
  borderRadius: {
    sm: "4px",
    md: "8px",
    lg: "16px",
    full: "9999px",
  },
  shadows: {
    sm: "0 1px 2px rgba(0,0,0,0.05)",
    md: "0 4px 6px rgba(0,0,0,0.1)",
    lg: "0 10px 15px rgba(0,0,0,0.1)",
  },
};
```

---

## CSS Variable Generation

### Token to Variable Mapping

Tokens are converted to CSS custom properties using kebab-case naming:

| Token Path | CSS Variable |
|------------|--------------|
| colors.primary | --color-primary |
| colors.primaryHover | --color-primary-hover |
| typography.fontFamily | --font-family |
| typography.fontSizeH1 | --font-size-h1 |
| spacing.md | --spacing-md |
| borderRadius.lg | --border-radius-lg |
| shadows.md | --shadow-md |

### Generated CSS Example

```css
:root {
  /* Colors */
  --color-primary: #1a5f7a;
  --color-primary-hover: #134a5e;
  --color-secondary: #f5a623;
  --color-background: #ffffff;
  --color-background-alt: #f8f9fa;
  --color-text: #333333;
  --color-text-muted: #666666;
  --color-border: #e0e0e0;
  --color-error: #dc3545;
  --color-success: #28a745;
  --color-warning: #ffc107;
  --color-link: #1a5f7a;
  --color-link-hover: #134a5e;

  /* Typography */
  --font-family: system-ui, -apple-system, sans-serif;
  --font-family-heading: system-ui, -apple-system, sans-serif;
  --font-size-base: 16px;
  --font-size-small: 14px;
  --font-size-large: 18px;
  --font-size-h1: 32px;
  --font-size-h2: 24px;
  --font-size-h3: 20px;
  --line-height: 1.6;
  --heading-line-height: 1.3;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 48px;

  /* Border Radius */
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 16px;
  --border-radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
}
```

### Using Variables in Components

Block components use CSS variables with fallbacks:

```css
.hero-block {
  background-color: var(--color-primary, #1a5f7a);
  color: var(--color-background, #ffffff);
  padding: var(--spacing-xxl, 48px);
  border-radius: var(--border-radius-lg, 16px);
}

.card {
  background: var(--color-background-alt, #f8f9fa);
  border: 1px solid var(--color-border, #e0e0e0);
  box-shadow: var(--shadow-md);
}
```

### Theme Inheritance

1. **Hardcoded fallbacks** - Built into CSS (always available)
2. **Default theme tokens** - Applied to :root if no theme set
3. **Custom theme tokens** - Override defaults when theme selected
4. **Per-page CSS** - Optional overrides scoped to page

---

## Template Structure

Templates provide reusable page blueprints.

### Template Types

| Type | Purpose |
|------|---------|
| PAGE | Standard content page template |
| EMAIL | Email message template |

### Template Model

```typescript
type Template = {
  id: string;
  name: string;
  slug: string;           // Unique identifier
  type: "PAGE" | "EMAIL";
  description?: string;
  content: PageContent;   // Default blocks
  themeId?: string;       // Default theme
  isActive: boolean;
};
```

### Example Templates

**Basic Page Template**

```json
{
  "name": "Basic Page",
  "slug": "basic-page",
  "type": "PAGE",
  "content": {
    "schemaVersion": 1,
    "blocks": [
      {
        "id": "hero-1",
        "type": "hero",
        "order": 0,
        "data": {
          "title": "Page Title",
          "alignment": "center"
        }
      },
      {
        "id": "text-1",
        "type": "text",
        "order": 1,
        "data": {
          "content": "<p>Enter your content here...</p>"
        }
      }
    ]
  }
}
```

**Landing Page Template**

```json
{
  "name": "Landing Page",
  "slug": "landing-page",
  "type": "PAGE",
  "content": {
    "schemaVersion": 1,
    "blocks": [
      {
        "id": "hero-1",
        "type": "hero",
        "order": 0,
        "data": {
          "title": "Welcome",
          "subtitle": "Discover our community",
          "ctaText": "Join Now",
          "ctaLink": "/join",
          "alignment": "center"
        }
      },
      {
        "id": "cards-1",
        "type": "cards",
        "order": 1,
        "data": {
          "columns": 3,
          "cards": []
        }
      },
      {
        "id": "cta-1",
        "type": "cta",
        "order": 2,
        "data": {
          "text": "Get Started",
          "link": "/contact",
          "style": "primary",
          "alignment": "center"
        }
      }
    ]
  }
}
```

---

## Security

### CSS Sanitization

Custom CSS is sanitized to prevent XSS attacks.

**Blocked Patterns:**

- `<script>` tags
- `javascript:` URLs
- `expression()` - IE CSS expressions
- `behavior:` - IE behaviors
- `-moz-binding:` - Firefox bindings
- `url(data:...script...)` - Script in data URLs

**Implementation:**

```typescript
function sanitizeCss(css: string): string {
  let sanitized = css;
  sanitized = sanitized.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  sanitized = sanitized.replace(/javascript:/gi, "");
  sanitized = sanitized.replace(/expression\s*\(/gi, "");
  sanitized = sanitized.replace(/behavior\s*:/gi, "");
  sanitized = sanitized.replace(/-moz-binding\s*:/gi, "");
  sanitized = sanitized.replace(
    /url\s*\(\s*["']?\s*data:[^)]*script[^)]*\)/gi,
    ""
  );
  return sanitized;
}
```

### HTML Sanitization

Text block content is sanitized on render to prevent XSS:

- Script tags removed
- Event handlers stripped
- Allowed tags: p, h1-h6, a, strong, em, ul, ol, li, blockquote
- href attributes validated

### Token Validation

Theme tokens are validated before save:

- Must be an object (not array)
- Nested properties must be objects
- String values only (no executable code)

---

## API Reference

### Theme Functions

| Function | Description |
|----------|-------------|
| `generateCssVariables(tokens)` | Generate CSS from tokens |
| `mergeTokensWithDefaults(tokens)` | Merge custom tokens with defaults |
| `getActiveThemeCss()` | Get CSS for active default theme |
| `getThemeById(id)` | Load theme with generated CSS |
| `sanitizeCss(css)` | Remove malicious CSS |
| `validateThemeTokens(tokens)` | Validate token structure |
| `ensureDefaultTheme()` | Create default theme if none exists |

### Block Functions

| Function | Description |
|----------|-------------|
| `createEmptyBlock(type, order)` | Create new block with defaults |
| `validatePageContent(content)` | Validate page content structure |
| `createDefaultPageContent()` | Create default hero + text layout |
| `BLOCK_METADATA` | Block metadata for editor UI |

---

## File Locations

| File | Description |
|------|-------------|
| `src/lib/publishing/theme.ts` | Theme system implementation |
| `src/lib/publishing/blocks.ts` | Block types and utilities |
| `src/components/publishing/BlockRenderer.tsx` | Block rendering component |
| `prisma/schema.prisma` | Database models |

---

## Related Documents

- [Publishing System Plan](./PUBLISHING_SYSTEM_PLAN.md)
- [Auth and RBAC](../rbac/AUTH_AND_RBAC.md)
