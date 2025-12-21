# ClubOS Delivery Model Strategy

Status: Strategic Guidance
Audience: Founders, Operators, Early Customers
Last updated: 2025-12-21

---

## 1. Framing Question

Is ClubOS best delivered as classic self-service SaaS or as a solutions-led platform?

This is not a question about convenience. It is a question about failure cost.

---

## 2. Recommended Delivery Model

**Primary Model: Solutions-Led Platform with Guided Onboarding**

ClubOS should operate as a managed platform where critical operations require human oversight, while day-to-day content work is self-service.

Justification:

| Factor | Assessment |
|--------|------------|
| Risk profile | High. Member data, financial records, governance history. |
| Governance requirements | Strict. Nonprofits face audit, legal, and fiduciary obligations. |
| Customer sophistication | Variable. Volunteer admins rotate frequently. |
| Failure cost | Severe. Data loss or exposure damages member trust irreversibly. |

Self-service SaaS assumes customers can recover from their own mistakes. ClubOS customers often cannot. A misconfigured permission model or corrupted member import may take months to detect and cannot be undone by the user who caused it.

---

## 3. Why Pure Self-Service Is Dangerous (Initially)

Volunteer-run organizations have predictable failure modes:

- **Permission drift**: Admins grant broad access to reduce friction, then forget.
- **Import corruption**: Bad CSV imports overwrite canonical member records.
- **Publish accidents**: Draft governance documents go live prematurely.
- **Backup neglect**: No one verifies restore procedures until disaster strikes.
- **Audit gaps**: Critical actions occur without logging because logging was disabled.

These failures violate data invariants that users cannot see and cannot repair. Recovery requires platform-level intervention. If that intervention is unavailable, trust collapses.

---

## 4. Where Human-in-the-Loop Is Mandatory

The following capabilities MUST NOT be self-service without platform review:

| Capability | Reason |
|------------|--------|
| Publishing freezes | Prevents accidental exposure during sensitive periods |
| Security containment | Credential revocation, session termination, access lockdown |
| Restore execution | Backups are worthless if restore is misconfigured |
| Role/permission model changes | One mistake creates invisible security holes |
| Invariant overrides | Bypassing data rules requires understanding consequences |
| Bulk member mutations | Mass updates can corrupt canonical identity records |
| Audit log access | Sensitive; must be scoped and justified |

These operations require confirmation from someone who understands the system, not just someone with admin credentials.

For the complete list of capabilities sold as services (not self-service features), see [Pricing and Tiers Section 7](./DELIVERY_MODEL_PRICING_AND_TIERS.md#7-what-we-will-not-sell-as-self-service).

---

## 5. Where Self-Service Is Appropriate

The following capabilities CAN be self-service safely:

| Capability | Why Safe |
|------------|----------|
| Content editing | Reversible, audited, preview-first |
| Block ordering | No data mutation, visual only |
| Draft creation | Unpublished by default |
| Non-authoritative previews | Sandboxed, no side effects |
| Event creation (draft) | Requires approval before visibility |
| Profile updates (own) | Member controls own data |
| Committee announcements | Scoped audience, low blast radius |

The pattern: self-service is safe when actions are reversible, scoped, and audited.

---

## 6. Transition Over Time

ClubOS may evolve toward broader self-service as the following gates are met:

| Gate | Requirement |
|------|-------------|
| Operational maturity | Customer demonstrates 6+ months of stable usage |
| Backup verification | Customer has tested restore at least once |
| Admin continuity | At least two trained admins with current access |
| Audit review | Platform has reviewed customer's permission model |
| Incident history | No unresolved security or data incidents |

Until these gates are passed, high-risk operations remain platform-assisted. This is not a limitation; it is protection.

---

## 7. Summary

ClubOS serves organizations where trust is the product. A membership club that loses member data or exposes private governance records does not get a second chance. The delivery model must reflect this reality. Solutions-led delivery with selective self-service ensures that customers can move fast on safe operations while remaining protected from catastrophic mistakes. As customers mature and demonstrate operational discipline, the platform can safely extend more autonomy. Trust is earned, not assumed.

---

## See Also

- [Reliability and Delivery Synthesis](./RELIABILITY_AND_DELIVERY_SYNTHESIS.md) - Board-ready summary
- [Pricing and Tiers](./DELIVERY_MODEL_PRICING_AND_TIERS.md) - Tier definitions and guardrails
- [Engineering Philosophy](./ENGINEERING_PHILOSOPHY.md) - Core values driving this model
- [Recovery and Restoration](./reliability/RECOVERY_AND_RESTORATION.md) - Recovery guarantees
- [Solutions Intake Bundle](./solutions/INTAKE_DELIVERABLE_BUNDLE.md) - Client onboarding artifacts
- [Readiness Assessment](./solutions/READINESS_ASSESSMENT.md) - Client qualification questionnaire
