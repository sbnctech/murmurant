# ClubOS Merge Hygiene (simple rules)

Goal: merge often, keep PRs small, avoid long-lived diverging branches.

## Daily cadence (default)
1) Open PRs small enough to merge within 1-3 days.
2) Rebase onto origin/main at least daily for any PR that is still open.
3) Merge as soon as checks are green.

Definition of "small":
- <= ~300-500 lines net change
- touches <= 3-5 files
- avoids hot files unless necessary (schema.prisma, app shell, playwright config)

## Hotspot rule
These files cause most conflicts:
- prisma/schema.prisma
- playwright.config.ts
- src/app/page.tsx
- src/app/admin/**

Policy:
- Only one PR at a time should touch a hotspot on main.
- If multiple PRs must touch hotspots, use an integration branch (below).

## Integration branches (when work is big or overlaps)
If a feature will take >3 days or overlaps hotspots:
- Create an integration branch: integrate/<topic>
- Merge all related PRs into the integration branch first
- Keep integration branch updated from main daily
- Ship to main via 1 PR from integration -> main

## Guardrails in GitHub settings (recommended)
- Require branch to be up-to-date before merge
- Require CI checks
- Prefer squash merges
- Delete branches on merge

## "Merge Captain" role (lightweight)
- One person merges daily.
- Merge only PRs that:
  - are not draft
  - are up-to-date with main (rebase clean)
  - have green checks
  - do not overlap hotspots unless explicitly sequenced

## If conflicts start appearing
- Stop opening more PRs that touch the same files.
- Create an integration branch and retarget work there.
- Merge the integration branch to main ASAP.

