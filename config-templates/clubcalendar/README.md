# ClubCalendar Config Templates

Production-ready configuration templates for SBNC's inline calendar widget.

## Quick Start

Pick one template based on your data source:

| Template | When to Use |
|----------|-------------|
| `sbnc-wa-feed.config.json` | You have a Wild Apricot ICS calendar feed URL |
| `sbnc-static-json.config.json` | You're hosting an events.json file yourself |

## Files in this Directory

- **sbnc-wa-feed.config.json** - Config for Wild Apricot ICS feed
- **sbnc-static-json.config.json** - Config for self-hosted JSON
- **example-events.json** - Sample events file (for static JSON variant)
- **README.md** - This file

## Setup Instructions

See [SBNC_INLINE_ONLY_INSTALL.md](../../docs/INSTALL/SBNC_INLINE_ONLY_INSTALL.md) for complete setup.

## What to Replace

Both config files have `_comment_*` fields that explain what to change. The main things:

1. **dataSource.url** - Your actual data feed URL
2. **features.eventPageBaseUrl** - Where event detail pages live

## Timezone

Both templates default to `America/Los_Angeles` (Pacific Time) for SBNC.
