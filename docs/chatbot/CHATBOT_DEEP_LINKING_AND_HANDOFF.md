# Chatbot Deep Linking and Handoff

Worker 3 - Chatbot Deep Linking and Handoff - Report

## Goal
Ensure the chatbot remains read-only while being highly effective at guiding users to the correct place in the app to complete a task.

## Principles
- Chatbot is a router: intent -> (help | link | query)
- Chatbot never mutates data
- Chatbot always respects ViewerContext and RBAC
- If a task requires action, chatbot hands off via a link to the correct page/section

## Response Types
1) How-to Support (static + role-aware)
- Provide concise steps
- Provide "Take me there" deep link(s)
- Provide "If blocked, contact" guidance

2) Read-only Query
- Use pre-approved query templates only
- Return short results + offer link to full view
- Never reveal redacted fields

3) Handoff to UI
- Provide deep link(s) with:
  - target page
  - optional filters (allowlisted only)
  - optional anchor to section
- Example: "Open Events -> Waitlist" (link)

## Deep Link Contract (conceptual)
A deep link payload must include:
- destination (page id)
- optional allowlisted params (filters, ids)
- optional anchor/section
- no secrets, no tokens in URL beyond short-lived server-issued session context

## Safety Rules
- Links must not encode privileged identifiers unless viewer has access
- Links must not increase access; they only navigate
- If viewer lacks permission, page must enforce 401/403 server-side

## Required UX Conventions
- Every major page exposes a stable "page id"
- Every major workflow exposes stable section anchors
- Pages render a friendly "Not allowed" explanation for denied users

## Verdict
READY FOR REVIEW
