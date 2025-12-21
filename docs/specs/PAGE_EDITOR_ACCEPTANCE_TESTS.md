# Page Editor v1.1 — Acceptance Tests

## Overview

Black-box acceptance tests for the page editor feature. These tests describe expected behavior from a user's perspective without reference to implementation details.

---

## 1. Creating a Page with Blocks

### 1.1 Create empty page

**Given** a webmaster is logged in and navigates to the pages list
**When** they click "Create Page" and enter a title "Welcome" and slug "welcome"
**Then** a new draft page is created with the default hero and text blocks
**And** the page appears in the pages list with status "Draft"

### 1.2 Add a text block to existing page

**Given** a draft page exists with one hero block
**When** the editor clicks "Add Block" and selects "Text"
**Then** a new text block appears below the hero
**And** the block contains placeholder content

### 1.3 Add multiple block types

**Given** a draft page exists
**When** the editor adds blocks of types: Image, Cards, FAQ, Divider
**Then** each block appears in the order added
**And** each block shows its type-specific editing controls

### 1.4 Edit block content

**Given** a page with a text block containing "Hello"
**When** the editor changes the text to "Welcome to our club"
**And** saves the page
**Then** the text block displays "Welcome to our club"
**And** the change persists after page reload

### 1.5 Delete a block

**Given** a page with three blocks: Hero, Text, Image
**When** the editor deletes the Text block
**Then** only Hero and Image blocks remain
**And** the remaining blocks maintain their relative order

### 1.6 Slug uniqueness enforced

**Given** a page exists with slug "about"
**When** creating a new page with slug "about"
**Then** an error message appears: "A page with this slug already exists"
**And** the page is not created

### 1.7 Slug format validation

**Given** a webmaster is creating a new page
**When** they enter slug "About Us!"
**Then** an error message appears indicating only lowercase letters, numbers, and hyphens are allowed
**And** the page is not created until a valid slug is provided

---

## 2. Reordering Blocks

### 2.1 Move block up

**Given** a page with blocks in order: Hero, Text, Image
**When** the editor moves the Image block up
**Then** the order becomes: Hero, Image, Text

### 2.2 Move block down

**Given** a page with blocks in order: Hero, Text, Image
**When** the editor moves the Hero block down
**Then** the order becomes: Text, Hero, Image

### 2.3 Move first block up (no-op)

**Given** a page with blocks in order: Hero, Text, Image
**When** the editor attempts to move Hero up
**Then** the order remains: Hero, Text, Image
**And** no error is shown

### 2.4 Move last block down (no-op)

**Given** a page with blocks in order: Hero, Text, Image
**When** the editor attempts to move Image down
**Then** the order remains: Hero, Text, Image
**And** no error is shown

### 2.5 Reorder persists after save

**Given** a page with blocks reordered from A-B-C to C-A-B
**When** the editor saves the page and reloads
**Then** the block order is C-A-B

### 2.6 Reorder single block page (edge case)

**Given** a page with exactly one block
**When** the editor attempts to reorder
**Then** move up/down controls are disabled or hidden

---

## 3. Visibility Changes

### 3.1 Set page to members only

**Given** a draft page with visibility "Public"
**When** the editor changes visibility to "Members Only"
**And** publishes the page
**Then** unauthenticated users cannot view the page
**And** authenticated members can view the page

### 3.2 Set page to public

**Given** a published page with visibility "Members Only"
**When** the editor changes visibility to "Public"
**Then** anyone can view the page without authentication

### 3.3 Role-restricted visibility

**Given** a page with visibility "Role Restricted" and audience rule "Board Members"
**When** a regular member attempts to view the page
**Then** they see an "Access Restricted" message
**When** a board member views the same page
**Then** they see the page content

### 3.4 Visibility change requires republish

**Given** a published public page
**When** the editor changes visibility to "Members Only" but does not republish
**Then** the live page remains public until republished

### 3.5 Draft pages not visible to public

**Given** a page in draft status with visibility "Public"
**When** an unauthenticated user navigates to the page URL
**Then** they see a "Page Not Found" response

---

## 4. Preview vs Publish

### 4.1 Preview shows current draft state

**Given** a draft page with unpublished changes
**When** the editor opens preview
**Then** they see the draft content including unpublished edits
**And** a banner indicates "Preview Mode - Draft"

### 4.2 Preview shows breadcrumbs when enabled

**Given** a draft page with breadcrumbs enabled (Home > About)
**When** the editor opens preview
**Then** the breadcrumb trail is visible
**And** "Home" links to "/"
**And** "About" is displayed as text (current page)

### 4.3 Preview hides breadcrumbs when disabled

**Given** a draft page with breadcrumbs set to null
**When** the editor opens preview
**Then** no breadcrumb navigation is visible

### 4.4 Publish makes page live

**Given** a draft page with content "Draft content"
**When** the editor publishes the page
**Then** the page status changes to "Published"
**And** public users can view "Draft content" at the page URL

### 4.5 Unpublish removes page from public view

**Given** a published page visible at /welcome
**When** the editor unpublishes the page
**Then** the page status changes to "Draft"
**And** public users see "Page Not Found" at /welcome

### 4.6 Publish preserves breadcrumb data

**Given** a draft page with breadcrumbs [Home, Products, Widget]
**When** the editor publishes the page
**Then** the breadcrumb data is unchanged
**And** the published page displays all three breadcrumb items

### 4.7 Multiple publish cycles don't mutate content

**Given** a page with specific content and breadcrumbs
**When** the editor publishes, unpublishes, and publishes again
**Then** the content and breadcrumbs are identical to the original

### 4.8 Archive removes page from lists

**Given** a published page "Old News"
**When** the editor archives the page
**Then** the page status changes to "Archived"
**And** the page is hidden from the default pages list
**And** public users see "Page Not Found"

---

## 5. Failure Scenarios

### 5.1 Save fails gracefully on network error

**Given** the editor has unsaved changes
**When** save is attempted but network is unavailable
**Then** an error message appears: "Could not save. Please try again."
**And** the unsaved changes are preserved in the editor

### 5.2 Concurrent edit conflict

**Given** two editors have the same page open
**When** editor A saves changes
**And** editor B attempts to save different changes
**Then** editor B sees a conflict warning
**And** is prompted to reload before saving

### 5.3 Unauthorized user cannot edit

**Given** a regular member (not webmaster) attempts to access the page editor
**Then** they receive a 403 Forbidden response
**And** cannot view or modify page content

### 5.4 Unauthorized user cannot publish

**Given** a user without publishing:manage capability
**When** they attempt to publish via API
**Then** they receive a 403 Forbidden response
**And** the page remains in draft status

### 5.5 Delete published page requires admin

**Given** a webmaster attempts to delete a published page
**Then** they receive an error: "Only full administrators can delete published pages"
**When** a president (full admin) attempts the same deletion
**Then** the page is deleted successfully

### 5.6 Invalid block data rejected

**Given** an editor attempts to add a block with missing required fields
**When** the save request is sent
**Then** validation fails with specific field errors
**And** the invalid block is not saved

### 5.7 Malformed slug rejected on update

**Given** a page with slug "valid-slug"
**When** the editor changes the slug to "Invalid Slug!"
**Then** validation fails with message about allowed characters
**And** the original slug is preserved

### 5.8 Preview unavailable for deleted page

**Given** a page that has been deleted
**When** someone navigates to its preview URL
**Then** they see "Page Not Found"

### 5.9 Session timeout during edit

**Given** an editor has a page open for editing
**When** their session expires
**And** they attempt to save
**Then** they are redirected to login
**And** after login, their changes are still in the editor (if possible)
**Or** they see a clear message that changes were lost

### 5.10 Large content handling

**Given** an editor creates a page with 50 blocks
**When** they save and reload the page
**Then** all 50 blocks are preserved correctly
**And** performance remains acceptable (< 3 second load time)

---

## Notes

- All tests assume the test user has appropriate permissions unless otherwise stated
- "Webmaster" refers to a user with the `publishing:manage` capability
- "Full admin" refers to a user with the `admin:full` role (e.g., president)
- These tests are suitable for automation via Playwright E2E tests
