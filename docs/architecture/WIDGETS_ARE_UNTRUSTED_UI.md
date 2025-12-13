# Widgets Are Untrusted UI — ClubOS Policy

Worker 1 — Widgets Are Untrusted UI Policy — Report

## Definition
Widgets are client-side rendering components that are never trusted
to enforce identity, authorization, privacy, or policy.

## Why This Matters
- Security boundaries remain server-side
- Governance rules remain enforceable
- UI can evolve without weakening controls

## What Widgets May Do
- Render data explicitly provided by ClubOS
- Dispatch user intent (never decisions)
- Navigate within allowed affordances

## What Widgets Must Never Do
- Authenticate users
- Authorize actions
- Infer eligibility
- Store secrets
- Enforce privacy rules

## Enforcement Mechanism
- ViewerContext
- Widget contracts
- Server-side authorization checks

## Examples
- Events Calendar Widget
- Photo Gallery Widget

## Verdict
READY FOR REVIEW
