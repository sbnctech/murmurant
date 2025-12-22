ClubOS Styling System (v1)

Goals
- No CSS override soup.
- Non-technical admins change "Appearance" via safe knobs, not selectors.
- Components never invent colors; they consume tokens.

Layers (in order)
1) Theme values (src/styles/themes/*.css)
   - --theme-* variables (the only place theme values live)

2) Tokens (src/styles/tokens/tokens.css)
   - --token-* variables map to --theme-*
   - Components and utility classes use --token-*

3) Presets/variants (code)
   - Components expose variants: e.g. button: primary|secondary|quiet|danger
   - Variants are implemented with class strings that reference tokens

Rules
- Do not add hex colors (e.g. #fff, #2563eb) in TS/TSX.
- Do not add new inline style objects in TSX (style={{...}}), except for truly dynamic layout calculations.
- If a component needs a color/state, add a token for it.

Admin UX (future)
- "Appearance" edits theme values and a small set of component defaults.
- Draft/publish: preview theme changes before making active.

