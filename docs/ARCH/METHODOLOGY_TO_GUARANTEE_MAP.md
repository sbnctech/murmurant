# Methodology to Guarantee Map

This document traces how ClubOS development practices translate into customer-facing guarantees. Each practice exists to prevent a specific class of risk, which in turn enables a promise we can make to customers.

---

## Practice-to-Guarantee Mapping

| Development Practice | Risk Prevented | Customer Guarantee |
|---------------------|----------------|-------------------|
| Versioned intent manifests | Silent changes to migration scope | What you reviewed is what gets applied |
| Preview gates before execution | Unexpected outcomes after commit | No surprises—you see before it happens |
| Abortable workflows | Irreversible mistakes during transition | You can always stop and walk away |
| Human approval checkpoints | Runaway automation acting without consent | The system proposes; you decide |
| Immutable snapshot binding | Drift between preview and execution | Preview reflects reality at decision time |
| Explicit non-guarantees | Overpromising on fidelity or scope | Honest about what we cannot promise |
| Deterministic replay | Unpredictable behavior across attempts | Same input produces same output |
| Audit trail requirements | Unattributable changes | Every action traceable to a person |
| Idempotent operations | Corrupted state from retry | Safe to re-run if interrupted |
| Recovery procedures documented | Feeling trapped after problems | Exit paths exist for every phase |

---

## How to Read This Table

**Development Practice**: An engineering discipline or architectural constraint enforced in the codebase.

**Risk Prevented**: The failure mode that would occur if the practice were absent.

**Customer Guarantee**: The promise customers can rely on because the practice is in place.

---

## Relationship to Other Documents

This map shows the "why" behind ClubOS development constraints. For the formal contract definitions, see:

- [Core Trust Surface](../ARCHITECTURAL_CHARTER.md#core-trust-surface) — Normative contract list
- [Preview Surface Contract](./PREVIEW_SURFACE_CONTRACT.md) — What preview promises
- [Reversibility Contract](./REVERSIBILITY_CONTRACT.md) — Abort and recovery guarantees

---

## Change Policy

Adding rows to this table requires:

1. The practice must be enforced (not aspirational)
2. The guarantee must be testable or auditable
3. The risk must be real (observed or documented)

Removing rows requires architectural review—guarantees create customer expectations.

---

*This document maps engineering discipline to customer trust. It does not define the contracts themselves.*
