<!--
  Copyright © 2025 Murmurant, Inc. All rights reserved.
-->


# Donation Tracking Feature

**Status**: Backlog
**Priority**: P2
**Epic**: Finance
**Created**: 2025-12-28

## Summary

Add lightweight donation tracking for volunteer-run clubs (300-2000 members). Scope is intentionally limited compared to enterprise donor management—focused on what volunteer treasurers actually need.

## Requirements Doc

See [docs/FINANCE/DONATION_TRACKING_REQUIREMENTS.md](../FINANCE/DONATION_TRACKING_REQUIREMENTS.md)

## Key Deliverables

### Phase 1 (MVP)

- [ ] Prisma schema: Donation, DonationFund, DonationReceipt models
- [ ] API: CRUD for donations
- [ ] API: Generate tax receipt
- [ ] UI: Donation entry form
- [ ] UI: Donation list with filters
- [ ] Report: Donation summary by date range
- [ ] Export: CSV download

### Phase 2

- [ ] Year-end statements (PDF generation)
- [ ] LYBUNT report (gave last year, not this year)
- [ ] Thank-you email templates
- [ ] Batch import from CSV

### Phase 3

- [ ] Fund/campaign management UI
- [ ] Dashboard widget
- [ ] QuickBooks export format
- [ ] Recurring gift tracking

## RBAC

| Role | Access |
|------|--------|
| Treasurer | Full CRUD, export, reports |
| Finance Committee | View, create, reports |
| Event Chair | View/create for own events |
| Admin | Full access |
| Member | View own donations only |

## Dependencies

- Member model (existing)
- Event model (existing)
- RBAC system (existing)
- PDF generation (new or existing?)

## Open Questions

1. Do we need online donation form integration, or is manual entry sufficient?
2. Should donations sync from Wild Apricot during migration?
3. PDF receipt template—use existing PDF tooling or new?

## References

- [DONATION_TRACKING_REQUIREMENTS.md](../FINANCE/DONATION_TRACKING_REQUIREMENTS.md)
- [FINANCE_RBAC_AND_DELEGATION.md](../FINANCE/FINANCE_RBAC_AND_DELEGATION.md)
