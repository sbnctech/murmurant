# Member Profile Experience

User experience documentation for the member profile editing feature at `/my/profile`.

## Overview

The profile page allows members to view and edit their personal information. The experience is designed to feel personal, clear, and trustworthy.

## Features

### Profile Completeness Indicator

A visual progress indicator shows members how complete their profile is:

- **Progress bar**: Fills based on completion percentage (0-100%)
- **Checklist**: Shows individual items with check/circle icons
- **Color coding**: Green when 100% complete, primary color otherwise

**Tracked Fields:**

| Field | Required | Notes |
|-------|----------|-------|
| First name | Yes | Must be 2-100 characters |
| Last name | Yes | Must be 2-100 characters |
| Email | Yes | Read-only, managed by system |
| Phone | No | Optional, admin-only visibility |

### Inline Validation

Fields are validated as users type, with friendly human messages:

- **On blur**: Validation runs when user leaves a field
- **Visual feedback**: Red border on invalid fields
- **Helpful messages**: Clear guidance on what to fix

**Example messages:**

- "Please enter your first name"
- "First name should be at least 2 characters"
- "Please use only numbers, spaces, and dashes" (for phone)

### Save Experience

The save button provides clear feedback at every stage:

| State | Button Text | Color |
|-------|-------------|-------|
| No changes | "No changes to save" | Muted/disabled |
| Has changes | "Save Changes" | Primary (enabled) |
| Saving | "Saving..." with spinner | Muted |
| Success | Shows checkmark toast | Green |
| Error | Shows error message | Red |

**Success toast**: "Your profile was updated" - displays for 4 seconds with a checkmark icon.

### Public Profile Preview

Members can preview how their profile appears to other members:

- Link at bottom of form: "Preview as others see it"
- Opens `/member/directory/:id` in read-only view
- Shows only public-safe fields (no email, phone, etc.)

## UI Components

### Read-Only Fields

Fields that cannot be edited are styled distinctly:

- Gray background
- Muted text color
- Helper text explaining why (e.g., "Contact support to change your email")

### Required Field Indicators

- Required fields marked with red asterisk (*)
- Optional fields show "(optional)" in muted text

### Membership Info Section

Read-only section showing:

- Membership status (e.g., "Active Member")
- Member since year
- Membership tier (if applicable)

## Accessibility

- All form fields have associated labels
- Required fields are programmatically marked
- Error messages are associated with their fields
- Color is not the only indicator of state

## Privacy Notes

The profile page includes privacy guidance:

- Phone: "Your phone number is only visible to club administrators"
- Public preview link helps members understand what others see

## Technical Implementation

### Validation Functions

```typescript
validateFirstName(value: string): FieldValidation
validateLastName(value: string): FieldValidation
validatePhone(value: string): FieldValidation
```

### State Management

- `formData`: Current form values
- `touched`: Which fields have been interacted with
- `validation`: Computed validation state
- `hasChanges`: Whether form differs from saved profile
- `saveState`: idle | saving | success | error

## Related Files

- `/src/app/my/profile/page.tsx` - Profile edit page
- `/src/lib/profile/index.ts` - Profile utilities
- `/src/app/api/v1/me/profile/route.ts` - Profile API
- `/docs/demos/MEMBER_PROFILE_VIEWS.md` - Public profile demo
