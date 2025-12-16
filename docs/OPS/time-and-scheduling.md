# Time and Scheduling Policy
Copyright (c) Santa Barbara Newcomers Club

This document defines scheduling invariants for cron jobs, JobRun identity,
and any time-based automation.

## Decision 1: JobRun Identity
A cron job run MUST be uniquely identified by:
- jobName
- scheduledForDate in the Club timezone

JobRun uniqueness key:
- UNIQUE(jobName, scheduledForDate)

## Decision 2: Club Timezone
All "scheduledForDate" computations MUST use the Club timezone, not UTC,
to prevent double-runs or missed runs around midnight.

## Rules
- Cron endpoints must be idempotent for the same jobName + scheduledForDate.
- If a cron job is triggered twice, only the first run performs mutations.
- Any time-based member transitions or reminders must log:
  - effectiveDate (club timezone date)
  - executedAt timestamp
  - requestId
