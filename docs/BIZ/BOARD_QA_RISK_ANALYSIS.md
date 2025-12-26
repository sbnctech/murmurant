# Exhibit D: Board Q&A and Risk Analysis

```
Audience: Board Members, Presidents, Risk-Averse Stakeholders
Purpose: Honest answers to hard questions about ClubOS adoption
Document Type: Q&A Format
```

---

## Introduction

This document addresses the difficult questions that board members and organizational leaders should ask before considering ClubOS adoption. The answers are intended to be honest rather than reassuring. Where risks exist, they are acknowledged. Where we do not have complete answers, we say so.

The goal is not to convince you that ClubOS is safe. The goal is to give you the information you need to make your own judgment.

---

## Q1: What if this fails?

**The honest answer:** It could fail. Technology projects fail all the time, and ClubOS is not immune.

**What failure could look like:**

- The migration process reveals data quality issues that cannot be resolved
- Volunteers find the new system harder to use than anticipated
- Critical functionality gaps emerge after adoption
- The system experiences reliability problems that disrupt operations

**Mitigations we have built:**

The entire migration architecture is designed around the assumption that failure is possible. Specifically:

- **Abort is always available.** Before final cutover, you can walk away. Wild Apricot remains exactly as it was. We have documented this in the [Reversibility Contract](../ARCH/REVERSIBILITY_CONTRACT.md).

- **Rehearsal before commitment.** The cutover rehearsal process lets you see exactly what the migrated system will look like before you commit. If it does not work, you do not proceed.

- **Rollback after cutover has limits.** We are honest about this: once you commit the migration and start operating in ClubOS, rolling back becomes difficult. New data would need to be migrated back. This is why we insist on thorough verification before cutover.

**What we cannot mitigate:**

If you commit the migration and then discover a fundamental problem three months later, recovery will be painful. We cannot make that risk disappear. We can only reduce it through careful validation before commitment.

---

## Q2: What if key people leave?

**The honest answer:** This is a real risk. ClubOS was developed primarily by one person. If that person becomes unavailable, the organization faces a problem.

**The current situation:**

- Ed Finkler developed ClubOS and understands it most deeply
- Some documentation exists, but institutional knowledge is concentrated
- No formal support organization exists today

**Mitigations we have considered:**

- **Documentation is a priority.** The codebase includes extensive documentation intended to make the system maintainable by others. See [CLAUDE.md](../../CLAUDE.md) and the docs/ directory.

- **The technology stack is conventional.** ClubOS uses standard, widely-understood technologies (Next.js, PostgreSQL, Prisma). A competent developer could learn the codebase.

- **Data is portable.** Member data is stored in standard formats. If ClubOS becomes unmaintainable, data can be exported and moved to another system.

**What we cannot mitigate:**

If ClubOS has no active maintainer and breaks, fixing it requires either finding someone with the right skills or abandoning the platform. Nonprofit volunteer organizations have limited capacity to recruit technical talent. This risk is real and should factor into your decision.

---

## Q3: What about data ownership?

**The honest answer:** Your data belongs to you. Full stop.

**Specific commitments:**

- **SBNC owns SBNC data.** No ambiguity. The organization's member records, event history, and financial data belong to the organization.

- **Export is guaranteed.** You can export your data at any time in standard formats (CSV, JSON). This is not a future feature; it exists today.

- **Deletion upon request.** If you leave ClubOS, your data will be deleted from ClubOS systems upon written request.

- **No data monetization.** Your member data will not be sold, shared, or used for purposes beyond operating your organization.

**What this does not cover:**

- Backups may persist for a reasonable retention period (typically 30-90 days) before deletion
- Aggregate, anonymized statistics may be retained for system improvement
- Legal obligations may require retention in some cases

These exceptions are standard and align with normal data handling practices.

---

## Q4: What about security?

**The honest answer:** ClubOS takes security seriously, but no system is perfectly secure. We are honest about what we protect and what remains at risk.

**What we do:**

- **Authentication:** Passkey-based authentication (WebAuthn) eliminates password theft as an attack vector. Members cannot have weak passwords because there are no passwords.
- **Authorization:** Capability-based access control with audit logging for every privileged action. Every permission is explicit and scoped. See [AUTH_AND_RBAC.md](../rbac/AUTH_AND_RBAC.md).
- **Data protection:** All data encrypted in transit (TLS) and at rest. Database connections require SSL.
- **Audit trail:** Every consequential action is logged with actor, timestamp, and before/after state. If something goes wrong, you can trace what happened.
- **Default deny:** The system denies access by default. Permissions must be explicitly granted, not assumed.

**What remains at risk:**

- **Infrastructure security depends on hosting provider.** We use standard cloud providers (Vercel, Neon), but we inherit their security posture. If they have a breach, we are affected.
- **No formal security audit has been conducted.** ClubOS has not been penetration tested by a third party. This is a gap.
- **Small attack surface, but not zero.** Web applications have vulnerabilities. We follow security best practices, but we cannot guarantee zero vulnerabilities.
- **Human factors:** Social engineering, credential sharing, and other human behaviors remain risks regardless of technology.

**Compared to Wild Apricot:**

Wild Apricot is a larger target (more customers, more data) but also has more security resources and a dedicated security team. ClubOS is a smaller target but has fewer resources for security response. Neither is inherently safer; the risk profiles differ.

---

## Q5: What about Wild Apricot responsibility versus ours?

**The honest answer:** Adopting ClubOS means accepting responsibility that currently belongs to Wild Apricot.

**What Wild Apricot handles today:**

| Responsibility | Wild Apricot | ClubOS |
|----------------|--------------|--------|
| Server uptime | Their problem | Our problem |
| Security patches | Their problem | Our problem |
| Backup and recovery | Their problem | Our problem |
| Feature development | Their roadmap | Our roadmap |
| Support | Their staff | Our volunteers |
| Compliance | Their legal team | Our responsibility |

**This is a real tradeoff:**

When Wild Apricot has an outage, you call their support line and wait. When ClubOS has an outage, someone in your organization needs to fix it or find someone who can.

**Why you might accept this tradeoff:**

- Greater control over your operations
- Features tailored to your specific needs
- No vendor lock-in
- Lower long-term costs (potentially)

**Why you might not:**

- You do not have technical volunteers
- You prefer to pay for someone else's responsibility
- The current system works well enough
- Risk tolerance is low

Both positions are reasonable. The question is which tradeoff fits your organization.

---

## Q6: What about legal exposure?

**The honest answer:** We are not lawyers, and this is not legal advice. But we can describe the situation as we understand it.

**Potential exposure areas:**

- **Data breach liability:** If member data is exposed, the organization may have notification obligations and potential liability. This is true regardless of what platform you use.

- **Contractual obligations:** If you have contracts that reference Wild Apricot specifically, you may need to review them before switching.

- **Privacy regulations:** Depending on your jurisdiction, data handling may be subject to regulations (CCPA in California, etc.). ClubOS does not change your compliance obligations.

**What ClubOS does not change:**

Your legal obligations as an organization remain the same. ClubOS is a tool; the organization remains responsible for how it uses that tool.

**What we recommend:**

If legal exposure is a significant concern, consult an attorney before making platform decisions. Do not rely on this document for legal guidance.

---

## Q7: What about long-term maintenance?

**The honest answer:** Long-term maintenance is uncertain. We have plans, but plans are not guarantees.

**Current maintenance model:**

- Ed Finkler maintains ClubOS as a personal project
- No formal support agreement exists
- Maintenance happens when time permits

**Future possibilities:**

- **ClubOS, Inc.:** If the commercial entity materializes, professional maintenance becomes possible
- **Community support:** If other organizations adopt ClubOS, shared maintenance becomes possible
- **Abandonment:** If neither happens, the software may become unmaintained

**Mitigations:**

- **Open source:** The code is available. If the original maintainer disappears, others can fork and maintain it.
- **Standard stack:** Nothing exotic. Any competent developer can work on it.
- **Documentation:** Extensive docs exist to help future maintainers understand the system.

**What we cannot promise:**

We cannot promise that ClubOS will be actively maintained in five years. We can promise that if it is not, you will have options (export data, hire a developer, fork the code).

---

## Q8: What if ClubOS, Inc. never materializes?

**The honest answer:** Then SBNC would be operating on software maintained by a volunteer with no formal support structure. This is the current situation for many nonprofit technology projects.

**What changes if ClubOS, Inc. exists:**

- Professional support would be available
- Development roadmap would be funded
- Multiple customers would share maintenance costs
- Business continuity would be more predictable

**What changes if it does not:**

- SBNC would rely on volunteer maintenance
- Feature development would depend on volunteer availability
- If the volunteer becomes unavailable, the organization would need alternatives

**Why this might be acceptable:**

- SBNC already relies on volunteers for many functions
- The software works; it does not require constant development
- Data is portable; you can leave if needed
- The current situation (Wild Apricot) is also uncertain (vendor decisions, price increases, feature changes)

**Why this might not be acceptable:**

- You prefer paid, professional support
- Volunteer capacity is already stretched
- The uncertainty is higher than you want to accept

---

## Summary: The Abortability Principle

Throughout this document, one theme recurs: you can abort.

| Stage | Abort Cost | What You Lose |
|-------|------------|---------------|
| Before migration | Nothing | Nothing |
| During evaluation | Evaluation time | Time spent reviewing |
| During dry run | Dry run effort | Time spent on dry run |
| After rehearsal, before commit | Significant effort | All migration preparation |
| After commit | Painful recovery | New data, operational continuity |

The system is designed so that the further you go, the more confidence you should have. Early stages are low-commitment. Final commitment requires passing through multiple validation checkpoints.

**Why we emphasize abortability:**

Organizations often feel trapped once they start a technology transition. We have designed ClubOS migration so that you are never trapped until you choose to be. At every stage, walking away remains an option. This is intentional. It reflects our belief that trust is earned through demonstrated safety, not demanded through contractual obligation.

**The question is not whether ClubOS is risk-free.** It is not. Nothing is.

**The question is whether the risks are acceptable given your organization's circumstances, risk tolerance, and alternatives.**

Every organization has a different answer to this question. Some will find ClubOS worth the risk. Others will not. Both conclusions are valid if they are made with full information.

This document is intended to help you make that judgment. It is not intended to make that judgment for you.

---

## Related Documents

- [Board Email Evaluation Request](./BOARD_EMAIL_EVALUATION_REQUEST.md) - Formal request to Board
- [Evaluation Charter](./EVALUATION_CHARTER.md) - Guarded evaluation terms
- [Migration Customer Journey](../IMPORTING/MIGRATION_CUSTOMER_JOURNEY.md) - What migration looks like
- [Architectural Charter](../ARCHITECTURAL_CHARTER.md) - System design principles

---

_This document provides honest risk analysis for informed decision-making. It is not legal advice, financial advice, or a recommendation to adopt or reject ClubOS._
