# Architecture Documentation Index

This index organizes all architecture documentation by category.

## Core Trust and Safety

These documents define the guarantees ClubOS makes to customers.

- [Core Trust Surface](./CORE_TRUST_SURFACE.md) - The five locked guarantees for migration and preview
- [Reversibility Contract](./REVERSIBILITY_CONTRACT.md) - Migration safety and abort guarantees
- [Trust Invariants](./TRUST_INVARIANTS.md) - System-wide safety invariants
- [Trust Model Glossary](./TRUST_MODEL_GLOSSARY.md) - Definitions of trust-related terms

## Preview and Suggestion

Documents governing how ClubOS shows customers what will happen before it happens.

- [Preview Surface Contract](./PREVIEW_SURFACE_CONTRACT.md) - Preview fidelity and uncertainty markers
- [Preview Surface Abuse Cases](./PREVIEW_SURFACE_ABUSE_CASES.md) - How previews can be misused
- [Suggestion Review Workflow](./SUGGESTION_REVIEW_WORKFLOW.md) - Suggestion state machine
- [Human-in-the-Loop State Machine](./HUMAN_IN_THE_LOOP_STATE_MACHINE.md) - Human approval points

## Intent and Rendering

Documents governing the intent-to-presentation pipeline.

- [Intent Manifest Schema](./INTENT_MANIFEST_SCHEMA.md) - Structure of intent declarations
- [Intent to Rendering Contract](./INTENT_TO_RENDERING_CONTRACT.md) - How intent becomes presentation
- [Intent Journal Schema Sketch](./INTENT_JOURNAL_SCHEMA_SKETCH.md) - Historical intent tracking
- [Organizational Representation Sketch](./ORGANIZATIONAL_REPRESENTATION_SKETCH.md) - How orgs are represented

## Migration

Documents specific to data migration from external systems.

- [Migration Invariants](./MIGRATION_INVARIANTS.md) - What must hold during migration
- [Migration Guarantee Verification](./MIGRATION_GUARANTEE_VERIFICATION.md) - Verifying migration safety
- [Migration Rollback & Recovery](./MIGRATION_ROLLBACK_RECOVERY.md) - Recovery procedures
- [MembershipTier Schema Decision](./MEMBERSHIP_TIER_SCHEMA_DECISION.md) - WA tier mapping decisions

## Policy and Configuration

Documents governing organization-configurable behavior.

- [Policy Key Catalog](./POLICY_KEY_CATALOG.md) - All configurable policy keys
- [Policy Configuration Layer](./POLICY_CONFIGURATION_LAYER.md) - How policies are stored and accessed
- [Platform vs Policy Separation](./PLATFORM_VS_POLICY.md) - What is platform vs configurable
- [SBNC Policy Coupling Audit](./SBNC_POLICY_COUPLING_AUDIT.md) - SBNC-specific policy review

## Calendar and Time

Documents governing date/time handling.

- [Calendar Interoperability Guide](./CALENDAR_INTEROP_GUIDE.md) - ICS and calendar integration
- [Calendar Time Model Compliance](./CALENDAR_TIME_COMPLIANCE.md) - Timezone and time handling

## Implementation

Documents for developers implementing features.

- [Implementation Guardrails](./IMPLEMENTATION_GUARDRAILS.md) - Safety rails for implementation
- [Adversarial Trust Review](./ADVERSARIAL_TRUST_REVIEW.md) - Security review checklist
- [Methodology to Guarantee Map](./METHODOLOGY_TO_GUARANTEE_MAP.md) - How methods map to guarantees
- [ClubOS Page Builder Primitives](./CLUBOS_PAGE_BUILDER_PRIMITIVES.md) - Page builder components

---

See also: [Main Documentation Index](../INDEX.md)
