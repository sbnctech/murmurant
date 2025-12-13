# Chatbot Tool Router Plan

Worker 4 - Chatbot Tool Router Plan - Report

## Goal
Define the minimal server-side tool router that exposes read-only tools to the chatbot.

No UI. No LLM integration yet. Just the server contract.

## Components
1) Tool registry
- tool_name -> handler
- input validation per tool
- output normalization per tool

2) ViewerContext requirement
- All tools require ViewerContext
- Tool router rejects missing/invalid context with 401/403

3) Audit logging
- One audit record per tool call

4) Rate limiting
- Per user and per tool

## Suggested File Locations (proposal)
- src/lib/chatbot/tools/types.ts
- src/lib/chatbot/tools/registry.ts
- src/lib/chatbot/tools/handlers/*.ts
- src/app/api/chatbot/tools/route.ts

## Initial Tools
- help.search
- help.get
- nav.resolve
- query.run
- events.lookup
- membership.lookup_self

## Non-Goals
- No writes
- No background jobs
- No freeform queries
- No external provider dependencies

## Verdict
READY FOR REVIEW
