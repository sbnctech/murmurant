# Just-in-Time Training Plan

Worker 4 — JIT Training Plan — Report

## Goal

Provide role-aware, context-sensitive training without requiring users to read
long documentation. Training appears at the moment of need, tailored to the
user's role, current page, and task state.

---

## Training Surfaces

### 1. Inline Tips

Short contextual hints displayed near UI elements.

| Trigger | Example |
|---------|---------|
| First visit to page | "This is where you approve event submissions" |
| Hover on unfamiliar element | "Click here to see registrant details" |
| Empty state | "No pending approvals. Events appear here after chairs submit them." |

**Characteristics**:
- Max 1-2 sentences
- Dismissible (remember dismissal per user)
- Role-filtered (VP sees different tips than Member)

### 2. Checklists

Step-by-step task completion guides.

| Context | Example Checklist |
|---------|-------------------|
| New Event Chair onboarding | "1. Review your committee assignment 2. Submit your first event 3. Track approval status" |
| First refund request | "1. Confirm cancellation 2. Select refund reason 3. Submit to Finance Manager" |
| Term transition | "1. Export your data 2. Review pending items 3. Hand off to successor" |

**Characteristics**:
- Progress persisted per user
- Can be resumed across sessions
- Linked to specific pages for each step

### 3. Next Step Nudges

Proactive suggestions after completing an action.

| After Action | Nudge |
|--------------|-------|
| Event approved | "Next: Notify the Event Chair or publish to calendar" |
| Registration cancelled | "Next: Process refund if payment was captured" |
| Member added | "Next: Send welcome email or assign to committee" |

**Characteristics**:
- Appears in toast/banner after action completes
- Links directly to the suggested next page
- Dismissible; does not block workflow

### 4. Walkthroughs

Guided multi-step tours for complex workflows.

| Workflow | Walkthrough Steps |
|----------|-------------------|
| Event submission | Form fields -> Preview -> Submit -> Track status |
| Refund lifecycle | Cancel registration -> Initiate refund -> Await approval -> Confirm completion |
| Report generation | Select report -> Configure filters -> Run -> Export |

**Characteristics**:
- Opt-in (user clicks "Show me how")
- Can exit at any step
- Highlights relevant UI elements in sequence
- Role-appropriate (Finance sees refund walkthrough; Chair does not)

---

## Content Model (Training Registry)

Training content is stored in a structured registry keyed by context dimensions.

### Registry Key Structure

```
TrainingSnippet {
  id: string
  key: {
    page: string          // e.g., "/admin/events", "/admin/refunds"
    role: Role[]          // e.g., ["vp-activities", "admin"]
    task: string | null   // e.g., "approve-event", "process-refund"
    state: string | null  // e.g., "empty", "first-visit", "error"
  }
  surface: "tip" | "checklist" | "nudge" | "walkthrough"
  content: {
    title: string
    body: string
    steps: Step[] | null  // for checklists/walkthroughs
    linkTo: string | null // internal page link
    docRef: string | null // reference to internal doc
  }
  priority: number        // higher = show first if multiple match
  dismissible: boolean
  expiresAfter: number | null  // show N times, then stop
}
```

### Matching Logic

When rendering a page, the system:

1. Collects context: (currentPage, userRole, currentTask, pageState)
2. Queries registry for matching snippets
3. Filters by role (user must have at least one matching role)
4. Sorts by priority
5. Returns top N snippets per surface type

### Example Registry Entries

```
{
  id: "tip-events-empty-vp",
  key: {
    page: "/admin/events",
    role: ["vp-activities"],
    task: null,
    state: "empty"
  },
  surface: "tip",
  content: {
    title: "No events yet",
    body: "Events appear here after committee chairs submit them via the event request form.",
    linkTo: "/docs/event-submission",
    docRef: "docs/workflows/EVENT_CHAIR_WORKFLOW.md"
  },
  priority: 10,
  dismissible: true,
  expiresAfter: 3
}
```

---

## How the Chatbot Uses Training

The chatbot accesses the same training registry in read-only mode.

### Chatbot Training Tools

| Tool | Purpose |
|------|---------|
| `training.search` | Find snippets by keyword or context |
| `training.get` | Retrieve specific snippet by ID |
| `training.suggest` | Get recommended training for user's current context |

### Chatbot Behavior

When user asks "How do I approve an event?":

1. Chatbot calls `training.search({ task: "approve-event", role: userRole })`
2. Registry returns matching snippets (checklist, walkthrough)
3. Chatbot formats response using snippet content
4. Chatbot includes `linkTo` as actionable link
5. Chatbot cites `docRef` for users who want more detail

### What Chatbot MUST NOT Do

- Invent steps not in the registry
- Provide instructions for pages user cannot access
- Skip role filtering
- Cache training content beyond session

---

## Guardrails (Prevent Wrong Instructions)

### Guardrail 1: No Hallucinated Steps

All training content comes from the registry. The chatbot and UI surfaces do
not generate instructions dynamically.

| Allowed | Forbidden |
|---------|-----------|
| Display registered snippet | Generate steps from LLM |
| Link to internal page | Link to external site |
| Cite internal doc | Cite imagined doc |

### Guardrail 2: Cite Internal Docs/Pages

Every training snippet MUST include at least one of:
- `linkTo`: Direct link to the relevant ClubOS page
- `docRef`: Path to internal documentation file

If neither exists, the snippet fails validation and is not deployed.

### Guardrail 3: Link User to Exact Page

Nudges and walkthroughs link to specific pages, not general areas.

| Good | Bad |
|------|-----|
| `/admin/events/123/approve` | `/admin` |
| `/admin/refunds?status=pending` | `/admin/refunds` (unfiltered) |
| `/docs/finance/REFUND_WORKFLOW.md` | "See the docs" |

### Guardrail 4: Role-Gated Content

Training for privileged actions (refunds, deletions) is only shown to users
with the required role. The registry enforces this at query time.

### Guardrail 5: Version Control

Training registry is version-controlled alongside code. Changes require review.
No runtime editing of training content.

---

## Rollout Plan

### Phase 1: Foundation

- [ ] Define TrainingSnippet schema
- [ ] Build registry with initial 20 snippets
- [ ] Implement page-level tip display
- [ ] Add dismiss/remember logic

### Phase 2: Checklists and Nudges

- [ ] Implement checklist progress tracking
- [ ] Add post-action nudge system
- [ ] Create onboarding checklists for each role

### Phase 3: Walkthroughs

- [ ] Build walkthrough engine (highlight, step, navigate)
- [ ] Create walkthroughs for top 5 workflows
- [ ] Add "Show me how" entry points

### Phase 4: Chatbot Integration

- [ ] Expose training tools to chatbot
- [ ] Train chatbot to prefer registry over freeform answers
- [ ] Add citation formatting for chatbot responses

---

## Metrics

### Completion Metrics

| Metric | Definition |
|--------|------------|
| Checklist completion rate | % of started checklists finished |
| Walkthrough completion rate | % of started walkthroughs finished |
| Step drop-off | Which step users abandon most |

### Deflection Metrics

| Metric | Definition |
|--------|------------|
| Support ticket reduction | Tickets before/after JIT rollout |
| Chatbot resolution rate | % of questions answered via training registry |
| Self-service rate | % of tasks completed without human help |

### Satisfaction Metrics

| Metric | Definition |
|--------|------------|
| Tip helpfulness | Thumbs up/down on inline tips |
| Walkthrough rating | 1-5 stars after completion |
| Time to first success | How long until user completes first key task |

### Tracking Requirements

- All metrics are aggregate (no PII in analytics)
- Dismissals tracked to avoid showing unwanted content
- A/B testing capability for new snippets

---

## Non-Goals

- No video tutorials (text and links only)
- No external help desk integration
- No AI-generated training content
- No user-editable training (admin-managed only)

---

## Open Questions

1. **Snippet authoring**: Who writes training snippets? Product? Tech?
2. **Localization**: Support multiple languages eventually?
3. **Expiration**: Auto-retire snippets after N months without use?

---

## Verdict

**READY FOR REVIEW**

---

*Worker 4 — JIT Training Plan — December 2024*
