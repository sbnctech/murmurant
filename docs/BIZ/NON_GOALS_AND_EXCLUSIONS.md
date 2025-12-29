# Non-Goals and Exclusions

This document explicitly states what Murmurant v1 does NOT do.
These are intentional scope boundaries, not missing features.

---

## Explicit Exclusions for v1

### 1. Continuous Sync

**What it would mean**: Real-time or periodic synchronization of data between
Wild Apricot and Murmurant while both systems are in use.

**Why excluded**:
- Creates two sources of truth (conflict nightmare)
- Sync failures create data integrity risks
- Debugging divergence is extremely difficult
- Adds complexity without clear customer value

**Decision**: Migration is a one-time operation. Once data is imported,
Murmurant is the source of truth. No ongoing sync.

### 2. Bi-Directional Sync

**What it would mean**: Changes in Murmurant flow back to Wild Apricot,
and vice versa.

**Why excluded**:
- All the problems of continuous sync, but worse
- Which system "wins" on conflict?
- Operator confusion about where to make changes
- Massively increased testing surface

**Decision**: Data flows one direction: WA -> Murmurant. Period.

### 3. Wild Apricot as Live Fallback

**What it would mean**: Keeping WA running indefinitely as a fallback,
with Murmurant automatically redirecting to WA if issues occur.

**Why excluded**:
- Requires keeping WA subscription active (cost)
- Requires keeping both systems in sync (see above)
- Creates confusion about which system is authoritative
- Delays full adoption and hides Murmurant issues

**Decision**: The shadow period exists for validation. After cutover,
Murmurant is primary. WA is decommissioned after a safety hold period.

### 4. Automatic HTML Scraping / Content Publishing

**What it would mean**: Automatically migrating Wild Apricot website content
(pages, layouts, custom CSS, embedded media) to Murmurant.

**Why excluded**:
- HTML scraping is fragile (layout changes break everything)
- Content structure varies wildly between organizations
- Risk of broken pages, missing images, layout issues
- Content migration is a separate, content-strategy problem

**Decision**: Presentation layer migration is deferred. Organizations
recreate content in Murmurant or use manual migration assistance.

---

## Rationale Summary

| Exclusion | Primary Risk | Primary Complexity |
|-----------|--------------|-------------------|
| Continuous sync | Data integrity | Conflict resolution |
| Bi-directional sync | Authority confusion | Two-way merge logic |
| WA live fallback | Adoption delay | Dual-system maintenance |
| Auto HTML scraping | Broken content | Layout diversity |

---

## Future Considerations

Some exclusions may be revisited in future versions:

- **Content migration tools**: Assistive tooling (not auto-scraping) may help
  organizations migrate content. This would be a separate epic.

- **Incremental import**: Currently only full imports are supported.
  Incremental (delta) imports may be considered if customer need emerges.

- **Multi-org import**: Currently one organization per migration run.
  Multi-org batch imports may be considered for enterprise deployments.

For deferred work tracking, see Epic #202 (WA Migration) which links to
related deferred items.

---

## References

- Epic #202 - WA Migration
- [DECISIONS_LEDGER.md](./DECISIONS_LEDGER.md) - Decision log with dates

---

Last updated: 2025-12-24
