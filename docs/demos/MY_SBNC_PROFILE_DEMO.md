# My SBNC Profile Demo

**Duration:** 2-3 minutes

This demo showcases the member profile self-service feature, demonstrating personalization and clean UX.

## What You'll Demo

- Member profile view with summary card on My SBNC page
- Profile edit page with form validation
- Secure field allowlist (members can't modify admin fields)
- Real-time save feedback

## Prerequisites

- Application running at `http://localhost:3000`
- A logged-in member session (or use View As to simulate member role)

---

## Demo Script

### Part 1: My SBNC Home Page (30 seconds)

1. Navigate to `/my` (My SBNC page)

2. **Point out the My Profile card** in the left column:
   - Shows member name with avatar initials
   - Displays email address
   - Shows membership status badge
   - "Member since" year
   - "View & Edit Profile" button

3. Say: *"Every member sees their personalized profile summary right on their home page. Let's edit our profile."*

### Part 2: Profile Edit Page (1 minute)

1. Click **"View & Edit Profile"** (or navigate to `/my/profile`)

2. **Point out the profile form:**
   - First Name field (editable, required)
   - Last Name field (editable, required)
   - Email field (read-only, with helper text)
   - Phone field (editable, optional)
   - Membership info section (read-only)
   - Last updated timestamp

3. Say: *"Notice the email field is read-only - members contact support to change their email. This prevents accidental lockouts."*

4. **Edit a field:**
   - Change the first name or phone number
   - Click **Save Changes**
   - Point out the success message

5. Say: *"The profile updates immediately with clear feedback. Let me show you the validation..."*

### Part 3: Validation Demo (30 seconds)

1. **Clear the First Name field** and try to save
   - Point out the browser's required field validation

2. **Try entering a very long phone number** (21+ characters)
   - Submit to show the validation error message

3. Say: *"All inputs are validated on both client and server for security."*

### Part 4: Security Highlight (30 seconds)

1. Say: *"Under the hood, the API uses a field allowlist. Even if someone tries to send unauthorized fields like membershipStatusId, they're filtered out."*

2. **Open browser DevTools** (optional):
   - Show Network tab
   - Point out the PATCH request only contains allowed fields
   - Show the response includes updatedAt for audit trail

3. Say: *"Every profile change is audit-logged for compliance."*

---

## Key Demo Points

| Feature | What to Highlight |
|---------|-------------------|
| **Personalization** | Profile card shows member's real name and status |
| **Self-Service** | Members update their own info without admin help |
| **Security** | Field allowlist prevents privilege escalation |
| **UX** | Clear save states, validation feedback, accessible inputs |
| **Audit Trail** | updatedAt timestamp, server-side logging |

## Technical Details (If Asked)

- **API Endpoints:**
  - `GET /api/v1/me/profile` - Returns member's profile
  - `PATCH /api/v1/me/profile` - Updates allowed fields only

- **Editable Fields:** firstName, lastName, phone

- **Read-Only Fields:** email, joinedAt, membershipStatus

- **Validation:** Zod schema with length limits, required fields

- **Security:** Cookie-based session auth, server-side allowlist filtering

## What's Next

- Avatar upload
- Additional profile fields (interests, emergency contact)
- Email change workflow with verification

---

## Demo Checklist

- [ ] My SBNC page loads with profile card
- [ ] Profile card shows correct name and status
- [ ] Edit profile page loads
- [ ] Form shows editable and read-only fields
- [ ] Save button updates profile
- [ ] Success message appears
- [ ] Validation errors display correctly
- [ ] Last updated timestamp updates after save
