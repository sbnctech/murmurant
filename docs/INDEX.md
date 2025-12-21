# ClubOS Documentation Index

This is the main entry point for all ClubOS developer documentation.

## Getting Started
- [Developer Onboarding](ONBOARDING.md)
- [Development Workflow](DEVELOPMENT_WORKFLOW.md)

## Architecture
- [Admin Architecture Map](ADMIN_ARCHITECTURE_MAP.md)
- [API Surface](API_SURFACE.md)

## Authorization & Access Control
- [Authorization & RBAC Guide](RBAC_OVERVIEW.md) - High-level overview
- [Auth and RBAC Explained](rbac/AUTH_AND_RBAC.md) - Plain-English guide for admins
- [Activities Roles Guide](rbac/ACTIVITIES_ROLES.md) - VP and Event Chair permissions
- [VP Activities Scope](rbac/VP_ACTIVITIES_SCOPE.md) - Technical implementation
- [VP Access Matrix](rbac/VP_ACTIVITIES_ACCESS_MATRIX.md) - Detailed permission tables

## Admin Feature Guides
- [Admin Dashboard Overview](ADMIN_DASHBOARD_OVERVIEW.md)
- [Admin Members UI](ADMIN_MEMBERS_UI.md)
- [Admin Events UI](ADMIN_EVENTS_UI.md)
- [Admin Registrations UI](ADMIN_REGISTRATIONS_UI.md)
- [Admin Activity UI](ADMIN_ACTIVITY_UI.md)

## Testing and Tooling
- Test scripts under scripts/dev/*
- Make targets documented in README.md
- Playwright test suites in tests/api and tests/admin

## Reference
- Mock data definitions under lib/mock/*
- Utility helpers under lib/*

---

## Canonical Reading Order

For new team members, stakeholders, or anyone seeking to understand ClubOS:

### 1. Foundation (Start Here)

1. [ARCHITECTURAL_CHARTER.md](ARCHITECTURAL_CHARTER.md) - Core principles (P1-P10) and anti-patterns (N1-N8)
2. [architecture/WA_FUTURE_FAILURE_IMMUNITY.md](architecture/WA_FUTURE_FAILURE_IMMUNITY.md) - Why ClubOS exists; meta-failure patterns we prevent

### 2. Competitive Context

3. [competitive/WA_FAILURE_MODES_TO_CLUBOS_GUARANTEES.md](competitive/WA_FAILURE_MODES_TO_CLUBOS_GUARANTEES.md) - Detailed WA vs ClubOS comparison
4. [competitive/WA_ARCHITECTURE_LIMITS_SLIDE.md](competitive/WA_ARCHITECTURE_LIMITS_SLIDE.md) - Executive summary of WA limits

### 3. Architectural Decisions

5. [architecture/SAFE_DELEGATION_AND_PERMISSION_MODEL.md](architecture/SAFE_DELEGATION_AND_PERMISSION_MODEL.md) - Capability-based permissions
6. [architecture/COMMITTEE_AND_LEADERSHIP_ENABLEMENT.md](architecture/COMMITTEE_AND_LEADERSHIP_ENABLEMENT.md) - Leadership transition modeling
7. [architecture/FAILURE_MODES_TO_GUARANTEES_REGISTRY.md](architecture/FAILURE_MODES_TO_GUARANTEES_REGISTRY.md) - Implementation status registry

### 4. Operations and Release Safety

8. [ops/FEATURE_RISK_AND_FIELD_TESTING_MODEL.md](ops/FEATURE_RISK_AND_FIELD_TESTING_MODEL.md) - Feature risk scoring and staged rollout
9. [reliability/MULTITENANT_RELEASE_READINESS.md](reliability/MULTITENANT_RELEASE_READINESS.md) - Release readiness checklist
10. [reliability/WA_IMMUNITY_REVIEW_GATE.md](reliability/WA_IMMUNITY_REVIEW_GATE.md) - PR review gate

### 5. Execution

11. [backlog/WA_GAPS_EXECUTION_PLAN.md](backlog/WA_GAPS_EXECUTION_PLAN.md) - Roadmap execution plan
12. [solutions/README.md](solutions/README.md) - Customer engagement workflows

---

## Directory Index

### Architecture

Design principles and structural guarantees.

- [architecture/README.md](architecture/README.md) - Directory index
- [architecture/WA_FUTURE_FAILURE_IMMUNITY.md](architecture/WA_FUTURE_FAILURE_IMMUNITY.md) - Meta-failure patterns and defenses
- [architecture/FAILURE_MODES_TO_GUARANTEES_REGISTRY.md](architecture/FAILURE_MODES_TO_GUARANTEES_REGISTRY.md) - Failure-to-guarantee mappings
- [architecture/SAFE_DELEGATION_AND_PERMISSION_MODEL.md](architecture/SAFE_DELEGATION_AND_PERMISSION_MODEL.md) - Permission architecture
- [architecture/COMMITTEE_AND_LEADERSHIP_ENABLEMENT.md](architecture/COMMITTEE_AND_LEADERSHIP_ENABLEMENT.md) - Committee modeling
- [architecture/COGNITIVE_LOAD_AND_TALENT_MARKET_ADVANTAGE.md](architecture/COGNITIVE_LOAD_AND_TALENT_MARKET_ADVANTAGE.md) - Developer experience
- [architecture/OPEN_SOURCE_ADOPTION_POLICY.md](architecture/OPEN_SOURCE_ADOPTION_POLICY.md) - OSS policy
- [architecture/OPEN_SOURCE_CANDIDATES.md](architecture/OPEN_SOURCE_CANDIDATES.md) - OSS candidates

### Competitive

Competitive analysis and sales enablement.

- [competitive/README.md](competitive/README.md) - Directory index
- [competitive/WA_FAILURE_MODES_TO_CLUBOS_GUARANTEES.md](competitive/WA_FAILURE_MODES_TO_CLUBOS_GUARANTEES.md) - WA vs ClubOS comparison
- [competitive/WA_ARCHITECTURE_LIMITS_SLIDE.md](competitive/WA_ARCHITECTURE_LIMITS_SLIDE.md) - Executive summary
- [competitive/CLUBOS_WA_PROSPECT_POSITIONING.md](competitive/CLUBOS_WA_PROSPECT_POSITIONING.md) - Sales positioning

### Solutions

Customer engagement and implementation.

- [solutions/README.md](solutions/README.md) - Directory index
- [solutions/PRICED_ENGAGEMENT_READINESS_BLUEPRINT.md](solutions/PRICED_ENGAGEMENT_READINESS_BLUEPRINT.md) - Readiness framework
- [solutions/READINESS_ENGAGEMENT_SKU.md](solutions/READINESS_ENGAGEMENT_SKU.md) - SKU definition
- [solutions/INTAKE_DELIVERABLE_BUNDLE.md](solutions/INTAKE_DELIVERABLE_BUNDLE.md) - Intake deliverables
- [solutions/INTAKE_VALIDATION_RUNNER_SPEC.md](solutions/INTAKE_VALIDATION_RUNNER_SPEC.md) - Validation automation
- [solutions/IMPLEMENTATION_PLAN_SPEC.md](solutions/IMPLEMENTATION_PLAN_SPEC.md) - Implementation planning
- [solutions/DECISION_MEMO_AND_PAUSE_PROTOCOL.md](solutions/DECISION_MEMO_AND_PAUSE_PROTOCOL.md) - Decision protocol
- [solutions/WA_PAIN_POINTS_AND_HOW_CLUBOS_ADDRESSES_THEM.md](solutions/WA_PAIN_POINTS_AND_HOW_CLUBOS_ADDRESSES_THEM.md) - Pain point analysis

### Backlog

Work queue and execution plans.

- [backlog/README.md](backlog/README.md) - Directory index
- [backlog/WA_GAPS_EXECUTION_PLAN.md](backlog/WA_GAPS_EXECUTION_PLAN.md) - Gap closure execution plan

### Operations

Operational procedures and release safety.

- [ops/FEATURE_RISK_AND_FIELD_TESTING_MODEL.md](ops/FEATURE_RISK_AND_FIELD_TESTING_MODEL.md) - Feature risk and field testing
- [ops/NORMALCY_SIGNALS_AND_RESPONSES.md](ops/NORMALCY_SIGNALS_AND_RESPONSES.md) - Operational signals
- [ops/restore-drill.md](ops/restore-drill.md) - Restore procedures
- [ops/monitoring.md](ops/monitoring.md) - Monitoring setup
- [ops/migrations.md](ops/migrations.md) - Database migrations

### Reliability

System guarantees and release readiness.

- [reliability/MULTITENANT_RELEASE_READINESS.md](reliability/MULTITENANT_RELEASE_READINESS.md) - Release readiness checklist
- [reliability/WA_IMMUNITY_REVIEW_GATE.md](reliability/WA_IMMUNITY_REVIEW_GATE.md) - PR review gate
- [reliability/DATA_INVARIANTS.md](reliability/DATA_INVARIANTS.md) - Data integrity rules
- [reliability/SYSTEM_GUARANTEES.md](reliability/SYSTEM_GUARANTEES.md) - System guarantees

