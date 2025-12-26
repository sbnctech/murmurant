# ClubOS Page Builder Primitives

Derived from Wild Apricot migration analysis.

## Structural
- Page
- Section
- Column
- Card

## Content
- TextBlock
- Image
- ImageGallery
- CallToAction
- SafeEmbed

## Dynamic
- EventList
- EventCalendar
- EventRegistration
- MemberDirectory
- LoginControl

## Control
- VisibilityRule
- RoleGate
- FeatureFlag

## Explicit Non-Goals
- Arbitrary HTML
- Inline scripts
- Unbounded external embeds (use SafeEmbed with allowlist instead)

---

## SafeEmbed Specification

SafeEmbed renders external content via a locked-down iframe. It replaces arbitrary HTML embeds from Wild Apricot custom blocks with a secure, auditable alternative.

### Inputs

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| providerType | string | yes | Identifier from the allowlist (e.g., "youtube", "google-maps") |
| url | string | yes | Full URL to embed; must match allowlist rules |
| title | string | yes | Accessible title for the iframe |
| height | number | no | Height in pixels (default: 315) |
| width | number | no | Width in pixels (default: 560) |
| allowFullscreen | boolean | no | Enable fullscreen (default: false; must be allowed by provider config) |

### Allowlist Model

Admin-configurable with safety constraints:

- **Default deny.** Only URLs matching an explicit allowlist entry are rendered.
- **Hostname-based entries.** No wildcards by default.
- **HTTPS only.** HTTP URLs are rejected.

Each allowlist entry defines:

| Field | Required | Description |
|-------|----------|-------------|
| hostname | yes | Exact hostname (e.g., "www.youtube.com") |
| pathPrefixes | no | Allowed URL path prefixes (e.g., ["/embed/"]) |
| queryParamsAllowed | no | Whether query params are permitted (default: true) |
| allowFullscreen | no | Whether fullscreen is permitted (default: false) |
| notes | no | Human-readable reason for this entry |

### Iframe Security

The rendered iframe uses locked-down attributes:

```
sandbox="allow-scripts allow-same-origin"
referrerpolicy="no-referrer"
allow=""
```

Notes:
- `allow-scripts` and `allow-same-origin` are needed for most video players.
- `allow=""` disables camera, microphone, geolocation, and other sensitive features.
- If a provider does not require `allow-same-origin`, omit it.

### Audit Requirements

All allowlist changes must be logged:

- Who: Admin user ID
- When: Timestamp
- What: Entry added, modified, or removed

### Migration Mapping

| WA Custom HTML Pattern | SafeEmbed Handling |
|------------------------|-------------------|
| YouTube iframe | AUTO-MIGRATE if URL matches allowlist |
| Vimeo iframe | AUTO-MIGRATE if URL matches allowlist |
| Google Maps iframe | AUTO-MIGRATE if URL matches allowlist |
| Calendly embed | AUTO-MIGRATE if URL matches allowlist |
| Unknown iframe src | MANUAL REBUILD (add to allowlist first) |
| Script-based embed | UNSUPPORTED (no inline scripts) |

### Default Allowlist (v1)

Shipped out of the box:

| Provider | Hostname | Path Prefix | Fullscreen |
|----------|----------|-------------|------------|
| YouTube | www.youtube.com | /embed/ | yes |
| YouTube (short) | youtu.be | / | yes |
| Vimeo | player.vimeo.com | /video/ | yes |
| Google Maps | www.google.com | /maps/embed | no |
| Calendly | calendly.com | / | no |

Admins may add entries for other providers following the safety rules above.
