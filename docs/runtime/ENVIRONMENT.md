# Runtime Environment Variables (Murmurant)

Calendar note: This document is being added while we are still on Calendar Day 2.

## Rules
- No secrets in git.
- Local dev uses .env (ignored).
- Vercel Preview/Production use Vercel Environment Variables.
- Do not point Vercel DATABASE_URL at localhost.

## Required for DB-backed routes
### DATABASE_URL
- Local dev example:
  postgresql://murmurant:murmurant@localhost:5432/murmurant_dev
- Vercel must be a hosted Postgres URL.
- For early Preview deploys, DATABASE_URL may be unset until Day 3 wiring.
- Any route that performs DB operations will require it.

## Optional (placeholders for Day 3 wiring)
### AUTH_JWT_SECRET
- Not used yet (auth not implemented).
- When enabled, must be a long random string.

### EMAIL_PROVIDER
- Not used yet (email not implemented).
- Example future values: "resend", "ses", "postmark"

### SMS_PROVIDER
- Not used yet (sms not implemented).
- Example future values: "twilio"

## Vercel UI Notes
Settings -> Build and Deployment:
- Root Directory: leave BLANK (do not enter "." or "./")
- Framework Preset: Next.js (auto)
- Build Command: npm run build (default)
- Output Directory: default
