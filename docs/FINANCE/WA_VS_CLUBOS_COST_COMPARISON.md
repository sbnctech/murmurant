# Wild Apricot vs Murmurant Cost Comparison

Initial framework for comparing total cost of ownership between Wild Apricot and Murmurant.

**Status**: Draft - Some values are placeholders pending validation.

---

## Cost Categories

### 1. Wild Apricot Fixed Costs

| Item | Monthly | Annual | Source |
|------|---------|--------|--------|
| WA Subscription (Professional tier) | $TBD | $TBD | WA invoice |
| Domain/SSL (if via WA) | Included | Included | WA pricing |
| **Subtotal Fixed** | $TBD | $TBD | |

Note: WA pricing varies by contact count tier. Verify current tier.

### 2. Wild Apricot Variable Costs (Payment Processing)

| Item | Rate | Estimated Annual | Source |
|------|------|------------------|--------|
| Personify standard card fees | 2.9% + $0.30 | $TBD | Script output |
| Personify AmEx fees (if known) | 3.5% + $0.30 | N/A (not tracked) | |
| **Subtotal Processing** | ~3.2% effective | $TBD | Script output |

Values to be filled from: `npx tsx scripts/finance/wa_personify_payments_analyze.ts`

### 3. Wild Apricot Infrastructure Costs (External)

SBNC maintains additional infrastructure not provided by WA:

| Item | Monthly | Annual | Notes |
|------|---------|--------|-------|
| Hosting.com Launch 4 VPS | $TBD | $TBD | Mail server hosting |
| Mail server maintenance | (labor) | (labor) | Volunteer time, not monetized |
| Backup storage | $TBD | $TBD | If applicable |
| **Subtotal Infrastructure** | $TBD | $TBD | |

These costs exist because WA does not provide:
- Outbound email (SMTP) with custom domain
- File storage beyond WA limits
- Custom application hosting

### 4. Murmurant Cloud Hosting (Projected)

Placeholder for production Murmurant infrastructure:

| Item | Monthly | Annual | Notes |
|------|---------|--------|-------|
| Managed PostgreSQL (Neon/Supabase) | $TBD | $TBD | Serverless DB |
| Vercel hosting (Pro tier) | $TBD | $TBD | Next.js hosting |
| Transactional email (Resend/Postmark) | $TBD | $TBD | Based on volume |
| File storage (S3/R2) | $TBD | $TBD | Based on usage |
| Monitoring/logging | $TBD | $TBD | Optional |
| **Subtotal Hosting** | $TBD | $TBD | |

Detailed analysis: See MURMURANT_HOSTING_COST_MODEL.md (pending)

### 5. Murmurant Payment Processing (Projected)

| Item | Rate | Notes |
|------|------|-------|
| Stripe standard rate | 2.9% + $0.30 | Same as Personify |
| Stripe nonprofit rate (if eligible) | 2.2% + $0.30 | Requires application |

Note: Payment processing percentage is roughly equivalent.
Any cost difference comes from infrastructure, not payment fees.

---

## Summary Comparison

| Category | WA Current | Murmurant Projected | Delta |
|----------|------------|------------------|-------|
| Subscription/hosting | $TBD | $TBD | $TBD |
| Payment processing | $TBD | ~Same | ~$0 |
| Infrastructure | $TBD | Included | -$TBD |
| **Total Annual** | $TBD | $TBD | $TBD |

---

## What Is NOT Captured Financially

Some factors affect total cost but are difficult to quantify:

### Reduced Complexity

- Single system vs WA + VPS + mail server + backups
- Fewer integration points
- Reduced volunteer burden

### Risk Reduction

- Modern backup/restore (vs manual VPS snapshots)
- Audit logging (vs WA's limited history)
- Deterministic logic (vs WA's hidden state)

### Capability Improvements

- Custom workflows (governance, lifecycle)
- Member self-service (beyond WA's widget limits)
- API-first design for future integrations

---

## Validation Checklist

Before presenting these numbers:

- [ ] Verify WA subscription tier and invoice amount
- [ ] Run payment analysis script with full year data
- [ ] Obtain Hosting.com invoice for VPS cost
- [ ] Estimate Murmurant hosting (see MURMURANT_HOSTING_COST_MODEL.md)
- [ ] Confirm Stripe nonprofit eligibility

---

## References

- PERSONIFY_PAYMENTS_COST_MODEL.md - Payment fee analysis
- INFRASTRUCTURE_COST_OFFSETS.md - VPS/mail costs (pending)
- MURMURANT_HOSTING_COST_MODEL.md - Cloud infrastructure (pending)
