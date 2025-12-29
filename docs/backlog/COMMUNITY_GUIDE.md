# Community Resource Guide ("clubguide")

**Status**: Backlog
**Priority**: P3
**Epic**: Content & Engagement
**Created**: 2024-12-28

## Summary

Member-contributed, editorially-reviewed guide to local resources for newcomers. Configurable as public or members-only. Exportable as branded PDF for potential B2B sales (realtors, relocation services, employers).

## Value Proposition

| Audience | Value |
|----------|-------|
| Members | Contribute knowledge, access curated local info |
| Prospective members | Public guide attracts newcomers to the club |
| Realtors | Branded PDF as gift for new homebuyers |
| Employers | Relocation package insert |
| Club | Revenue stream, community visibility |

## Content Categories (configurable)

- Cultural (museums, theaters, music)
- Recreation (hiking, beaches, sports, fitness)
- Charitable (volunteer opportunities)
- Educational (adult ed, libraries, lectures)
- Healthcare (doctors, urgent care, specialists)
- Services (contractors, mechanics, cleaners)
- Dining & Social (member favorites)
- Government & Civic (DMV, utilities, voting)
- Faith Communities
- Newcomer Tips (parking, traffic, local customs)

## Key Features

### Phase 1 (MVP)

- [ ] Resource listings with categories
- [ ] Member submission form
- [ ] Admin review/approval workflow
- [ ] Public/members-only toggle (admin configurable per category or whole guide)
- [ ] Basic search and browse
- [ ] PDF export (simple)

### Phase 2

- [ ] Review cycle (listings expire after N months, trigger re-verification)
- [ ] Member comments/tips on listings
- [ ] Activity group linking (hiking resources → Hiking group)
- [ ] Branded PDF templates (club logo, sponsor logos)
- [ ] PDF customization (select categories, add cover letter)

### Phase 3

- [ ] Ratings (member favorites)
- [ ] "Verified by SBNC" badge program
- [ ] Sponsor/advertiser listings (paid placement)
- [ ] White-label PDF generation for B2B sales
- [ ] Print-on-demand integration (optional)

## Data Model

```prisma
enum ResourceStatus {
  DRAFT
  PENDING_REVIEW
  PUBLISHED
  NEEDS_UPDATE
  ARCHIVED
}

enum ResourceVisibility {
  PUBLIC
  MEMBERS_ONLY
  HIDDEN
}

model ResourceCategory {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @unique
  slug        String   @unique
  description String?
  icon        String?  // Icon name or emoji
  visibility  ResourceVisibility @default(PUBLIC)
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)

  resources   ResourceListing[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ResourceListing {
  id              String   @id @default(uuid()) @db.Uuid

  // Content
  title           String
  description     String   @db.Text
  categoryId      String   @db.Uuid

  // Contact info
  website         String?
  phone           String?
  email           String?
  address         String?
  addressLine2    String?
  city            String?
  state           String?
  zip             String?

  // Location (for mapping)
  latitude        Decimal? @db.Decimal(10, 8)
  longitude       Decimal? @db.Decimal(11, 8)

  // Visibility & status
  status          ResourceStatus @default(DRAFT)
  visibility      ResourceVisibility @default(PUBLIC)

  // Editorial workflow
  submittedById   String?  @db.Uuid
  submittedAt     DateTime @default(now())
  reviewedById    String?  @db.Uuid
  reviewedAt      DateTime?
  reviewNotes     String?  // Internal notes from reviewer

  // Review cycle
  lastVerifiedAt  DateTime?
  nextReviewDue   DateTime?

  // Member engagement (Phase 2)
  memberTip       String?  @db.Text  // "Pro tip: Ask for Dr. Smith"

  // Metadata
  tags            String[] // Flexible tagging beyond category

  // Audit
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  category        ResourceCategory @relation(fields: [categoryId], references: [id])
  submittedBy     Member?  @relation("ResourceSubmitter", fields: [submittedById], references: [id])
  reviewedBy      Member?  @relation("ResourceReviewer", fields: [reviewedById], references: [id])
  comments        ResourceComment[]
}

model ResourceComment {
  id          String   @id @default(uuid()) @db.Uuid
  resourceId  String   @db.Uuid
  authorId    String   @db.Uuid
  content     String   @db.Text
  isPublished Boolean  @default(true)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  resource    ResourceListing @relation(fields: [resourceId], references: [id], onDelete: Cascade)
  author      Member   @relation(fields: [authorId], references: [id])
}
```

## RBAC

| Role | Permissions |
|------|-------------|
| Member | Submit listings, add comments, view published |
| Activity Chair | Edit listings in their category (if linked) |
| Guide Editor | Review submissions, edit all, manage categories |
| Admin | Full access, visibility settings, PDF config |
| Public | View public listings only |

## PDF Generation

### Requirements

- Branded cover page (club logo, optional sponsor logo)
- Table of contents by category
- Clean, printable layout
- Optional: QR codes linking to online version
- Optional: "Last updated" timestamp
- Optional: Custom intro letter (for realtor personalization)

### B2B Package Options

| Package | Contents | Suggested Price |
|---------|----------|-----------------|
| Digital PDF | Standard guide, club branding | Free / $10 |
| Co-branded PDF | Realtor logo on cover, custom intro | $25-50 |
| Bulk print | 25-100 printed copies | $5-10/copy |
| Sponsor listing | Business featured in guide | $100-500/year |

## Admin Settings

```yaml
guide:
  defaultVisibility: PUBLIC | MEMBERS_ONLY
  allowPublicSubmissions: false
  reviewRequired: true
  reviewCycleDays: 365
  enableComments: true
  enableRatings: false
  pdfEnabled: true
  pdfBrandingLogo: /uploads/club-logo.png
  pdfSponsorLogos: []
  categoriesPublic: [cultural, recreation, healthcare]
  categoriesMembersOnly: [services, member-favorites]
```

## Dependencies

- Member model (existing)
- RBAC system (existing)
- File upload (for logos) - existing?
- PDF generation library (new - Puppeteer, PDFKit, or React-PDF)

## Open Questions

1. Should realtors/sponsors get a login to download PDFs, or is it manual fulfillment?
2. Integration with Wild Apricot content during migration?
3. Mobile app consideration for "guide on the go"?
4. Map view of resources?

## Revenue Model Considerations

- Free public guide drives membership awareness
- Members-only "insider tips" section adds membership value
- PDF sales to realtors: $25-50 each, potentially 50-100/year = $1,250-5,000
- Sponsor listings: 10 sponsors at $200/year = $2,000
- **Potential annual revenue: $3,000-7,000**

## References

- Similar: LocalWiki, Nextdoor, Chamber directories
- PDF generation: [React-PDF](https://react-pdf.org/), [Puppeteer](https://pptr.dev/)
