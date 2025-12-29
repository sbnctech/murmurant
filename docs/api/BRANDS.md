# Brands API

## Overview

Brands represent per-club customization of visual identity, voice, and communication settings. Each club can have its own brand configuration that controls colors, typography, logos, terminology, and chatbot personality.

## Data Model

### ClubTheme

The complete brand configuration for a club.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique brand identifier (e.g., "sbnc", "murmurant-default") |
| name | string | Full club name for display |
| logo | LogoConfig | Full logo configuration |
| bug | BugConfig | Small icon/bug configuration |
| colors | ColorPalette | Brand color palette |
| typography | TypographyConfig | Font settings |
| shape | ShapeConfig | Border radius and button styles |
| voice | VoiceConfig | Tone and terminology |
| chatbot | ChatbotConfig | AI assistant configuration |

### LogoConfig

| Field | Type | Description |
|-------|------|-------------|
| url | string | Path to logo image (e.g., "/themes/sbnc/logo.svg") |
| width | number | Logo width in pixels |
| height | number | Logo height in pixels |
| alt | string | Alt text for accessibility |

### BugConfig

| Field | Type | Description |
|-------|------|-------------|
| url | string | Path to bug/icon image |
| size | number | Square size in pixels |

### ColorPalette

| Field | Type | Description |
|-------|------|-------------|
| primary | string | Primary brand color (hex) |
| primaryHover | string | Primary hover state color |
| secondary | string | Secondary brand color |
| accent | string | Accent/highlight color |
| background | string | Page background color |
| surface | string | Card/surface background |
| textPrimary | string | Primary text color |
| textSecondary | string | Secondary text color |
| textMuted | string | Muted/disabled text |
| border | string | Border color |
| success | string | Success state color |
| warning | string | Warning state color |
| error | string | Error state color |

### TypographyConfig

| Field | Type | Description |
|-------|------|-------------|
| fontHeading | string | Font stack for headings |
| fontBody | string | Font stack for body text |
| fontMono | string | Font stack for code/monospace |
| baseFontSize | number | Base font size in pixels |
| lineHeight | number | Line height multiplier |

### ShapeConfig

| Field | Type | Description |
|-------|------|-------------|
| borderRadius | "none" \| "sm" \| "md" \| "lg" \| "full" | Default border radius |
| buttonStyle | "square" \| "rounded" \| "pill" | Button shape style |
| cardStyle | "flat" \| "raised" \| "outlined" | Card appearance |

### VoiceConfig

| Field | Type | Description |
|-------|------|-------------|
| tone | "formal" \| "friendly" \| "casual" \| "professional" | Communication tone |
| terminology | Terminology | Custom terminology mapping |
| greeting | string | Default greeting message |

### Terminology

| Field | Type | Description |
|-------|------|-------------|
| member | string | Word for "member" (e.g., "member", "participant") |
| event | string | Word for "event" (e.g., "event", "activity") |
| dues | string | Word for "dues" (e.g., "dues", "membership fee") |

### ChatbotConfig

| Field | Type | Description |
|-------|------|-------------|
| name | string | Chatbot display name (e.g., "Sandy") |
| personality | string | Personality description for AI context |
| suggestedPrompts | string[] | Default conversation starters |

## React Integration

### ThemeProvider

Wrap your app to provide brand context:

```tsx
import { ThemeProvider } from "@/lib/themes";
import { sbncTheme } from "@/lib/themes/customers/sbnc";

export default function Layout({ children }) {
  return (
    <ThemeProvider initialTheme={sbncTheme}>
      {children}
    </ThemeProvider>
  );
}
```

For admin/system pages that should use Murmurant branding:

```tsx
<ThemeProvider isMurmurantContext>
  {children}
</ThemeProvider>
```

### useTheme Hook

Access the current theme in any component:

```tsx
import { useTheme } from "@/lib/themes";

function MyComponent() {
  const { theme, setTheme, isMurmurantContext } = useTheme();

  return (
    <div style={{ color: theme.colors.textPrimary }}>
      Welcome to {theme.name}
    </div>
  );
}
```

### Utility Hooks

```tsx
import {
  useThemeColor,
  usePrimaryColor,
  useIsMurmurantContext,
  getThemeVar,
  getColorVar
} from "@/lib/themes";

// Get a specific color
const primaryColor = usePrimaryColor();
const borderColor = useThemeColor("border");

// Check context
const isAdmin = useIsMurmurantContext();

// Get CSS variable references for inline styles
const primaryVar = getThemeVar("primary"); // "var(--theme-primary)"
const errorVar = getColorVar("error");     // "var(--theme-error)"
```

## CSS Variables

When a theme is applied, the following CSS variables are set on `:root`:

```css
/* Colors */
--theme-primary
--theme-primary-hover
--theme-secondary
--theme-accent
--theme-background
--theme-surface
--theme-text-primary
--theme-text-secondary
--theme-text-muted
--theme-border
--theme-success
--theme-warning
--theme-error

/* Typography */
--theme-font-heading
--theme-font-body
--theme-font-mono
--theme-font-size-base
--theme-line-height

/* Shape */
--theme-border-radius
```

Usage in CSS/Tailwind:

```css
.my-element {
  background-color: var(--theme-primary);
  font-family: var(--theme-font-body);
  border-radius: var(--theme-border-radius);
}
```

## Example Brand Configuration

### Santa Barbara Newcomers Club (SBNC)

```typescript
const sbncTheme: ClubTheme = {
  id: "sbnc",
  name: "Santa Barbara Newcomers Club",

  logo: {
    url: "/themes/sbnc/logo.svg",
    width: 200,
    height: 60,
    alt: "SBNC Logo",
  },

  bug: {
    url: "/themes/sbnc/bug.svg",
    size: 32,
  },

  colors: {
    primary: "#1E40AF",      // Deep blue (coastal)
    primaryHover: "#1E3A8A",
    secondary: "#059669",    // Teal green (nature)
    accent: "#F59E0B",       // Golden (California sun)
    background: "#FFFBEB",   // Warm cream
    surface: "#FFFFFF",
    textPrimary: "#1F2937",
    textSecondary: "#4B5563",
    textMuted: "#9CA3AF",
    border: "#E5E7EB",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
  },

  typography: {
    fontHeading: "Georgia, serif",
    fontBody: "system-ui, sans-serif",
    fontMono: "monospace",
    baseFontSize: 16,
    lineHeight: 1.6,
  },

  shape: {
    borderRadius: "md",
    buttonStyle: "rounded",
    cardStyle: "raised",
  },

  voice: {
    tone: "friendly",
    terminology: {
      member: "member",
      event: "activity",
      dues: "dues",
    },
    greeting: "Welcome!",
  },

  chatbot: {
    name: "Sandy",
    personality: "Warm, helpful, knowledgeable about Santa Barbara. Speaks like a friendly neighbor who knows everyone.",
    suggestedPrompts: [
      "What activities are coming up this month?",
      "How do I join a committee?",
      "Tell me about upcoming luncheons",
    ],
  },
};
```

## Best Practices

1. **Color Accessibility**: Ensure sufficient contrast between text and background colors. Use `textPrimary` on `background` and `surface`.

2. **Terminology Consistency**: Use the voice.terminology values throughout the app instead of hardcoding "member", "event", etc.

3. **Context Awareness**: Use `isMurmurantContext` to determine whether to show club-specific or system branding.

4. **CSS Variables**: Prefer CSS variables over direct color values for dynamic theming.

5. **Font Loading**: Ensure custom fonts are properly loaded before rendering to avoid FOUT (flash of unstyled text).

## Related Documentation

- [Theme Types](/src/lib/themes/types.ts) - TypeScript type definitions
- [Theme Provider](/src/lib/themes/ThemeProvider.tsx) - React context provider
- [Default Theme](/src/lib/themes/defaults.ts) - Murmurant default theme values
