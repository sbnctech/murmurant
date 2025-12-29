# Net Cost Comparison Summary

Total cost of ownership comparison: Wild Apricot vs Murmurant.

**Status**: Draft - Placeholder values marked as $TBD require validation.

---

## Executive Summary

| Category | Wild Apricot | Murmurant | Delta |
|----------|--------------|--------|-------|
| Platform subscription/hosting | $TBD | ~$720 | TBD |
| Payment processing | ~$800 | ~$800 | ~$0 |
| External infrastructure | $TBD | $0 | -$TBD |
| **Total Annual Cost** | **$TBD** | **~$1,520** | **TBD** |

**Key Insight**: Payment processing fees are roughly equivalent between platforms. The cost comparison is primarily about:

1. WA subscription vs Murmurant hosting
2. WA infrastructure offsets (VPS, mail server) vs Murmurant integrated services

---

## Detailed Breakdown

### Wild Apricot Costs

#### 1. WA Subscription

| Item | Monthly | Annual | Source |
|------|---------|--------|--------|
| Professional tier (est.) | $TBD | $TBD | WA invoice needed |

Note: WA pricing varies by contact count tier. SBNC tier TBD.

#### 2. Payment Processing (Personify)

| Metric | Value | Source |
|--------|-------|--------|
| Annual card transaction volume | ~$25,000 | WA API analysis |
| Transaction count | ~300-400 | WA API analysis |
| Estimated fees (2.9% + $0.30) | ~$800 | Calculated |
| Effective rate | ~3.2% | Calculated |

See: `PERSONIFY_PAYMENTS_COST_MODEL.md` for methodology.

#### 3. External Infrastructure

| Item | Annual | Notes |
|------|--------|-------|
| Hosting.com VPS | $TBD | Mail server hosting |
| DNS (if separate) | $TBD | Domain management |
| Volunteer labor | (not monetized) | ~30-60 hours/year |

See: `INFRASTRUCTURE_COST_OFFSETS.md` for details.

#### WA Total

```
WA Subscription:     $TBD
+ Payment fees:      ~$800
+ Infrastructure:    $TBD
─────────────────────────
= WA Total:          $TBD/year
```

---

### Murmurant Costs

#### 1. Hosting (Production Config)

| Service | Annual | Notes |
|---------|--------|-------|
| Neon (Launch) | $228 | Database |
| Vercel (Pro) | $240 | Hosting |
| Resend (Free/Pro) | $0-240 | Transactional email |
| Cloudflare R2 | ~$12 | File storage |
| **Subtotal** | **~$720** | |

See: `MURMURANT_HOSTING_COST_MODEL.md` for tier options.

#### 2. Payment Processing (Stripe)

| Metric | Value | Notes |
|--------|-------|--------|
| Standard rate | 2.9% + $0.30 | Same as Personify |
| Nonprofit rate (if eligible) | 2.2% + $0.30 | Requires application |
| Estimated fees (standard) | ~$800 | Same transaction volume |

#### 3. External Infrastructure

| Item | Annual | Notes |
|------|--------|-------|
| None required | $0 | Email, storage integrated |

#### Murmurant Total

```
Hosting:             ~$720
+ Payment fees:      ~$800
+ Infrastructure:    $0
─────────────────────────
= Murmurant Total:      ~$1,520/year
```

---

## Cost Delta Analysis

### Payment Processing: Net Zero

Both platforms use standard card processing rates:

| Platform | Standard Rate | Flat Fee |
|----------|---------------|----------|
| WA (Personify) | 2.9% | $0.30 |
| Murmurant (Stripe) | 2.9% | $0.30 |

**Conclusion**: Payment fees are a wash. The comparison hinges on platform and infrastructure costs.

### Potential Stripe Savings

If SBNC qualifies for Stripe nonprofit pricing:

| Scenario | Rate | Annual Fees | Savings vs Personify |
|----------|------|-------------|----------------------|
| Standard | 2.9% + $0.30 | ~$800 | $0 |
| Nonprofit | 2.2% + $0.30 | ~$625 | ~$175 |

Nonprofit rate requires:

- 501(c)(3) status (SBNC is 501(c)(7))
- Application and approval

Social clubs may not qualify. Assume standard rate for conservative estimate.

### Platform Costs: Where Comparison Matters

```
                    WA                      Murmurant
                    ──                      ──────
Subscription:       $TBD                    $0
Hosting:            (included)              $720
Infrastructure:     $TBD                    $0
                    ────                    ────
Platform Total:     $TBD                    $720
```

The comparison depends on:

1. **WA subscription tier**: What does SBNC currently pay?
2. **Infrastructure offset**: What does the VPS actually cost?

---

## Scenario Analysis

### Scenario A: WA Costs Are Low

If WA subscription + infrastructure < $720/year:

- Murmurant costs more purely on dollars
- Value proposition shifts to capabilities, risk reduction, volunteer time

### Scenario B: WA Costs Match Murmurant

If WA subscription + infrastructure ≈ $720/year:

- Financial parity
- Decision based on capabilities and operational factors

### Scenario C: WA Costs Exceed Murmurant

If WA subscription + infrastructure > $720/year:

- Murmurant is cheaper AND more capable
- Clear financial + operational win

---

## What Numbers Are Missing

To complete this comparison:

| Data Point | Source | Action |
|------------|--------|--------|
| WA subscription amount | WA invoice | Request from treasurer |
| WA contact tier | WA admin | Check current tier |
| VPS hosting cost | Hosting.com invoice | Request from VPS admin |
| DNS hosting cost | Registrar invoice | If billed separately |

---

## Non-Financial Factors

These affect total value but are not monetized:

### Volunteer Time Savings

| Task | WA Hours/Year | Murmurant Hours/Year |
|------|---------------|-------------------|
| VPS maintenance | 10-20 | 0 |
| Mail server admin | 5-10 | 0 |
| Integration scripts | 10-20 | 0 |
| Data exports/backups | 5-10 | 0 |
| **Total** | 30-60 | ~0 |

### Risk Reduction

| Risk | WA | Murmurant |
|------|-----|--------|
| Single-point-of-failure (VPS admin) | High | Eliminated |
| Mail deliverability | Volunteer-managed | Managed service |
| Data loss | Manual backups | Automatic snapshots |
| Vendor lock-in | High (proprietary) | Low (standard tech) |

See: `../GOVERNANCE/TECH_LEAD_COGNITIVE_LOAD.md` for detailed risk analysis.

---

## Summary Table

| Factor | WA | Murmurant | Winner |
|--------|-----|--------|--------|
| Payment fees | ~$800 | ~$800 | Tie |
| Platform costs | $TBD | $720 | TBD |
| External infrastructure | $TBD | $0 | Murmurant |
| Volunteer time | 30-60 hrs | ~0 hrs | Murmurant |
| Single-point-of-failure risk | High | Low | Murmurant |
| Capability ceiling | Limited | Extensible | Murmurant |

---

## References

- `PERSONIFY_PAYMENTS_COST_MODEL.md` - Payment fee calculation methodology
- `INFRASTRUCTURE_COST_OFFSETS.md` - VPS and mail server costs
- `MURMURANT_HOSTING_COST_MODEL.md` - Murmurant infrastructure pricing
- `WA_VS_MURMURANT_COST_COMPARISON.md` - Detailed comparison framework
