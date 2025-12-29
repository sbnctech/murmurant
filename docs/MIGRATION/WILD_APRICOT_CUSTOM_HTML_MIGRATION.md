# Wild Apricot Custom HTML Migration Guide

```
Audience: Migration Operators, Tech Staff
Purpose: Migrate WA custom HTML blocks safely to Murmurant
Companion: WILD_APRICOT_CUSTOM_HTML_BLOCKS_GUIDE.md (detailed reference)
```

---

## TL;DR

Wild Apricot lets organizations add raw HTML anywhere. Murmurant doesn't run arbitrary HTML—that's a feature, not a bug. This guide explains what's in those HTML blocks and how to migrate them.

**The Automagic Rule:**
- **Allowlisted iframes** (YouTube, Maps, Calendly) → AUTO migrate to SafeEmbed
- **Scripts and tracking pixels** → UNSUPPORTED (security/privacy)
- **Everything else** → MANUAL review

---

## What WA Custom HTML Blocks Usually Contain

Based on common WA usage patterns, custom HTML blocks typically fall into these categories:

### 1. Video Embeds (Very Common)

```html
<iframe width="560" height="315"
  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
  frameborder="0" allowfullscreen></iframe>
```

**Purpose:** Embedded YouTube, Vimeo, or other video players.

**Migration:** AUTO via SafeEmbed. Just paste the URL.

### 2. Map Embeds (Very Common)

```html
<iframe src="https://www.google.com/maps/embed?pb=!1m18..."
  width="600" height="450" frameborder="0"></iframe>
```

**Purpose:** Show event location or office directions.

**Migration:** AUTO via SafeEmbed. Address-based.

### 3. External Calendar Embeds

```html
<iframe src="https://calendar.google.com/calendar/embed?src=..."
  width="800" height="600"></iframe>
```

**Purpose:** Display Google Calendar instead of WA's calendar.

**Migration:** MANUAL. Use Murmurant native calendar (syncs via ICS).

### 4. Booking/Scheduling Widgets

```html
<div class="calendly-inline-widget"
  data-url="https://calendly.com/your-org/30min"></div>
<script src="https://assets.calendly.com/assets/external/widget.js"></script>
```

**Purpose:** Calendly, Acuity, or similar booking tools.

**Migration:** MANUAL for the iframe/widget portion. **Script portion is UNSUPPORTED.**

### 5. Tracking Pixels and Analytics

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=UA-XXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'UA-XXXXX');
</script>

<!-- Facebook Pixel -->
<script>
  !function(f,b,e,v,n,t,s){...}
</script>
<noscript><img height="1" width="1" src="https://www.facebook.com/tr?..."/></noscript>
```

**Purpose:** Marketing analytics, conversion tracking.

**Migration:** UNSUPPORTED. Privacy compliance risk. Configure analytics through Murmurant admin if needed.

### 6. External Form Embeds

```html
<iframe src="https://docs.google.com/forms/d/e/.../viewform?embedded=true"
  width="640" height="800" frameborder="0"></iframe>
```

**Purpose:** Surveys, signups, feedback forms.

**Migration:** MANUAL. Consider Murmurant native forms or SafeEmbed if on allowlist.

### 7. Custom JavaScript

```html
<script>
  // Accordion behavior
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', function() {
      this.nextElementSibling.classList.toggle('open');
    });
  });
</script>
```

**Purpose:** Interactive features (accordions, lightboxes, countdowns, etc.)

**Migration:** UNSUPPORTED. XSS risk. Request Murmurant native component if essential.

### 8. Social Media Widgets

```html
<div class="fb-page" data-href="https://www.facebook.com/YourOrg"
  data-tabs="timeline" data-width="340" data-height="500"></div>
<script async defer src="https://connect.facebook.net/en_US/sdk.js#..."></script>
```

**Purpose:** Show Facebook feed, Twitter timeline, Instagram posts.

**Migration:** UNSUPPORTED (requires script). Use Social Links block instead.

### 9. Payment Buttons

```html
<form action="https://www.paypal.com/cgi-bin/webscr" method="post">
  <input type="hidden" name="cmd" value="_donations">
  <input type="hidden" name="business" value="your@email.com">
  <input type="submit" value="Donate">
</form>
```

**Purpose:** PayPal donations, payment buttons.

**Migration:** UNSUPPORTED. External payment processing bypasses Murmurant. Use native donation forms with Stripe.

---

## What Breaks During Migration

### Security Issues

| Problem | Why It Breaks | Risk |
|---------|---------------|------|
| `<script>` tags | XSS attack vector | Session theft, data exfiltration |
| Inline event handlers (`onclick`, etc.) | Same as script tags | Code injection |
| `javascript:` URLs | Disguised scripts | Phishing, redirects |
| Unsandboxed iframes | Can access parent page | Cookie theft, clickjacking |

**Murmurant Policy:** All inline scripts are UNSUPPORTED. Period.

### Mixed Content Issues

| Problem | Why It Breaks | Effect |
|---------|---------------|--------|
| HTTP iframe in HTTPS page | Browser blocks it | Embed doesn't load |
| External CSS includes | May conflict with Murmurant | Broken styling |
| External fonts | May not load (CORS) | Wrong typography |

### Auth Assumption Issues

| Problem | Why It Breaks | Effect |
|---------|---------------|--------|
| WA session cookies | Not available in Murmurant | Widget shows logged-out state |
| WA member variables | `{ContactId}` etc. don't exist | Broken personalization |
| WA-specific URLs | `/Sys/...` paths don't exist | 404 errors |

### CSS Collision Issues

| Problem | Why It Breaks | Effect |
|---------|---------------|--------|
| Global CSS in HTML block | Affects entire page | Layout breaks |
| Hardcoded widths | Not responsive | Mobile breaks |
| `!important` overrides | Fights with Murmurant theme | Inconsistent styling |

---

## The Automagic Migration Approach

The discovery crawler automatically classifies each custom HTML block:

### Classification: AUTO

**Criteria:** Contains only allowlisted iframe sources. No scripts.

**Allowlist (v1):**

| Provider | Domain Pattern | SafeEmbed Type |
|----------|----------------|----------------|
| YouTube | youtube.com/embed/*, youtu.be/* | video |
| Vimeo | player.vimeo.com/video/* | video |
| Google Maps | google.com/maps/embed* | map |
| Google Docs | docs.google.com/* (public) | document |
| Google Forms | docs.google.com/forms/* | form |
| Calendly | calendly.com/* | booking |

**Action:** Migration script converts to SafeEmbed block automatically.

### Classification: MANUAL

**Criteria:** Contains elements that need human judgment.

| Element | Reason | Operator Action |
|---------|--------|-----------------|
| Non-allowlisted iframe | Unknown source | Evaluate, request allowlist, or link |
| External form | Data flows externally | Consider native form or link |
| External images | May need re-upload | Download and re-upload |
| Complex HTML layout | May not render correctly | Rebuild with Murmurant blocks |

**Action:** Discovery report flags for operator review.

### Classification: UNSUPPORTED

**Criteria:** Cannot be migrated due to security or compliance risk.

| Element | Reason | Alternative |
|---------|--------|-------------|
| `<script>` tags | XSS risk | Request native component |
| Inline handlers | XSS risk | None |
| Tracking pixels | Privacy risk | Configure Murmurant analytics |
| Social widgets with JS | XSS risk | Social links block |
| External payment forms | Bypasses Murmurant billing | Native donation form |

**Action:** Logged but not migrated. Operator must find alternative.

---

## Murmurant Primitive Replacements

### Quick Reference

| WA Custom HTML | Murmurant Primitive | Migration |
|----------------|------------------|-----------|
| YouTube iframe | SafeEmbed (video) | AUTO |
| Vimeo iframe | SafeEmbed (video) | AUTO |
| Google Maps iframe | SafeEmbed (map) | AUTO |
| Google Calendar iframe | EventCalendar primitive | MANUAL |
| Calendly embed | SafeEmbed (booking) | AUTO (iframe only) |
| Google Form iframe | SafeEmbed (form) | AUTO |
| Typeform/JotForm | Link or request allowlist | MANUAL |
| Facebook widget | Social links | MANUAL |
| Twitter widget | Social links | MANUAL |
| PayPal button | Donation form (Stripe) | MANUAL |
| Custom accordion | TextBlock or FAQ | MANUAL |
| Image gallery script | ImageGallery | MANUAL |
| Tracking pixels | Murmurant analytics | UNSUPPORTED |
| Any `<script>` | None | UNSUPPORTED |

### SafeEmbed Details

SafeEmbed wraps allowlisted iframes with security controls:

```
sandbox="allow-scripts allow-same-origin"
referrerpolicy="no-referrer"
allow=""  (disables camera, mic, geolocation)
```

Operators add SafeEmbed by:
1. Select "Embed" block in editor
2. Paste original iframe URL
3. System validates against allowlist
4. If allowed, embed renders
5. If not allowed, shows warning with options

---

## Operator Checklist: What to Capture Before Migration

Print this page. Walk through the WA site. Check each item.

### Custom HTML Inventory

Go to each WA page and check for custom HTML blocks:

- [ ] **Page URL:** ________________________________
- [ ] **Block location on page:** (top/middle/bottom)
- [ ] **What it displays:** ________________________________
- [ ] **Source URL (for iframes):** ________________________________

Repeat for each custom HTML block found.

### For Each Block, Note:

**Type (check one):**
- [ ] Video embed (YouTube/Vimeo)
- [ ] Map embed (Google Maps)
- [ ] Calendar embed
- [ ] Booking widget (Calendly, Acuity)
- [ ] External form (Google Forms, Typeform)
- [ ] Social media widget
- [ ] Tracking/analytics code
- [ ] Payment button
- [ ] Custom interactive feature
- [ ] Other: ________________________________

**Contains scripts?**
- [ ] No scripts
- [ ] Yes, external script (`<script src="...">`)
- [ ] Yes, inline script (`<script>...</script>`)
- [ ] Yes, event handlers (onclick, onload, etc.)

**Is it essential?**
- [ ] Must have for day-one (explain why)
- [ ] Nice to have
- [ ] Can remove entirely

### Questions to Ask the Customer

1. "What does this block actually do?"
2. "Do you have login credentials for the external service?"
3. "Is this used for member-only content?"
4. "Can members access this feature another way?"
5. "Who added this? Can they explain how it works?"

### Document External Service Accounts

| Service | Purpose | Login Owner | Still Active? |
|---------|---------|-------------|---------------|
| Google Analytics | __________ | __________ | [ ] Yes [ ] No |
| Facebook Page | __________ | __________ | [ ] Yes [ ] No |
| Calendly | __________ | __________ | [ ] Yes [ ] No |
| __________ | __________ | __________ | [ ] Yes [ ] No |

### Screenshot Everything

For each custom HTML block:
1. Screenshot how it looks on WA (desktop)
2. Screenshot how it looks on WA (mobile)
3. Save the raw HTML source

Store in: `migration-assets/[org-name]/custom-html/`

---

## Decision Tree for Operators

```
Found a custom HTML block
|
Is it just static text/images (no iframes, no scripts)?
|-- Yes --> Convert to TextBlock or Image. Done.
+-- No --> Continue
    |
    Does it contain <script> or event handlers?
    |-- Yes --> UNSUPPORTED. Log it. Move on.
    +-- No --> Continue
        |
        Is it an iframe?
        |-- Yes --> Is the source on the allowlist?
        |   |-- Yes --> AUTO (SafeEmbed). Done.
        |   +-- No --> Can we request allowlist addition?
        |       |-- Yes --> Submit request. Mark PENDING.
        |       +-- No --> Suggest external link. Mark MANUAL.
        +-- No --> Continue
            |
            Is it an external form?
            |-- Yes --> Can Murmurant native forms handle it?
            |   |-- Yes --> Rebuild in Murmurant. Mark MANUAL.
            |   +-- No --> Suggest external link. Mark MANUAL.
            +-- No --> Continue
                |
                What is it?
                |-- Social widget --> Use Social Links block. MANUAL.
                |-- Payment button --> Use native donation. MANUAL.
                |-- Unknown --> Screenshot, document, escalate.
```

---

## Inline Scripts: Why They're Always UNSUPPORTED

**Question:** Is it OK to treat ALL inline scripts as UNSUPPORTED and require SafeEmbed wrapper?

**Answer:** Yes. This is the correct architectural decision.

**Rationale:**

1. **Security:** Inline scripts can do anything—steal sessions, redirect users, mine crypto, inject phishing forms. Murmurant cannot distinguish "safe" scripts from malicious ones without manual code review, which doesn't scale.

2. **Liability:** If Murmurant executes customer-provided scripts, Murmurant becomes liable for any security incidents. Blocking scripts transfers responsibility back to the source.

3. **Maintainability:** Inline scripts often break when:
   - External APIs change
   - Browser security policies tighten
   - Murmurant updates its framework
   Blocking them prevents silent failures.

4. **Precedent:** The HTML_WIDGET_POLICY (escape hatch for Tech Chair only) explicitly rejects `<script>` tags by default. Migration should not be more permissive than the production policy.

**Alternative for essential functionality:**
- Request a native Murmurant component
- Use SafeEmbed with allowlisted iframe-based widgets
- Link to external page

---

## Related Documents

- [Custom HTML Blocks Guide](./WILD_APRICOT_CUSTOM_HTML_BLOCKS_GUIDE.md) - Detailed patterns and classification rules
- [Gadget Tagging Matrix](./WILD_APRICOT_GADGET_TAGGING.md) - Full WA element classification
- [Page Builder Primitives](../ARCH/MURMURANT_PAGE_BUILDER_PRIMITIVES.md) - SafeEmbed specification
- [HTML Widget Policy](../pages/HTML_WIDGET_POLICY.md) - Tech Chair escape hatch (not for migration)
- [Migration Intake Checklist](./WILD_APRICOT_MIGRATION_INTAKE_CHECKLIST.md) - Full intake process

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-26 | System | Initial migration-focused guide with automagic approach |
