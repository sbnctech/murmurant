Admin Test Failures Baseline

Purpose:
- Track pre-existing admin test failures (so other PRs can proceed)
- Provide a single place to assign fixes without mixing concerns

Rules:
- Do NOT change production code in this PR
- Prefer fixing brittle assertions; if truly blocked, use test.skip with TODO and link to issue

Baseline:


## Failures captured from local run

### Failure 1

```
  1) tests/admin/admin-activity-ui.spec.ts:18:7 › Admin Activity UI › Activity table shows the expected rows 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

    Locator: locator('[data-test-id="admin-activity-row"]').first()
    Expected: visible
    Timeout: 10000ms
    Error: element(s) not found

    Call log:
    [2m  - Expect "toBeVisible" with timeout 10000ms[22m
    [2m  - waiting for locator('[data-test-id="admin-activity-row"]').first()[22m


      21 |     // Wait for activity rows to appear (server renders with data from API)
      22 |     const rows = page.locator('[data-test-id="admin-activity-row"]');
    > 23 |     await expect(rows.first()).toBeVisible({ timeout: 10000 });
         |                                ^
      24 |     const count = await rows.count();
      25 |     expect(count).toBeGreaterThanOrEqual(1);
      26 |
        at /Users/edf/clubos/tests/admin/admin-activity-ui.spec.ts:23:32

    Error Context: test-results/admin-admin-activity-ui-Ad-6a84b-ble-shows-the-expected-rows/error-context.md

  2) tests/admin/admin-activity-ui.spec.ts:36:7 › Admin Activity UI › Status column shows REGISTERED and WAITLISTED 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

    Locator: locator('[data-test-id="admin-activity-row"]').first()
```

Triage:
- Suspected cause:
- Fix type:
- Owner:
- Priority:

### Failure 2

```
  2) tests/admin/admin-activity-ui.spec.ts:36:7 › Admin Activity UI › Status column shows REGISTERED and WAITLISTED 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

    Locator: locator('[data-test-id="admin-activity-row"]').first()
    Expected: visible
    Timeout: 10000ms
    Error: element(s) not found

    Call log:
    [2m  - Expect "toBeVisible" with timeout 10000ms[22m
    [2m  - waiting for locator('[data-test-id="admin-activity-row"]').first()[22m


      38 |
      39 |     const rows = page.locator('[data-test-id="admin-activity-row"]');
    > 40 |     await expect(rows.first()).toBeVisible({ timeout: 10000 });
         |                                ^
      41 |
      42 |     // Alice Johnson should have REGISTERED status
      43 |     const aliceRow = rows.filter({ hasText: "Alice Johnson" });
        at /Users/edf/clubos/tests/admin/admin-activity-ui.spec.ts:40:32

    Error Context: test-results/admin-admin-activity-ui-Ad-5bdb7-s-REGISTERED-and-WAITLISTED/error-context.md

  3) tests/admin/admin-activity-ui.spec.ts:51:7 › Admin Activity UI › Activity table structure is correct and empty state element exists in DOM 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

    Locator: locator('[data-test-id="admin-activity-row"]').first()
```

Triage:
- Suspected cause:
- Fix type:
- Owner:
- Priority:

### Failure 3

```
  3) tests/admin/admin-activity-ui.spec.ts:51:7 › Admin Activity UI › Activity table structure is correct and empty state element exists in DOM 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

    Locator: locator('[data-test-id="admin-activity-row"]').first()
    Expected: visible
    Timeout: 10000ms
    Error: element(s) not found

    Call log:
    [2m  - Expect "toBeVisible" with timeout 10000ms[22m
    [2m  - waiting for locator('[data-test-id="admin-activity-row"]').first()[22m


      65 |     // Verify rows exist with mock data - wait for first row to be visible
      66 |     const rows = page.locator('[data-test-id="admin-activity-row"]');
    > 67 |     await expect(rows.first()).toBeVisible({ timeout: 10000 });
         |                                ^
      68 |     const rowCount = await rows.count();
      69 |     expect(rowCount).toBeGreaterThanOrEqual(1);
      70 |
        at /Users/edf/clubos/tests/admin/admin-activity-ui.spec.ts:67:32

    Error Context: test-results/admin-admin-activity-ui-Ad-7dfc0-state-element-exists-in-DOM/error-context.md

  4) tests/admin/admin-event-detail-page.spec.ts:7:7 › Admin Event Detail Page › shows event detail page for Welcome Hike 

    Error: lookupEventIdByTitle: API failed 401

       at admin/helpers/lookupIds.ts:42
```

Triage:
- Suspected cause:
- Fix type:
- Owner:
- Priority:

### Failure 4

```
  4) tests/admin/admin-event-detail-page.spec.ts:7:7 › Admin Event Detail Page › shows event detail page for Welcome Hike 

    Error: lookupEventIdByTitle: API failed 401

       at admin/helpers/lookupIds.ts:42

      40 | export async function lookupEventIdByTitle(request: APIRequestContext, title: string): Promise<string> {
      41 |   const res = await request.get(`/api/admin/events?query=${encodeURIComponent(title)}`);
    > 42 |   if (!res.ok()) throw new Error(`lookupEventIdByTitle: API failed ${res.status()}`);
         |                        ^
      43 |   const data: ListResponse<EventItem> | EventItem[] = await res.json();
      44 |   const items = extractItems(data);
      45 |   const hit = items.find((e) => (e.title ?? "").toLowerCase().includes(title.toLowerCase()));
        at lookupEventIdByTitle (/Users/edf/clubos/tests/admin/helpers/lookupIds.ts:42:24)
        at /Users/edf/clubos/tests/admin/admin-event-detail-page.spec.ts:8:21

  5) tests/admin/admin-event-detail-page.spec.ts:23:7 › Admin Event Detail Page › shows at least one registration row 

    Error: lookupEventIdByTitle: API failed 401

       at admin/helpers/lookupIds.ts:42

      40 | export async function lookupEventIdByTitle(request: APIRequestContext, title: string): Promise<string> {
      41 |   const res = await request.get(`/api/admin/events?query=${encodeURIComponent(title)}`);
    > 42 |   if (!res.ok()) throw new Error(`lookupEventIdByTitle: API failed ${res.status()}`);
         |                        ^
      43 |   const data: ListResponse<EventItem> | EventItem[] = await res.json();
      44 |   const items = extractItems(data);
      45 |   const hit = items.find((e) => (e.title ?? "").toLowerCase().includes(title.toLowerCase()));
        at lookupEventIdByTitle (/Users/edf/clubos/tests/admin/helpers/lookupIds.ts:42:24)
```

Triage:
- Suspected cause:
- Fix type:
- Owner:
- Priority:

### Failure 5

```
  5) tests/admin/admin-event-detail-page.spec.ts:23:7 › Admin Event Detail Page › shows at least one registration row 

    Error: lookupEventIdByTitle: API failed 401

       at admin/helpers/lookupIds.ts:42

      40 | export async function lookupEventIdByTitle(request: APIRequestContext, title: string): Promise<string> {
      41 |   const res = await request.get(`/api/admin/events?query=${encodeURIComponent(title)}`);
    > 42 |   if (!res.ok()) throw new Error(`lookupEventIdByTitle: API failed ${res.status()}`);
         |                        ^
      43 |   const data: ListResponse<EventItem> | EventItem[] = await res.json();
      44 |   const items = extractItems(data);
      45 |   const hit = items.find((e) => (e.title ?? "").toLowerCase().includes(title.toLowerCase()));
        at lookupEventIdByTitle (/Users/edf/clubos/tests/admin/helpers/lookupIds.ts:42:24)
        at /Users/edf/clubos/tests/admin/admin-event-detail-page.spec.ts:24:21

  6) tests/admin/admin-event-detail-page.spec.ts:32:7 › Admin Event Detail Page › returns 404 for invalid event id 

    Error: lookupEventIdByTitle: API failed 401

       at admin/helpers/lookupIds.ts:42

      40 | export async function lookupEventIdByTitle(request: APIRequestContext, title: string): Promise<string> {
      41 |   const res = await request.get(`/api/admin/events?query=${encodeURIComponent(title)}`);
    > 42 |   if (!res.ok()) throw new Error(`lookupEventIdByTitle: API failed ${res.status()}`);
         |                        ^
      43 |   const data: ListResponse<EventItem> | EventItem[] = await res.json();
      44 |   const items = extractItems(data);
      45 |   const hit = items.find((e) => (e.title ?? "").toLowerCase().includes(title.toLowerCase()));
        at lookupEventIdByTitle (/Users/edf/clubos/tests/admin/helpers/lookupIds.ts:42:24)
```

Triage:
- Suspected cause:
- Fix type:
- Owner:
- Priority:

### Failure 6

```
  6) tests/admin/admin-event-detail-page.spec.ts:32:7 › Admin Event Detail Page › returns 404 for invalid event id 

    Error: lookupEventIdByTitle: API failed 401

       at admin/helpers/lookupIds.ts:42

      40 | export async function lookupEventIdByTitle(request: APIRequestContext, title: string): Promise<string> {
      41 |   const res = await request.get(`/api/admin/events?query=${encodeURIComponent(title)}`);
    > 42 |   if (!res.ok()) throw new Error(`lookupEventIdByTitle: API failed ${res.status()}`);
         |                        ^
      43 |   const data: ListResponse<EventItem> | EventItem[] = await res.json();
      44 |   const items = extractItems(data);
      45 |   const hit = items.find((e) => (e.title ?? "").toLowerCase().includes(title.toLowerCase()));
        at lookupEventIdByTitle (/Users/edf/clubos/tests/admin/helpers/lookupIds.ts:42:24)
        at /Users/edf/clubos/tests/admin/admin-event-detail-page.spec.ts:33:21

  7) tests/admin/admin-events-explorer.spec.ts:13:7 › Admin Events Explorer › displays both mock events 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoHaveCount[2m([22m[32mexpected[39m[2m)[22m failed

    Locator:  locator('[data-test-id="admin-events-list-row"]')
    Expected: [32m2[39m
    Received: [31m0[39m
    Timeout:  5000ms

    Call log:
    [2m  - Expect "toHaveCount" with timeout 5000ms[22m
    [2m  - waiting for locator('[data-test-id="admin-events-list-row"]')[22m
    [2m    9 × locator resolved to 0 elements[22m
    [2m      - unexpected value "0"[22m
```

Triage:
- Suspected cause:
- Fix type:
- Owner:
- Priority:

### Failure 7

```
  7) tests/admin/admin-events-explorer.spec.ts:13:7 › Admin Events Explorer › displays both mock events 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoHaveCount[2m([22m[32mexpected[39m[2m)[22m failed

    Locator:  locator('[data-test-id="admin-events-list-row"]')
    Expected: [32m2[39m
    Received: [31m0[39m
    Timeout:  5000ms

    Call log:
    [2m  - Expect "toHaveCount" with timeout 5000ms[22m
    [2m  - waiting for locator('[data-test-id="admin-events-list-row"]')[22m
    [2m    9 × locator resolved to 0 elements[22m
    [2m      - unexpected value "0"[22m


      15 |
      16 |     const rows = page.locator('[data-test-id="admin-events-list-row"]');
    > 17 |     await expect(rows).toHaveCount(2);
         |                        ^
      18 |
      19 |     const rowTexts = await rows.allTextContents();
      20 |     const allText = rowTexts.join(" ");
        at /Users/edf/clubos/tests/admin/admin-events-explorer.spec.ts:17:24

    Error Context: test-results/admin-admin-events-explore-a6812-r-displays-both-mock-events/error-context.md

  8) tests/admin/admin-events-explorer.spec.ts:25:7 › Admin Events Explorer › title links navigate to event detail page 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed
```

Triage:
- Suspected cause:
- Fix type:
- Owner:
- Priority:

### Failure 8

```
  8) tests/admin/admin-events-explorer.spec.ts:25:7 › Admin Events Explorer › title links navigate to event detail page 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

    Locator: locator('[data-test-id="admin-events-list-title-link"]').filter({ hasText: 'Welcome Hike' })
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
    [2m  - Expect "toBeVisible" with timeout 5000ms[22m
    [2m  - waiting for locator('[data-test-id="admin-events-list-title-link"]').filter({ hasText: 'Welcome Hike' })[22m


      29 |     const titleLinks = page.locator('[data-test-id="admin-events-list-title-link"]');
      30 |     const welcomeHikeLink = titleLinks.filter({ hasText: "Welcome Hike" });
    > 31 |     await expect(welcomeHikeLink).toBeVisible();
         |                                   ^
      32 |
      33 |     await welcomeHikeLink.click();
      34 |
        at /Users/edf/clubos/tests/admin/admin-events-explorer.spec.ts:31:35

    Error Context: test-results/admin-admin-events-explore-ce13c-vigate-to-event-detail-page/error-context.md

  9) tests/admin/admin-events.spec.ts:4:5 › Admin events table renders mock events ─────────────────

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoHaveCount[2m([22m[32mexpected[39m[2m)[22m failed

    Locator:  locator('[data-test-id="admin-events-row"]')
```

Triage:
- Suspected cause:
- Fix type:
- Owner:
- Priority:

### Failure 9

```
  9) tests/admin/admin-events.spec.ts:4:5 › Admin events table renders mock events ─────────────────

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoHaveCount[2m([22m[32mexpected[39m[2m)[22m failed

    Locator:  locator('[data-test-id="admin-events-row"]')
    Expected: [32m2[39m
    Received: [31m3[39m
    Timeout:  5000ms

    Call log:
    [2m  - Expect "toHaveCount" with timeout 5000ms[22m
    [2m  - waiting for locator('[data-test-id="admin-events-row"]')[22m
    [2m    9 × locator resolved to 3 elements[22m
    [2m      - unexpected value "3"[22m


       8 |
       9 |   const rows = frame.locator('[data-test-id="admin-events-row"]');
    > 10 |   await expect(rows).toHaveCount(2);
         |                      ^
      11 |
      12 |   await expect(rows.nth(0)).toContainText("Welcome Hike");
      13 |   await expect(rows.nth(1)).toContainText("Wine Mixer");
        at /Users/edf/clubos/tests/admin/admin-events.spec.ts:10:22

    Error Context: test-results/admin-admin-events-Admin-events-table-renders-mock-events/error-context.md

  10) tests/admin/admin-member-detail-page.spec.ts:15:7 › Admin Member Detail Page (API-backed) › Displays member name, email, and status 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoContainText[2m([22m[32mexpected[39m[2m)[22m failed
```

Triage:
- Suspected cause:
- Fix type:
- Owner:
- Priority:

### Failure 10

```
  10) tests/admin/admin-member-detail-page.spec.ts:15:7 › Admin Member Detail Page (API-backed) › Displays member name, email, and status 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoContainText[2m([22m[32mexpected[39m[2m)[22m failed

    Locator: locator('[data-test-id="member-detail-name"]')
    Expected substring: [32m"Alice [7mJohnso[27mn"[39m
    Received string:    [31m"Alice [7mChe[27mn"[39m
    Timeout: 5000ms

    Call log:
    [2m  - Expect "toContainText" with timeout 5000ms[22m
    [2m  - waiting for locator('[data-test-id="member-detail-name"]')[22m
    [2m    9 × locator resolved to <span data-test-id="member-detail-name">Alice Chen</span>[22m
    [2m      - unexpected value "Alice Chen"[22m


      19 |     const name = page.locator('[data-test-id="member-detail-name"]');
      20 |     await expect(name).toBeVisible();
    > 21 |     await expect(name).toContainText("Alice Johnson");
         |                        ^
      22 |
      23 |     const email = page.locator('[data-test-id="member-detail-email"]');
      24 |     await expect(email).toBeVisible();
        at /Users/edf/clubos/tests/admin/admin-member-detail-page.spec.ts:21:24

    Error Context: test-results/admin-admin-member-detail--d741a-ember-name-email-and-status/error-context.md

  11) tests/admin/admin-member-detail-page.spec.ts:32:7 › Admin Member Detail Page (API-backed) › Shows registrations table with at least one row 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoHaveCount[2m([22m[32mexpected[39m[2m)[22m failed
```

Triage:
- Suspected cause:
- Fix type:
- Owner:
- Priority:

### Failure 11

```
  11) tests/admin/admin-member-detail-page.spec.ts:32:7 › Admin Member Detail Page (API-backed) › Shows registrations table with at least one row 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoHaveCount[2m([22m[32mexpected[39m[2m)[22m failed

    Locator:  locator('[data-test-id="member-detail-registration-row"]')
    Expected: [32m1[39m
    Received: [31m2[39m
    Timeout:  5000ms

    Call log:
    [2m  - Expect "toHaveCount" with timeout 5000ms[22m
    [2m  - waiting for locator('[data-test-id="member-detail-registration-row"]')[22m
    [2m    9 × locator resolved to 2 elements[22m
    [2m      - unexpected value "2"[22m


      38 |
      39 |     const rows = page.locator('[data-test-id="member-detail-registration-row"]');
    > 40 |     await expect(rows).toHaveCount(1);
         |                        ^
      41 |
      42 |     await expect(rows.first()).toContainText("Welcome Hike");
      43 |     await expect(rows.first()).toContainText("REGISTERED");
        at /Users/edf/clubos/tests/admin/admin-member-detail-page.spec.ts:40:24

    Error Context: test-results/admin-admin-member-detail--aac57-table-with-at-least-one-row/error-context.md

  12) tests/admin/admin-member-detail-ui.spec.ts:29:7 › Admin Member Detail UI (from search) › Panel shows the expected member name, email, status 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoContainText[2m([22m[32mexpected[39m[2m)[22m failed
```

Triage:
- Suspected cause:
- Fix type:
- Owner:
- Priority:

### Failure 12

```
  12) tests/admin/admin-member-detail-ui.spec.ts:29:7 › Admin Member Detail UI (from search) › Panel shows the expected member name, email, status 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoContainText[2m([22m[32mexpected[39m[2m)[22m failed

    Locator: locator('[data-test-id="admin-member-panel-name"]')
    Expected substring: [32m"Alice [7mJohnso[27mn"[39m
    Received string:    [31m"Alice [7mChe[27mn"[39m
    Timeout: 5000ms

    Call log:
    [2m  - Expect "toContainText" with timeout 5000ms[22m
    [2m  - waiting for locator('[data-test-id="admin-member-panel-name"]')[22m
    [2m    9 × locator resolved to <span data-test-id="admin-member-panel-name">Alice Chen</span>[22m
    [2m      - unexpected value "Alice Chen"[22m


      48 |     // Check member details
      49 |     const memberName = page.locator('[data-test-id="admin-member-panel-name"]');
    > 50 |     await expect(memberName).toContainText("Alice Johnson");
         |                              ^
      51 |
      52 |     const memberEmail = page.locator('[data-test-id="admin-member-panel-email"]');
      53 |     await expect(memberEmail).toContainText("alice@example.com");
        at /Users/edf/clubos/tests/admin/admin-member-detail-ui.spec.ts:50:30

    Error Context: test-results/admin-admin-member-detail--fb083-ed-member-name-email-status/error-context.md

  13) tests/admin/admin-member-detail-ui.spec.ts:59:7 › Admin Member Detail UI (from search) › Panel shows at least one registration row 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoHaveCount[2m([22m[32mexpected[39m[2m)[22m failed
```

Triage:
- Suspected cause:
- Fix type:
- Owner:
- Priority:

### Failure 13

```
  13) tests/admin/admin-member-detail-ui.spec.ts:59:7 › Admin Member Detail UI (from search) › Panel shows at least one registration row 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoHaveCount[2m([22m[32mexpected[39m[2m)[22m failed

    Locator:  locator('[data-test-id="admin-member-panel-registration-row"]')
    Expected: [32m1[39m
    Received: [31m2[39m
    Timeout:  5000ms

    Call log:
    [2m  - Expect "toHaveCount" with timeout 5000ms[22m
    [2m  - waiting for locator('[data-test-id="admin-member-panel-registration-row"]')[22m
    [2m    9 × locator resolved to 2 elements[22m
    [2m      - unexpected value "2"[22m


      82 |     // Check at least one registration row
      83 |     const regRows = page.locator('[data-test-id="admin-member-panel-registration-row"]');
    > 84 |     await expect(regRows).toHaveCount(1);
         |                           ^
      85 |
      86 |     // Verify the registration details
      87 |     await expect(regRows.first()).toContainText("Welcome Hike");
        at /Users/edf/clubos/tests/admin/admin-member-detail-ui.spec.ts:84:27

    Error Context: test-results/admin-admin-member-detail--2cc00--least-one-registration-row/error-context.md

  14) tests/admin/admin-member-detail.spec.ts:6:7 › Admin Member Detail Page › Loads member detail page for m1 with correct info 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed
```

Triage:
- Suspected cause:
- Fix type:
- Owner:
- Priority:

### Failure 14

```
  14) tests/admin/admin-member-detail.spec.ts:6:7 › Admin Member Detail Page › Loads member detail page for m1 with correct info 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

    Locator: locator('[data-test-id="member-detail-name"]')
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
    [2m  - Expect "toBeVisible" with timeout 5000ms[22m
    [2m  - waiting for locator('[data-test-id="member-detail-name"]')[22m


       9 |     // Assert name is displayed
      10 |     const name = page.locator('[data-test-id="member-detail-name"]');
    > 11 |     await expect(name).toBeVisible();
         |                        ^
      12 |     await expect(name).toContainText("Alice Johnson");
      13 |
      14 |     // Assert email is displayed
        at /Users/edf/clubos/tests/admin/admin-member-detail.spec.ts:11:24

    Error Context: test-results/admin-admin-member-detail--543b8-ge-for-m1-with-correct-info/error-context.md

  15) tests/admin/admin-member-detail.spec.ts:25:7 › Admin Member Detail Page › Displays registrations table with at least 1 row 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

    Locator: locator('[data-test-id="member-detail-registrations-table"]')
```

Triage:
- Suspected cause:
- Fix type:
- Owner:
- Priority:

### Failure 15

```
  15) tests/admin/admin-member-detail.spec.ts:25:7 › Admin Member Detail Page › Displays registrations table with at least 1 row 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

    Locator: locator('[data-test-id="member-detail-registrations-table"]')
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
    [2m  - Expect "toBeVisible" with timeout 5000ms[22m
    [2m  - waiting for locator('[data-test-id="member-detail-registrations-table"]')[22m


      28 |     // Assert registrations table exists
      29 |     const table = page.locator('[data-test-id="member-detail-registrations-table"]');
    > 30 |     await expect(table).toBeVisible();
         |                         ^
      31 |
      32 |     // Assert at least 1 registration row
      33 |     const rows = page.locator('[data-test-id="member-detail-registration-row"]');
        at /Users/edf/clubos/tests/admin/admin-member-detail.spec.ts:30:25

    Error Context: test-results/admin-admin-member-detail--67b4d-s-table-with-at-least-1-row/error-context.md

  16) tests/admin/admin-members-explorer.spec.ts:26:7 › Admin Members Explorer › Clicking member name navigates to detail page 

    Error: [2mexpect([22m[31mpage[39m[2m).[22mtoHaveURL[2m([22m[32mexpected[39m[2m)[22m failed

    Expected pattern: [32m/\/admin\/members\/m\d+/[39m
```

Triage:
- Suspected cause:
- Fix type:
- Owner:
- Priority:

### Failure 16

```
  16) tests/admin/admin-members-explorer.spec.ts:26:7 › Admin Members Explorer › Clicking member name navigates to detail page 

    Error: [2mexpect([22m[31mpage[39m[2m).[22mtoHaveURL[2m([22m[32mexpected[39m[2m)[22m failed

    Expected pattern: [32m/\/admin\/members\/m\d+/[39m
    Received string:  [31m"http://localhost:3000/admin/members/70eb3aaa-43b6-431d-bfdb-43e914974477"[39m
    Timeout: 5000ms

    Call log:
    [2m  - Expect "toHaveURL" with timeout 5000ms[22m
    [2m    9 × unexpected value "http://localhost:3000/admin/members/70eb3aaa-43b6-431d-bfdb-43e914974477"[22m


      33 |
      34 |     // Should navigate to member detail page
    > 35 |     await expect(page).toHaveURL(/\/admin\/members\/m\d+/);
         |                        ^
      36 |
      37 |     const detailRoot = page.locator('[data-test-id="admin-member-detail-root"]');
      38 |     await expect(detailRoot).toBeVisible();
        at /Users/edf/clubos/tests/admin/admin-members-explorer.spec.ts:35:24

    Error Context: test-results/admin-admin-members-explor-1c1d7-me-navigates-to-detail-page/error-context.md

  17) tests/admin/admin-registration-detail-page.spec.ts:32:7 › Admin Registration Detail Page › returns 404 for invalid registration id 

    Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

    Expected: [32m404[39m
    Received: [31m200[39m
```

Triage:
- Suspected cause:
- Fix type:
- Owner:
- Priority:

### Failure 17

```
  17) tests/admin/admin-registration-detail-page.spec.ts:32:7 › Admin Registration Detail Page › returns 404 for invalid registration id 

    Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

    Expected: [32m404[39m
    Received: [31m200[39m

      32 |   test("returns 404 for invalid registration id", async ({ page }) => {
      33 |     const response = await page.goto(`${BASE}/admin/registrations/invalid-id`);
    > 34 |     expect(response?.status()).toBe(404);
         |                                ^
      35 |   });
      36 | });
        at /Users/edf/clubos/tests/admin/admin-registration-detail-page.spec.ts:34:32

    Error Context: test-results/admin-admin-registration-d-8d738-for-invalid-registration-id/error-context.md

  18) tests/admin/admin-registrations-explorer.spec.ts:26:7 › Admin Registrations Explorer › clicking member name navigates to detail page 

    Error: [2mexpect([22m[31mpage[39m[2m).[22mtoHaveURL[2m([22m[32mexpected[39m[2m)[22m failed

    Expected pattern: [32m/\/admin\/registrations\/r\d+/[39m
    Received string:  [31m"http://localhost:3000/admin/registrations/25a2dc36-469f-4e66-803d-993e18b9df39"[39m
    Timeout: 5000ms

    Call log:
    [2m  - Expect "toHaveURL" with timeout 5000ms[22m
    [2m    9 × unexpected value "http://localhost:3000/admin/registrations/25a2dc36-469f-4e66-803d-993e18b9df39"[22m


```

Triage:
- Suspected cause:
- Fix type:
- Owner:
- Priority:

### Failure 18

```
  18) tests/admin/admin-registrations-explorer.spec.ts:26:7 › Admin Registrations Explorer › clicking member name navigates to detail page 

    Error: [2mexpect([22m[31mpage[39m[2m).[22mtoHaveURL[2m([22m[32mexpected[39m[2m)[22m failed

    Expected pattern: [32m/\/admin\/registrations\/r\d+/[39m
    Received string:  [31m"http://localhost:3000/admin/registrations/25a2dc36-469f-4e66-803d-993e18b9df39"[39m
    Timeout: 5000ms

    Call log:
    [2m  - Expect "toHaveURL" with timeout 5000ms[22m
    [2m    9 × unexpected value "http://localhost:3000/admin/registrations/25a2dc36-469f-4e66-803d-993e18b9df39"[22m


      32 |     await memberLink.click();
      33 |
    > 34 |     await expect(page).toHaveURL(/\/admin\/registrations\/r\d+/);
         |                        ^
      35 |   });
      36 |
      37 |   test("nav link from main admin page works", async ({ page }) => {
        at /Users/edf/clubos/tests/admin/admin-registrations-explorer.spec.ts:34:24

    Error Context: test-results/admin-admin-registrations--de5c5-me-navigates-to-detail-page/error-context.md

  19) tests/admin/admin-registrations-filter.spec.ts:6:7 › Admin Registrations Filter › filter control is visible and defaults to All statuses 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoHaveCount[2m([22m[32mexpected[39m[2m)[22m failed

    Locator:  locator('[data-test-id="admin-registrations-list-row"]')
    Expected: [32m2[39m
```

Triage:
- Suspected cause:
- Fix type:
- Owner:
- Priority:

### Failure 19

```
  19) tests/admin/admin-registrations-filter.spec.ts:6:7 › Admin Registrations Filter › filter control is visible and defaults to All statuses 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoHaveCount[2m([22m[32mexpected[39m[2m)[22m failed

    Locator:  locator('[data-test-id="admin-registrations-list-row"]')
    Expected: [32m2[39m
    Received: [31m4[39m
    Timeout:  5000ms

    Call log:
    [2m  - Expect "toHaveCount" with timeout 5000ms[22m
    [2m  - waiting for locator('[data-test-id="admin-registrations-list-row"]')[22m
    [2m    2 × locator resolved to 0 elements[22m
    [2m      - unexpected value "0"[22m
    [2m    7 × locator resolved to 4 elements[22m
    [2m      - unexpected value "4"[22m


      15 |     // Mock data has 2 registrations
      16 |     const rows = page.locator('[data-test-id="admin-registrations-list-row"]');
    > 17 |     await expect(rows).toHaveCount(2);
         |                        ^
      18 |   });
      19 |
      20 |   test("Registered only filter shows only REGISTERED rows", async ({ page }) => {
        at /Users/edf/clubos/tests/admin/admin-registrations-filter.spec.ts:17:24

    Error Context: test-results/admin-admin-registrations--611c9-nd-defaults-to-All-statuses/error-context.md

  20) tests/admin/admin-registrations-filter.spec.ts:20:7 › Admin Registrations Filter › Registered only filter shows only REGISTERED rows 
```

Triage:
- Suspected cause:
- Fix type:
- Owner:
- Priority:

### Failure 20

```
  20) tests/admin/admin-registrations-filter.spec.ts:20:7 › Admin Registrations Filter › Registered only filter shows only REGISTERED rows 

    Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThanOrEqual[2m([22m[32mexpected[39m[2m)[22m

    Expected: >= [32m1[39m
    Received:    [31m0[39m

      26 |     const rows = page.locator('[data-test-id="admin-registrations-list-row"]');
      27 |     const count = await rows.count();
    > 28 |     expect(count).toBeGreaterThanOrEqual(1);
         |                   ^
      29 |
      30 |     // Verify all visible rows have REGISTERED status
      31 |     for (let i = 0; i < count; i++) {
        at /Users/edf/clubos/tests/admin/admin-registrations-filter.spec.ts:28:19

    Error Context: test-results/admin-admin-registrations--55068--shows-only-REGISTERED-rows/error-context.md

  21) tests/admin/admin-registrations.spec.ts:5:5 › Admin registrations table renders joined member/event data 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoHaveCount[2m([22m[32mexpected[39m[2m)[22m failed

    Locator:  locator('[data-test-id="admin-registrations-row"]')
    Expected: [32m2[39m
    Received: [31m4[39m
    Timeout:  5000ms

    Call log:
    [2m  - Expect "toHaveCount" with timeout 5000ms[22m
    [2m  - waiting for locator('[data-test-id="admin-registrations-row"]')[22m
```

Triage:
- Suspected cause:
- Fix type:
- Owner:
- Priority:

### Failure 21

```
  21) tests/admin/admin-registrations.spec.ts:5:5 › Admin registrations table renders joined member/event data 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoHaveCount[2m([22m[32mexpected[39m[2m)[22m failed

    Locator:  locator('[data-test-id="admin-registrations-row"]')
    Expected: [32m2[39m
    Received: [31m4[39m
    Timeout:  5000ms

    Call log:
    [2m  - Expect "toHaveCount" with timeout 5000ms[22m
    [2m  - waiting for locator('[data-test-id="admin-registrations-row"]')[22m
    [2m    9 × locator resolved to 4 elements[22m
    [2m      - unexpected value "4"[22m


      11 |
      12 |   const rows = page.locator('[data-test-id="admin-registrations-row"]');
    > 13 |   await expect(rows).toHaveCount(2);
         |                      ^
      14 |
      15 |   // Row 1
      16 |   await expect(rows.nth(0)).toContainText("Alice Johnson");
        at /Users/edf/clubos/tests/admin/admin-registrations.spec.ts:13:22

    Error Context: test-results/admin-admin-registrations--83fb0-rs-joined-member-event-data/error-context.md

  22) tests/admin/admin-search-ui.spec.ts:19:7 › Admin Search UI › Typing a query and searching shows member/event/registration matches 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoContainText[2m([22m[32mexpected[39m[2m)[22m failed
```

Triage:
- Suspected cause:
- Fix type:
- Owner:
- Priority:

### Failure 22

```
  22) tests/admin/admin-search-ui.spec.ts:19:7 › Admin Search UI › Typing a query and searching shows member/event/registration matches 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoContainText[2m([22m[32mexpected[39m[2m)[22m failed

    Locator: locator('[data-test-id="admin-search-member-row"]')
    Expected substring: [32m"Alice [7mJohnson[27m"[39m
    Received string:    [31m"Alice [7mChenalice@example.com[27m"[39m
    Timeout: 5000ms

    Call log:
    [2m  - Expect "toContainText" with timeout 5000ms[22m
    [2m  - waiting for locator('[data-test-id="admin-search-member-row"]')[22m
    [2m    9 × locator resolved to <tr data-test-id="admin-search-member-row">…</tr>[22m
    [2m      - unexpected value "Alice Chenalice@example.com"[22m


      35 |     await expect(membersTable).toBeVisible();
      36 |     const memberRow = page.locator('[data-test-id="admin-search-member-row"]');
    > 37 |     await expect(memberRow).toContainText("Alice Johnson");
         |                             ^
      38 |
      39 |     // Registrations should also match (Alice has a registration)
      40 |     const registrationsTable = page.locator('[data-test-id="admin-search-registrations-table"]');
        at /Users/edf/clubos/tests/admin/admin-search-ui.spec.ts:37:29

    Error Context: test-results/admin-admin-search-ui-Admi-f9165--event-registration-matches/error-context.md

  23) tests/admin/admin-search-ui.spec.ts:62:7 › Admin Search UI › Searching for event title shows event results 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoContainText[2m([22m[32mexpected[39m[2m)[22m failed
```

Triage:
- Suspected cause:
- Fix type:
- Owner:
- Priority:

### Failure 23

```
  23) tests/admin/admin-search-ui.spec.ts:62:7 › Admin Search UI › Searching for event title shows event results 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoContainText[2m([22m[32mexpected[39m[2m)[22m failed

    Locator: locator('[data-test-id="admin-search-event-row"]')
    Expected substring: [32m"Welcome Hike"[39m
    Received string:    [31m"Morning Hike at Rattlesnake CanyonOutdoors"[39m
    Timeout: 5000ms

    Call log:
    [2m  - Expect "toContainText" with timeout 5000ms[22m
    [2m  - waiting for locator('[data-test-id="admin-search-event-row"]')[22m
    [2m    9 × locator resolved to <tr data-test-id="admin-search-event-row">…</tr>[22m
    [2m      - unexpected value "Morning Hike at Rattlesnake CanyonOutdoors"[22m


      78 |     await expect(eventsTable).toBeVisible();
      79 |     const eventRow = page.locator('[data-test-id="admin-search-event-row"]');
    > 80 |     await expect(eventRow).toContainText("Welcome Hike");
         |                            ^
      81 |   });
      82 | });
      83 |
        at /Users/edf/clubos/tests/admin/admin-search-ui.spec.ts:80:28

    Error Context: test-results/admin-admin-search-ui-Admi-53f23-t-title-shows-event-results/error-context.md

  24) tests/admin/admin-system-comms.spec.ts:6:7 › Admin System Communications panel › displays system comms section with health OK 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoContainText[2m([22m[32mexpected[39m[2m)[22m failed
```

Triage:
- Suspected cause:
- Fix type:
- Owner:
- Priority:

### Failure 24

```
  24) tests/admin/admin-system-comms.spec.ts:6:7 › Admin System Communications panel › displays system comms section with health OK 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoContainText[2m([22m[32mexpected[39m[2m)[22m failed

    Locator: locator('[data-test-id="system-comms-health"]')
    Expected substring: [32m"Health[7m: OK[27m"[39m
    Received string:    [31m"Health[7m checkHealth: error[27m"[39m
    Timeout: 10000ms

    Call log:
    [2m  - Expect "toContainText" with timeout 10000ms[22m
    [2m  - waiting for locator('[data-test-id="system-comms-health"]')[22m
    [2m    14 × locator resolved to <div data-test-id="system-comms-health">…</div>[22m
    [2m       - unexpected value "Health checkHealth: error"[22m


      14 |     const healthElement = page.locator('[data-test-id="system-comms-health"]');
      15 |     await expect(healthElement).toBeVisible();
    > 16 |     await expect(healthElement).toContainText("Health: OK", { timeout: 10000 });
         |                                 ^
      17 |   });
      18 |
      19 |   test("email test button triggers successful test", async ({ page }) => {
        at /Users/edf/clubos/tests/admin/admin-system-comms.spec.ts:16:33

    Error Context: test-results/admin-admin-system-comms-A-35a2e-omms-section-with-health-OK/error-context.md

  24 failed
    tests/admin/admin-activity-ui.spec.ts:18:7 › Admin Activity UI › Activity table shows the expected rows 
    tests/admin/admin-activity-ui.spec.ts:36:7 › Admin Activity UI › Status column shows REGISTERED and WAITLISTED 
```

Triage:
- Suspected cause:
- Fix type:
- Owner:
- Priority:
