# Canonical Terminology

**Status**: Normative
**Last Updated**: 2025-12-25
**Related Documents**:
- [Architectural Charter](../ARCHITECTURAL_CHARTER.md) (P6: Human-first UI language)
- [Organizational Presentation Philosophy](./ORGANIZATIONAL_PRESENTATION_PHILOSOPHY.md)

---

## Purpose

This document defines the official terminology for ClubOS. It prevents semantic drift—the gradual weakening or inflation of meaning that erodes trust.

This document is normative. When writing documentation, UI text, or communications:

- Use approved terms
- Replace deprecated terms
- Never use forbidden terms
- Respect subtle distinctions

---

## 1. Approved Terms

These are the correct terms. Use them consistently.

### System Behavior

| Term | Definition | Use When |
|------|------------|----------|
| **Propose** | System presents an option for human consideration | Describing system suggestions |
| **Suggest** | System offers a recommendation that requires approval | Describing non-binding recommendations |
| **Surface** | System makes information visible to humans | Describing how issues are shown |
| **Support** | System provides capability that humans can use | Describing features |
| **Enable** | System makes an action possible | Describing what the system allows |
| **Record** | System captures information for later reference | Describing audit and logging |
| **Expose** | System makes data available for inspection | Describing transparency features |

### Human Authority

| Term | Definition | Use When |
|------|------------|----------|
| **Approve** | Human explicitly authorizes a proposed action | Describing the approval step |
| **Review** | Human examines a proposal before deciding | Describing the review step |
| **Commit** | Human finalizes a decision irreversibly | Describing the final step of migration/publishing |
| **Abort** | Human stops a process before completion | Describing cancellation before commit |
| **Authorize** | Human grants permission for an action | Describing permission grants |

### States and Outcomes

| Term | Definition | Use When |
|------|------------|----------|
| **Draft** | Work in progress, not yet submitted for review | Describing pre-review content |
| **Pending** | Awaiting human action | Describing items in queue |
| **Approved** | Human has authorized; ready for next step | Describing post-approval state |
| **Committed** | Finalized and applied | Describing completed state |
| **Rejected** | Human declined the proposal | Describing refused suggestions |

### Data and Identity

| Term | Definition | Use When |
|------|------------|----------|
| **Intent** | What the organization wants to communicate | Describing presentation goals |
| **Manifest** | Structured record of intent | Describing the intent manifest |
| **Recognizable** | Members can identify their organization | Describing fidelity goals |
| **Portable** | Data can be exported and used elsewhere | Describing data ownership |

---

## 2. Deprecated Terms

These terms were used historically but should be replaced. When encountered in existing docs, update them.

| Deprecated | Replace With | Reason |
|------------|--------------|--------|
| **Sync** | Import, migrate, or transfer | "Sync" implies ongoing bidirectional connection we do not maintain |
| **Auto-save** | Save draft | "Auto" prefix implies no human involvement |
| **Smart defaults** | Suggested values | "Smart" implies system judgment |
| **Intelligent** | Suggested, proposed | Anthropomorphizes the system |
| **Learning** | Configured, based on | Implies autonomous adaptation |
| **Magic** | Configured, automated | Obscures how things work |
| **Seamless** | Straightforward, guided | Over-promises smoothness |
| **Effortless** | Guided, assisted | Under-acknowledges human work required |

---

## 3. Forbidden Terms

Never use these terms. They over-promise, obscure responsibility, or imply capabilities we do not have.

### Over-Promising

| Forbidden | Problem | Alternative |
|-----------|---------|-------------|
| **Guarantee** (unqualified) | Implies absolute certainty | Specify what is actually promised |
| **Ensure** (for outcomes) | Implies system controls outcomes | "Support", "enable", "help" |
| **Perfect** | Nothing is perfect | "Accurate", "faithful", "recognizable" |
| **Flawless** | Implies no errors possible | Omit or describe specific quality |
| **Automatic** (for decisions) | Implies no human needed | "Suggested", "proposed", "assisted" |
| **Instantly** | Implies no processing time | "Quickly", "promptly", or omit |
| **Always** (for behavior) | Rarely true | Specify conditions |
| **Never fail** | Everything can fail | Describe failure handling |

### Obscuring Responsibility

| Forbidden | Problem | Alternative |
|-----------|---------|-------------|
| **The system decided** | Systems do not decide; humans do | "The system proposed and [person] approved" |
| **It was determined** | Passive voice hides actor | Name who determined |
| **Automatically approved** | Contradicts human authority | Cannot exist; approvals require humans |
| **Self-healing** | Implies autonomous correction | "Recovery procedure", "operator action" |

### Implying False Capabilities

| Forbidden | Problem | Alternative |
|-----------|---------|-------------|
| **AI-powered** | Vague; implies autonomy | Describe specific capability |
| **Understands** | System does not understand meaning | "Extracts", "identifies", "processes" |
| **Knows** | System does not have knowledge | "Records", "contains", "stores" |
| **Thinks** | System does not think | Avoid or describe the process |
| **Learns your preferences** | Implies autonomous adaptation | "Configured by", "based on your settings" |

---

## 4. Subtle Distinctions

These terms are easily confused. The distinctions matter.

### Preview vs. Approval

| Term | Meaning | Key Difference |
|------|---------|----------------|
| **Preview** | See what would happen before deciding | No commitment; can walk away |
| **Approval** | Authorize something to proceed | Commitment; action follows |

A preview does not approve anything. Approval happens after preview, as a separate explicit action.

### Suggest vs. Decide

| Term | Meaning | Key Difference |
|------|---------|----------------|
| **Suggest** | Propose an option for consideration | Human decides |
| **Decide** | Make a choice that takes effect | Requires human actor |

The system suggests. Humans decide. Never write "the system decided."

### Approve vs. Commit

| Term | Meaning | Key Difference |
|------|---------|----------------|
| **Approve** | Authorize something to move forward | Reversible; can still abort |
| **Commit** | Finalize irreversibly | Point of no return (without recovery) |

Approval enables the next step. Commit ends the process.

### Abort vs. Rollback

| Term | Meaning | Key Difference |
|------|---------|----------------|
| **Abort** | Stop before completion | Clean exit; no changes made |
| **Rollback** | Reverse after completion | Recovery action; may have limits |

Abort is always possible before commit. Rollback may not be possible after.

### Error vs. Unknown

| Term | Meaning | Key Difference |
|------|---------|----------------|
| **Error** | Something went wrong | System problem |
| **Unknown** | Information is missing | Requires human input |

Errors are system failures. Unknowns are gaps requiring human judgment.

### Fidelity vs. Equivalence

| Term | Meaning | Key Difference |
|------|---------|----------------|
| **Fidelity** | Faithful representation | Intent preserved, not identical |
| **Equivalence** | Exactly the same | Implies pixel-perfect match |

ClubOS provides fidelity (recognizable), not equivalence (identical).

### Proposal vs. Action

| Term | Meaning | Key Difference |
|------|---------|----------------|
| **Proposal** | Something suggested for approval | Inert; does nothing until approved |
| **Action** | Something that changes state | Has effects |

A manifest is a proposal. Commit is an action.

---

## 5. Context-Specific Usage

### In UI Text

- Use active voice with clear actors: "You approved" not "Was approved"
- Name the human: "Your approval is required" not "Approval is required"
- Be specific about what happens: "This will publish the page" not "Continue"

### In Documentation

- Define terms on first use in each document
- Link to this terminology reference for canonical definitions
- Use consistent capitalization for defined terms

### In Error Messages

- State what happened: "The preview could not be generated"
- State why: "The source content is no longer available"
- State what to do: "Contact support or try again with updated content"

---

## 6. Revision Process

To propose a terminology change:

1. Identify the term and proposed change
2. Explain why the current term is problematic
3. Propose the replacement term with definition
4. Update all affected documentation in the same PR

Terminology changes require review to prevent accidental semantic drift.

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-25 | System | Initial specification |
