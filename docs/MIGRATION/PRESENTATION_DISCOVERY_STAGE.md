# Presentation Discovery Stage

**Status**: Specification
**Last Updated**: 2025-12-26
**Related**: Core Trust Surface, WA Migration Epic (#202)

---

## Purpose

The Presentation Discovery stage crawls a Wild Apricot site's public pages to inventory its presentation layer: navigation structure, page URLs, embedded widgets, and custom CSS. The output is a **Presentation Discovery Report** that informs the Suggestion Plan for content migration.

This stage does NOT migrate content. It discovers what exists so operators can make informed decisions.

---

## Scope

### Default Scope (Public-Only Crawl)

By default, this stage crawls only:

- Public pages visible to unauthenticated visitors
- Known export surfaces (events list, public content pages)
- Navigation structure and menus
- CSS/theme files referenced by public pages

This stage does NOT crawl:

- Member-only pages (require authentication)
- Admin pages (require admin authentication)
- Payment or transaction pages
- Private documents or files

### Extended Scope (Operator-Authorized)

If explicitly authorized by the operator via configuration:

- Member-visible pages (requires test member credentials)
- Admin-visible structures (requires admin credentials)

Extended scope requires explicit operator consent and is logged for audit.

---

## Inputs

| Input | Source | Required |
|-------|--------|----------|
| Site URL | Operator-provided | Yes |
| Crawl depth limit | Config (default: 3 levels) | No |
| Rate limit | Config (default: 1 req/sec) | No |
| Extended scope credentials | Operator-provided | No |
| Exclude patterns | Config (regex list) | No |

---

## Process

### Step 1: Site Validation

Before crawling:

1. Verify the site URL is reachable
2. Confirm it is a Wild Apricot site (detect WA signatures)
3. Check robots.txt for crawl restrictions
4. Log validation result

If validation fails, stop and report the reason.

### Step 2: Public Page Discovery

Starting from the home page:

1. Extract all internal links
2. Follow links up to the configured depth limit
3. Respect rate limiting
4. For each page, record:
   - URL and path
   - Page title
   - Navigation position (if in menu)
   - Template type (if detectable)
   - Embedded widgets/gadgets (see tagging spec)
   - External resources (CSS, JS, images)

### Step 3: Widget Inventory

For each page, detect and classify embedded elements:

| Element Type | Detection Method | Classification |
|--------------|------------------|----------------|
| WA System Widgets | Known class patterns | Auto-migrate / Manual / Unsupported |
| WA Gadgets | Gadget container signatures | See WILD_APRICOT_GADGET_TAGGING.md |
| Custom HTML | Freeform content blocks | Manual review required |
| External embeds | iframe src domains | Unsupported unless allowlisted |

### Step 4: Theme/CSS Extraction

Identify styling resources:

1. Primary stylesheet URLs
2. Custom CSS blocks (inline styles)
3. Theme name (if WA theme detected)
4. Font references
5. Color palette (primary colors from CSS)

### Step 5: Report Generation

Produce the Presentation Discovery Report (JSON format) containing:

- Crawl metadata (date, duration, pages visited)
- Page inventory (URL, title, depth, widgets)
- Navigation structure (menu hierarchy)
- Widget summary (counts by type and classification)
- Theme/CSS summary
- Recommendations for Suggestion Plan

---

## Outputs

### Primary Output: Presentation Discovery Report

Format: JSON (see PRESENTATION_DISCOVERY_CONTRACT.json)

Contents:

```
{
  "metadata": {
    "siteUrl": "https://example.wildapricot.org",
    "crawlDate": "2025-12-26T10:00:00Z",
    "crawlDuration": "PT5M30S",
    "pagesDiscovered": 47,
    "scope": "public-only"
  },
  "pages": [...],
  "navigation": {...},
  "widgets": {...},
  "theme": {...},
  "recommendations": [...]
}
```

### Secondary Output: Suggestion Plan Input

The discovery report feeds into the Suggestion Plan generator, which proposes:

- Which pages to recreate in ClubOS
- Which widgets to auto-migrate
- Which elements require manual rebuild
- Which elements are unsupported

The Suggestion Plan is a separate stage and document.

---

## Exit Criteria

The stage completes successfully when:

- [ ] Site validation passed
- [ ] All reachable public pages within depth limit crawled
- [ ] No unhandled errors during crawl
- [ ] Discovery report generated and validated against schema
- [ ] Report stored for operator review

---

## Failure Modes

| Failure | Cause | Recovery |
|---------|-------|----------|
| Site unreachable | DNS/network issue | Retry after operator confirms URL |
| Not a WA site | Wrong URL or site migrated | Stop, report to operator |
| Rate limited by WA | Too aggressive crawl | Reduce rate, retry |
| Crawl timeout | Site too large | Increase timeout or reduce depth |
| Auth required for page | Member-only content | Skip page, note in report |

All failures are logged. The stage never modifies the source site.

---

## Trust Surface Alignment

This stage adheres to Core Trust Surface guarantees:

| Guarantee | How Addressed |
|-----------|---------------|
| Human Authority | Crawl requires operator initiation; no automatic execution |
| Intent Determinism | Report reflects exactly what was discovered; no inference |
| Preview Fidelity | Report can be reviewed before any action is taken |
| Abortability | Crawl can be stopped at any time; no side effects |
| Auditability | All crawl actions logged; report includes full metadata |

### Prohibitions Observed

- **No CMS cloning**: We discover structure, not content
- **No hidden inference**: Widgets are classified by explicit rules, not guessed
- **No automatic execution**: Discovery report requires operator review before proceeding

---

## Relationship to Other Stages

```
┌─────────────────────────────────────────────────────────────────┐
│                    MIGRATION WORKFLOW                            │
├─────────────────────────────────────────────────────────────────┤
│  Data Export (WA CSV) ──────────────────────────────────────┐   │
│                                                              │   │
│  Presentation Discovery ──► Suggestion Plan ──► Preview ──► │   │
│                                                              │   │
│  Policy Capture ────────────────────────────────────────────►│   │
│                                                              ▼   │
│                                                         Cutover  │
└─────────────────────────────────────────────────────────────────┘
```

Presentation Discovery runs independently of Data Export. Both feed into the Suggestion Plan stage.

---

## Implementation Notes

### Rate Limiting

The crawler must:

- Default to 1 request per second
- Honor Retry-After headers
- Back off exponentially on errors
- Never exceed 10 requests per second even if configured higher

### Storage

Discovery reports are stored:

- As JSON files in the migration working directory
- With checksums for integrity verification
- Retained until operator explicitly deletes them

### Credential Handling (Extended Scope Only)

If credentials are provided for extended scope:

- Credentials are used only for the duration of the crawl
- Credentials are never stored in the discovery report
- Credential use is logged for audit

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-26 | System | Initial specification |
