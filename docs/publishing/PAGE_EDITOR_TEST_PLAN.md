# Page Editor Test Plan

Testing strategy for the ClubOS page editor.

## Test Layers

### Unit Tests (fast, deterministic)

Location: `tests/unit/publishing/`

Run with: `npm run test:unit -- tests/unit/publishing/`

**What we test:**

1. **Block validation** (`block-validation.spec.ts`)
   - Valid block structures accepted
   - Invalid blocks rejected with clear errors
   - Required fields enforced per block type
   - Schema version validation

2. **URL sanitization** (`url-sanitize.spec.ts`)
   - Safe URLs pass validation
   - javascript: URLs rejected
   - data: URLs handled correctly
   - Relative paths allowed
   - Mailto links allowed

3. **Reorder algorithm** (`block-reorder.spec.ts`)
   - Reorder produces correct order values
   - Edge cases: first to last, last to first
   - No duplicate orders after reorder
   - Empty/single block lists handled

4. **Block content helpers** (`block-helpers.spec.ts`)
   - createEmptyBlock produces valid defaults
   - Block type metadata accurate

### API Tests (integration)

Location: `tests/api/`

Run with: `npm run test-api:stable -- tests/api/page-editor.spec.ts`

**What we test:**

1. **RBAC enforcement**
   - Cannot access without auth (401)
   - Cannot access without publishing:manage (403)
   - Cannot delete published page without admin:full (403)
   - Webmaster CAN edit and publish (200)

2. **Block CRUD operations**
   - Add block: creates with correct order
   - Update block: modifies content only
   - Delete block: removes and reorders remaining
   - Reorder blocks: atomic update

3. **Validation**
   - Invalid block type rejected
   - Missing required fields rejected
   - Invalid URLs rejected
   - Size limits enforced

4. **Audit logging**
   - Each mutation creates audit entry
   - Audit contains correct action type
   - Audit contains block/page IDs
   - Before/after state captured

5. **Error handling**
   - 404 for non-existent page
   - 404 for non-existent block
   - 400 for invalid JSON
   - 409 for version conflict (if implemented)

### E2E Tests (Playwright)

Location: `tests/admin/`

Run with: `npm run test-admin -- tests/admin/page-editor.spec.ts`

**Golden Path Scenarios:**

1. **Create and edit page**
   - Navigate to page list
   - Click create new page
   - Enter title and slug
   - Add text block
   - Edit block content
   - Verify content persists after reload

2. **Reorder blocks**
   - Open page with multiple blocks
   - Drag block to new position
   - Verify order persists after reload

3. **Publish workflow**
   - Create draft page
   - Add content
   - Click publish
   - Verify status changes
   - Verify audit log entry

4. **Permission boundaries**
   - Attempt publish without capability (blocked)
   - Webmaster can edit but not delete published

## Anti-Flake Guidelines

### Selectors

Use `data-testid` attributes exclusively:

```tsx
<button data-testid="add-block-button">Add Block</button>
<div data-testid="block-list">...</div>
<div data-testid={`block-${block.id}`}>...</div>
```

Never rely on:
- CSS classes (styling may change)
- Text content (i18n, typo fixes)
- DOM structure (refactors)
- Element indices (dynamic lists)

### Waiting

Use Playwright expect polling, not sleeps:

```typescript
// Good
await expect(page.getByTestId('save-status')).toHaveText('Saved');

// Bad
await page.waitForTimeout(1000);
```

For network requests, wait for response:

```typescript
await Promise.all([
  page.waitForResponse(resp => resp.url().includes('/blocks') && resp.status() === 200),
  page.getByTestId('add-block-button').click()
]);
```

### Test Isolation

Each test must:
- Create its own test data (unique page per test)
- Clean up after itself (delete created pages)
- Not depend on other tests running first
- Use unique slugs with test ID suffix

```typescript
const testSlug = `test-page-${Date.now()}`;
```

### Auth Tokens

Use existing test auth patterns:

```typescript
// API tests
const response = await request.get('/api/admin/content/pages', {
  headers: { Authorization: 'Bearer test-webmaster-token' }
});

// E2E tests - use existing admin login flow
await adminLogin(page, 'webmaster');
```

### Drag and Drop

For DnD tests, use @dnd-kit's keyboard API:

```typescript
// More reliable than mouse simulation
const block = page.getByTestId('block-0');
await block.focus();
await page.keyboard.press('Space'); // Start drag
await page.keyboard.press('ArrowDown');
await page.keyboard.press('Space'); // Drop
```

## Test Data

### Fixtures

Minimal fixtures for testing:

```typescript
const testPage = {
  title: 'Test Page',
  slug: 'test-page-unique-id',
  content: {
    schemaVersion: 1,
    blocks: [
      { id: 'block-1', type: 'text', order: 0, data: { content: '<p>Test</p>' } }
    ]
  }
};
```

### Seeding

For API tests, use Prisma directly in setup:

```typescript
beforeAll(async () => {
  testPage = await prisma.page.create({ data: testPageFixture });
});

afterAll(async () => {
  await prisma.page.deleteMany({ where: { slug: { startsWith: 'test-' } } });
});
```

## Coverage Expectations

### Unit Tests

- Block validation: 100% of block types
- URL sanitization: All edge cases
- Reorder algorithm: All permutations

### API Tests

- Every endpoint covered
- Every error code tested
- Every RBAC boundary tested

### E2E Tests

- Happy path for each major workflow
- One permission boundary test
- Minimal to reduce flakiness

## Running Tests Locally

```bash
# All unit tests
npm run test:unit

# Publishing unit tests only
npm run test:unit -- tests/unit/publishing/

# API tests (requires running server)
npm run test-api:stable -- tests/api/page-editor.spec.ts

# E2E tests (requires running server)
npm run test-admin -- tests/admin/page-editor.spec.ts

# Watch mode for development
npm run test:unit -- --watch tests/unit/publishing/
```

## CI Integration

Tests run in GitHub Actions:

- Unit tests: Always run, fast
- API tests: Run when src/** changes
- E2E tests: Run when admin/** or api/** changes

Failure blocks merge.

## Known Limitations

1. **DnD E2E tests** may be flaky across browsers - prefer keyboard interaction
2. **Rich text editing** is tested minimally (complex DOM interactions)
3. **File uploads** not tested in E2E (mock in API tests)
