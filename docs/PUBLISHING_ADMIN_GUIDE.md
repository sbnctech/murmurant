# Publishing and Communications Admin Guide

Copyright (c) Santa Barbara Newcomers Club

This guide covers administrative tasks for the ClubOS publishing and communications system. It is intended for site administrators, content editors, and communications staff.

---

## Overview

The ClubOS publishing system enables you to:

- Create and manage web pages without writing code
- Build pages using configurable content blocks
- Control who can see what content based on roles and groups
- Send emails using templates with personalized merge fields
- Manage mailing lists for targeted communications

---

## Page Management

### Creating a New Page

1. Navigate to Admin > Pages
2. Click "New Page"
3. Enter the page details:
   - **Path**: The URL path (e.g., "/about", "/groups/hiking")
   - **Title**: Page title shown in browser tab and search results
   - **Description**: Brief description for SEO
   - **Template**: Choose a page template (determines available regions)
   - **Visibility**: Who can view this page (see Visibility section below)
4. Click "Create"
5. Add content blocks to the page
6. Preview and publish when ready

### Page Statuses

- **Draft**: Work in progress, not visible to public
- **Published**: Live and visible according to visibility rules
- **Archived**: Hidden from public, preserved for reference

### Editing Pages

1. Navigate to Admin > Pages
2. Click on the page title to edit
3. Modify page settings or blocks
4. Click "Save Draft" to save changes without publishing
5. Click "Publish" to make changes live

### Version History

Every time you publish a page, a version snapshot is saved.

- View version history: Admin > Pages > [Page] > Versions
- Restore a previous version: Click "Restore" next to any version
- Restoring creates a new version with the old content

---

## Content Blocks

Blocks are the building units of pages. Each block type serves a specific purpose.

### Available Block Types

**hero**: Full-width header section

- Title and subtitle text
- Background image
- Optional call-to-action button

**text**: Rich text content

- Formatted text with headings, lists, links
- Supports basic HTML formatting

**image**: Single image display

- Image file selection
- Caption and alt text for accessibility

**event-list**: Dynamic event listing

- Shows upcoming events from the calendar
- Filter by category
- Configure number of events shown

**registration-cta**: Event registration call-to-action

- Link to event registration
- Customizable button text

**callout**: Highlighted message box

- Icon selection
- Style variants (info, warning, success)
- Title and body text

**gallery**: Image grid

- Multiple images in a grid layout
- Lightbox viewing

**nav-links**: Custom navigation

- List of links for section navigation
- Useful for sidebars

**member-spotlight**: Featured member profile

- Member photo and bio
- Used for highlighting volunteers, board members

**contact-form**: Simple contact form

- Sends submissions to configured email
- Customizable fields

### Adding Blocks

1. Open a page for editing
2. Select the region (header, main, sidebar, footer)
3. Click "Add Block"
4. Choose block type
5. Configure block settings
6. Set block visibility if different from page
7. Save

### Reordering Blocks

1. Drag blocks to reorder within a region
2. Save the page to preserve order

### Block Visibility

Blocks can have their own visibility settings:

- **Inherit**: Uses the page's visibility setting
- **Public**: Visible to everyone
- **Members Only**: Visible only to logged-in members
- **Role Restricted**: Visible only to specific roles
- **Group Targeted**: Visible only to specific group members

This allows you to show different content to different audiences on the same page.

---

## Templates and Themes

### Page Templates

Templates define the structure of a page with regions and constraints.

**Default template regions:**

- Header: Hero or navigation (max 1 block)
- Main: Primary content area (unlimited blocks)
- Sidebar: Supporting content (max 3 blocks)
- Footer: Bottom content (max 2 blocks)

Each region specifies which block types are allowed.

### Themes

Themes control the visual appearance:

- Colors (primary, secondary, background, text)
- Typography (fonts, sizes, line height)
- Spacing (margins, padding)
- Border radius and shadows

Themes apply site-wide. Changing the theme updates all pages automatically.

---

## Visibility and Access Control

### Page Visibility Options

**Public**: Anyone can view, including guests not logged in.

**Members Only**: Requires login with an active membership.

**Role Restricted**: Visible only to users with specific roles. Configure which roles can view.

**Group Targeted**: Visible only to members of specific groups (e.g., Hiking group members only).

### Visibility Rules

For complex requirements, create custom visibility rules:

- **Role-based**: Allow specific roles (Board Member, Site Admin, etc.)
- **Group-based**: Allow specific group members
- **Membership level**: Allow specific membership levels (Newcomer, Extended)
- **Compound**: Combine rules with AND/OR logic

Example: "Board members OR Hiking group leaders" can view this page.

---

## Email Templates

### Creating Email Templates

1. Navigate to Admin > Email > Templates
2. Click "New Template"
3. Enter template details:
   - **Name**: Internal name for reference
   - **Slug**: Unique identifier (e.g., "event-reminder")
   - **Type**: Transactional or Campaign
   - **Subject**: Email subject line (supports merge fields)
   - **Body**: HTML and plain text versions

### Merge Fields

Use merge fields to personalize emails. Format: `{{fieldName}}`

**Member fields:**

- `{{member.firstName}}` - First name
- `{{member.lastName}}` - Last name
- `{{member.fullName}}` - Full name
- `{{member.email}}` - Email address
- `{{member.membershipLevel}}` - Membership level

**Event fields:**

- `{{event.title}}` - Event title
- `{{event.startDate}}` - Start date
- `{{event.startTime}}` - Start time
- `{{event.location}}` - Location
- `{{event.description}}` - Description

**Registration fields:**

- `{{registration.status}}` - Registration status
- `{{registration.confirmationNumber}}` - Confirmation number

**System fields:**

- `{{club.name}}` - Club name
- `{{club.website}}` - Club website URL
- `{{unsubscribeLink}}` - Unsubscribe link (required)
- `{{preferencesLink}}` - Email preferences link

### Template Types

**Transactional**: Triggered by system events

- Registration confirmation
- Password reset
- Waitlist promotion

These are always sent regardless of unsubscribe status.

**Campaign**: Manually sent broadcasts

- Newsletters
- Announcements
- Event promotions

These respect unsubscribe preferences.

### Previewing Templates

1. Open a template for editing
2. Click "Preview"
3. Select sample data (member, event) to populate merge fields
4. Review rendered email
5. Send test email to yourself

---

## Mailing Lists

### List Types

**Static Lists**: Manually managed membership

- Add/remove members individually
- Import from CSV
- Use for special groups not captured by other criteria

**Dynamic Lists**: Membership based on rules

- Automatically includes matching members
- Updates when member data changes
- Use for role-based or membership-based targeting

### Creating Mailing Lists

1. Navigate to Admin > Mailing Lists
2. Click "New List"
3. Enter list details:
   - **Name**: Display name
   - **Type**: Static or Dynamic
   - **Owner Roles**: Who can send to this list
   - **Allow Subscribe/Unsubscribe**: Self-service options

For dynamic lists, configure the audience segment rules.

### Audience Segments

Define who belongs to a dynamic list:

**By membership status:**

- All active members
- New members (joined in last 90 days)
- Lapsed members

**By role:**

- Board members
- Committee chairs
- Category chairs

**By group:**

- Hiking group members
- Book club members
- Multiple groups (OR)

**By event:**

- Registered for specific event
- Waitlisted for specific event

### Sending to Lists

1. Navigate to Admin > Email > Send
2. Select template
3. Select mailing list
4. Preview recipient count
5. Send or schedule

### Unsubscribe Handling

Members can unsubscribe in two ways:

- **List-specific**: Stop receiving from one list
- **Global**: Stop receiving all non-transactional email

Unsubscribe links must be included in all campaign emails.

View unsubscribe reports: Admin > Email > Unsubscribes

---

## Roles and Permissions

### Available Roles

**Site Admin**: Full access to all features

**Content Editor**: Can create and edit pages, blocks, and media

**Communications Admin**: Can manage email templates and send to all lists

**Events Admin**: Can create and manage all events

**Members Admin**: Can view and edit member records

**Category Chair**: Can manage events in assigned categories

**Group Leader**: Can manage assigned groups and group pages

**Read Only Auditor**: Can view admin data but not modify

### Assigning Roles

1. Navigate to Admin > Members > [Member]
2. Click "Manage Roles"
3. Select roles to grant
4. Click "Save"

Role changes are logged in the audit trail.

### Group-Based Permissions

Group leaders automatically have permissions on:

- Pages assigned to their group
- Mailing lists for their group
- Events in their group's category

---

## Best Practices

### Page Organization

- Use consistent paths (e.g., "/groups/[name]" for all group pages)
- Keep page titles concise and descriptive
- Write meaningful descriptions for SEO

### Content Blocks

- Use hero blocks sparingly (typically one per page)
- Break long content into multiple text blocks
- Add alt text to all images for accessibility

### Email Templates

- Keep subject lines under 50 characters
- Always include unsubscribe link
- Test emails before sending to large lists
- Use plain text fallback for all emails

### Mailing Lists

- Prefer dynamic lists for ongoing audiences
- Use static lists only for one-time or special groups
- Review list membership before major sends
- Monitor bounce rates and remove invalid addresses

### Permissions

- Follow principle of least privilege
- Grant specific roles rather than Site Admin where possible
- Review role assignments periodically
- Use group-based permissions for distributed management

---

## Troubleshooting

### Page Not Visible

1. Check page status (must be Published)
2. Check page visibility settings
3. Verify viewer has required role/group membership
4. Check visibility rule configuration

### Email Not Received

1. Check spam folder
2. Verify email address is correct
3. Check if recipient has unsubscribed
4. Review email logs for delivery status

### Permission Denied

1. Verify user has required role
2. Check if role was recently revoked
3. Review permission audit log for changes
4. Contact Site Admin for assistance

---

## Getting Help

For technical issues or feature requests, contact:

- Site Administrator for permission changes
- Communications Admin for email template help
- Development team for system issues

Review the audit logs (Admin > Audit) to track changes and troubleshoot issues.
