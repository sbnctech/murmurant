# Release Classification

Every PR must declare its release classification. This ensures reviewers understand the stability expectations and deployment risk.

## Classifications

### experimental

Early exploration code. May be reverted at any time without notice.

- **Use for**: Prototypes, spikes, proof-of-concepts
- **Expectations**: May break, may be incomplete, may be abandoned
- **Deployment**: May ship to staging; requires explicit approval for production
- **Revert policy**: Can be reverted without discussion

### candidate

Ready for review and validation. Intended to ship after testing.

- **Use for**: Features that are functionally complete
- **Expectations**: Should work, may have edge cases
- **Deployment**: Ships to staging; ships to production after validation
- **Revert policy**: Discuss before reverting; may need migration

### stable

Production-ready. Fully tested and documented.

- **Use for**: Bug fixes, well-tested features, documentation
- **Expectations**: Should not break anything
- **Deployment**: Ships to production in normal release cycle
- **Revert policy**: Requires incident justification

## How to Use

In your PR description, check exactly one classification:

```markdown
## Release Classification (Required)

Select ONE classification for this PR:

- [x] **experimental** - Early exploration; may be reverted; not for production
- [ ] **candidate** - Ready for review; may ship after validation
- [ ] **stable** - Production-ready; fully tested and documented
```

## CI Enforcement

The `release-classification` workflow checks that:

1. Exactly one classification is selected
2. The classification is valid (experimental, candidate, or stable)

PRs without a valid classification will fail CI.

## Changing Classification

If a PR's classification changes during review:

1. Update the checkbox in the PR description
2. CI will re-run automatically
3. Add a comment explaining the change

## Related

- [PR Template](/.github/pull_request_template.md)
- [ARCHITECTURAL_CHARTER.md](/docs/ARCHITECTURAL_CHARTER.md)
