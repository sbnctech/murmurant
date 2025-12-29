# Murmurant Engineering Constitution

This document defines the non-negotiable engineering rules for Murmurant.
Its purpose is to keep `main` green, prevent merge churn, and preserve developer time.

If a choice exists between speed and safety, choose safety.

---

## Core Principles

1. Main must always be releasable
2. Merge conflicts are a process failure, not a technical one
3. Small, boring changes beat large, clever ones
4. Forward progress is mandatory; stalls are not

---

## Authority Model

- There is exactly **one Merge Captain** at any time
- Only the Merge Captain merges into `main`
- All other contributors submit PRs only

---

## PR Discipline

- One concern per PR
- Minimal diff
- No speculative refactors
- No rebasing existing PRs
- Long-lived PRs are forbidden

---

## Hotspot Protection

The following files and areas are **hotspots** and require explicit coordination:

- `prisma/schema.prisma`
- database migrations
- `package-lock.json`
- CI workflows
- core auth and RBAC logic
- editor and publishing surfaces

Hotspot changes must be:

- isolated
- sequential
- Merge-Captain owned

---

## Micro-PR Rule

Any PR that:

- touches a hotspot
- exceeds review capacity
- overlaps with another PR

must be decomposed into **micro-PRs**.

---

## Failure Handling

- If blocked, log the blocker and continue
- If uncertain, choose the lowest-risk option
- If in doubt, do nothing rather than destabilize main

---

## Definition of Success

- `main` is green
- PR count stays low
- Work lands continuously
- No cleanup cycles are required

---

*This constitution supersedes all prior informal practices.*
