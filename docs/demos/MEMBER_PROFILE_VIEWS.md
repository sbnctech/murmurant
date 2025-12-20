# Member Profile Views Demo

A 2-minute walkthrough of the member-to-member public profile feature.

## Overview

Members can view read-only profiles of other active members. This feature respects privacy by only showing public-safe fields.

## Quick Demo

### Step 1: Sign In as a Member

1. Go to `/auth/signin`
2. Enter your email and request a magic link
3. Click the link to sign in

### Step 2: View the Member Directory

1. Navigate to `/member/directory`
2. You'll see a list of all active members
3. Use the search box to filter by name
4. Use pagination to browse large lists

### Step 3: View a Member's Profile

1. Click any member in the directory
2. You'll be taken to `/member/directory/:id`
3. See their public profile:
   - Name and avatar
   - Membership status badge
   - Membership tier (if any)
   - Member since year
   - Committee assignments (if any)

### Step 4: View Your Own Public Profile

1. Go to `/my/profile`
2. Click "View how other members see this" link
3. See what your profile looks like to others

## What Members CAN See

| Field | Example |
|-------|---------|
| Name | Alice Smith |
| Member Since | 2023 (year only) |
| Status | Active Member |
| Tier | Standard Member |
| Committees | Events Committee - Chair |

## What Members CANNOT See

- Email address
- Phone number
- Exact join date (only year shown)
- Payment history
- Internal notes
- Audit logs
- Admin-only data

## Security Features

1. **Authentication Required**: All directory/profile endpoints require a valid session
2. **Active Members Only**: Profiles for inactive/lapsed members return 404
3. **Field Redaction**: Only allowlisted fields are returned
4. **No Account Enumeration**: 404 errors don't reveal if a member exists

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/members/directory` | List active members (paginated) |
| GET | `/api/v1/members/:id/public` | View a member's public profile |

## UI Pages

| URL | Description |
|-----|-------------|
| `/member/directory` | Member directory listing |
| `/member/directory/:id` | Individual member profile |
| `/my/profile` | Edit your own profile |

## Testing the Feature

Run the unit tests:
```bash
npm run test:unit -- tests/unit/profile/public-profile.spec.ts
```

Run the API tests (requires running server):
```bash
npx playwright test tests/api/member-public-profile.spec.ts
```

## Charter Compliance

- **P1**: Identity via session cookie
- **P2**: Member-to-member access control
- **P9**: Fail closed on invalid auth
