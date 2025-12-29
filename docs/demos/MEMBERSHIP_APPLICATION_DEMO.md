# Membership Application Demo Script

**URL:** `/join`
**Purpose:** Demonstrate Murmurant membership application experience
**Duration:** 3-5 minutes

---

## Overview

This demo showcases the membership application flow - a multi-step, friendly experience that feels more modern and welcoming than Wild Apricot's forms.

**Key differentiators from Wild Apricot:**

- Clean, uncluttered design with warm SBNC branding
- Clear tier comparison side-by-side (not buried in dropdown)
- Progress indicator showing where you are
- Interest selection makes members feel valued
- Smooth animations between steps
- Mobile-friendly responsive design

---

## Demo Flow

### Step 1: Tier Selection (30 seconds)

**Talking Points:**

- "Notice how the two membership tiers are presented side-by-side with clear pricing"
- "The 'Most Popular' badge guides new members toward Newbie membership"
- "Features are listed clearly - no hunting through FAQ pages"
- "Click to select, visual feedback confirms your choice"

**Demo Actions:**

1. Click on "Newbie Membership" card - notice the selection animation
2. Hover over "Full Membership" to show hover state
3. Point out the price comparison ($45 vs $60)
4. Click "Continue"

---

### Step 2: Personal Information (45 seconds)

**Talking Points:**

- "Form fields are large and easy to read - especially important for our demographic"
- "Required fields are clearly marked"
- "Helper text explains why we're asking for certain info"
- "Address is optional - we don't force unnecessary information"

**Demo Actions:**

1. Fill in: First Name: "Jane", Last Name: "Smith"
2. Fill in: Email: "jane@example.com"
3. Optionally add phone: "(805) 555-1234"
4. Skip address to show it's optional
5. Click "Continue"

---

### Step 3: About You (45 seconds)

**Talking Points:**

- "This is where Murmurant shines - we're learning about the member"
- "Interest selection helps us match them with activities they'll enjoy"
- "This data can drive personalized event recommendations"
- "Referral tracking helps the club understand what's working"

**Demo Actions:**

1. Select "Friend or Family" from dropdown
2. Click 3-4 interest buttons (Dining Out, Wine Tasting, Hiking & Nature)
3. Point out the toggle behavior
4. Click "Review Application"

---

### Step 4: Review & Submit (30 seconds)

**Talking Points:**

- "Everything is summarized in one place - no surprise fees"
- "Clear price breakdown and what they're getting"
- "Terms agreement is required before submission"
- "Demo notice reminds us this isn't a real submission"

**Demo Actions:**

1. Review the summary
2. Check the terms agreement checkbox
3. Click "Submit Application"
4. Watch the brief loading state (simulates real processing)

---

### Step 5: Success (30 seconds)

**Talking Points:**

- "Celebratory confirmation with personalized greeting"
- "Clear next steps - member knows exactly what to do"
- "For Newbie members, we mention the mentor program"
- "Quick action buttons to keep them engaged"

**Demo Actions:**

1. Point out the success checkmark animation
2. Review the "What happens next" steps
3. Show the CTA buttons
4. Click "Start demo again" to reset

---

## Technical Notes

- **No backend:** This is a frontend-only demo
- **No data persistence:** Form resets on page refresh
- **Theme:** Uses SBNC cherry blossom theme automatically
- **Responsive:** Works on mobile, tablet, and desktop

---

## Comparison Points vs Wild Apricot

| Feature | Wild Apricot | Murmurant Demo |
|---------|-------------|-------------|
| Tier selection | Dropdown menu | Side-by-side cards |
| Progress indicator | None | Visual progress bar |
| Interest capture | Not available | Interactive selection |
| Mobile experience | Clunky | Responsive design |
| Branding | Generic | Custom SBNC theme |
| Animations | None | Smooth transitions |
| Next steps | Plain text | Numbered guide |

---

## FAQ

**Q: Can members actually sign up?**
A: No, this is demo-only. Real signup will require Stripe integration and backend work.

**Q: Where does the data go?**
A: Nowhere. Form state is held in React component state only.

**Q: How do I customize the interests list?**
A: Edit `INTEREST_OPTIONS` array in `/src/app/(public)/join/page.tsx`

**Q: Can I change the membership tiers?**
A: Yes, modify the `TierCard` components in Step 1. For production, tiers should come from the database.

---

## Files

- **Page:** `src/app/(public)/join/page.tsx`
- **Styles:** Uses SBNC theme from `src/styles/themes/sbnc.css`
- **Animations:** Added to `src/app/globals.css`

---

*Demo created December 2024 for Murmurant stakeholder review*
