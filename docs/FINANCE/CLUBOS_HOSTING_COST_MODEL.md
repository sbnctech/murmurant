# Murmurant Hosting Cost Model

Projected infrastructure costs for running Murmurant in production.

**Status**: Draft - Based on published pricing as of 2024.

---

## Organization Profile (SBNC Baseline)

| Metric | Value | Notes |
|--------|-------|-------|
| Active members | ~300 | Including all statuses |
| Annual payment volume | ~$25,000 | Card transactions |
| Transaction count | ~250-400/year | Memberships + events |
| Email volume | ~500-1000/month | Transactional only |
| File storage | <1 GB | Documents, images |
| Page views | <10,000/month | Low traffic site |

This is a small-to-medium club. Costs scale with these metrics.

---

## Option A: Minimal (Free Tiers)

Suitable for development and early adoption. No monthly costs.

| Service | Tier | Monthly | Annual | Limits |
|---------|------|---------|--------|--------|
| **Neon** | Free | $0 | $0 | 0.5 GB storage, 190 compute hours |
| **Vercel** | Hobby | $0 | $0 | 100 GB bandwidth, no commercial use |
| **Resend** | Free | $0 | $0 | 100 emails/day, 3,000/month |
| **Cloudflare R2** | Free | $0 | $0 | 10 GB storage, 1M requests |
| **Total** | | **$0** | **$0** | |

### Limitations

- **Vercel Hobby**: Terms prohibit commercial use; club may qualify as non-commercial
- **Neon Free**: 190 compute hours/month may be tight with always-on workloads
- **Resend Free**: 100/day limit is fine for SBNC's volume
- **No SLA**: Free tiers have no uptime guarantees

### Risk Assessment

| Risk | Likelihood | Impact |
|------|------------|--------|
| Neon compute exhaustion | Low | Service interruption |
| Vercel terms violation | Medium | Migration required |
| Email throttling | Low | Delayed notifications |

---

## Option B: Production-Ready (Paid Tiers)

Recommended for reliable production operation.

| Service | Tier | Monthly | Annual | Capacity |
|---------|------|---------|--------|----------|
| **Neon** | Launch | $19 | $228 | 10 GB storage, 300 compute hours |
| **Vercel** | Pro | $20 | $240 | Commercial use, team features |
| **Resend** | Pro | $20 | $240 | 50K emails/month |
| **Cloudflare R2** | Pay-as-you | ~$1 | ~$12 | Based on actual usage |
| **Total** | | **~$60** | **~$720** | |

### What You Get

- **Commercial license**: No terms ambiguity
- **Support**: Paid tier support channels
- **Headroom**: 10x capacity above current needs
- **SLA**: Better uptime commitments

### Cost Per Member

At 300 members: ~$720/year / 300 = **$2.40/member/year**

---

## Option C: Scale-Ready

For growth to 1000+ members or higher traffic.

| Service | Tier | Monthly | Annual | Capacity |
|---------|------|---------|--------|----------|
| **Neon** | Scale | $69 | $828 | 50 GB, 750 compute hours, autoscaling |
| **Vercel** | Pro | $20 | $240 | Same as Option B |
| **Resend** | Business | $100 | $1,200 | 100K emails/month |
| **Cloudflare R2** | Pay-as-you | ~$5 | ~$60 | Higher storage |
| **Domain** | | $15 | $180 | If not already owned |
| **Total** | | **~$209** | **~$2,508** | |

---

## Service-by-Service Analysis

### Database: Neon

Neon is a serverless PostgreSQL provider. Pricing is based on storage and compute time.

| Tier | Storage | Compute Hours | Monthly | Best For |
|------|---------|---------------|---------|----------|
| Free | 0.5 GB | 190 | $0 | Development |
| Launch | 10 GB | 300 | $19 | Small production |
| Scale | 50 GB | 750 | $69 | Growing orgs |

**SBNC Fit**: Launch tier ($19/month) is more than sufficient.

- Current data: <100 MB
- Growth projection: <1 GB in 3 years
- Compute: Low-traffic site uses minimal compute

### Hosting: Vercel

Vercel hosts Next.js applications with edge functions and CDN.

| Tier | Bandwidth | Builds | Monthly | Notes |
|------|-----------|--------|---------|-------|
| Hobby | 100 GB | 6,000 min | $0 | Non-commercial only |
| Pro | 1 TB | 24,000 min | $20 | Commercial, team |

**SBNC Fit**: Pro tier ($20/month) for commercial license clarity.

- Bandwidth: <10 GB/month for SBNC
- Builds: Deploys are infrequent
- Main driver: Commercial use terms

### Email: Resend

Resend provides transactional email with good deliverability.

| Tier | Emails/Month | Monthly | Notes |
|------|--------------|---------|-------|
| Free | 3,000 | $0 | 100/day limit |
| Pro | 50,000 | $20 | No daily limit |

**SBNC Fit**: Free tier works for current volume.

- Typical usage: 500-1000 emails/month
- Growth capacity: 3x before upgrade needed

Alternative: Postmark ($15/10K emails) if deliverability issues arise.

### Storage: Cloudflare R2

R2 provides S3-compatible object storage with no egress fees.

| Usage | Storage | Requests | Monthly |
|-------|---------|----------|---------|
| <10 GB | Free | 1M Class A, 10M Class B | $0 |
| 10-100 GB | $0.015/GB | Same | ~$1.50 |

**SBNC Fit**: Free tier covers foreseeable needs.

- Current storage: <100 MB
- File types: PDFs, images, documents

---

## Comparison: WA vs Murmurant Infrastructure

| Component | WA Subscription | Murmurant (Option B) |
|-----------|-----------------|-------------------|
| Database | Included | $19/month (Neon) |
| Hosting | Included | $20/month (Vercel) |
| Email | Limited (external needed) | $0-20/month (Resend) |
| File storage | Limited | $0 (R2) |
| **Monthly Total** | Part of $X/month | ~$60/month |

**Key Insight**: Murmurant hosting is additive cost, but:

1. Eliminates WA external infrastructure (VPS, mail server)
2. Eliminates WA subscription entirely
3. Provides capabilities WA cannot match

---

## Total Cost of Ownership Summary

| Configuration | Annual Cost | Per Member | Notes |
|---------------|-------------|------------|-------|
| Option A (Free) | $0 | $0 | Development only |
| Option B (Production) | ~$720 | $2.40 | Recommended |
| Option C (Scale) | ~$2,508 | $8.36 | Future growth |

---

## Validation Checklist

Before finalizing:

- [ ] Confirm Vercel Hobby terms for 501(c)(7) clubs
- [ ] Test Neon free tier compute usage in staging
- [ ] Validate email volume estimates
- [ ] Check domain/DNS current costs

---

## References

- Neon pricing: https://neon.tech/pricing
- Vercel pricing: https://vercel.com/pricing
- Resend pricing: https://resend.com/pricing
- Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/
