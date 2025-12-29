# Wild Apricot Custom HTML Blocks: Operator Guide

```
Audience: Operators, Migration Coordinators
Purpose: Guide for handling WA custom HTML during migration
Classification: Operator Documentation
```

---

## What Are WA Custom HTML Blocks?

Wild Apricot allows website administrators to insert raw HTML code into pages using "Content" gadgets with HTML editing enabled. This gives organizations flexibility to:

- Embed third-party content (maps, videos, calendars)
- Add tracking and analytics code
- Insert custom forms from external services
- Display social media feeds
- Add custom JavaScript for interactive features

This flexibility creates migration challenges because Murmurant cannot blindly execute arbitrary HTML from an external source.

---

## Common Custom HTML Patterns

Based on publicly available WA community discussions and typical organization websites, custom HTML blocks typically contain:

### 1. Iframe Embeds

**What they do:** Display external content inside the page.

**Common sources:**

| Source | Typical Use |
|--------|-------------|
| Google Maps | Event locations, office directions |
| Google Calendar | External calendar display |
| YouTube/Vimeo | Event videos, welcome messages |
| Facebook | Social feed, event promotion |
| Google Forms | Surveys, volunteer signups |
| Eventbrite | Ticket sales for external events |
| PayPal buttons | Donation buttons, alternative payment |
| Canva | Embedded flyers, announcements |

**Example HTML:**
```html
<iframe src="https://www.google.com/maps/embed?pb=..."
        width="600" height="450"
        frameborder="0" allowfullscreen></iframe>
```

### 2. Tracking Pixels and Analytics

**What they do:** Track visitor behavior for marketing and analytics.

**Common sources:**

| Source | Purpose |
|--------|---------|
| Google Analytics | Page views, user behavior |
| Facebook Pixel | Advertising conversion tracking |
| Google Tag Manager | Tag container management |
| Mailchimp tracking | Email campaign attribution |
| HubSpot | CRM visitor tracking |

**Example HTML:**
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=UA-XXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'UA-XXXXX');
</script>
```

### 3. External Forms

**What they do:** Collect data using third-party form builders.

**Common sources:**

| Source | Purpose |
|--------|---------|
| Google Forms | Surveys, feedback |
| Typeform | Styled questionnaires |
| JotForm | Complex application forms |
| Microsoft Forms | Office 365 organizations |
| SurveyMonkey | Member surveys |

### 4. Social Media Widgets

**What they do:** Display social content or sharing buttons.

**Common sources:**

| Source | Purpose |
|--------|---------|
| Facebook Page Plugin | Show page feed |
| Twitter timeline | Show recent tweets |
| Instagram embed | Show posts |
| LinkedIn badge | Organization page link |
| AddThis/ShareThis | Sharing buttons |

### 5. Custom Scripts

**What they do:** Add interactive behavior.

**Examples:**

- Accordion/collapsible sections
- Image lightboxes
- Custom form validation
- Countdown timers
- Weather widgets
- Chat widgets (Intercom, Drift)

---

## Why Custom HTML Breaks in Migration

Murmurant cannot execute arbitrary HTML from Wild Apricot for three reasons:

### 1. Security Boundary

Custom HTML can contain:

- Malicious JavaScript (XSS attacks)
- Session-stealing code
- Phishing forms disguised as login
- Cryptocurrency miners
- Redirect scripts

Murmurant cannot verify that HTML written for Wild Apricot is safe. Even well-intentioned code may have vulnerabilities.

**Principle:** Murmurant does not execute untrusted code.

### 2. Maintenance Burden

Custom HTML often:

- References external URLs that change or disappear
- Uses deprecated APIs
- Breaks when third parties update their embed formats
- Contains hardcoded dimensions that do not work on mobile
- Conflicts with Murmurant styling

**Principle:** Murmurant surfaces are maintainable.

### 3. Privacy Compliance

Third-party tracking code may:

- Set cookies without consent
- Transmit member data to external services
- Violate GDPR/CCPA requirements
- Leak email addresses to advertisers

**Principle:** Murmurant controls what data leaves the platform.

---

## How to Replace Custom HTML in Murmurant

Murmurant provides three mechanisms to replace common custom HTML patterns:

### Option 1: SafeEmbed (Allowlisted Iframes)

**What it is:** Murmurant maintains an allowlist of trusted iframe sources. Embeds from these sources render normally. Embeds from other sources are blocked.

**Allowlisted sources (initial set):**

| Domain | Content Type |
|--------|--------------|
| youtube.com, youtu.be | Video |
| vimeo.com | Video |
| google.com/maps | Maps |
| maps.google.com | Maps |
| calendar.google.com | Calendar (public) |
| docs.google.com | Documents (public) |
| forms.google.com | Forms |
| canva.com | Design embeds |

**How operators use it:**

1. In Murmurant editor, add an "Embed" block
2. Paste the original iframe URL
3. If source is allowlisted, embed renders
4. If source is not allowlisted, editor shows warning

**Operator action for unlisted sources:**

- Request source addition via support ticket
- Murmurant team evaluates security/privacy
- If approved, source added to allowlist
- If denied, operator uses alternative approach

### Option 2: Native Murmurant Blocks

**What it is:** Murmurant provides native components for common needs.

| Instead of... | Use Murmurant... |
|---------------|---------------|
| Google Calendar iframe | Native calendar view (synced via ICS) |
| Google Maps iframe | Native map block (address-based) |
| YouTube iframe | Video block (URL paste) |
| Custom form iframe | Form builder |
| Social media widget | Social links block |
| PayPal button | Stripe donation form |

**Advantages:**

- Consistent styling
- Mobile responsive
- Privacy compliant
- No external dependencies

### Option 3: External Link

**What it is:** Link to external content instead of embedding it.

**When to use:**

- Complex interactive content
- Content that cannot be safely embedded
- Content from non-allowlisted sources

**Example:**

Instead of embedding a Google Form, add a button that links to the form URL.

---

## What Happens to Each Pattern

### Tracking Pixels: Not Migrated

**Status:** UNSUPPORTED

**Reason:** Privacy and compliance risk.

**Operator action:**

- If analytics needed, configure Murmurant analytics settings
- If third-party analytics required, add via admin settings (not page content)
- Marketing pixels should be evaluated for GDPR compliance before adding

### Inline JavaScript: Not Migrated

**Status:** UNSUPPORTED

**Reason:** XSS risk.

**Operator action:**

- Identify what the script accomplishes
- Find Murmurant native equivalent
- If no equivalent exists, file feature request
- Custom interactivity may require external page

### Allowlisted Iframes: Auto-Suggested

**Status:** AUTO (SafeEmbed)

**Reason:** Known-safe source.

**Operator action:**

- Review suggested embed in Murmurant editor
- Verify content displays correctly
- Approve or adjust

### Non-Allowlisted Iframes: Manual Review

**Status:** MANUAL

**Reason:** Unknown source requires evaluation.

**Operator action:**

- Identify what the iframe displays
- Determine if Murmurant has native equivalent
- If not, request source evaluation
- If denied, use external link approach

---

## Migration Automation Proposal

This section describes how the migration tooling detects and classifies custom HTML blocks.

### Detection Phase

The Presentation Discovery crawler (see PRESENTATION_DISCOVERY_STAGE.md) identifies custom HTML blocks by:

1. **Container detection**: Look for WA content gadget containers with HTML mode enabled
2. **Content extraction**: Extract raw HTML from the block
3. **Element parsing**: Parse HTML to identify embedded elements

### Classification Rules

For each detected element, apply these rules in order:

```
INPUT: Parsed HTML element
OUTPUT: Classification tag + proposed action

RULE 1: Script tags
  IF element is <script>
  THEN classify as UNSUPPORTED
  REASON: XSS risk
  ACTION: Log only, do not migrate

RULE 2: Tracking patterns
  IF element src contains (googletagmanager|google-analytics|fbevents|pixel)
  THEN classify as UNSUPPORTED
  REASON: Privacy risk
  ACTION: Log only, suggest admin analytics config

RULE 3: Allowlisted iframe
  IF element is <iframe>
  AND src domain is in SafeEmbed allowlist
  THEN classify as AUTO
  REASON: Trusted source
  ACTION: Generate SafeEmbed block with original URL

RULE 4: Non-allowlisted iframe
  IF element is <iframe>
  AND src domain is NOT in SafeEmbed allowlist
  THEN classify as MANUAL
  REASON: Unknown source
  ACTION: Log URL, suggest operator review

RULE 5: Form elements
  IF element is <form>
  AND action points to external domain
  THEN classify as MANUAL
  REASON: Data flows externally
  ACTION: Log form action URL, suggest native form or link

RULE 6: Style-only HTML
  IF element contains only formatting tags (div, span, p, h1-h6, ul, ol, li)
  AND no external resources
  THEN classify as AUTO
  REASON: Safe static content
  ACTION: Convert to Murmurant rich text block

RULE 7: Images
  IF element is <img>
  AND src is external URL
  THEN classify as MANUAL
  REASON: May need re-upload
  ACTION: Log URL, suggest image block with re-upload

RULE 8: Default
  ELSE classify as MANUAL
  REASON: Unknown pattern
  ACTION: Log element, require operator review
```

### Output: Presentation Discovery Report

The discovery report includes a dedicated section for custom HTML findings:

```json
{
  "customHtmlBlocks": {
    "summary": {
      "total": 12,
      "auto": 4,
      "manual": 6,
      "unsupported": 2
    },
    "items": [
      {
        "pageUrl": "/about-us",
        "blockPosition": 3,
        "classification": "AUTO",
        "elementType": "iframe",
        "sourceUrl": "https://www.youtube.com/embed/abc123",
        "proposedAction": "SafeEmbed: YouTube video",
        "operatorNotes": null
      },
      {
        "pageUrl": "/contact",
        "blockPosition": 1,
        "classification": "AUTO",
        "elementType": "iframe",
        "sourceUrl": "https://www.google.com/maps/embed?pb=...",
        "proposedAction": "SafeEmbed: Google Maps",
        "operatorNotes": null
      },
      {
        "pageUrl": "/volunteer",
        "blockPosition": 2,
        "classification": "MANUAL",
        "elementType": "iframe",
        "sourceUrl": "https://forms.example.com/volunteer-signup",
        "proposedAction": "External form - review required",
        "operatorNotes": "Source not in allowlist. Recommend native form or external link."
      },
      {
        "pageUrl": "/home",
        "blockPosition": 5,
        "classification": "UNSUPPORTED",
        "elementType": "script",
        "sourceUrl": "https://www.googletagmanager.com/gtag/js",
        "proposedAction": "Not migrated - tracking script",
        "operatorNotes": "Configure analytics in Murmurant admin if needed."
      }
    ]
  }
}
```

### Operator Review Workflow

1. **Discovery runs**: Crawler identifies all custom HTML blocks
2. **Report generated**: Classification and proposed actions documented
3. **Operator reviews**: Each MANUAL item requires decision
4. **Suggestions updated**: Operator decisions recorded in migration manifest
5. **Preview generated**: Murmurant preview reflects approved changes
6. **Final review**: Operator verifies presentation before cutover

---

## Operator Decision Guide

When reviewing MANUAL items, use this decision tree:

```
Is the content essential to member experience?
|-- No --> Skip migration, remove from Murmurant
+-- Yes --> Continue
    |
    Does Murmurant have a native equivalent?
    |-- Yes --> Use native block (calendar, map, video, form)
    +-- No --> Continue
        |
        Is the source on the SafeEmbed allowlist?
        |-- Yes --> Use SafeEmbed block
        +-- No --> Continue
            |
            Can you request source addition to allowlist?
            |-- Yes --> Submit request, wait for evaluation
            +-- No --> Use external link approach
```

---

## Frequently Asked Questions

### Q: Why can't Murmurant just copy my HTML exactly?

Murmurant cannot verify that HTML written for Wild Apricot is safe. Even if your HTML is harmless, we cannot distinguish it from malicious code without manual review. The SafeEmbed allowlist lets us permit known-safe sources while blocking unknown risks.

### Q: My tracking pixel is important. How do I keep it?

Contact support to discuss analytics requirements. Murmurant may offer native analytics or approved third-party integrations configured through admin settings rather than inline HTML.

### Q: What if my iframe source gets approved later?

Once a source is added to the SafeEmbed allowlist, you can add the embed through the Murmurant editor. Previously blocked embeds do not auto-migrate; you add them manually after approval.

### Q: Can I get a custom exception?

Murmurant does not support per-organization allowlist exceptions. All approved sources are available to all organizations. This ensures consistent security evaluation.

---

## Related Documents

- [Gadget Tagging Matrix](./WILD_APRICOT_GADGET_TAGGING.md) - Classification of all WA elements
- [Presentation Discovery Stage](./PRESENTATION_DISCOVERY_STAGE.md) - How discovery works
- [Migration Intake Checklist](./WILD_APRICOT_MIGRATION_INTAKE_CHECKLIST.md) - Questions to ask before migration

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-26 | System | Initial guide with automation proposal |
