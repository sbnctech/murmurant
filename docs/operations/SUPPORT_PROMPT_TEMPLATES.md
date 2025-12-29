# Support Case AI Prompt Templates

Templates for AI-assisted support case handling. These prompts guide Claude to assist with the Tech Lead support workflow.

## 1. Case Intake & Categorization

Use this prompt when a new support request arrives to categorize it and check for completeness.

```
You are helping triage a support request for Murmurant, a club management system.

SUPPORT REQUEST:
"""
{verbatim_request}
"""

SUBMITTER: {submitter_name}
CHANNEL: {channel}
DATE: {received_date}

Please analyze this request and provide:

1. SUGGESTED CATEGORY (choose one):
   - BUG: System behaving incorrectly
   - UX_GAP: Works but confusing
   - RULE_MISMATCH: Policy vs implementation conflict
   - MISSING_CAPABILITY: Feature request
   - EDUCATION: Expectation mismatch, not a bug
   - UNKNOWN: Cannot determine

2. COMPLETENESS CHECK - Is the following information present?
   - [ ] Which page/feature/action is affected?
   - [ ] What role was the user in? (member, chair, admin)
   - [ ] What device/browser was used?
   - [ ] What did they expect to happen?
   - [ ] What actually happened?
   - [ ] Is this repeatable?

3. If information is missing, draft a brief, friendly follow-up message requesting ONLY the missing details. The message should be:
   - Appreciative and non-blaming
   - Short and specific
   - Explain why the info is needed
   - Avoid technical jargon

4. INITIAL ASSESSMENT:
   - Urgency: low / medium / high
   - Likely root cause (1-2 sentences)
```

---

## 2. Clarification Request Draft

Use when case needs more information before proceeding.

```
Draft a friendly follow-up message to gather missing information for a support case.

ORIGINAL REQUEST:
"""
{original_request}
"""

MISSING INFORMATION NEEDED:
{missing_items_list}

Write a brief, polite message that:
1. Thanks them for reaching out
2. Asks only for the specific missing information
3. Explains briefly why each piece helps us resolve the issue
4. Keeps the tone warm and non-technical
5. Is under 100 words

Do not apologize excessively or use phrases like "I'm sorry for the inconvenience."
```

---

## 3. Response Draft (After Sufficient Info)

Use when ready to respond with an explanation or status update.

```
Draft a response to a support case. The Tech Lead will review and edit before sending.

CASE SUMMARY:
- Issue: {issue_summary}
- Category: {category}
- Root Cause: {root_cause}

RESOLUTION STATUS:
{resolution_status}
(Options: investigating, fix in progress, fix deployed, not a bug, documentation updated, feature request logged)

NEXT STEPS (if any):
{next_steps}

Write a response that:
1. Acknowledges the issue clearly
2. Explains what happened in plain language (no jargon)
3. States what was done or will be done
4. Sets clear expectations
5. Thanks them for reporting

Keep it under 150 words. Be direct and warm, not overly apologetic.
```

---

## 4. Root Cause Analysis

Use for internal analysis after gathering complete information.

```
Analyze this support case and propose actions.

CASE DETAILS:
- Category: {category}
- Description: {description}
- Affected Feature: {feature}
- User Role: {role}
- Expected Behavior: {expected}
- Actual Behavior: {actual}

CONTEXT:
{additional_context}

Please provide:

1. ROOT CAUSE HYPOTHESIS
   What is likely causing this issue? (2-3 sentences)

2. SYSTEM VS EXPECTATION
   Is the system wrong, or is the user expectation misaligned?
   - System fault
   - Expectation mismatch
   - Both (system works but UX misleads)
   - Unclear

3. RECURRENCE LIKELIHOOD
   - Low: One-off edge case
   - Medium: Could affect other users in similar situations
   - High: Likely to recur frequently

4. PROPOSED ACTIONS (one or more):
   For each action, rate Risk (low/med/high) and Effort (trivial/small/medium/large)

   a) Code change: {description}
      Risk: __ | Effort: __

   b) Business rule update: {description}
      Risk: __ | Effort: __

   c) UX clarification: {description}
      Risk: __ | Effort: __

   d) Validation/warning: {description}
      Risk: __ | Effort: __

   e) Documentation update: {description}
      Risk: __ | Effort: __

5. RECOMMENDED PATH
   Which resolution path do you recommend?
   - RESPONSE_ONLY: Education issue, low recurrence
   - RESPONSE_PLUS_DOCS: Documentation gap
   - RESPONSE_PLUS_FIX: Code or rule change needed
   - ESCALATE: Policy decision required
```

---

## 5. Closure Summary

Use when closing a case to generate the closure record.

```
Generate a closure summary for this support case.

CASE NUMBER: {case_number}
ORIGINAL ISSUE: {original_description}
CATEGORY: {final_category}
RESOLUTION PATH: {resolution}

ACTIONS TAKEN:
{actions_taken}

PREVENTIVE CHANGES:
{preventive_changes_or_none}

Generate a concise closure summary (under 100 words) that:
1. States what the issue was
2. Explains what was done to resolve it
3. Notes any system improvements made
4. Can be shared with the submitter if appropriate
```

---

## 6. Feedback Loop Message

Use when notifying submitter that their feedback led to improvements.

```
Draft a brief thank-you message for a submitter whose feedback resulted in a system improvement.

ORIGINAL ISSUE: {issue_summary}
IMPROVEMENT MADE: {improvement_description}

Write a message (under 75 words) that:
1. Thanks them specifically for reporting the issue
2. Explains what was improved as a result
3. Reinforces that feedback is valued
4. Invites future feedback

Keep it warm and genuine, not corporate.
```

---

## Usage Notes

- **All drafts require human review** before sending
- Templates are starting points - adapt as needed
- For complex cases, use multiple templates in sequence
- Store AI analysis in `aiRootCause` and `aiProposedActions` fields
- Update `aiRiskLevel` and `aiEffortLevel` based on analysis

## Integration Pattern

```typescript
// Example usage with support case
async function analyzeCase(caseId: string) {
  const supportCase = await prisma.supportCase.findUnique({
    where: { id: caseId },
  });

  const prompt = buildRootCausePrompt(supportCase);
  const analysis = await callClaude(prompt);

  await prisma.supportCase.update({
    where: { id: caseId },
    data: {
      aiRootCause: analysis.rootCause,
      aiProposedActions: analysis.proposedActions,
      aiRiskLevel: analysis.riskLevel,
      aiEffortLevel: analysis.effortLevel,
    },
  });

  await prisma.supportCaseNote.create({
    data: {
      caseId,
      noteType: "ai_analysis",
      content: JSON.stringify(analysis),
    },
  });
}
```

## Related Files

- `docs/operations/TECH_LEAD_SUPPORT_GUIDE.md` - Full workflow documentation
- `prisma/schema.prisma` - SupportCase and SupportCaseNote models
- `src/lib/support/` - Support case utilities (to be implemented)
