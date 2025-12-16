# ClubOS Chatbot Contributor Rules

**Version**: 1.1
**Effective Date**: 2025-12-16
**Audience**: AI assistants, chatbots, and automated code generators
**Canonical Grounding**: [ORG/SBNC_BUSINESS_MODEL.md](./ORG/SBNC_BUSINESS_MODEL.md)
**Charter Reference**: [ARCHITECTURAL_CHARTER.md](./ARCHITECTURAL_CHARTER.md)

---

## Purpose

This document defines rules that AI assistants and automated contributors MUST follow when working on the ClubOS codebase. These rules ensure that AI-generated code remains consistent with SBNC's organizational mission and the Architectural Charter.

**Grounding Priority (in order):**

1. **Canonical Grounding**: [ORG/SBNC_BUSINESS_MODEL.md](./ORG/SBNC_BUSINESS_MODEL.md)
   - SBNC is participation-driven; success = member journey progression
   - The flywheel (events -> participation -> volunteers -> more events) must be protected
   - Fear reduction is the primary strategy for member and volunteer engagement
   - $50K buffer exists; surplus spent on participation/volunteer sustainability

2. **Architectural Charter**: [ARCHITECTURAL_CHARTER.md](./ARCHITECTURAL_CHARTER.md)
   - Capability-based authorization (not role-based)
   - Technical principles P1-P10
   - Anti-patterns N1-N8

3. **Existing Code Patterns**: What already works in the codebase

Before making any change, chatbots MUST:

1. Read `docs/ORG/SBNC_BUSINESS_MODEL.md` (canonical grounding)
2. Read `docs/ARCHITECTURAL_CHARTER.md` (technical charter)
3. Cite the specific principles that apply
4. Add or update tests that prove permission boundaries remain correct
5. Update documentation when behavior changes

---

## Behavioral Commitments

When interacting with users or generating content, AI assistants MUST:

### B1: Normalize Anxiety

Acknowledge that uncertainty and anxiety about participation are normal.
Don't dismiss concerns; address them with information and support.

```
// Good: "It's normal to feel uncertain about your first event. Here's what to expect..."
// Bad: "Don't worry, you'll be fine."
```

### B2: Promote Mentorship

Surface mentor availability at friction points. When a member seems hesitant
or is facing a first-time situation, mention the mentor program.

```
// Good: "Would you like us to connect you with a mentor who can help?"
// Bad: (Ignoring hesitation and pushing forward)
```

### B3: Escalate Uncertainty

When unsure about a question or situation, ask rather than guess.
It is better to say "I'm not certain - let me check" than to provide
incorrect information.

```
// Good: "I'm not sure about that policy. Let me connect you with someone who knows."
// Bad: "I think the answer is probably X." (when unsure)
```

### B4: Protect the Flywheel

All recommendations and changes should support the flywheel:
events -> participation -> volunteers -> more events.

When evaluating a change, ask: "Does this make participation easier or harder?
Does this support or strain volunteers?"

---

## Core Rules

### R1: Read Before Write

MUST read existing files before proposing modifications.

- Always use Read tool before Edit tool
- Understand the existing patterns before suggesting changes
- Check for similar implementations elsewhere in the codebase
- Never guess at file contents or structure

### R2: Follow Existing Patterns

MUST match the style and patterns of existing code.

- Use the same import style as neighboring files
- Match indentation and formatting conventions
- Follow existing naming conventions
- Use the same error handling patterns

### R3: No Speculative Features

MUST NOT add features beyond what is explicitly requested.

- Don't add "helpful" extra functionality
- Don't refactor unrelated code
- Don't add comments to unchanged code
- Don't create utility functions for one-time operations

### R4: Use Capability Checks, Not Role Checks

MUST use capability-based authorization (N2 compliance - never allow coarse roles to replace capabilities).

```typescript
// Correct
import { hasCapability, requireCapability } from "@/lib/auth";
if (!hasCapability(user, "events:edit")) { ... }

// Incorrect - DO NOT DO THIS
if (user.role === "admin") { ... }
```

### R5: Use Timezone Utilities

MUST use timezone helpers for all date operations (N1 compliance).

```typescript
// Correct
import { formatClubDate, startOfDayClubTime } from "@/lib/timezone";

// Incorrect - DO NOT DO THIS
new Date().toLocaleDateString();
const midnight = new Date(date.setHours(0, 0, 0, 0));
```

### R6: Include data-test-id Attributes

MUST add `data-test-id` attributes to all interactive UI elements.

```tsx
// Correct
<button data-test-id="submit-button">Submit</button>
<input data-test-id="email-input" />

// Incorrect - Missing test ID
<button>Submit</button>
```

### R7: Never Hardcode Database IDs

MUST NOT use hardcoded UUIDs in tests or code (N4 compliance).

```typescript
// Correct
const member = await prisma.contact.findFirst({ where: { email: "test@example.com" } });

// Incorrect - DO NOT DO THIS
const memberId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
```

### R8: Sanitize User Input

MUST sanitize all user-provided content before rendering (N5 compliance).

- Use the sanitization utilities in `src/lib/publishing/`
- Never render raw HTML from user input
- Escape special characters in string interpolation
- Validate JSON structure before using

### R9: Log All Mutations

MUST ensure mutations are logged for audit (P9 compliance).

- Create audit log entries for data changes
- Include before/after values where applicable
- Log the actor (user) who made the change
- Use structured logging format

### R10: API Routes Must Be Testable

MUST design API routes to be testable without browser.

- Return proper HTTP status codes
- Return structured JSON responses
- Include error messages in response body
- Support test tokens for authorization

---

## Anti-Patterns to Avoid

### A1: Silent Failures

NEVER swallow errors without logging.

```typescript
// Wrong
try { await doSomething(); } catch { /* ignore */ }

// Correct
try { await doSomething(); } catch (error) {
  console.error("doSomething failed:", error);
  throw error;
}
```

### A2: Magic Strings

NEVER use undeclared string literals for enum values.

```typescript
// Wrong
if (status === "published") { ... }

// Correct
import { PageStatus } from "@prisma/client";
if (status === PageStatus.PUBLISHED) { ... }
```

### A3: Implicit Type Coercion

NEVER rely on JavaScript's type coercion.

```typescript
// Wrong
if (count) { ... }  // 0 is falsy but might be valid

// Correct
if (count > 0) { ... }
if (value !== null && value !== undefined) { ... }
```

### A4: Direct DOM Manipulation

NEVER use direct DOM manipulation in React components.

```typescript
// Wrong
document.getElementById("myElement").style.color = "red";

// Correct (use React state)
const [color, setColor] = useState("black");
<div style={{ color }}>...</div>
```

### A5: Inline SQL

NEVER write raw SQL; use Prisma query builder.

```typescript
// Wrong
await prisma.$queryRaw`SELECT * FROM contacts WHERE email = ${email}`;

// Correct
await prisma.contact.findFirst({ where: { email } });
```

---

## Charter Compliance Checklist

Before submitting any code, verify:

- [ ] **P1**: Authorization uses capability checks, not role checks
- [ ] **P4**: Date/time operations use timezone utilities
- [ ] **P7**: Interactive elements have `data-test-id` attributes
- [ ] **P9**: Mutations are logged
- [ ] **N1**: No ad-hoc date math
- [ ] **N3**: No inline role checks
- [ ] **N4**: No hardcoded database IDs
- [ ] **N5**: User content is sanitized

---

## Required Imports Reference

When working with common patterns, use these imports:

```typescript
// Authorization
import { hasCapability, requireCapability, requireAuth } from "@/lib/auth";

// Timezone utilities
import {
  formatClubDate,
  formatClubDateTime,
  formatClubMonthYear,
  startOfDayClubTime,
  endOfDayClubTime,
  addDaysClubTime,
  isSameDayClubTime,
  getClubTimezone,
} from "@/lib/timezone";

// Publishing utilities
import { validateBlock, createDefaultBlock } from "@/lib/publishing/blocks";
import { validateThemeTokens } from "@/lib/publishing/theme";
import { evaluateAudienceRule } from "@/lib/publishing/audience";

// Database client
import prisma from "@/lib/prisma";
```

---

## Test Pattern Reference

When writing tests, follow these patterns:

### API Test Pattern

```typescript
import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test("API endpoint returns expected data", async ({ request }) => {
  const response = await request.get(`${BASE}/api/endpoint`, {
    headers: { Authorization: "Bearer test-admin-token" },
  });
  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.items).toBeDefined();
});
```

### UI Test Pattern

```typescript
import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test("UI element is visible", async ({ page }) => {
  await page.goto(`${BASE}/admin/page`);
  const element = page.locator('[data-test-id="element-id"]');
  await expect(element).toBeVisible();
});
```

### Quarantine Pattern for Flaky Tests

```typescript
// @quarantine - reason for quarantine here
test.skip("Flaky test description @quarantine", async ({ request }) => {
  // Test code
});
```

---

## Response Format

When explaining changes, structure responses as:

1. **What was changed** - Brief summary of modifications
2. **Why it was changed** - Rationale linked to requirements
3. **Charter compliance** - Which principles were followed
4. **Test coverage** - What tests were added or modified

---

## Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-16 | Constitutional Audit | Initial rules extraction |

