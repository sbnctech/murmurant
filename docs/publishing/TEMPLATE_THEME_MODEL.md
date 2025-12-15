# Template and Theme Model

Version: 0.1.0
Status: Draft
Date: 2025-12-15

---

## Overview

This document describes the template and theme system for ClubOS publishing. The goal is to provide flexible, token-based styling that avoids WildApricot-era rigidity while maintaining brand consistency.


---

## 1. Theme System

### What is a Theme?

A theme defines the visual appearance of pages through CSS custom properties (design tokens). Themes control:

- Colors (brand palette)
- Typography (fonts, sizes)
- Spacing (padding, margins)
- Border radius
- Shadows

### Theme Token Structure

```typescript
type ThemeTokens = {
  colors?: {
    primary?: string;       // Main brand color
    primaryHover?: string;  // Hover state
    secondary?: string;     // Accent color
    background?: string;    // Page background
    backgroundAlt?: string; // Alternate sections
    text?: string;          // Main text
    textMuted?: string;     // Secondary text
    border?: string;        // Borders
    error?: string;         // Error states
    success?: string;       // Success states
    warning?: string;       // Warning states
    link?: string;          // Link text
    linkHover?: string;     // Link hover
  };
  typography?: {
    fontFamily?: string;        // Body font
    fontFamilyHeading?: string; // Heading font
    fontSizeBase?: string;      // Base size (16px)
    fontSizeSmall?: string;     // Small text
    fontSizeLarge?: string;     // Large text
    fontSizeH1?: string;        // H1 size
    fontSizeH2?: string;        // H2 size
    fontSizeH3?: string;        // H3 size
    lineHeight?: string;        // Body line height
    headingLineHeight?: string; // Heading line height
  };
  spacing?: {
    xs?: string;  // 4px
    sm?: string;  // 8px
    md?: string;  // 16px
    lg?: string;  // 24px
    xl?: string;  // 32px
    xxl?: string; // 48px
  };
  borderRadius?: {
    sm?: string;   // 4px
    md?: string;   // 8px
    lg?: string;   // 16px
    full?: string; // 9999px (pill)
  };
  shadows?: {
    sm?: string; // Subtle shadow
    md?: string; // Medium shadow
    lg?: string; // Prominent shadow
  };
};
```

### Default Theme Tokens

The system provides sensible defaults that work out of the box:

```typescript
const DEFAULT_THEME_TOKENS: ThemeTokens = {
  colors: {
    primary: "#1a5f7a",      // SBNC blue
    primaryHover: "#134a5e",
    secondary: "#f5a623",    // Accent gold
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

### CSS Variable Generation

Tokens are converted to CSS custom properties:

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


---

## 2. Theme Customization

### Token Overrides

Themes can override any token. Unspecified tokens inherit from defaults.

Example: Holiday theme with festive colors:

```json
{
  "colors": {
    "primary": "#c41e3a",
    "secondary": "#228b22",
    "backgroundAlt": "#fef6e4"
  }
}
```

Only the specified tokens change; all others use defaults.

### Custom CSS

Themes can include additional CSS for advanced styling:

```css
/* Custom CSS for holiday theme */
.hero-block {
  background-image: url('/assets/snowflakes.svg');
  background-repeat: repeat;
}

.cta-block button {
  border: 2px solid var(--color-secondary);
}
```

Custom CSS is:

- Appended after token CSS
- Sanitized to remove script vectors
- Limited to 50KB

### CSS Sanitization

The following are removed from custom CSS:

- `<script>` tags
- `javascript:` URLs
- `expression()` (IE-specific JS execution)
- `behavior:` property (IE-specific)
- `-moz-binding:` property (Firefox-specific)
- `data:` URLs containing "script"


---

## 3. Template System

### What is a Template?

A template defines a reusable page structure with predefined blocks and configuration. Templates help maintain consistency across similar pages.

### Template Types

| Type | Use Case |
|------|----------|
| `PAGE` | Standard content pages |
| `LANDING` | Marketing/landing pages |
| `EMAIL` | Email message layouts |

### Template Schema

Templates define which blocks are included and their default data:

```typescript
type TemplateContent = {
  schemaVersion: number;
  blocks: Array<{
    id: string;
    type: BlockType;
    order: number;
    data: Record<string, unknown>;
    locked?: boolean;      // Cannot be removed
    configurable?: boolean; // Can be edited (default: true)
  }>;
};
```

### Example: Standard Page Template

```json
{
  "schemaVersion": 1,
  "blocks": [
    {
      "id": "header",
      "type": "hero",
      "order": 0,
      "data": {
        "title": "Page Title",
        "alignment": "center"
      },
      "locked": false,
      "configurable": true
    },
    {
      "id": "content",
      "type": "text",
      "order": 1,
      "data": {
        "content": "<p>Enter your content here...</p>"
      },
      "locked": false,
      "configurable": true
    }
  ]
}
```

### Example: Contact Page Template

```json
{
  "schemaVersion": 1,
  "blocks": [
    {
      "id": "header",
      "type": "hero",
      "order": 0,
      "data": {
        "title": "Contact Us",
        "subtitle": "We'd love to hear from you",
        "alignment": "center"
      }
    },
    {
      "id": "intro",
      "type": "text",
      "order": 1,
      "data": {
        "content": "<p>Fill out the form below and we'll get back to you soon.</p>",
        "alignment": "center"
      }
    },
    {
      "id": "form",
      "type": "contact",
      "order": 2,
      "data": {
        "recipientEmail": "info@sbnewcomers.org",
        "fields": [
          { "name": "name", "label": "Your Name", "type": "text", "required": true },
          { "name": "email", "label": "Email", "type": "email", "required": true },
          { "name": "message", "label": "Message", "type": "textarea", "required": true }
        ],
        "submitText": "Send Message"
      },
      "locked": true
    }
  ]
}
```


---

## 4. Inheritance Model

### CSS Cascade

The styling cascade from lowest to highest priority:

1. **Browser defaults** - Base HTML styles
2. **Default tokens** - System fallbacks
3. **Theme tokens** - Active theme CSS variables
4. **Theme custom CSS** - Additional theme styles
5. **Page custom CSS** - Page-specific overrides
6. **Block inline styles** - Direct block styling

### Token Merging

When rendering a page:

```
DEFAULT_THEME_TOKENS
    |
    v
+--------------------+
| Theme.tokens       |  <-- Merge (theme overrides defaults)
+--------------------+
    |
    v
generateCssVariables()
    |
    v
+--------------------+
| Theme.cssText      |  <-- Append (custom CSS)
+--------------------+
    |
    v
+--------------------+
| Page.customCss     |  <-- Append (page CSS, scoped)
+--------------------+
    |
    v
Final CSS output
```


---

## 5. Per-Page Overrides

### When to Use

Use per-page CSS for:

- Unique landing pages with special layouts
- Event-specific styling
- Seasonal or promotional pages

### Scoping

Page CSS is scoped to prevent style bleed:

```css
/* Input */
.hero-block { background: red; }

/* Output (scoped) */
.page-about .hero-block { background: red; }
```

### Example: Event Landing Page

```css
/* Page: annual-gala */
.page-annual-gala {
  --color-primary: #8b0000;
  --color-secondary: #ffd700;
}

.page-annual-gala .hero-block {
  min-height: 80vh;
  background-size: cover;
}

.page-annual-gala .cta-block button {
  font-size: 1.25em;
  padding: var(--spacing-lg);
}
```


---

## 6. Block Styling

### Base Block Styles

All blocks share common base styles from the theme:

```css
.block {
  padding: var(--spacing-lg) var(--spacing-md);
  margin: 0 auto;
  max-width: 1200px;
}

.block h1 {
  font-family: var(--font-family-heading);
  font-size: var(--font-size-h1);
  line-height: var(--heading-line-height);
  color: var(--color-text);
}

.block p {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  line-height: var(--line-height);
  color: var(--color-text);
}

.block a {
  color: var(--color-link);
}

.block a:hover {
  color: var(--color-link-hover);
}
```

### Block-Specific Styles

Each block type has its own styles:

```css
/* Hero Block */
.hero-block {
  text-align: center;
  padding: var(--spacing-xxl) var(--spacing-md);
  background-color: var(--color-background-alt);
}

.hero-block h1 {
  margin-bottom: var(--spacing-md);
}

.hero-block .cta-button {
  display: inline-block;
  padding: var(--spacing-md) var(--spacing-xl);
  background-color: var(--color-primary);
  color: white;
  border-radius: var(--border-radius-md);
  text-decoration: none;
}

/* Cards Block */
.cards-block {
  display: grid;
  gap: var(--spacing-lg);
}

.cards-block.columns-3 {
  grid-template-columns: repeat(3, 1fr);
}

.cards-block .card {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

/* FAQ Block */
.faq-block details {
  border-bottom: 1px solid var(--color-border);
  padding: var(--spacing-md) 0;
}

.faq-block summary {
  cursor: pointer;
  font-weight: 600;
}

.faq-block summary:hover {
  color: var(--color-primary);
}
```


---

## 7. Responsive Design

### Breakpoints

Standard breakpoints (not tokens, hardcoded):

```css
/* Mobile first */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

### Responsive Blocks

Blocks adapt to screen size:

```css
/* Cards responsive */
.cards-block {
  grid-template-columns: 1fr;
}

@media (min-width: 640px) {
  .cards-block.columns-3 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .cards-block.columns-3 {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Hero responsive */
.hero-block h1 {
  font-size: calc(var(--font-size-h1) * 0.75);
}

@media (min-width: 768px) {
  .hero-block h1 {
    font-size: var(--font-size-h1);
  }
}
```


---

## 8. Theme Management

### Creating a Theme

1. Navigate to Admin > Content > Themes
2. Click "Create Theme"
3. Enter name, slug, description
4. Edit token values using the visual editor
5. Optionally add custom CSS
6. Save as Draft or set as Active

### Theme States

| Status | Description |
|--------|-------------|
| `DRAFT` | Work in progress, not available for pages |
| `ACTIVE` | Available for pages to use |
| `ARCHIVED` | Hidden, preserved for history |

### Default Theme

One theme can be marked as default. New pages use the default theme unless overridden. The site uses the default active theme for public rendering.


---

## 9. Migration Notes

### From WildApricot

WildApricot themes cannot be directly imported due to different architecture. Migration approach:

1. Extract color palette from WA theme
2. Create new ClubOS theme with matching colors
3. Recreate custom styles as token overrides or custom CSS
4. Test with sample pages


### Avoiding WA Rigidity

Key differences from WildApricot:

| WildApricot | ClubOS |
|-------------|--------|
| Fixed templates | Flexible block composition |
| Global CSS only | Per-page overrides allowed |
| Opaque styling | Token-based customization |
| Complex widget system | Simple block types |


---

## Appendix: Code Locations

| File | Purpose |
|------|---------|
| `src/lib/publishing/theme.ts` | Theme token types and CSS generation |
| `src/lib/publishing/blocks.ts` | Block type definitions |
| `src/app/api/admin/content/themes/` | Theme CRUD API |
| `src/app/api/admin/content/templates/` | Template CRUD API |
| `prisma/schema.prisma` | Theme and Template models |
