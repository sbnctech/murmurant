<!--
  Copyright © 2025 Murmurant, Inc. All rights reserved.
-->

# Block Types Reference Guide

```
Status: Reference Documentation
Version: 1.0
Created: 2025-12-28
Related: WORK_QUEUE.md, src/lib/publishing/blocks.ts
```

---

## Overview

Murmurant's page editor uses a block-based content system. Each page is composed of reusable blocks that content administrators can arrange and configure. This guide documents all available block types, their properties, and usage examples.

### Block Categories

| Category | Block Types | Description |
|----------|-------------|-------------|
| **Content** | Hero, Text, Cards, FAQ, Testimonial, Stats, Timeline | Text and structured content |
| **Media** | Image, Gallery | Visual content |
| **Interactive** | Event List, Contact, CTA, Flip Cards, Accordion, Tabs, Before/After | User engagement |
| **Layout** | Divider, Spacer | Page structure |

---

## Content Blocks

### Hero

Full-width header with optional background image and call-to-action.

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | string | Yes | Main heading text |
| `subtitle` | string | No | Secondary text below title |
| `backgroundImage` | URL | No | Full-width background image |
| `backgroundOverlay` | rgba color | No | Semi-transparent overlay on background |
| `textColor` | color | No | Text color (default: white) |
| `alignment` | left, center, right | No | Text alignment (default: center) |
| `ctaText` | string | No | Button text |
| `ctaLink` | URL | No | Button destination |
| `ctaStyle` | primary, secondary, outline | No | Button style |

**Example:**
```json
{
  "type": "hero",
  "data": {
    "title": "Welcome to Our Club",
    "subtitle": "Join 500+ members in our community",
    "backgroundImage": "/images/hero-bg.jpg",
    "backgroundOverlay": "rgba(0, 0, 0, 0.4)",
    "ctaText": "Join Now",
    "ctaLink": "/join",
    "ctaStyle": "primary"
  }
}
```

---

### Text

Rich text content block with HTML support.

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `content` | HTML string | Yes | Rich text content |
| `alignment` | left, center, right | No | Text alignment (default: left) |

**Example:**
```json
{
  "type": "text",
  "data": {
    "content": "<p>Welcome to our organization. We're <strong>dedicated</strong> to bringing newcomers together.</p>",
    "alignment": "left"
  }
}
```

---

### Cards

Grid of content cards with optional images and links.

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `columns` | 2, 3, 4 | No | Number of columns (default: 3) |
| `cards` | array | Yes | Array of card objects |

**Card Object:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | string | Yes | Card title |
| `description` | string | No | Card description |
| `image` | URL | No | Card image |
| `linkUrl` | URL | No | Card link destination |
| `linkText` | string | No | Link text (default: "Learn more") |

**Example:**
```json
{
  "type": "cards",
  "data": {
    "columns": 3,
    "cards": [
      {
        "title": "Interest Groups",
        "description": "Join groups for hiking, books, wine, and more.",
        "image": "/images/groups.jpg",
        "linkUrl": "/groups",
        "linkText": "View all groups"
      },
      {
        "title": "Events",
        "description": "Monthly mixers, luncheons, and special events.",
        "image": "/images/events.jpg",
        "linkUrl": "/events"
      }
    ]
  }
}
```

---

### FAQ

Frequently asked questions with expandable answers.

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | string | No | Section heading |
| `items` | array | Yes | Array of Q&A pairs |

**Item Object:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `question` | string | Yes | The question |
| `answer` | string | Yes | The answer |

**Example:**
```json
{
  "type": "faq",
  "data": {
    "title": "Frequently Asked Questions",
    "items": [
      {
        "question": "How do I join?",
        "answer": "Visit our membership page and complete the online application."
      },
      {
        "question": "What is the annual fee?",
        "answer": "Membership is $50 per year, which includes all member benefits."
      }
    ]
  }
}
```

---

### Testimonial

Rotating quotes from members or customers.

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | string | No | Section heading |
| `autoRotate` | boolean | No | Auto-rotate testimonials (default: true) |
| `rotateIntervalMs` | number | No | Rotation interval in ms (default: 5000) |
| `testimonials` | array | Yes | Array of testimonial objects |

**Testimonial Object:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `quote` | string | Yes | The testimonial text |
| `author` | string | Yes | Author name |
| `role` | string | No | Author title/role |
| `image` | URL | No | Author photo |

**Example:**
```json
{
  "type": "testimonial",
  "data": {
    "title": "What Members Say",
    "autoRotate": true,
    "rotateIntervalMs": 5000,
    "testimonials": [
      {
        "quote": "Joining this club was the best decision we made after moving here!",
        "author": "Jane Smith",
        "role": "Member since 2020",
        "image": "/images/members/jane.jpg"
      }
    ]
  }
}
```

---

### Stats

Animated number counters with labels.

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | string | No | Section heading |
| `columns` | 2, 3, 4 | No | Number of columns (default: 3) |
| `stats` | array | Yes | Array of stat objects |

**Stat Object:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `value` | number | Yes | The number to display |
| `prefix` | string | No | Text before number (e.g., "$") |
| `suffix` | string | No | Text after number (e.g., "+", "%", "k") |
| `label` | string | Yes | Description of the stat |

**Example:**
```json
{
  "type": "stats",
  "data": {
    "title": "By the Numbers",
    "columns": 4,
    "stats": [
      { "value": 500, "suffix": "+", "label": "Active Members" },
      { "value": 50, "label": "Events per Year" },
      { "value": 30, "label": "Interest Groups" },
      { "value": 25, "label": "Years Strong" }
    ]
  }
}
```

**Styling:** Displays on primary color background with white text.

---

### Timeline

Vertical chronological layout for history or milestones.

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | string | No | Section heading |
| `events` | array | Yes | Array of timeline events |

**Event Object:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `date` | string | Yes | Date or year (e.g., "2020", "January 2023") |
| `title` | string | Yes | Event title |
| `description` | string | Yes | Event description |
| `image` | URL | No | Optional event image |

**Example:**
```json
{
  "type": "timeline",
  "data": {
    "title": "Our History",
    "events": [
      {
        "date": "1999",
        "title": "Club Founded",
        "description": "Started with just 20 founding members."
      },
      {
        "date": "2010",
        "title": "500 Members",
        "description": "Reached our 500-member milestone.",
        "image": "/images/500-celebration.jpg"
      },
      {
        "date": "2023",
        "title": "Digital Transformation",
        "description": "Launched our new member portal."
      }
    ]
  }
}
```

---

## Media Blocks

### Image

Single image with optional caption and link.

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `src` | URL | Yes | Image source URL |
| `alt` | string | Yes | Alt text for accessibility |
| `caption` | string | No | Image caption |
| `width` | string | No | Image width (e.g., "full", "100%") |
| `alignment` | left, center, right | No | Image alignment (default: center) |
| `linkUrl` | URL | No | Makes image clickable |

**Example:**
```json
{
  "type": "image",
  "data": {
    "src": "/images/group-photo.jpg",
    "alt": "Members at the annual picnic",
    "caption": "Annual Summer Picnic 2023",
    "alignment": "center"
  }
}
```

---

### Gallery

Grid of images with optional lightbox.

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `images` | array | Yes | Array of image objects |
| `columns` | 2, 3, 4 | No | Number of columns (default: 3) |
| `enableLightbox` | boolean | No | Enable click-to-enlarge (default: true) |

**Image Object:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `src` | URL | Yes | Image source |
| `alt` | string | Yes | Alt text |
| `caption` | string | No | Image caption |

**Example:**
```json
{
  "type": "gallery",
  "data": {
    "columns": 4,
    "enableLightbox": true,
    "images": [
      { "src": "/images/event1.jpg", "alt": "Wine tasting", "caption": "Wine Club meetup" },
      { "src": "/images/event2.jpg", "alt": "Hiking group" },
      { "src": "/images/event3.jpg", "alt": "Book club discussion" }
    ]
  }
}
```

---

## Interactive Blocks

### Event List

Dynamic list of upcoming events (requires backend data).

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | string | No | Section heading |
| `limit` | number | No | Maximum events to show (default: 5) |
| `categories` | array | No | Filter by category slugs |
| `showPastEvents` | boolean | No | Include past events (default: false) |
| `layout` | list, cards, calendar | No | Display layout (default: list) |

**Example:**
```json
{
  "type": "event-list",
  "data": {
    "title": "Upcoming Events",
    "limit": 6,
    "categories": ["social", "educational"],
    "layout": "cards"
  }
}
```

---

### Contact

Contact form with configurable fields.

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | string | No | Form heading |
| `description` | string | No | Introductory text |
| `recipientEmail` | email | Yes | Email to receive submissions |
| `fields` | array | No | Custom form fields |
| `submitText` | string | No | Submit button text (default: "Send Message") |

**Field Object:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | Yes | Field name (for form data) |
| `label` | string | Yes | Display label |
| `type` | text, email, textarea, select | Yes | Field type |
| `required` | boolean | No | Is field required |
| `options` | array | No | Options for select fields |

**Example:**
```json
{
  "type": "contact",
  "data": {
    "title": "Get in Touch",
    "description": "Have questions? We'd love to hear from you.",
    "recipientEmail": "info@example.org",
    "fields": [
      { "name": "name", "label": "Your Name", "type": "text", "required": true },
      { "name": "email", "label": "Email Address", "type": "email", "required": true },
      { "name": "subject", "label": "Subject", "type": "select", "options": ["Membership", "Events", "Volunteering", "Other"] },
      { "name": "message", "label": "Message", "type": "textarea", "required": true }
    ],
    "submitText": "Send Message"
  }
}
```

---

### CTA (Call to Action)

Standalone button with configurable style.

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `text` | string | Yes | Button text |
| `link` | URL | Yes | Button destination |
| `style` | primary, secondary, outline | No | Button style (default: primary) |
| `size` | small, medium, large | No | Button size (default: medium) |
| `alignment` | left, center, right | No | Button alignment (default: center) |

**Example:**
```json
{
  "type": "cta",
  "data": {
    "text": "Join Today",
    "link": "/membership/join",
    "style": "primary",
    "size": "large",
    "alignment": "center"
  }
}
```

---

### Flip Cards

Interactive cards that flip on hover to reveal back content.

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `columns` | 2, 3, 4 | No | Number of columns (default: 3) |
| `cards` | array | Yes | Array of flip card objects |

**Card Object:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `frontImage` | URL | Yes | Front side image |
| `frontImageAlt` | string | Yes | Alt text for front image |
| `backTitle` | string | Yes | Title on back side |
| `backDescription` | string | Yes | Description on back side |
| `backGradient` | CSS gradient | No | Background gradient for back |
| `backTextColor` | color | No | Text color for back (default: white) |
| `linkUrl` | URL | No | Optional link on back |
| `linkText` | string | No | Link text (default: "Learn more") |

**Example:**
```json
{
  "type": "flip-card",
  "data": {
    "columns": 3,
    "cards": [
      {
        "frontImage": "/images/hiking.jpg",
        "frontImageAlt": "Hiking group on trail",
        "backTitle": "Hiking Club",
        "backDescription": "Weekly hikes for all skill levels in the local mountains.",
        "backGradient": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "linkUrl": "/groups/hiking",
        "linkText": "Join this group"
      },
      {
        "frontImage": "/images/books.jpg",
        "frontImageAlt": "Book club meeting",
        "backTitle": "Book Club",
        "backDescription": "Monthly discussions of fiction and non-fiction.",
        "backGradient": "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
      }
    ]
  }
}
```

**Accessibility:** Cards are keyboard-focusable and flip on focus as well as hover.

---

### Accordion

Expandable/collapsible content sections.

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | string | No | Section heading |
| `allowMultiple` | boolean | No | Allow multiple panels open (default: false) |
| `items` | array | Yes | Array of accordion items |

**Item Object:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | string | Yes | Panel header |
| `content` | HTML string | Yes | Panel content |
| `defaultOpen` | boolean | No | Open by default |

**Example:**
```json
{
  "type": "accordion",
  "data": {
    "title": "Membership Benefits",
    "allowMultiple": true,
    "items": [
      {
        "title": "Social Events",
        "content": "<p>Access to monthly mixers, luncheons, and special events.</p>",
        "defaultOpen": true
      },
      {
        "title": "Interest Groups",
        "content": "<p>Join any of our 30+ interest groups at no additional cost.</p>"
      },
      {
        "title": "Member Directory",
        "content": "<p>Connect with fellow members through our searchable directory.</p>"
      }
    ]
  }
}
```

**Implementation:** Uses native `<details>` element for accessibility.

---

### Tabs

Tabbed content panels for organizing related content.

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `alignment` | left, center, right | No | Tab bar alignment (default: left) |
| `tabs` | array | Yes | Array of tab objects |

**Tab Object:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `label` | string | Yes | Tab button text |
| `content` | HTML string | Yes | Tab panel content |

**Example:**
```json
{
  "type": "tabs",
  "data": {
    "alignment": "center",
    "tabs": [
      {
        "label": "About",
        "content": "<p>We're a social club for newcomers to the Santa Barbara area.</p>"
      },
      {
        "label": "Leadership",
        "content": "<p>Meet our volunteer board members who keep the club running.</p>"
      },
      {
        "label": "History",
        "content": "<p>Founded in 1999, we've been welcoming newcomers for 25+ years.</p>"
      }
    ]
  }
}
```

**Note:** Server-rendered with first tab selected by default.

---

### Before/After

Draggable slider comparing two images (before and after).

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | string | No | Section heading |
| `beforeImage` | URL | Yes | "Before" image URL |
| `beforeAlt` | string | Yes | Alt text for before image |
| `beforeLabel` | string | No | Label for before side (e.g., "Before") |
| `afterImage` | URL | Yes | "After" image URL |
| `afterAlt` | string | Yes | Alt text for after image |
| `afterLabel` | string | No | Label for after side (e.g., "After") |
| `initialPosition` | 0-100 | No | Initial slider position (default: 50) |
| `aspectRatio` | 16:9, 4:3, 1:1, 3:2 | No | Image aspect ratio (default: 16:9) |

**Example:**
```json
{
  "type": "before-after",
  "data": {
    "title": "Venue Transformation",
    "beforeImage": "/images/venue-before.jpg",
    "beforeAlt": "Venue before renovation",
    "beforeLabel": "Before",
    "afterImage": "/images/venue-after.jpg",
    "afterAlt": "Venue after renovation",
    "afterLabel": "After",
    "initialPosition": 50,
    "aspectRatio": "16:9"
  }
}
```

**Interaction:** Supports mouse drag and touch/swipe on mobile devices.

---

## Layout Blocks

### Divider

Horizontal line separator.

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `style` | solid, dashed, dotted | No | Line style (default: solid) |
| `width` | full, half, quarter | No | Line width (default: full) |

**Example:**
```json
{
  "type": "divider",
  "data": {
    "style": "solid",
    "width": "half"
  }
}
```

---

### Spacer

Vertical whitespace.

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `height` | small, medium, large | No | Space height (default: medium) |

**Height Values:**

- `small`: 24px
- `medium`: 48px
- `large`: 96px

**Example:**
```json
{
  "type": "spacer",
  "data": {
    "height": "large"
  }
}
```

---

## Block Structure

All blocks share a common structure:

```typescript
{
  id: string;        // Unique identifier (UUID)
  type: BlockType;   // Block type identifier
  order: number;     // Position in page (0-indexed)
  data: object;      // Type-specific properties
}
```

### Page Content Format

```json
{
  "schemaVersion": 1,
  "blocks": [
    { "id": "abc-123", "type": "hero", "order": 0, "data": { ... } },
    { "id": "def-456", "type": "text", "order": 1, "data": { ... } }
  ]
}
```

---

## Related Documents

| Document | Relationship |
|----------|--------------|
| [WORK_QUEUE.md](../backlog/WORK_QUEUE.md) | Block type backlog items (A6-A12) |
| [PUBLISHING_AND_CONTENT_LIFECYCLE.md](../BIZ/PUBLISHING_AND_CONTENT_LIFECYCLE.md) | Publishing workflow |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/lib/publishing/blocks.ts` | Block type definitions |
| `src/lib/publishing/blockSchemas.ts` | Zod validation schemas |
| `src/components/publishing/BlockRenderer.tsx` | React rendering components |

---

_This document describes all available block types. For editor usage, see the admin documentation._
