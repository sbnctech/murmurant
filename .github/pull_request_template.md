## Release Classification (Required)

Select ONE classification for this PR:

- [ ] **experimental** - Early exploration; may be reverted; not for production
- [ ] **candidate** - Ready for review; may ship after validation
- [ ] **stable** - Production-ready; fully tested and documented

<!-- CI will fail if no classification is selected -->

---

## Change checklist

### General
- [ ] Scope is small and focused; unrelated changes avoided.
- [ ] Lint passes (`npm run lint`).
- [ ] Typecheck passes (`npm run typecheck`).
- [ ] Build passes (`npm run build`).

### Prisma / DB (required if Prisma or data model changes)
- [ ] `schema.prisma` updated for all new models/fields/enums used in code.
- [ ] Migration created and committed under `prisma/migrations/`.
- [ ] `prisma validate` passes.
- [ ] `prisma generate` passes.
- [ ] Code does not reference Prisma models/fields/enums that are not in `schema.prisma`.

Note: CI requires DATABASE_URL during npm ci because postinstall runs prisma generate.

### Deployment / Preview sanity
- [ ] Netlify/Vercel previews are green (or not applicable and explained).

### Notes for reviewers
- [ ] I listed any new env vars and provided safe defaults/placeholders.

---

## Description

<!-- Briefly describe what this PR does -->

## Related Issues

<!-- Link any related issues: Fixes #123, Relates to #456 -->
