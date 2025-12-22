# Prisma CI Rules

## Why this exists
Our CI frequently runs `npm ci`, and our repo runs `prisma generate` during postinstall.
That means CI must have a DATABASE_URL available even for jobs that do not run migrations.

## Rules
1) Any workflow job that runs `npm ci` must set DATABASE_URL at the job level.
   Example:
     jobs:
       some-job:
         runs-on: ubuntu-latest
         env:
           DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/db?schema=public"

2) Do not rely on step-level env for DATABASE_URL if postinstall runs before that step.

3) If a workflow does not need Prisma at all, it must avoid running postinstall or avoid npm ci.
   (Prefer rule #1 instead of trying to bypass postinstall.)

## Common failure
- "Missing required environment variable: DATABASE_URL"
This typically occurs during `npm ci` when postinstall runs `prisma generate`.
