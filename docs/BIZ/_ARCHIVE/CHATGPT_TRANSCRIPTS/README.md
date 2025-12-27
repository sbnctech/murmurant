# ChatGPT Transcript Archive

This folder contains verbatim transcripts from ChatGPT design sessions.

---

## Why This Archive Exists

ChatGPT serves as a design studio for exploring ideas. Transcripts are
primary sources that preserve the original thinking, context, and
discussion that led to decisions captured in the canonical docs.

By archiving raw transcripts:
- We preserve context that summaries lose
- Future contributors can understand the "why" behind decisions
- Audit trail exists for strategic discussions

---

## Rules for Transcripts

1. **Verbatim only**: Copy-paste directly from ChatGPT. Do not summarize,
   interpret, or rephrase.

2. **No edits except redaction**: Remove API keys, credentials, personal
   data, or other secrets. Mark redactions with [REDACTED].

3. **One topic per file**: Keep transcripts focused. If a session covers
   multiple topics, split into separate files.

4. **Use markdown formatting**: Preserve the conversation structure
   (You: / ChatGPT:) for readability.

---

## Naming Convention

```
CHATGPT_<TOPIC>_TRANSCRIPT_<YYYY-MM-DD>.md
```

Examples:
- CHATGPT_BUSINESS_MODEL_TRANSCRIPT_2025-12-24.md
- CHATGPT_MIGRATION_STRATEGY_TRANSCRIPT_2025-12-25.md
- CHATGPT_POLICY_ISOLATION_TRANSCRIPT_2025-12-26.md

Use SCREAMING_SNAKE_CASE for topic names. Date is when the conversation
occurred (or was captured, if spanning multiple days).

---

## Transcript Index

| File | Topic | Date |
|------|-------|------|
| [CHATGPT_BUSINESS_MODEL_TRANSCRIPT_2025-12-24.md](./CHATGPT_BUSINESS_MODEL_TRANSCRIPT_2025-12-24.md) | Business model exploration, migration philosophy, sync exclusions | 2025-12-24 |

---

## How to Add a Transcript

1. Create a new file using the naming convention above
2. Add header with topic and date
3. Paste verbatim ChatGPT content
4. Redact any secrets (mark with [REDACTED])
5. Add entry to the index table above
6. Commit and open PR

---

Last updated: 2025-12-24
