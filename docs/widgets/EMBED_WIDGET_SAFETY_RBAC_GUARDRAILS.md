# Embed Widgets Safety & RBAC Guardrails (Murmurant)

Worker 2 — Embed Safety Guardrails — Report

## Goal
Allow customers/admins to embed Murmurant widgets into pages they author without breaking RBAC or leaking data.

## Threat Model (Short)
- Shared embed URLs bypassing membership checks
- Token leakage via view-source, referrers, logs
- Cross-site scripting risks from user HTML
- Clickjacking / framing risks
- Data exfiltration via overly-broad API responses

## Allowed Embed Patterns (Preferred First)
1. Iframe embed to Murmurant-rendered page (RBAC enforced server-side)
2. Script tag embed that renders UI but fetches data via RBAC-gated APIs
3. Host-page SDK (advanced; only if we can harden)

## Required Controls (Non-Negotiable)
- All data APIs require auth; no "public JSON feed" for member data
- Short-lived signed session/token; no long-lived secrets in browser
- Origin allowlist for embeds where feasible
- Strict parameter validation (deny unknown parameters)
- Response shaping: only fields needed for widget
- Rate limiting and audit logging for privileged endpoints
- CSP guidance and frame-ancestors policy

## Forbidden / High-Risk Patterns
- Direct links to third-party galleries that bypass Murmurant RBAC
- Password-only protection as sole gate for member content
- Client-side filtering of "hidden" data (must be server enforced)

## RBAC Preservation Rules
- Embed must never expand user rights
- Viewer rights determined by Murmurant session, not embed location
- "Delegated admin" actions never allowed from anonymous embeds

## Operational Notes
- How admins would configure embeds safely (UI idea only)
- Logging/audit expectations
- Testing checklist (what to verify before enabling)

## Verdict
READY FOR REVIEW
