# Hotspot Map (Quarantine Paths)

Purpose: Identify paths that frequently conflict and should be treated as "hotspots".
Rule: If a change must touch a hotspot, it becomes a dedicated themed wave owned by the merge captain.

Hotspots (primary)
- prisma/schema.prisma
- package.json
- package-lock.json
- src/app/admin/** (core admin nav/search/layout surfaces)
- src/app/admin/content/pages/** (publishing/editor surfaces)
- src/lib/publishing/** (publishing runtime)

Hotspots (secondary)
- src/app/api/** (route contracts; frequently touched)
- tests/** (broad surface; prefer micro-PRs)

Guidance
- Prefer docs-only work that avoids hotspots while waves are in flight.
- For conflicting work, salvage via micro-PRs after the wave lands.
