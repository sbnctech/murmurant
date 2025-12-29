# Murmurant Themes

CSS custom property-based theme system for Murmurant.

## Overview

Themes define visual styling through CSS custom properties (CSS variables).
Components consume these tokens rather than hardcoded values.

## Available Themes

- **base** - Neutral professional theme (blue-gray palette)
- **sbnc** - Santa Barbara Newcomers Club theme (cherry blossom palette)

## Usage

### Setting the Active Theme

Set `data-theme` attribute on the html or body element:

```html
<html data-theme="sbnc">
```

### Dev Mode Theme Switching

Add `?theme=sbnc` or `?theme=base` to the URL to switch themes during development.

### Using Tokens in Components

```tsx
const buttonStyle = {
  backgroundColor: "var(--token-color-primary)",
  color: "var(--token-color-primary-text)",
  borderRadius: "var(--token-radius-md)",
  padding: "var(--token-space-sm) var(--token-space-md)",
};
```

## Token Categories

- **Colors** - primary, secondary, accent, backgrounds, text, semantic
- **Typography** - font families, sizes, weights, line heights
- **Spacing** - xs through 2xl scale
- **Radius** - border radius values
- **Shadows** - box shadow definitions
- **Layout** - max widths, nav height, sidebar width
- **Controls** - button and input heights

## Creating a New Theme

1. Copy `base.css` to `yourtheme.css`
2. Update the selector: `[data-theme="yourtheme"]`
3. Modify the `--theme-*` variable values
4. Import in `index.css`

## File Structure

```
src/styles/
  tokens/
    tokens.css     # Token variable names (maps --token-* to --theme-*)
  themes/
    index.css      # Imports all themes
    base.css       # Base/default theme
    sbnc.css       # SBNC theme
    README.md      # This file
```
