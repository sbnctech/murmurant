# Wild Apricot Migration Intake Checklist

**Purpose**: Identify Wild Apricot gadgets, widgets, and extensions in use so migration scope is explicit and surprises are minimized.

**When to use**:

- Early discovery calls
- Pre-migration intake
- Demo mapping conversations

**How to use**: Walk through each section with the customer. Check off items they use. Note any special configurations.

**Tagging Reference**: For AUTO/MANUAL/UNSUPPORTED classification of each item, see the [Canonical Gadget Matrix](./WILD_APRICOT_GADGET_TAGGING.md#canonical-gadget-matrix).

---

## Step 1: Events and Registration

Check all features the customer uses for events.

**Where to find in WA**: Admin > Events, then click any event to see registration settings.

- [ ] **Event lists on website**
  - Where: Site pages > Page editor > Event list gadget
  - Ask: "How many places do you show event lists?"

- [ ] **Calendar view of events**
  - Where: Site pages > Page editor > Event calendar gadget
  - Ask: "Do you use month view, week view, or both?"

- [ ] **Event detail pages**
  - Where: Automatically generated for each event
  - Ask: "Do you customize event page layouts?"

- [ ] **Registration forms**
  - Where: Events > (Event) > Registration settings
  - Ask: "Do you use custom registration fields?"

- [ ] **Waitlists**
  - Where: Events > (Event) > Registration settings > Enable waitlist
  - Ask: "How do you handle waitlist notifications?"

- [ ] **Paid event registrations**
  - Where: Events > (Event) > Registration types > Price
  - Ask: "What payment processor do you use?"

- [ ] **Guest registrations**
  - Where: Events > (Event) > Registration settings > Guest policy
  - Ask: "Can members bring guests? How many?"

- [ ] **Multi-session events**
  - Where: Events > (Event) > Sessions tab
  - Ask: "Do you have events with multiple sessions?"

---

## Step 2: Members and Directory

Check all member-facing features.

**Where to find in WA**: Admin > Contacts (for member data), Site pages (for public features).

- [ ] **Member directory on website**
  - Where: Site pages > Page editor > Member directory gadget
  - Ask: "Who can see the directory? All members or public?"

- [ ] **Member profile pages**
  - Where: Auto-generated from directory links
  - Ask: "What info shows on profiles?"

- [ ] **Profile edit / self-service**
  - Where: Member logs in > Profile area
  - Ask: "Can members update their own contact info?"

- [ ] **Login/logout widgets**
  - Where: Site pages > Page editor > Login gadget (usually in header)
  - Ask: "Where do you show login links?"

- [ ] **Member-only pages**
  - Where: Site pages > Page settings > Access restrictions
  - Ask: "How many pages are members-only?"

- [ ] **Membership levels**
  - Where: Admin > Settings > Membership levels
  - Ask: "How many membership types do you have?"

---

## Step 3: Payments and Dues

Check all payment and financial features.

**Where to find in WA**: Admin > Finances, Admin > Settings > Payment processor.

- [ ] **Membership dues collection**
  - Where: Membership levels > Renewal settings
  - Ask: "Monthly, annual, or other cycle?"

- [ ] **Donation collection**
  - Where: Site pages > Donation page or widget
  - Ask: "Do you have a donation page? Multiple funds?"

- [ ] **Payment history display**
  - Where: Member logs in > Payments area
  - Ask: "Do members need to see past payments?"

- [ ] **Invoices**
  - Where: Admin > Finances > Invoices
  - Ask: "Do you send invoices? PDF or email?"

- [ ] **Payment processor**
  - Where: Admin > Settings > Payment processor
  - Ask: "Which processor? (WA Payments, Stripe, PayPal, Square)"

- [ ] **Recurring payments**
  - Where: Membership levels > Auto-renewal
  - Ask: "Do you use automatic renewals?"

---

## Step 4: Website and Presentation

Check all content and layout features.

**Where to find in WA**: Site pages > Page editor.

- [ ] **Custom home page layout**
  - Where: Site pages > Home
  - Ask: "Is your home page custom designed?"

- [ ] **Static content pages**
  - Where: Site pages > (Any content page)
  - Ask: "Roughly how many content pages do you have?"

- [ ] **Image galleries**
  - Where: Page editor > Image gallery gadget
  - Ask: "Do you have photo galleries? How many?"

- [ ] **Card layouts / image grids**
  - Where: Page editor > Various layout gadgets
  - Ask: "Do you use card-style layouts?"

- [ ] **Slideshows / carousels**
  - Where: Page editor > Slideshow gadget
  - Ask: "Do you have rotating banners?"

- [ ] **Custom navigation menus**
  - Where: Site pages > Navigation settings
  - Ask: "Is your navigation customized beyond default?"

- [ ] **Custom CSS**
  - Where: Site pages > Settings > Custom CSS
  - Ask: "Do you have custom styling/branding?"

---

## Step 5: Custom Code and Embeds

Check all custom HTML and third-party embeds. These require special handling.

**Where to find in WA**: Page editor > Custom HTML gadget, or embedded in content blocks.

- [ ] **Custom HTML blocks**
  - Where: Page editor > HTML gadget or code view
  - Ask: "Do you have any raw HTML on your pages?"
  - **Action**: Screenshot or export the HTML source

- [ ] **Inline JavaScript**
  - Where: Inside HTML blocks or page source
  - Ask: "Do you have any custom scripts running?"
  - **Action**: Note which pages and what the scripts do

- [ ] **YouTube videos**
  - Where: Page editor > Video embed or iframe
  - Ask: "Do you embed videos? How many pages?"

- [ ] **Google Maps**
  - Where: Page editor > Map embed or iframe
  - Ask: "Do you show maps on event pages?"

- [ ] **Google Calendar embed**
  - Where: Page editor > iframe to Google Calendar
  - Ask: "Do you embed an external calendar?"

- [ ] **Google Forms**
  - Where: Page editor > iframe to Google Forms
  - Ask: "Do you use Google Forms for surveys?"

- [ ] **Google Docs/Sheets embeds**
  - Where: Page editor > iframe to Google Docs
  - Ask: "Do you embed documents on pages?"

- [ ] **Social media widgets**
  - Where: Page editor > Social gadget or custom HTML
  - Ask: "Facebook feed, Twitter/X timeline, Instagram?"

- [ ] **Tracking pixels**
  - Where: Page header/footer or custom HTML
  - Ask: "Google Analytics, Facebook Pixel, other tracking?"
  - **Action**: List which services

- [ ] **Other third-party widgets**
  - Where: Custom HTML blocks
  - Ask: "Any chat widgets, booking tools, or other vendors?"
  - **Action**: Note vendor name and purpose

---

## Step 6: Integrations and Automations

Check all external connections and automated workflows.

**Where to find in WA**: Admin > Settings > Authorized applications, external tool configs.

- [ ] **Zapier connections**
  - Where: Zapier account > Wild Apricot app
  - Ask: "What do your Zaps do?" (e.g., new member triggers)

- [ ] **Make (Integromat) connections**
  - Where: Make account > Scenarios
  - Ask: "What automations run?"

- [ ] **Google Sheets exports**
  - Where: Manual exports or Zapier
  - Ask: "Do you export data to spreadsheets regularly?"

- [ ] **ICS calendar feeds**
  - Where: Events > Subscribe link
  - Ask: "Do people subscribe to your calendar?"

- [ ] **Email integrations**
  - Where: WA email settings or external
  - Ask: "Do you use WA email or external (Mailchimp, Constant Contact)?"

- [ ] **API access**
  - Where: Admin > Settings > Authorized applications > API
  - Ask: "Do you have custom integrations using the WA API?"

---

## Step 7: Verify and Document

Before finishing, confirm scope is complete.

- [ ] **Walk through the site together**
  - Ask: "Let me click through your site. Stop me if I miss anything."

- [ ] **Check admin screens**
  - Ask: "Are there admin features you use that we haven't covered?"

- [ ] **Confirm migration expectations**
  - Ask: "Which features are must-haves for day one? Which can wait?"

---

## Discovery Output Template

Copy this block and fill it out for each customer. This becomes the migration scope document.

```markdown
# Migration Discovery: [Customer Name]

**Discovery Date**: YYYY-MM-DD
**Operator**: [Your name]
**Customer Contact**: [Name, email]

## Site Information

- **WA Site URL**: https://[org].wildapricot.org
- **Organization Name**:
- **Member Count (approx)**:
- **Event Volume**: [events per month]

## Features In Use

### AUTO-Migrate (script handles)

- [ ] Event lists and calendar
- [ ] Event registration and waitlists
- [ ] Paid registrations via: [processor name]
- [ ] Member directory
- [ ] Member profiles and self-service
- [ ] Login/logout
- [ ] Membership dues collection
- [ ] Donation collection
- [ ] ICS calendar feeds

### MANUAL-Rebuild (operator recreates)

- [ ] Content pages (count: ___)
- [ ] Image galleries (count: ___)
- [ ] Custom layouts/cards
- [ ] Navigation structure
- [ ] Custom CSS/branding
- [ ] YouTube embeds (count: ___)
- [ ] Google Maps embeds
- [ ] Email templates
- [ ] Zapier/Make workflows (list: ___)

### UNSUPPORTED (excluded from scope)

- [ ] Custom HTML blocks (count: ___)
- [ ] Inline JavaScript
- [ ] Tracking pixels (list: ___)
- [ ] Third-party widgets (list: ___)
- [ ] External payment embeds

## Special Notes

[Any unusual configurations, must-have requirements, or concerns]

## Next Steps

- [ ] Share discovery summary with customer
- [ ] Create migration manifest
- [ ] Schedule dry-run
```

---

## Related Documents

- [Canonical Gadget Matrix](./WILD_APRICOT_GADGET_TAGGING.md) - single source of truth for migration tags
- [ClubOS Page Builder Primitives](../ARCH/CLUBOS_PAGE_BUILDER_PRIMITIVES.md) - ClubOS equivalents and migration behavior
- [Presentation Discovery Stage](./PRESENTATION_DISCOVERY_STAGE.md) - automated site crawling
- [Widgets vs Gadgets](./WILD_APRICOT_WIDGETS_VS_GADGETS.md) - terminology guide
