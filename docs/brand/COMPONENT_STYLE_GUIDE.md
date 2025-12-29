# Murmurant Component Style Guide

## Design Principles

1. **Consistency** - Components should look and behave the same across all pages
2. **Accessibility** - All components must be keyboard navigable and screen-reader friendly
3. **Responsiveness** - Components should adapt gracefully to all screen sizes
4. **Clarity** - UI should be self-explanatory; avoid mystery icons or hidden actions

---

## Buttons

### Variants

| Variant | Use Case | Example |
|---------|----------|---------|
| **Primary** | Main action on page | "Save", "Submit", "Register" |
| **Secondary** | Alternative actions | "Cancel", "Back", "Edit" |
| **Ghost** | Subtle actions, toolbars | Icon buttons, "Learn more" |
| **Destructive** | Irreversible actions | "Delete", "Remove", "Cancel membership" |
| **Link** | Inline text actions | "View details", "See all" |

### Sizes

- **sm**: 32px height, 12px padding, 14px font
- **md**: 40px height, 16px padding, 14px font (default)
- **lg**: 48px height, 24px padding, 16px font

### States

- **Default**: Normal resting state
- **Hover**: Slight darkening or lift
- **Active**: Pressed appearance
- **Focus**: Visible focus ring (2px offset)
- **Disabled**: 50% opacity, no pointer events
- **Loading**: Spinner replaces text, disabled interactions

### Guidelines

- Use sentence case: "Create event" not "Create Event"
- Keep labels short: 1-3 words when possible
- Include icons sparingly; left side preferred
- Destructive buttons should require confirmation

---

## Cards

### Variants

| Variant | Use Case |
|---------|----------|
| **Default** | Standard content containers |
| **Bordered** | Lower emphasis, grouped items |
| **Flat** | Minimal style, nested cards |
| **Interactive** | Clickable cards, listings |
| **Selected** | Active/chosen state |

### Sizes

- **sm**: 16px padding
- **md**: 24px padding (default)
- **lg**: 32px padding

### Structure

```
+---------------------------+
| Header (optional)         |
+---------------------------+
| Body                      |
|                           |
|                           |
+---------------------------+
| Footer (optional)         |
+---------------------------+
```

### Guidelines

- Maintain consistent corner radius (8px)
- Use subtle shadows (0 2px 4px rgba(0,0,0,0.1))
- Interactive cards show hover lift effect
- Group related cards with consistent spacing (16px gap)

---

## Forms

### Input Fields

- **Height**: 40px (sm: 32px, lg: 48px)
- **Border**: 1px solid #d1d5db
- **Border radius**: 6px
- **Padding**: 8px 12px
- **Focus**: Blue border, light blue ring

### Labels

- Position: Above input
- Font weight: 500
- Font size: 14px
- Margin bottom: 6px
- Required indicator: Red asterisk after label text

### Helper Text

- Position: Below input
- Font size: 13px
- Color: #6b7280 (muted gray)
- Margin top: 4px

### Error State

- Border: 1px solid #dc2626 (red)
- Error message: Below input, red text
- Icon: Optional error icon in input

### Input Types

| Type | Notes |
|------|-------|
| **Text** | Standard single-line input |
| **Textarea** | Multi-line, min-height 80px |
| **Select** | Native or custom dropdown |
| **Checkbox** | 18px square, rounded corners |
| **Radio** | 18px circle, grouped vertically |
| **Switch** | 44px x 24px toggle |
| **Date picker** | Calendar popup |
| **File upload** | Drag-drop zone or button |

### Form Layout

- Single column preferred for most forms
- Field spacing: 20px vertical gap
- Group related fields with fieldsets
- Action buttons at bottom, right-aligned

---

## Modals

### Structure

```
+--------------------------------+
| Header: Title         [X]      |
+--------------------------------+
| Body                           |
|                                |
| (scrollable if content long)   |
|                                |
+--------------------------------+
| Footer: [Cancel]    [Confirm]  |
+--------------------------------+
```

### Sizes

- **sm**: 400px max-width
- **md**: 500px max-width (default)
- **lg**: 640px max-width
- **xl**: 800px max-width
- **full**: 90vw, 90vh

### Guidelines

- Center vertically and horizontally
- Backdrop: rgba(0,0,0,0.5)
- Close on backdrop click (unless destructive)
- Close on Escape key
- Trap focus within modal
- Cancel button on left, primary action on right
- Animate in with fade and scale

### Confirmation Modals

For destructive actions:
- Title states the action: "Delete this event?"
- Body explains consequences
- Destructive button clearly labeled
- Consider requiring text input for critical actions

---

## Tables

### Structure

- **Header**: Bold text, light gray background (#f9fafb)
- **Rows**: White background, 1px bottom border
- **Alternating rows**: Optional, use subtle gray (#f9fafb)
- **Row height**: 48px minimum for touch targets

### Hover State

- Light blue background (#eff6ff)
- Subtle transition

### Actions Column

- Right-aligned
- Icon buttons or dropdown menu
- Show on row hover (optional)

### Pagination

- Position: Below table, centered
- Show: Previous, page numbers, Next
- Items per page selector (optional)
- "Showing X-Y of Z" text

### Empty State

- Center message in table area
- Include relevant action if applicable
- Icon or illustration optional

### Responsive

- Horizontal scroll on small screens
- Or collapse to card layout

---

## Navigation

### Header

- **Height**: 64px
- **Position**: Fixed top
- **Background**: White with subtle bottom shadow
- **Content**: Logo left, nav center, user menu right
- **Mobile**: Hamburger menu

### Sidebar

- **Width**: 240px (collapsed: 64px)
- **Position**: Fixed left
- **Background**: White or light gray
- **Sections**: Grouped with headers
- **Icons**: 20px, left of text
- **Active state**: Blue background, bold text

### Breadcrumbs

- Separator: "/" or ">"
- All items linked except current (plain text)
- Truncate long paths with ellipsis
- Show at least first and last items

### Tabs

- **Underline style**: Border bottom on active
- **Pill style**: Background on active
- **Spacing**: 16px between tabs
- **Icons**: Optional, left of text

---

## Feedback

### Alerts

| Type | Color | Use Case |
|------|-------|----------|
| **Info** | Blue | General information |
| **Success** | Green | Completed actions |
| **Warning** | Yellow/Orange | Caution needed |
| **Error** | Red | Failed actions, problems |

### Toasts

- Position: Top-right or bottom-right
- Auto-dismiss: 5 seconds (errors persist)
- Max 3 visible at once
- Stack vertically, newest on top
- Include close button

### Loading States

- **Spinner**: For buttons, small areas
- **Skeleton**: For content placeholders
- **Progress bar**: For known durations
- **Full-page**: Centered spinner with message

### Empty States

- Centered in container
- Icon or illustration
- Clear message explaining the state
- Action button if applicable

---

## Spacing Scale

| Token | Value | Use Case |
|-------|-------|----------|
| **xs** | 4px | Icon spacing, tight elements |
| **sm** | 8px | Related elements, list items |
| **md** | 16px | Default spacing, card padding |
| **lg** | 24px | Section breaks, card gaps |
| **xl** | 32px | Major sections |
| **2xl** | 48px | Page sections |
| **3xl** | 64px | Hero areas |

---

## Typography

### Font Stack

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

### Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| **h1** | 28px | 700 | 1.2 |
| **h2** | 24px | 600 | 1.3 |
| **h3** | 20px | 600 | 1.4 |
| **h4** | 18px | 600 | 1.4 |
| **body** | 16px | 400 | 1.5 |
| **small** | 14px | 400 | 1.5 |
| **caption** | 13px | 400 | 1.4 |

### Colors

- **Primary text**: #1f2937
- **Secondary text**: #6b7280
- **Muted text**: #9ca3af
- **Link text**: #2563eb
- **Error text**: #dc2626

---

## Responsive Breakpoints

| Name | Min Width | Typical Devices |
|------|-----------|-----------------|
| **sm** | 640px | Large phones |
| **md** | 768px | Tablets |
| **lg** | 1024px | Laptops |
| **xl** | 1280px | Desktops |
| **2xl** | 1536px | Large monitors |

### Mobile-First Approach

- Start with mobile layout
- Add complexity at larger breakpoints
- Touch targets: 44px minimum
- Avoid hover-only interactions
