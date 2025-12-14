# Chatbot Plugin Specification (Read-Only)

Worker 4 — Chatbot Plugin Spec — Report

## Goal
The chatbot operates through the same plugin interface used by other system features:
- Answers "how-to" support questions about using the application
- Executes read-only queries based on the user's RBAC/row-level access
- Helps navigate users to the correct page/section to complete tasks

## Non-Goals (v1)
- No data mutation (no creating events, no editing members, no sending emails)
- No direct admin actions
- No bypassing RBAC or exposing hidden entities

## Core Capabilities
1. How-to Support
- Uses docs/runbooks as sources
- Returns short, step-by-step instructions
- Always includes "Go to" links into the app where possible

2. Read-Only Query
- Uses allowlisted query templates (same as list gadgets concept)
- Returns scoped results only
- Can summarize results and offer navigation links

## Plugin Interface Concept
Chatbot uses:
- "Intent detectors" -> maps user question to:
  (a) doc answer, or
  (b) a query template, or
  (c) a navigation suggestion

## Safety and RBAC
- Every query executed must include viewer context (user id, roles, memberships).
- The server performs RBAC filtering prior to response.
- The chatbot never constructs raw SQL; it calls template endpoints.
- Results must be redacted by template rules (PII policy).

## Audit
- Log: user_id, timestamp, prompt summary, template_id (if used), params, result_count.
- Do not store full conversation text unless explicitly enabled (future).

## Navigation Behavior
- Prefer deep links:
  - /admin/... for admins
  - /member/... for members
- If user lacks permission, chatbot must explain and route to the appropriate role/owner (e.g., "contact VP Activities").

## JIT Training Integration
- Chatbot can suggest relevant "micro-training cards" tied to pages:
  - "You are on the Event page. Here are 3 common tasks..."
- Training content is generated from maintained docs snippets.

## Decisions Required
- Where will curated doc snippets live (docs/chatbot/snippets/ vs DB)?
- Do we enable conversation retention (default: no)?

## Verdict
READY FOR REVIEW
