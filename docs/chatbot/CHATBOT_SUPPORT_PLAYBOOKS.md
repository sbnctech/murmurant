# Chatbot Support Playbooks

Worker 4 — Q-024 Chatbot Support Playbooks — Report

## Purpose
Define how the chatbot handles support questions and guided navigation
without mutating data.

## Capabilities
- Answer how-to questions
- Execute read-only queries
- Explain results
- Deep-link to UI locations

## Input Sources
- User chat
- Email-style requests
- Admin prompts

## Role Sensitivity
- Member
- Event Chair
- Committee Lead
- Tech Chair
- Board

## Response Structure
1. Direct answer
2. Context explanation
3. Link to action page
4. Escalation guidance (if needed)

## Guardrails
- Read-only
- RBAC enforced
- No assumptions
- Cite data source

## Non-Goals
- No writes
- No automation
- No background jobs

## Verdict
READY FOR REVIEW
