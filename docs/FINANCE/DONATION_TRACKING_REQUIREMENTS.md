# Donation Tracking Requirements

## For Volunteer-Run Membership Clubs (300-2000 Members)

> **Status**: Draft
> **Author**: Technology Committee
> **Last Updated**: 2024-12-28

---

## Overview

Lightweight donation tracking for volunteer-run membership organizations. Intentionally simpler than enterprise donor management systems.

## ICP: 300-2000 members, volunteer-run, event-based fundraising

---

## 1. Donor Records

**Essential**: Donor reference (link to Member), name, email, address, giving history, lifetime total, notes

**Out of scope**: Wealth screening, engagement scoring, household grouping

---

## 2. Gift Entry

**Essential**: Manual entry, batch entry, fund/campaign attribution, in-kind donations, payment method

**Nice to have**: Online form integration, recurring gifts, spreadsheet import

**Out of scope**: Stock donations, crypto, matching gifts, pledge schedules

---

## 3. Receipts & Acknowledgments

**Essential**: IRS-compliant tax receipts, year-end statements, thank-you template, audit trail

**IRS requirements**: Org name/status, donor info, date/amount, goods/services statement

---

## 4. Reporting

**Essential**: Donation summary, donor list, YoY comparison, fund breakdown, receipt log

**Nice to have**: CSV export, LYBUNT report, basic charts

**Out of scope**: Custom report builder, predictive analytics

---

## 5. Segmentation

**Essential filters**: Date, amount, fund, member/non-member, payment method

**Essential lists**: This year donors, LYBUNT

---

## 6. RBAC

| Role | Access |
|------|--------|
| Treasurer | Full CRUD, export, reports |
| Finance Committee | View, create, reports |
| Event Chair | Own events only |
| Member | Own donations only |

---

## 7. Data Model

```
Donation: donor, amount, date, fund, paymentMethod, event?, inKind?, receipt status
DonationFund: name, description, isActive
DonationReceipt: donation, recipient snapshot, IRS fields, delivery method
```

---

## 8. Success Metrics

- Enter donation: <30 sec
- Year-end statement: <1 min
- Treasurer training: <30 min
- Data always exportable
