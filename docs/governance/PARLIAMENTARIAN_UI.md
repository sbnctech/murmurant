# Parliamentarian Dashboard & Annotation Panel

## Overview

The Parliamentarian Dashboard is an admin UI widget that provides the Parliamentarian (and other authorized officers) with a centralized view of governance review flags and interpretations. The AnnotationPanel is a reusable component for attaching notes and interpretations to governance documents.

## Location

- **Dashboard Widget**: `src/app/admin/ParliamentarianDashboard.tsx`
- **Annotation Panel**: `src/components/governance/AnnotationPanel.tsx`
- **API Endpoint**: `src/app/api/v1/officer/parliamentarian/dashboard/route.ts`
- **Unit Tests**: `tests/unit/governance/parliamentarian-dashboard.spec.ts`
- **E2E Tests**: `tests/admin/admin-parliamentarian-dashboard.spec.ts`

## Features

### Parliamentarian Dashboard

The dashboard displays governance items requiring Parliamentarian attention:

1. **Overdue Flags Alert** - Red alert section showing flags past due date:
   - Prominent warning styling
   - Quick action buttons to resolve

2. **Open Policy Questions** - POLICY_REVIEW type flags in OPEN/IN_PROGRESS status:
   - Flag title and notes
   - Due date with overdue indicator
   - Resolve action (if user has capability)
   - Audit trail link

3. **Docs Needing Review** - INSURANCE_REVIEW and LEGAL_REVIEW type flags:
   - Document reference (target type and ID)
   - Review type badge
   - Due date tracking
   - Audit trail link

4. **Recent Interpretations** - Latest governance annotations:
   - Annotation body preview
   - Target document reference
   - Publish status indicator
   - Created by and date
   - Audit trail link

5. **Quick Links**:
   - View All Flags (`/admin/governance/flags`)
   - View All Annotations (`/admin/governance/annotations`)
   - Create New Flag (`/admin/governance/flags/new`)

### AnnotationPanel Component

A reusable panel for viewing and managing annotations on governance documents:

- **List View**: Shows all annotations for a target document
- **Add Form**: Create new annotations (capability-gated)
- **Edit/Delete**: Modify existing annotations (capability-gated)
- **Publish/Unpublish**: Control annotation visibility (capability-gated)
- **Anchor Support**: Link annotations to specific sections

## Capability-Gated Actions

Actions are gated by server-validated capabilities. The UI displays actions based on capabilities returned from the API:

| Action | Required Capability | Roles |
|--------|---------------------|-------|
| View Dashboard | `governance:flags:read` | Parliamentarian, Admin |
| Create Flag | `governance:flags:create` | Parliamentarian, Admin |
| Resolve Flag | `governance:flags:resolve` | Parliamentarian, Admin |
| Create Annotation | `governance:annotations:write` | Parliamentarian, Admin |
| Edit Annotation | `governance:annotations:write` | Parliamentarian, Admin |
| Publish Annotation | `governance:annotations:publish` | Parliamentarian, Admin |
| Manage Rules | `governance:rules:manage` | Admin |

## API Response Structure

### Dashboard Data

```typescript
type ParliamentarianDashboardData = {
  visible: boolean;
  openPolicyQuestions: FlagSummary[];
  recentInterpretations: AnnotationSummary[];
  docsNeedingReview: FlagSummary[];
  overdueFlags: FlagSummary[];
  flagCounts: Record<string, number>;
  capabilities: {
    canCreateFlag: boolean;
    canResolveFlag: boolean;
    canCreateAnnotation: boolean;
    canEditAnnotation: boolean;
    canPublishAnnotation: boolean;
    canManageRules: boolean;
  };
};
```

### Flag Summary

```typescript
type FlagSummary = {
  id: string;
  targetType: string;
  targetId: string;
  flagType: ReviewFlagType;
  flagTypeLabel: string;
  title: string;
  notes: string | null;
  status: ReviewFlagStatus;
  statusLabel: string;
  dueDate: string | null;
  dueDateFormatted: string | null;
  isOverdue: boolean;
  createdAt: string;
  createdBy: string | null;
  auditTrailUrl: string;
};
```

### Annotation Summary

```typescript
type AnnotationSummary = {
  id: string;
  targetType: string;
  targetId: string;
  anchor: string | null;
  body: string;
  isPublished: boolean;
  createdAt: string;
  createdAtFormatted: string;
  createdBy: string | null;
  auditTrailUrl: string;
};
```

## Flag Types

| Type | Label | Purpose |
|------|-------|---------|
| INSURANCE_REVIEW | Insurance Review | Flag document for insurance carrier review |
| LEGAL_REVIEW | Legal Review | Flag document for legal counsel review |
| POLICY_REVIEW | Policy Question | Flag policy interpretation question |
| COMPLIANCE_CHECK | Compliance Check | Flag for compliance verification |
| GENERAL | General | General review flag |

## Flag Statuses

| Status | Label | Meaning |
|--------|-------|---------|
| OPEN | Open | Newly created, not yet addressed |
| IN_PROGRESS | In Progress | Being actively reviewed |
| RESOLVED | Resolved | Review complete, issue addressed |
| DISMISSED | Dismissed | Review complete, no action needed |

## AnnotationPanel Usage

The AnnotationPanel can be embedded in any governance document view:

```tsx
import AnnotationPanel from "@/components/governance/AnnotationPanel";

function BylawDetailPage({ bylawId }: { bylawId: string }) {
  // Define section anchors for the document
  const anchors = [
    { id: "article-1", label: "Article I - Name" },
    { id: "article-2", label: "Article II - Purpose" },
    { id: "article-3", label: "Article III - Membership" },
  ];

  return (
    <div>
      {/* Document content */}
      <BylawContent bylawId={bylawId} />

      {/* Annotation panel */}
      <AnnotationPanel
        targetType="bylaw"
        targetId={bylawId}
        anchors={anchors}
        title="Interpretations & Notes"
        showAddForm={true}
        testIdPrefix="bylaw-annotations"
      />
    </div>
  );
}
```

### AnnotationPanel Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `targetType` | string | Yes | Type of target document (bylaw, policy, motion, etc.) |
| `targetId` | string | Yes | ID of the target document |
| `anchors` | `{ id: string; label: string }[]` | No | Available section anchors for targeting |
| `title` | string | No | Panel title (default: "Annotations") |
| `showAddForm` | boolean | No | Whether to show add form initially (default: true) |
| `testIdPrefix` | string | No | Prefix for test IDs (default: "annotation-panel") |

## Target Types

Annotations can be attached to various governance document types:

- `motion` - Board motions
- `bylaw` - Club bylaws
- `policy` - Standing policies
- `page` - Wiki/documentation pages
- `file` - Uploaded documents
- `minutes` - Meeting minutes

## Charter Compliance

These components follow the ClubOS Architectural Charter:

- **P1 (Identity Provable)**: All actions require authenticated session via HttpOnly cookies
- **P2 (Default Deny)**: Dashboard returns `visible: false` for unauthorized users
- **P3 (Explicit State Machine)**: Flag workflow follows defined status transitions
- **P7 (Audit Trail)**: Every flag and annotation includes audit trail link
- **P9 (Explain the Rule)**: Flag types and statuses have human-readable labels

## Test IDs

### Parliamentarian Dashboard

| Test ID | Element |
|---------|---------|
| `parliamentarian-dashboard` | Main container |
| `parliamentarian-dashboard-title` | Widget title |
| `parliamentarian-dashboard-loading` | Loading state |
| `parliamentarian-overdue` | Overdue flags alert section |
| `parliamentarian-overdue-count` | Overdue count badge |
| `parliamentarian-overdue-list` | Overdue flags list |
| `parliamentarian-policy-questions` | Policy questions section |
| `parliamentarian-policy-questions-count` | Policy questions count |
| `parliamentarian-policy-questions-list` | Policy questions list |
| `parliamentarian-docs-review` | Docs needing review section |
| `parliamentarian-docs-review-count` | Docs review count |
| `parliamentarian-docs-review-list` | Docs review list |
| `parliamentarian-interpretations` | Recent interpretations section |
| `parliamentarian-interpretations-count` | Interpretations count |
| `parliamentarian-interpretations-list` | Interpretations list |

### AnnotationPanel

| Test ID | Element |
|---------|---------|
| `{prefix}-container` | Main panel container |
| `{prefix}-title` | Panel title |
| `{prefix}-loading` | Loading state |
| `{prefix}-empty` | Empty state message |
| `{prefix}-list` | Annotations list |
| `{prefix}-item-{id}` | Individual annotation item |
| `{prefix}-add-form` | Add annotation form |
| `{prefix}-add-body` | Body textarea |
| `{prefix}-add-anchor` | Anchor select dropdown |
| `{prefix}-add-submit` | Submit button |
| `{prefix}-edit-{id}` | Edit button for annotation |
| `{prefix}-delete-{id}` | Delete button for annotation |
| `{prefix}-publish-{id}` | Publish/unpublish button |
| `{prefix}-audit-{id}` | Audit trail link |

## Related Documentation

- [ANNOTATIONS_AND_FLAGS.md](./ANNOTATIONS_AND_FLAGS.md) - Annotations and flags system overview
- [ROLES_PARLIAMENTARIAN.md](./ROLES_PARLIAMENTARIAN.md) - Parliamentarian role capabilities
- [SECRETARY_DASHBOARD.md](./SECRETARY_DASHBOARD.md) - Secretary dashboard (similar pattern)
- [MINUTES_WORKFLOW.md](./MINUTES_WORKFLOW.md) - Minutes workflow documentation
