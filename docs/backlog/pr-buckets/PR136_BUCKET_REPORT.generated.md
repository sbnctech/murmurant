=== PR #136 bucket report (generated) ===

Repo: sbnctech/clubos
Title: docs(arch): clarify blocks vs sections; plan stripe deprecation
URL: https://github.com/sbnctech/clubos/pull/136
Generated: 2025-12-22 03:27:40Z

## All files

- .gitignore
- docs/api/API_REFERENCE.md
- docs/api/openapi.yaml
- docs/ARCHITECTURE_BLOCKS_AND_SECTIONS.md
- docs/ARCHITECTURE.md
- docs/claudecode-tasks/MEMBERSHIP_LIFECYCLE_STATE_MACHINE_TASK.md
- docs/communications/VP_COMMS_ENEWS_SPEC.md
- docs/DEMO_GUIDE.md
- docs/DEMO_MEMBER_LIST.md
- docs/demos/DEMO_NARRATIVE.md
- docs/demos/DEMO_SCENARIOS_RUNBOOK.md
- docs/demos/EVENTS_DISCOVERY_DEMO.md
- docs/demos/HOME_PAGE_STRIPES_DEMO.md
- docs/demos/LEADERSHIP_DEMO_SCRIPT.md
- docs/demos/LIFECYCLE_DEEP_LINKS_DEMO.md
- docs/demos/LIFECYCLE_DEMO_FIXTURES.md
- docs/demos/LIFECYCLE_EXPLAINER_DEMO.md
- docs/demos/MEMBER_HOME_GADGETS_DEMO.md
- docs/demos/MEMBER_PROFILE_VIEWS.md
- docs/demos/MEMBERSHIP_APPLICATION_DEMO.md
- docs/demos/MEMBERSHIP_DEMO_SCRIPT.md
- docs/demos/MY_SBNC_PROFILE_DEMO.md
- docs/demos/VIEW_AS_SUPPORT_TOOL.md
- docs/DEVELOPER/API_DOCUMENTATION.md
- docs/events/EVENT_ARCHIVE_NOTEBOOK.md
- docs/events/EVENT_DERIVATION_MODEL.md
- docs/events/EVENT_FIELD_INTELLIGENCE.md
- docs/events/EVENT_LIFECYCLE_DESIGN.md
- docs/events/EVENT_POSTMORTEM.md
- docs/events/EVENT_STATUS_LIFECYCLE.md
- docs/events/POSTING_AND_REGISTRATION_SCHEDULE.md
- docs/FINANCE/ACH_OPTION.md
- docs/FINANCE/CLUBOS_HOSTING_COST_MODEL.md
- docs/FINANCE/INFRASTRUCTURE_COST_OFFSETS.md
- docs/FINANCE/NET_COST_COMPARISON_SUMMARY.md
- docs/FINANCE/PERSONIFY_PAYMENTS_COST_MODEL.md
- docs/FINANCE/WA_VS_CLUBOS_COST_COMPARISON.md
- docs/FOLLOWUP_PR_BLOCKS_AND_SECTIONS.md
- docs/governance/TECH_LEAD_COGNITIVE_LOAD.md
- docs/IMPORTING/IMPORTER_RUNBOOK.md
- docs/IMPORTING/WA_FULL_SYNC_REPORTING.md
- docs/IMPORTING/WA_REGISTRATION_PIPELINE_ANALYSIS.md
- docs/IMPORTING/WA_REGISTRATIONS_DIAGNOSTIC.md
- docs/investigations/WEBDAV_STATUS.md
- docs/MEMBER_PROFILE_EDITING.md
- docs/MEMBERSHIP_LIFECYCLE_STATE_MACHINE.md
- docs/MEMBERSHIP_MODEL_TRUTH_TABLE.md
- docs/membership/MEMBERSHIP_LIFECYCLE_STATE_MACHINE.md
- docs/membership/MEMBERSHIP_MODEL_TRUTH_TABLE.md
- docs/operations/ACH_PAYMENT_GUIDE.md
- docs/operations/EMAIL_INFRASTRUCTURE_GUIDE.md
- docs/operations/SUPPORT_PROMPT_TEMPLATES.md
- docs/operations/TECH_LEAD_SUPPORT_GUIDE.md
- docs/policies/POLICY_INGESTION_PLAN.md
- docs/policies/POLICY_REGISTRY_SPEC.md
- docs/policies/POLICY_REGISTRY.yaml
- docs/policies/sbnc/ACKNOWLEDGEMENT_REQUIREMENTS_INVENTORY.md
- docs/policies/sbnc/EVENT_SUBMISSION_PHASE2_SPEC.md
- docs/policies/sbnc/EXTRACTED_RULES.md
- docs/policies/sbnc/ocr/txt_20251220_172434/Articles of Inc. SBNC.txt
- docs/policies/sbnc/ocr/txt_20251220_172434/Santa Barbara Newcomers Club - Bylaw Am...Commentary and Implementation Analysis.txt
- docs/policies/sbnc/POLICY_VISIBILITY_AND_ACCESS_MAP.md
- docs/policies/sbnc/SBNC_Policy_Registry.md
- docs/policies/sbnc/sources/harvest_20251220_165053/Articles of Inc. SBNC.txt
- docs/policies/sbnc/sources/harvest_20251220_165053/INVENTORY.tsv
- docs/policies/sbnc/UNVERIFIED_RULES_CANDIDATE_SET.md
- docs/POLICY_DECISION_DEPENDENCIES.md
- docs/policy/INDEX.md
- docs/policy/POLICY_CROSSWALK.md
- docs/QA/TEST_SUITE_STATUS_REPORT.md
- docs/RENAME_STRIPES_TO_SECTIONS_PLAN.md
- docs/UX/MEMBER_PROFILE_EXPERIENCE.md
- docs/WA_FULL_SYNC_VERIFICATION.md
- docs/work-queue/GIFT_MEMBERSHIP_WIDGET.md
- docs/work-queue/MEMBERSHIP_APPLICATION_WIDGET.md
- docs/work-queue/MEMBERSHIP_LIFECYCLE.md
- docs/work-queue/README.md
- package-lock.json
- package.json
- prisma/schema.prisma
- scripts/ci/validate-policies.ts
- scripts/demo/seed_demo_scenarios.ts
- scripts/finance/wa_personify_payments_analyze.ts
- scripts/importing/seed_demo_members.ts
- scripts/importing/wa_full_sync.ts
- src/app/(member)/member/page.tsx
- src/app/(public)/join/page.tsx
- src/app/admin/AchMetricsWidget.tsx
- src/app/admin/AdminSectionNav.tsx
- src/app/admin/communications/page.tsx
- src/app/admin/demo/DemoScenarioCards.tsx
- src/app/admin/demo/EventDerivedPreviewDemo.tsx
- src/app/admin/demo/LifecycleDeepLinks.tsx
- src/app/admin/demo/members/DemoMembersClient.tsx
- src/app/admin/demo/members/page.tsx
- src/app/admin/demo/page.tsx
- src/app/admin/demo/ViewAsMemberSection.tsx
- src/app/admin/dev/api-docs/ApiDocsClient.tsx
- src/app/admin/VPActivitiesDashboard.tsx
- src/app/ViewAsWrapper.tsx

## Docs-only

- 10:docs/FINANCE/NET_COST_COMPARISON_SUMMARY.md
- 11:docs/FINANCE/PERSONIFY_PAYMENTS_COST_MODEL.md
- 12:docs/FINANCE/WA_VS_CLUBOS_COST_COMPARISON.md
- 13:docs/FOLLOWUP_PR_BLOCKS_AND_SECTIONS.md
- 14:docs/IMPORTING/IMPORTER_RUNBOOK.md
- 15:docs/IMPORTING/WA_FULL_SYNC_REPORTING.md
- 16:docs/IMPORTING/WA_REGISTRATIONS_DIAGNOSTIC.md
- 17:docs/IMPORTING/WA_REGISTRATION_PIPELINE_ANALYSIS.md
- 18:docs/MEMBERSHIP_LIFECYCLE_STATE_MACHINE.md
- 19:docs/MEMBERSHIP_MODEL_TRUTH_TABLE.md
- 2:docs/ARCHITECTURE.md
- 20:docs/MEMBER_PROFILE_EDITING.md
- 21:docs/POLICY_DECISION_DEPENDENCIES.md
- 22:docs/QA/TEST_SUITE_STATUS_REPORT.md
- 23:docs/RENAME_STRIPES_TO_SECTIONS_PLAN.md
- 24:docs/UX/MEMBER_PROFILE_EXPERIENCE.md
- 25:docs/WA_FULL_SYNC_VERIFICATION.md
- 26:docs/api/API_REFERENCE.md
- 27:docs/api/openapi.yaml
- 28:docs/claudecode-tasks/MEMBERSHIP_LIFECYCLE_STATE_MACHINE_TASK.md
- 29:docs/communications/VP_COMMS_ENEWS_SPEC.md
- 3:docs/ARCHITECTURE_BLOCKS_AND_SECTIONS.md
- 30:docs/demos/DEMO_NARRATIVE.md
- 31:docs/demos/DEMO_SCENARIOS_RUNBOOK.md
- 32:docs/demos/EVENTS_DISCOVERY_DEMO.md
- 33:docs/demos/HOME_PAGE_STRIPES_DEMO.md
- 34:docs/demos/LEADERSHIP_DEMO_SCRIPT.md
- 35:docs/demos/LIFECYCLE_DEEP_LINKS_DEMO.md
- 36:docs/demos/LIFECYCLE_DEMO_FIXTURES.md
- 37:docs/demos/LIFECYCLE_EXPLAINER_DEMO.md
- 38:docs/demos/MEMBERSHIP_APPLICATION_DEMO.md
- 39:docs/demos/MEMBERSHIP_DEMO_SCRIPT.md
- 4:docs/DEMO_GUIDE.md
- 40:docs/demos/MEMBER_HOME_GADGETS_DEMO.md
- 41:docs/demos/MEMBER_PROFILE_VIEWS.md
- 42:docs/demos/MY_SBNC_PROFILE_DEMO.md
- 43:docs/demos/VIEW_AS_SUPPORT_TOOL.md
- 44:docs/events/EVENT_ARCHIVE_NOTEBOOK.md
- 45:docs/events/EVENT_DERIVATION_MODEL.md
- 46:docs/events/EVENT_FIELD_INTELLIGENCE.md
- 47:docs/events/EVENT_LIFECYCLE_DESIGN.md
- 48:docs/events/EVENT_POSTMORTEM.md
- 49:docs/events/EVENT_STATUS_LIFECYCLE.md
- 5:docs/DEMO_MEMBER_LIST.md
- 50:docs/events/POSTING_AND_REGISTRATION_SCHEDULE.md
- 51:docs/governance/TECH_LEAD_COGNITIVE_LOAD.md
- 52:docs/investigations/WEBDAV_STATUS.md
- 53:docs/membership/MEMBERSHIP_LIFECYCLE_STATE_MACHINE.md
- 54:docs/membership/MEMBERSHIP_MODEL_TRUTH_TABLE.md
- 55:docs/operations/ACH_PAYMENT_GUIDE.md
- 56:docs/operations/EMAIL_INFRASTRUCTURE_GUIDE.md
- 57:docs/operations/SUPPORT_PROMPT_TEMPLATES.md
- 58:docs/operations/TECH_LEAD_SUPPORT_GUIDE.md
- 59:docs/policies/POLICY_INGESTION_PLAN.md
- 6:docs/DEVELOPER/API_DOCUMENTATION.md
- 60:docs/policies/POLICY_REGISTRY.yaml
- 61:docs/policies/POLICY_REGISTRY_SPEC.md
- 62:docs/policies/sbnc/ACKNOWLEDGEMENT_REQUIREMENTS_INVENTORY.md
- 63:docs/policies/sbnc/EVENT_SUBMISSION_PHASE2_SPEC.md
- 64:docs/policies/sbnc/EXTRACTED_RULES.md
- 65:docs/policies/sbnc/POLICY_VISIBILITY_AND_ACCESS_MAP.md
- 66:docs/policies/sbnc/SBNC_Policy_Registry.md
- 67:docs/policies/sbnc/UNVERIFIED_RULES_CANDIDATE_SET.md
- 68:docs/policies/sbnc/ocr/txt_20251220_172434/Articles of Inc. SBNC.txt
- 69:docs/policies/sbnc/ocr/txt_20251220_172434/Santa Barbara Newcomers Club - Bylaw Am...Commentary and Implementation Analysis.txt
- 7:docs/FINANCE/ACH_OPTION.md
- 70:docs/policies/sbnc/sources/harvest_20251220_165053/Articles of Inc. SBNC.txt
- 71:docs/policies/sbnc/sources/harvest_20251220_165053/INVENTORY.tsv
- 72:docs/policy/INDEX.md
- 73:docs/policy/POLICY_CROSSWALK.md
- 74:docs/work-queue/GIFT_MEMBERSHIP_WIDGET.md
- 75:docs/work-queue/MEMBERSHIP_APPLICATION_WIDGET.md
- 76:docs/work-queue/MEMBERSHIP_LIFECYCLE.md
- 77:docs/work-queue/README.md
- 8:docs/FINANCE/CLUBOS_HOSTING_COST_MODEL.md
- 9:docs/FINANCE/INFRASTRUCTURE_COST_OFFSETS.md

## Hotspots

- 78:package-lock.json
- 79:package.json
- 80:prisma/schema.prisma

## Prisma-adjacent

- 80:prisma/schema.prisma

## Core admin app surfaces

- 100:src/app/admin/dev/api-docs/ApiDocsClient.tsx
- 89:src/app/admin/AchMetricsWidget.tsx
- 90:src/app/admin/AdminSectionNav.tsx
- 91:src/app/admin/VPActivitiesDashboard.tsx
- 92:src/app/admin/communications/page.tsx
- 93:src/app/admin/demo/DemoScenarioCards.tsx
- 94:src/app/admin/demo/EventDerivedPreviewDemo.tsx
- 95:src/app/admin/demo/LifecycleDeepLinks.tsx
- 96:src/app/admin/demo/ViewAsMemberSection.tsx
- 97:src/app/admin/demo/members/DemoMembersClient.tsx
- 98:src/app/admin/demo/members/page.tsx
- 99:src/app/admin/demo/page.tsx

## Editor/publishing UI surfaces

- 86:src/app/(member)/member/page.tsx
- 87:src/app/(public)/join/page.tsx
- 88:src/app/ViewAsWrapper.tsx

## Importing runtime

- 84:scripts/importing/seed_demo_members.ts
- 85:scripts/importing/wa_full_sync.ts

## CI/scripts

- 81:scripts/ci/validate-policies.ts

