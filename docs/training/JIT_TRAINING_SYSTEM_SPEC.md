# Just-in-Time Training System Spec (Murmurant)

Worker 4 — JIT Training Spec — Report

## Goals
- Provide role-aware, context-aware training without requiring users to read docs
- Support both non-technical volunteers and highly technical tech chairs
- Reduce emergency burden by making the system self-explanatory and diagnosable

## Core Capabilities
- Contextual help panel on each page ("What can I do here?")
- Micro-lessons (30-90 seconds) generated from page metadata + task flows
- Chatbot:
  - answers how-to questions
  - performs read-only queries using RBAC
  - deep-links user to the exact UI section to complete the task
- Admin training tracks:
  - basic (volunteer)
  - advanced (technical chair)

## Inputs to Training Generator
- Page metadata (actions, fields, prerequisites)
- RBAC model (what user can/cannot do)
- Task flow library (step sequences)
- Known FAQs + troubleshooting playbooks

## Outputs
- Step-by-step guidance
- "Why you can't do that" explanations with next steps
- Links/buttons to the correct screens
- Optional printable cheat sheets

## Maintainability Claims (What we will be able to tell skeptical maintainers)
- Strong contracts (query templates, gadgets, RBAC gates)
- Audit logs + deterministic behavior
- Documentation that is executable by agents (structured specs)
- AI-assisted debugging becomes feasible when the system is well-instrumented

## Open Questions / Decisions
- TBD

## Verdict
READY FOR REVIEW
