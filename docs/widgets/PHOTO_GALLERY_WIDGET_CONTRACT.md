# Photo Gallery Widget Contract

Worker 4 — Widget Contract — Report

## Allowed Responsibilities
- Render photos
- Request metadata
- Invoke declared actions

## Forbidden Responsibilities
- Authentication
- Authorization
- Privacy enforcement
- Face recognition decisions

## Allowed Events
- photo:view
- photo:download
- face:tag:add
- face:tag:remove

## Security Invariants
- Widget never decides access
- Widget never stores secrets
- Widget treats storage URLs as opaque

## Verdict
READY FOR REVIEW
