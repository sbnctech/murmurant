# Rollback Procedure for Netlify (main branch)

## Where This Lives / When to Use It

This document lives in `docs/reliability/` and describes how to roll back the production site when a deploy from `main` causes issues. Use this procedure when:

- A deploy introduces a critical bug affecting user-facing functionality
- The site is down or returning errors after a deploy
- Performance has degraded significantly post-deploy
- You need to restore service quickly while investigating the root cause

**Important:** Rollback is a temporary measure. After restoring service, investigate the issue and fix it properly before redeploying.

---

## Rollback Decision Criteria

Trigger a rollback if **any** of the following are true:

- [ ] Site is returning 5xx errors on critical pages (home, login, member dashboard)
- [ ] Core user flows are broken (login, registration, member lookup)
- [ ] JavaScript console shows unrecoverable errors preventing page interaction
- [ ] API endpoints return errors that block frontend functionality
- [ ] Page load time has increased by more than 3x compared to baseline
- [ ] Multiple users report the same issue within minutes of deploy

**Do NOT rollback if:**

- The issue is cosmetic only (styling, typos)
- The issue affects only admin/internal pages with workarounds available
- A hotfix can be deployed within 15 minutes

---

## How to Identify the Last Good Deploy

### Via Netlify UI

1. Log in to [Netlify](https://app.netlify.com/)
2. Select the **clubos** site from your team dashboard
3. Navigate to **Deploys** in the left sidebar
4. Look for the most recent deploy with:
   - **Status:** "Published" (green checkmark)
   - **Deployed before** the problematic commit
5. Click on the deploy to view details
6. Note the **Deploy ID** and **commit SHA** for reference

### Via Git (to correlate commits)

```bash
# Show recent commits on main with timestamps
git log --oneline -10 main

# Compare with Netlify deploy times to identify the last good commit
```

---

## How to Roll Back

### Option 1: Netlify UI (Recommended)

1. Go to **Deploys** → find the last known good deploy
2. Click on that deploy to open its detail page
3. Click the **"Publish deploy"** button (top right)
4. Confirm the action when prompted
5. Wait for the publish to complete (usually < 30 seconds)
6. The site will now serve the rolled-back version

### Option 2: Netlify CLI

If you have the Netlify CLI installed and configured:

```bash
# List recent deploys
netlify deploys --site clubos

# Publish a specific deploy by ID
netlify deploy --prod --deploy-id <DEPLOY_ID>
```

### Option 3: Git Revert (Creates New Deploy)

If you prefer to fix via Git (creates audit trail):

```bash
# Revert the problematic commit(s)
git revert <BAD_COMMIT_SHA>

# Push to main (triggers new deploy)
git push origin main
```

**Note:** This creates a new deploy rather than republishing an old one. Use Options 1 or 2 for faster recovery.

---

## Post-Rollback Verification Checklist

After rolling back, verify the site is functioning correctly:

### Smoke Test URLs

- [ ] **Homepage:** `https://<site-url>/` — loads without errors
- [ ] **Login page:** `https://<site-url>/login` — form renders correctly
- [ ] **Member dashboard:** `https://<site-url>/my` — loads for authenticated users
- [ ] **Public pages:** Spot-check 2-3 public content pages

### Key Flows to Verify

- [ ] **Login flow:** Can log in with valid credentials
- [ ] **Navigation:** Main menu links work correctly
- [ ] **API health:** Check browser Network tab for failed requests
- [ ] **Console errors:** No unrecoverable JavaScript errors in browser console

### Monitoring Checks

- [ ] Error rate in logs has returned to baseline
- [ ] Page load times are back to normal
- [ ] No new error alerts firing

---

## Post-Rollback Actions

1. **Notify the team** — Post in the appropriate channel that a rollback occurred
2. **Document the issue** — Create or update the related GitHub issue with:
   - What symptoms were observed
   - Which deploy was rolled back
   - Which deploy was restored
3. **Investigate root cause** — Review the problematic commit(s)
4. **Fix and test** — Create a fix, test in preview deploy before merging to main
5. **Redeploy** — Once fixed, merge to main and verify the new deploy

---

## Quick Reference

| Action | Location |
|--------|----------|
| View deploys | Netlify → Site → Deploys |
| Rollback (UI) | Deploy detail → "Publish deploy" |
| Rollback (CLI) | `netlify deploy --prod --deploy-id <ID>` |
| Deploy logs | Netlify → Deploy → "Deploy log" |
| Build settings | Netlify → Site → Site configuration → Build & deploy |
