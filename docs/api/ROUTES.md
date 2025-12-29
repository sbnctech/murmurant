# Murmurant API Routes

Generated: 2025-12-27

---

## `/admin/ach-metrics`
**Methods:** GET

`src/app/api/admin/ach-metrics/route.ts`

## `/admin/activity`
**Methods:** GET

`src/app/api/admin/activity/route.ts`

## `/admin/comms/audience-rules`
**Methods:** GET,POST,PUT,DELETE

`src/app/api/admin/comms/audience-rules/route.ts`

## `/admin/comms/campaigns/:id`
**Methods:** GET,PUT,DELETE,POST

`src/app/api/admin/comms/campaigns/[id]/route.ts`

## `/admin/comms/campaigns`
**Methods:** GET,POST

`src/app/api/admin/comms/campaigns/route.ts`

## `/admin/comms/lists`
**Methods:** GET,POST,PUT,DELETE

`src/app/api/admin/comms/lists/route.ts`

## `/admin/comms/templates`
**Methods:** GET,POST,PUT,DELETE

`src/app/api/admin/comms/templates/route.ts`

## `/admin/content/pages/:id/audit`
**Methods:** GET

`src/app/api/admin/content/pages/[id]/audit/route.ts`

## `/admin/content/pages/:id/blocks/:blockId`
**Methods:** PATCH,DELETE

`src/app/api/admin/content/pages/[id]/blocks/[blockId]/route.ts`

## `/admin/content/pages/:id/blocks`
**Methods:** POST

`src/app/api/admin/content/pages/[id]/blocks/route.ts`

## `/admin/content/pages/:id/redo`
**Methods:** POST

`src/app/api/admin/content/pages/[id]/redo/route.ts`

## `/admin/content/pages/:id/revisions`
**Methods:** GET

`src/app/api/admin/content/pages/[id]/revisions/route.ts`

## `/admin/content/pages/:id`
**Methods:** GET,PUT,DELETE,POST

`src/app/api/admin/content/pages/[id]/route.ts`

## `/admin/content/pages/:id/undo`
**Methods:** POST

`src/app/api/admin/content/pages/[id]/undo/route.ts`

## `/admin/content/pages`
**Methods:** GET,POST

`src/app/api/admin/content/pages/route.ts`

## `/admin/content/templates`
**Methods:** GET,POST,PUT,DELETE

`src/app/api/admin/content/templates/route.ts`

## `/admin/content/themes`
**Methods:** GET,POST,PUT,DELETE

`src/app/api/admin/content/themes/route.ts`

## `/admin/dashboard`
**Methods:** GET

`src/app/api/admin/dashboard/route.ts`

## `/admin/debug/effective-permissions`
**Methods:** GET

`src/app/api/admin/debug/effective-permissions/route.ts`

## `/admin/demo/lifecycle-members`
**Methods:** GET

`src/app/api/admin/demo/lifecycle-members/route.ts`

## `/admin/demo/member-list`
**Methods:** GET

`src/app/api/admin/demo/member-list/route.ts`

## `/admin/demo/scenarios`
**Methods:** GET

`src/app/api/admin/demo/scenarios/route.ts`

## `/admin/demo/status`
**Methods:** GET

`src/app/api/admin/demo/status/route.ts`

## `/admin/demo/work-queue`
**Methods:** GET

`src/app/api/admin/demo/work-queue/route.ts`

## `/admin/events/:id`
**Methods:** GET,PATCH,DELETE

`src/app/api/admin/events/[id]/route.ts`

## `/admin/events`
**Methods:** POST,GET

`src/app/api/admin/events/route.ts`

## `/admin/export/activity`
**Methods:** GET

`src/app/api/admin/export/activity/route.ts`

## `/admin/export/events`
**Methods:** GET

`src/app/api/admin/export/events/route.ts`

## `/admin/export/members`
**Methods:** GET

`src/app/api/admin/export/members/route.ts`

## `/admin/export/registrations`
**Methods:** GET

`src/app/api/admin/export/registrations/route.ts`

## `/admin/files/:id`
**Methods:** GET,PATCH,DELETE

`src/app/api/admin/files/[id]/route.ts`

## `/admin/files/authorized`
**Methods:** GET

`src/app/api/admin/files/authorized/route.ts`

## `/admin/files`
**Methods:** POST

`src/app/api/admin/files/route.ts`

## `/admin/impersonate/end`
**Methods:** POST

`src/app/api/admin/impersonate/end/route.ts`

## `/admin/impersonate/start`
**Methods:** POST

`src/app/api/admin/impersonate/start/route.ts`

## `/admin/impersonate/status`
**Methods:** GET

`src/app/api/admin/impersonate/status/route.ts`

## `/admin/members/:id/history`
**Methods:** GET

`src/app/api/admin/members/[id]/history/route.ts`

## `/admin/members/:id`
**Methods:** GET

`src/app/api/admin/members/[id]/route.ts`

## `/admin/members`
**Methods:** GET

`src/app/api/admin/members/route.ts`

## `/admin/registrations/:id`
**Methods:** GET

`src/app/api/admin/registrations/[id]/route.ts`

## `/admin/registrations`
**Methods:** GET

`src/app/api/admin/registrations/route.ts`

## `/admin/registrations/search`
**Methods:** GET

`src/app/api/admin/registrations/search/route.ts`

## `/admin/search`
**Methods:** GET

`src/app/api/admin/search/route.ts`

## `/admin/summary`
**Methods:** GET

`src/app/api/admin/summary/route.ts`

## `/admin/ticket-types`
**Methods:** GET

`src/app/api/admin/ticket-types/route.ts`

## `/admin/transitions/summary`
**Methods:** GET

`src/app/api/admin/transitions/summary/route.ts`

## `/auth/logout`
**Methods:** POST

`src/app/api/auth/logout/route.ts`

## `/auth/me`
**Methods:** GET

`src/app/api/auth/me/route.ts`

## `/auth/request-link`
**Methods:** POST

`src/app/api/auth/request-link/route.ts`

## `/cron/transitions`
**Methods:** POST,GET

`src/app/api/cron/transitions/route.ts`

## `/email/log`
**Methods:** POST,GET

`src/app/api/email/log/route.ts`

## `/email/test`
**Methods:** POST,GET

`src/app/api/email/test/route.ts`

## `/events`
**Methods:** GET

`src/app/api/events/route.ts`

## `/health/auth`
**Methods:** GET

`src/app/api/health/auth/route.ts`

## `/health/cron`
**Methods:** GET

`src/app/api/health/cron/route.ts`

## `/health/db`
**Methods:** GET

`src/app/api/health/db/route.ts`

## `/health`
**Methods:** GET

`src/app/api/health/route.ts`

## `/members`
**Methods:** GET

`src/app/api/members/route.ts`

## `/openapi`
**Methods:** GET

`src/app/api/openapi/route.ts`

## `/payments/fake/checkout`
**Methods:** GET

`src/app/api/payments/fake/checkout/route.ts`

## `/payments/fake/complete`
**Methods:** POST

`src/app/api/payments/fake/complete/route.ts`

## `/payments/fake/webhook`
**Methods:** POST

`src/app/api/payments/fake/webhook/route.ts`

## `/payments/intents`
**Methods:** POST

`src/app/api/payments/intents/route.ts`

## `/registrations`
**Methods:** GET

`src/app/api/registrations/route.ts`

## `/sms/test`
**Methods:** POST,GET

`src/app/api/sms/test/route.ts`

## `/v1/admin/communications/enews-week`
**Methods:** GET

`src/app/api/v1/admin/communications/enews-week/route.ts`

## `/v1/admin/email-health/config`
**Methods:** GET,PATCH

`src/app/api/v1/admin/email-health/config/route.ts`

## `/v1/admin/email-health`
**Methods:** GET

`src/app/api/v1/admin/email-health/route.ts`

## `/v1/admin/events/:id/cancel`
**Methods:** PATCH

`src/app/api/v1/admin/events/[id]/cancel/route.ts`

## `/v1/admin/events/:id/duplicate`
**Methods:** POST

`src/app/api/v1/admin/events/[id]/duplicate/route.ts`

## `/v1/admin/events/:id`
**Methods:** GET,PATCH,DELETE

`src/app/api/v1/admin/events/[id]/route.ts`

## `/v1/admin/events`
**Methods:** GET,POST

`src/app/api/v1/admin/events/route.ts`

## `/v1/admin/import/status`
**Methods:** GET

`src/app/api/v1/admin/import/status/route.ts`

## `/v1/admin/members/:id/history`
**Methods:** GET

`src/app/api/v1/admin/members/[id]/history/route.ts`

## `/v1/admin/members/:id/lifecycle`
**Methods:** GET

`src/app/api/v1/admin/members/[id]/lifecycle/route.ts`

## `/v1/admin/members/:id`
**Methods:** GET,PATCH

`src/app/api/v1/admin/members/[id]/route.ts`

## `/v1/admin/members/:id/service-history`
**Methods:** GET

`src/app/api/v1/admin/members/[id]/service-history/route.ts`

## `/v1/admin/members/:id/status`
**Methods:** PATCH

`src/app/api/v1/admin/members/[id]/status/route.ts`

## `/v1/admin/members`
**Methods:** GET

`src/app/api/v1/admin/members/route.ts`

## `/v1/admin/registrations/:id/promote`
**Methods:** POST

`src/app/api/v1/admin/registrations/[id]/promote/route.ts`

## `/v1/admin/registrations/:id`
**Methods:** GET,DELETE

`src/app/api/v1/admin/registrations/[id]/route.ts`

## `/v1/admin/registrations/pending`
**Methods:** GET

`src/app/api/v1/admin/registrations/pending/route.ts`

## `/v1/admin/registrations`
**Methods:** GET

`src/app/api/v1/admin/registrations/route.ts`

## `/v1/admin/service-history/:id/close`
**Methods:** PATCH

`src/app/api/v1/admin/service-history/[id]/close/route.ts`

## `/v1/admin/service-history`
**Methods:** GET,POST

`src/app/api/v1/admin/service-history/route.ts`

## `/v1/admin/transitions/:id/apply`
**Methods:** POST

`src/app/api/v1/admin/transitions/[id]/apply/route.ts`

## `/v1/admin/transitions/:id/approve`
**Methods:** POST

`src/app/api/v1/admin/transitions/[id]/approve/route.ts`

## `/v1/admin/transitions/:id/assignments/:aid`
**Methods:** DELETE

`src/app/api/v1/admin/transitions/[id]/assignments/[aid]/route.ts`

## `/v1/admin/transitions/:id/assignments`
**Methods:** POST

`src/app/api/v1/admin/transitions/[id]/assignments/route.ts`

## `/v1/admin/transitions/:id/cancel`
**Methods:** POST

`src/app/api/v1/admin/transitions/[id]/cancel/route.ts`

## `/v1/admin/transitions/:id/detect-outgoing`
**Methods:** POST

`src/app/api/v1/admin/transitions/[id]/detect-outgoing/route.ts`

## `/v1/admin/transitions/:id`
**Methods:** GET,PATCH,DELETE

`src/app/api/v1/admin/transitions/[id]/route.ts`

## `/v1/admin/transitions/:id/submit`
**Methods:** POST

`src/app/api/v1/admin/transitions/[id]/submit/route.ts`

## `/v1/admin/transitions`
**Methods:** GET,POST

`src/app/api/v1/admin/transitions/route.ts`

## `/v1/admin/transitions/widget`
**Methods:** GET

`src/app/api/v1/admin/transitions/widget/route.ts`

## `/v1/admin/users/:id/passkeys`
**Methods:** GET,DELETE

`src/app/api/v1/admin/users/[id]/passkeys/route.ts`

## `/v1/auth/logout`
**Methods:** POST

`src/app/api/v1/auth/logout/route.ts`

## `/v1/auth/magic-link/send`
**Methods:** POST

`src/app/api/v1/auth/magic-link/send/route.ts`

## `/v1/auth/magic-link/verify`
**Methods:** POST

`src/app/api/v1/auth/magic-link/verify/route.ts`

## `/v1/auth/passkey/login/begin`
**Methods:** POST

`src/app/api/v1/auth/passkey/login/begin/route.ts`

## `/v1/auth/passkey/login/finish`
**Methods:** POST

`src/app/api/v1/auth/passkey/login/finish/route.ts`

## `/v1/auth/passkey/register/begin`
**Methods:** POST

`src/app/api/v1/auth/passkey/register/begin/route.ts`

## `/v1/auth/passkey/register/finish`
**Methods:** POST

`src/app/api/v1/auth/passkey/register/finish/route.ts`

## `/v1/auth/refresh`
**Methods:** POST

`src/app/api/v1/auth/refresh/route.ts`

## `/v1/committees`
**Methods:** GET

`src/app/api/v1/committees/route.ts`

## `/v1/docs/openapi`
**Methods:** GET

`src/app/api/v1/docs/openapi/route.ts`

## `/v1/events/:id/eligibility`
**Methods:** GET

`src/app/api/v1/events/[id]/eligibility/route.ts`

## `/v1/events/:id/notes/:noteId`
**Methods:** PATCH,DELETE

`src/app/api/v1/events/[id]/notes/[noteId]/route.ts`

## `/v1/events/:id/notes`
**Methods:** GET,POST

`src/app/api/v1/events/[id]/notes/route.ts`

## `/v1/events/:id/postmortem/approve`
**Methods:** POST

`src/app/api/v1/events/[id]/postmortem/approve/route.ts`

## `/v1/events/:id/postmortem/return`
**Methods:** POST

`src/app/api/v1/events/[id]/postmortem/return/route.ts`

## `/v1/events/:id/postmortem`
**Methods:** GET,POST,PATCH

`src/app/api/v1/events/[id]/postmortem/route.ts`

## `/v1/events/:id/postmortem/status`
**Methods:** POST

`src/app/api/v1/events/[id]/postmortem/status/route.ts`

## `/v1/events/:id/postmortem/submit`
**Methods:** POST

`src/app/api/v1/events/[id]/postmortem/submit/route.ts`

## `/v1/events/:id/postmortem/unlock`
**Methods:** POST

`src/app/api/v1/events/[id]/postmortem/unlock/route.ts`

## `/v1/events/:id/register`
**Methods:** POST,DELETE

`src/app/api/v1/events/[id]/register/route.ts`

## `/v1/events/:id`
**Methods:** GET

`src/app/api/v1/events/[id]/route.ts`

## `/v1/events/:id/status`
**Methods:** POST

`src/app/api/v1/events/[id]/status/route.ts`

## `/v1/events`
**Methods:** GET

`src/app/api/v1/events/route.ts`

## `/v1/files/:id`
**Methods:** GET,PATCH,DELETE

`src/app/api/v1/files/[id]/route.ts`

## `/v1/files/:id/url`
**Methods:** GET

`src/app/api/v1/files/[id]/url/route.ts`

## `/v1/files`
**Methods:** POST,GET

`src/app/api/v1/files/route.ts`

## `/v1/health`
**Methods:** GET

`src/app/api/v1/health/route.ts`

## `/v1/me/committees`
**Methods:** GET

`src/app/api/v1/me/committees/route.ts`

## `/v1/me/passkeys`
**Methods:** GET,DELETE

`src/app/api/v1/me/passkeys/route.ts`

## `/v1/me/payment-methods/:id`
**Methods:** DELETE

`src/app/api/v1/me/payment-methods/[id]/route.ts`

## `/v1/me/payment-methods/ach`
**Methods:** POST

`src/app/api/v1/me/payment-methods/ach/route.ts`

## `/v1/me/payment-methods`
**Methods:** GET

`src/app/api/v1/me/payment-methods/route.ts`

## `/v1/me/profile`
**Methods:** GET,PATCH

`src/app/api/v1/me/profile/route.ts`

## `/v1/me/recommended-events`
**Methods:** GET

`src/app/api/v1/me/recommended-events/route.ts`

## `/v1/me/registrations`
**Methods:** GET

`src/app/api/v1/me/registrations/route.ts`

## `/v1/me`
**Methods:** GET

`src/app/api/v1/me/route.ts`

## `/v1/members/:id/public`
**Methods:** GET

`src/app/api/v1/members/[id]/public/route.ts`

## `/v1/members/:id`
**Methods:** GET

`src/app/api/v1/members/[id]/route.ts`

## `/v1/members/directory`
**Methods:** GET

`src/app/api/v1/members/directory/route.ts`

## `/v1/members`
**Methods:** GET

`src/app/api/v1/members/route.ts`

## `/v1/officer/board-records/:id`
**Methods:** GET,PATCH,DELETE,POST

`src/app/api/v1/officer/board-records/[id]/route.ts`

## `/v1/officer/board-records`
**Methods:** GET,POST

`src/app/api/v1/officer/board-records/route.ts`

## `/v1/officer/communications/dashboard`
**Methods:** GET

`src/app/api/v1/officer/communications/dashboard/route.ts`

## `/v1/officer/events/dashboard`
**Methods:** GET

`src/app/api/v1/officer/events/dashboard/route.ts`

## `/v1/officer/events/my-events`
**Methods:** GET

`src/app/api/v1/officer/events/my-events/route.ts`

## `/v1/officer/governance/annotations/:id`
**Methods:** GET,PATCH,DELETE,POST

`src/app/api/v1/officer/governance/annotations/[id]/route.ts`

## `/v1/officer/governance/annotations`
**Methods:** GET,POST

`src/app/api/v1/officer/governance/annotations/route.ts`

## `/v1/officer/governance/flags/:id`
**Methods:** GET,PATCH,DELETE,POST

`src/app/api/v1/officer/governance/flags/[id]/route.ts`

## `/v1/officer/governance/flags`
**Methods:** GET,POST

`src/app/api/v1/officer/governance/flags/route.ts`

## `/v1/officer/governance/meetings/:id`
**Methods:** GET,PATCH,DELETE

`src/app/api/v1/officer/governance/meetings/[id]/route.ts`

## `/v1/officer/governance/meetings`
**Methods:** GET,POST

`src/app/api/v1/officer/governance/meetings/route.ts`

## `/v1/officer/governance/minutes/:id`
**Methods:** GET,PATCH,DELETE,POST

`src/app/api/v1/officer/governance/minutes/[id]/route.ts`

## `/v1/officer/governance/minutes`
**Methods:** GET,POST

`src/app/api/v1/officer/governance/minutes/route.ts`

## `/v1/officer/governance/motions/:id`
**Methods:** GET,PATCH,DELETE,POST

`src/app/api/v1/officer/governance/motions/[id]/route.ts`

## `/v1/officer/governance/motions`
**Methods:** GET,POST

`src/app/api/v1/officer/governance/motions/route.ts`

## `/v1/officer/governance/rules-guidance/:id`
**Methods:** GET,PATCH,DELETE

`src/app/api/v1/officer/governance/rules-guidance/[id]/route.ts`

## `/v1/officer/governance/rules-guidance`
**Methods:** GET,POST

`src/app/api/v1/officer/governance/rules-guidance/route.ts`

## `/v1/officer/meetings/:id/minutes`
**Methods:** GET,POST,PATCH

`src/app/api/v1/officer/meetings/[id]/minutes/route.ts`

## `/v1/officer/meetings/:id`
**Methods:** GET,PATCH,DELETE

`src/app/api/v1/officer/meetings/[id]/route.ts`

## `/v1/officer/meetings`
**Methods:** GET,POST

`src/app/api/v1/officer/meetings/route.ts`

## `/v1/officer/parliamentarian/dashboard`
**Methods:** GET

`src/app/api/v1/officer/parliamentarian/dashboard/route.ts`

## `/v1/officer/secretary/dashboard`
**Methods:** GET

`src/app/api/v1/officer/secretary/dashboard/route.ts`

## `/v1/officer/vp-activities/dashboard`
**Methods:** GET

`src/app/api/v1/officer/vp-activities/dashboard/route.ts`

## `/v1/policies/:id/export-pdf`
**Methods:** GET

`src/app/api/v1/policies/[id]/export-pdf/route.ts`

## `/v1/policies/:id`
**Methods:** GET

`src/app/api/v1/policies/[id]/route.ts`

## `/v1/policies/export-pdf`
**Methods:** GET

`src/app/api/v1/policies/export-pdf/route.ts`

## `/v1/policies`
**Methods:** GET

`src/app/api/v1/policies/route.ts`

## `/v1/support/cases/:id/notes`
**Methods:** POST

`src/app/api/v1/support/cases/[id]/notes/route.ts`

## `/v1/support/cases/:id`
**Methods:** GET,PATCH

`src/app/api/v1/support/cases/[id]/route.ts`

## `/v1/support/cases`
**Methods:** GET,POST

`src/app/api/v1/support/cases/route.ts`

## `/v1/support/dashboard`
**Methods:** GET

`src/app/api/v1/support/dashboard/route.ts`

## `/v1/tickets/:id/eligibility`
**Methods:** GET

`src/app/api/v1/tickets/[id]/eligibility/route.ts`

## `/v1/version`
**Methods:** GET

`src/app/api/v1/version/route.ts`

## `/webhooks/email`
**Methods:** POST

`src/app/api/webhooks/email/route.ts`

## `/widgets/list`
**Methods:** POST

`src/app/api/widgets/list/route.ts`

