# Murmurant Brand Guide

This document defines the Murmurant brand identity, ensuring consistency across all communications and touchpoints.

---

## 1. Brand Overview

### Why "Murmurant"?

When someone asks about the name, here's how to explain it:

**The 10-Second Answer:**
> "It comes from 'murmuration' - when thousands of starlings fly together as one. No single bird leads; they move by responding to their neighbors. That's how the best organizations work too."

**The 30-Second Answer (for board members, prospects):**
> "Murmurant comes from 'murmuration' - the phenomenon where thousands of starlings fly in perfect synchronization without any single leader. Each bird responds to its neighbors, and together they create something beautiful and effective.
>
> That's exactly what we help organizations do. Your committees, your volunteers, your members - they're all moving toward shared goals. We're the system that helps them stay in sync."

**The Deeper Story (for those who want it):**
> "Have you ever seen a murmuration? Thousands of starlings swooping and diving as one organism - no conductor, no central command. Scientists discovered that each bird only tracks seven neighbors, following simple rules. From that simplicity emerges something extraordinary.
>
> That's the philosophy behind Murmurant. We don't believe in rigid top-down systems that force organizations into boxes. We believe in simple, clear tools that let your people coordinate naturally. The board sets direction, committees do their work, members participate - and together you create something none of you could alone.
>
> The word itself means 'that which murmurs' - the soft sound of many voices together. It felt right for software that's meant to amplify communities, not replace them."

---

### Brand Story

**Murmurant** takes its name from the murmuration - the mesmerizing phenomenon where thousands of starlings fly together in synchronized, fluid formations. No single bird leads; instead, each responds to its neighbors, creating emergent collective intelligence.

This is the perfect metaphor for the communities we serve:

- **Collective action** - Many members moving together toward shared goals
- **Pooled wisdom** - Decisions emerge from the group, not top-down
- **Shared resources** - Each member benefits from the organization's strength
- **United purpose** - Individual actions create something greater than the sum
- **Effortless coordination** - Complex behavior from simple, clear rules
- **Emergent beauty** - When done right, organizations create something beautiful

### Mission

**"Empowering communities to move as one"**

Murmurant exists to give clubs and community organizations the tools they need to flourish. We remove administrative friction so leaders can focus on what matters: bringing people together.

### Vision

**Modern organization management that feels natural**

We believe software should adapt to how people naturally work, not the other way around. Murmurant combines powerful capabilities with intuitive design, making sophisticated organization management accessible to everyone.

### Values

- **Simplicity** - We eliminate complexity. Every feature should feel obvious and every workflow should be streamlined. If it takes more than three clicks, we rethink it.

- **Connection** - We strengthen bonds between people. Our platform facilitates meaningful relationships, not just transactions. Members should feel welcomed, not processed.

- **Trust** - We earn confidence through transparency and reliability. Data is protected, actions are auditable, and the system works when you need it.

- **Harmony** - Like a murmuration, we believe in collective strength. Individual members and their unique contributions create something greater together.

---

## 2. Logo Usage

### Primary Logo (Horizontal Wordmark + Symbol)

The primary logo combines the Murmurant wordmark with the murmuration symbol - an abstract pattern of dots suggesting birds in coordinated flight.

**File:** `public/brand/murmurant-logo.svg`

**Usage guidelines:**

- Use on website headers, marketing materials, and official documents
- Preferred for introductions where brand recognition is being established
- Always maintain horizontal orientation

### Bug (Icon Only)

The bug is the standalone murmuration symbol, used when the full logo won't fit or when Murmurant is already established in context.

**File:** `public/brand/murmurant-bug.svg`

**Usage guidelines:**

- Use for favicons, app icons, and social media avatars
- Appropriate for small UI elements where text would be illegible
- Use only when Murmurant has already been identified elsewhere on the page/screen

### Wordmark Only

The wordmark can be used without the symbol when the context is clear.

**File:** `public/brand/murmurant-wordmark.svg`

### Dark Background Version

For use on dark backgrounds, use the inverted color version.

**File:** `public/brand/murmurant-logo-dark.svg`

### Monochrome Version

For single-color applications (print, embroidery, etc.), use the monochrome version.

**File:** `public/brand/murmurant-bug-mono.svg`

### Clear Space Rules

Maintain minimum clear space around the logo equal to the height of the "u" in Murmurant. This ensures the logo remains visually distinct and uncluttered.

**Never:**

- Place the logo on busy backgrounds without sufficient contrast
- Crowd the logo with other elements
- Place text or graphics within the clear space zone

### Minimum Sizes

To ensure legibility and brand integrity, observe these minimum sizes:

| Logo Version | Print (mm) | Digital (px) |
|--------------|------------|--------------|
| Primary Logo | 30mm wide  | 150px wide   |
| Bug Only     | 10mm wide  | 32px wide    |

---

## 3. Color Palette

### Primary Colors

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| Twilight Blue | `#1a365d` | 26, 54, 93 | Primary brand color, logo, headings |
| Deep Blue | `#1e40af` | 30, 64, 175 | Hover states, emphasis |
| Sunset Orange | `#ed8936` | 237, 137, 54 | Accent, CTAs, highlights |

### Secondary Colors

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| Dusk Purple | `#805ad5` | 128, 90, 213 | Secondary accent, transitions |
| Success Green | `#059669` | 5, 150, 105 | Confirmations, positive states |
| Alert Red | `#dc2626` | 220, 38, 38 | Errors, destructive actions |
| Warm Amber | `#f59e0b` | 245, 158, 11 | Warnings, attention |

### Neutral Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Gray 900 | `#1f2937` | Primary text |
| Gray 700 | `#374151` | Secondary text |
| Gray 600 | `#4b5563` | Muted text |
| Gray 400 | `#9ca3af` | Placeholder text, disabled states |
| Gray 200 | `#e5e7eb` | Borders, dividers |
| Gray 100 | `#f3f4f6` | Subtle backgrounds |
| Gray 50 | `#f9fafb` | Page backgrounds |
| White | `#ffffff` | Cards, clean spaces |

### Color Usage Guidelines

- **Twilight Blue** is the dominant brand color - use it for the logo, main headings, and primary navigation
- **Sunset Orange** adds warmth and energy - use sparingly for CTAs and key highlights
- **Dusk Purple** creates visual interest in transitions and secondary elements
- Neutrals provide the foundation - most UI should use the neutral palette

---

## 4. Typography

### Primary Typeface

**Inter** - A clean, modern sans-serif designed for screens.

- Available from Google Fonts: `https://fonts.google.com/specimen/Inter`
- Excellent readability at all sizes
- Supports a wide range of weights

### Fallback Stack

```css
font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Type Scale

| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|----------------|
| H1 | 32px | 700 (Bold) | 1.2 | -0.02em |
| H2 | 24px | 600 (Semibold) | 1.25 | -0.01em |
| H3 | 20px | 600 (Semibold) | 1.3 | 0 |
| H4 | 18px | 600 (Semibold) | 1.4 | 0 |
| Body | 16px | 400 (Regular) | 1.5 | 0 |
| Small | 14px | 400 (Regular) | 1.5 | 0 |
| Caption | 12px | 500 (Medium) | 1.4 | 0.02em |

---

## 5. Voice & Tone

### Brand Voice

Murmurant speaks with:

- **Clarity** - We say what we mean, simply and directly
- **Warmth** - We're friendly without being overly casual
- **Confidence** - We're helpful experts, not pushy salespeople
- **Respect** - We value our users' time and intelligence
- **Collectivism** - We emphasize "we" and "together" over individual action

### Tone Variations

| Context | Tone | Example |
|---------|------|---------|
| Success messages | Encouraging, celebratory | "You're all set! The event is now live." |
| Error messages | Helpful, non-blaming | "We couldn't save your changes. Check your connection and try again." |
| Empty states | Inviting, actionable | "No events yet. Create your first one to get started." |
| Confirmations | Clear, reassuring | "This will remove the member from the committee. They'll keep their organization membership." |
| Onboarding | Welcoming, supportive | "Welcome to the flock! Let's get your organization set up." |

### Writing Guidelines

- **Use "you" and "your"** - Speak directly to the user
- **Embrace collective language** - "We're in this together"
- **Avoid jargon** - Say "members" not "stakeholders"
- **Be specific** - Say "3 members registered" not "some members registered"
- **Use active voice** - Say "You created an event" not "An event was created"
- **Keep it brief** - Respect users' time with concise messaging

---

## 6. Imagery

### Photography Style

- **Authentic** - Real people in real settings, not stock photo poses
- **Diverse** - Reflect the variety of communities Murmurant serves
- **Warm** - Natural lighting, welcoming environments
- **Active** - People engaged in activities, not just portraits
- **Together** - Emphasize groups and connections, not isolated individuals

### Illustration Style

When illustrations are used:

- **Flowing, organic shapes** - Reflect the murmuration aesthetic
- **Dot patterns** - Reference the logo's abstract bird forms
- **Keep them simple and functional** - Don't overcomplicate
- **Use the brand color palette** - Twilight blue and sunset orange
- **Suggest movement** - Evoke the dynamic nature of murmurations

### Photography Subjects

Ideal imagery includes:

- Groups collaborating at events
- Community gatherings and celebrations
- Volunteers working together
- Leaders facilitating activities
- Members connecting with each other

---

## 7. Application Examples

### Website

- Primary logo in header (left-aligned)
- Twilight Blue for primary navigation
- Sunset Orange for primary CTAs
- Ample white space
- Inter typeface throughout

### Email

- Bug in email header
- Plain text-friendly formatting
- Twilight Blue for links
- Clear hierarchy with bold headings
- Sunset Orange for important links/buttons

### Admin Interface

- Bug in top navigation
- Twilight Blue for selected states
- Neutral palette for content areas
- Sunset Orange for key actions
- Consistent Inter typography

### Print Materials

- Primary logo with full clear space
- CMYK color values (see color table)
- Minimum 11pt body text
- Generous margins
- High contrast for accessibility

---

## 8. Logo Files Reference

| File | Purpose |
|------|---------|
| `murmurant-logo.svg` | Primary horizontal logo (icon + wordmark) |
| `murmurant-bug.svg` | Icon only (for favicons, small spaces) |
| `murmurant-logo-dark.svg` | Light version for dark backgrounds |
| `murmurant-wordmark.svg` | Text only (no icon) |
| `murmurant-bug-mono.svg` | Monochrome icon (uses currentColor) |

---

## Related Documents

- [NAMING-DECISION.md](../company/NAMING-DECISION.md) - Why we chose the name Murmurant
- [VOICE_AND_MESSAGING.md](./VOICE_AND_MESSAGING.md) - Detailed communication guidelines
- [COMPONENT_STYLE_GUIDE.md](./COMPONENT_STYLE_GUIDE.md) - UI component styling

---

*Last updated: December 2025*
