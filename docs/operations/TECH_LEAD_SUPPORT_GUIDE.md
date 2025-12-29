# Tech Lead Support Intake & Resolution Guide

Copyright (c) Santa Barbara Newcomers Club

## Purpose

This guide defines how the Tech Lead handles inbound support requests (email, text, Slack, verbal) in a way that:

- Reduces repetitive manual work
- Preserves institutional knowledge
- Feeds improvements back into Murmurant (logic, rules, UX, content)
- Uses AI to draft responses, request missing details, and propose fixes
- Ensures every issue is tracked, resolved, and closed

The goal is not just to respond to problems, but to continuously harden and clarify the system.

---

## Core Principle: Every Request Is a Case

Any support request that requires more than a trivial reply becomes a **case**.

A case must always have:

- An owner (Tech Lead)
- A current status
- A clear next action
- A closure condition

No case is considered "done" until it is explicitly closed.

---

## Step 1: Case Creation (Automatic or Manual)

When a support request arrives, immediately create a case record with:

- **Submitter**
- **Channel** (email, text, Slack, in person)
- **Date received**
- **Free-text description** (verbatim)
- **Initial category** (see below)
- **Status: OPEN**

### Issue Categories (initial guess is fine)

- Bug (system behaving incorrectly)
- UX gap (works, but confusing)
- Rule mismatch (policy vs implementation)
- Missing capability
- Education / expectation mismatch

AI may suggest a category; the Tech Lead can override.

---

## Step 2: Completeness Check (Before Responding)

Before drafting a response, the system (via AI) evaluates whether the request includes enough information to act.

### Common Missing Details

- Which event / page / action?
- What role was the user in? (member, chair, admin)
- What device was used?
- What did they expect vs what happened?
- Is this repeatable?

---

## Step 3: AI-Guided Clarification (If Needed)

If required details are missing, the system should:

1. **Generate a clarification checklist** for the Tech Lead
2. **Draft a polite follow-up message** to the submitter requesting only the missing information
3. Keep the case **OPEN – AWAITING INFO**

### Draft Follow-Up Characteristics

- Appreciative and non-blaming
- Short and specific
- Explains why the info is needed
- Avoids technical jargon

The Tech Lead reviews and sends.

No technical work begins until required info is received.

---

## Step 4: AI-Drafted Response (Human Approved)

Once sufficient information exists, AI drafts a response that:

- Acknowledges the issue
- Explains what is happening (plain language)
- Sets expectations (fix, workaround, timeline, or explanation)

The Tech Lead reviews, edits if needed, and sends.

This response does **not** close the case.

---

## Step 5: Internal Action Analysis (AI-Assisted)

Separately from user communication, AI analyzes the case and proposes:

- Root cause hypothesis
- Whether the system or expectation is at fault
- Likelihood of recurrence
- One or more concrete actions:
  - Code change
  - Business rule update
  - UX clarification
  - Validation or warning
  - Documentation update

Each proposal includes:

- Risk level
- Effort level
- Expected impact

---

## Step 6: Resolution Decision (Human Judgment)

The Tech Lead selects one resolution path:

1. **Response only**
   - Education issue
   - Low recurrence risk

2. **Response + Documentation**
   - Institutional knowledge gap

3. **Response + System Change**
   - Bug, UX issue, or rule mismatch

4. **Escalate**
   - Policy or governance decision required

The chosen path is recorded on the case.

---

## Step 7: Closure Criteria (Required)

A case may be closed only when **one** of the following is true:

- A fix has been deployed
- Documentation has been updated
- A policy decision has been recorded
- The submitter has confirmed resolution
- The Tech Lead has determined no action is required (with rationale)

### Required Closure Fields

- **Final category**
- **Action taken**
- **Preventive change made (if any)**
- **Date closed**

Status becomes **CLOSED**.

---

## Step 8: Feedback Loop (Optional but Encouraged)

When appropriate, notify the original submitter that:

- Their feedback resulted in a fix or improvement
- Or explain the final outcome clearly

This reinforces trust and encourages constructive reporting.

---

## Operating Standards

- No silent drops: every case is closed explicitly
- Repeated questions indicate system failure, not user failure
- AI assists with analysis and drafting, not authority
- Humans approve all outward communication
- The system should get better because support happened

---

## Success Indicators

This process is working when:

- Similar issues stop recurring
- Responses get shorter over time
- Support requests increasingly map to product improvements
- The Tech Lead spends more time improving the system than answering questions

---

## Related Files

- `prisma/schema.prisma` - SupportCase model
- `src/lib/support/` - Case management utilities
- `docs/operations/SUPPORT_PROMPT_TEMPLATES.md` - AI prompt templates
