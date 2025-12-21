# Editor Acceptance Tests (Prose)

These are acceptance tests written as prose to lock behavior before implementation.
If a test fails, the editor is not shippable.

## New Pages Only

GIVEN a user opens the editor
WHEN they attempt to edit an existing legacy page
THEN the editor does not allow it
AND provides a clear message: "Legacy pages are not editable in v1."

## No Implicit Navigation

GIVEN a newly created page
WHEN it is published
THEN it does not appear in any navigation menus by default
AND it does not appear in any auto-generated lists
AND there is no inferred placement in a hierarchy.

## Explicit Metadata Only

GIVEN a newly created page
WHEN no metadata fields are set
THEN the page renders with default safe values
AND no optional features appear.

## Breadcrumbs Hidden by Default

GIVEN a newly created page with breadcrumbs not enabled
WHEN the page is rendered
THEN no breadcrumb UI appears anywhere
AND the page otherwise renders normally.

## Breadcrumbs Explicit Opt-In

GIVEN a page with breadcrumbs enabled
AND breadcrumbs are manually defined in page data
WHEN the page is rendered
THEN the breadcrumb UI appears exactly as defined
AND the breadcrumb UI does not change routing, navigation, or access control.

## Preview Matches Production

GIVEN the same page data
WHEN rendered in preview
AND rendered in production
THEN the output is identical in structure and content.

There are no preview-only features.

## Failure Behavior

GIVEN malformed metadata
WHEN the page is rendered
THEN the page does not crash
AND only the malformed feature is disabled
AND the rest of the page remains readable.

## Legacy Isolation

GIVEN an existing legacy page
WHEN the editor is introduced
THEN the legacy page renders exactly as before
AND no data migrations occur
AND no behavior changes occur.

## Editing Discipline

GIVEN a user does not enable a feature
THEN that feature does not appear anywhere
AND no system behavior changes due to "defaults" beyond safe rendering.

## Crawl / Exposure Control

GIVEN an editor/admin route
WHEN a crawler requests it
THEN it is non-indexable
AND it is not discoverable via public links
AND it requires authentication.

GIVEN a member-only page
WHEN the page is rendered without explicit SEO enablement
THEN it is non-indexable by default.

## Final Acceptance Criterion

A developer unfamiliar with the editor should be able to answer:

"Why does this page render this way?"

using only the stored page data.

