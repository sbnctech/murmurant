# Event-Specific Guest Release Requirement

**Audience**: Event Chairs, VP of Activities, Tech Chair
**Purpose**: Specify requirements for guest release agreements at club events

---

## Overview

Certain club events require guests (non-members attending with a member) to sign
a release agreement before participation. This document specifies how ClubOS
enforces guest release requirements.

---

## When Guest Release Is Required

Event Chairs or Admins may mark an event as requiring a guest release. Typical
events include:

- Outdoor activities (hiking, kayaking, cycling)
- Events involving physical activity or equipment
- Events at venues requiring liability waivers
- Events with inherent risk disclosure requirements

---

## Hard Gate Requirement

**Guest release is a hard gate.** A guest cannot complete registration for a
release-required event until the release agreement is signed.

- The system blocks registration completion until release is recorded.
- No workarounds, overrides, or "sign later" options exist.
- Event Chairs cannot manually bypass the release requirement.
- Admins cannot retroactively mark a release as signed without an actual
  signature record.

---

## Non-Delegable Consent

**Guest release consent is non-delegable.**

Unlike partnership delegation (where one partner may register for another),
release agreements must be signed by the guest personally.

- A member cannot sign a release on behalf of their guest.
- A partner cannot sign a release on behalf of their partner.
- Each individual must provide their own signature.

This rule exists because:

1. Release agreements have legal significance.
2. The signer must understand and personally accept the terms.
3. Delegation would undermine the purpose of informed consent.

---

## Data Model

GuestRelease:
- id
- eventId (the event requiring the release)
- guestContactId (the guest who signed)
- signedAt (timestamp of signature)
- releaseVersion (version of the release text signed)
- ipAddress (optional, for online signatures)
- createdAt
- updatedAt

EventReleaseRequirement:
- id
- eventId
- releaseTemplateId (which release form to use)
- isRequired (boolean, true for hard gate)
- createdAt
- updatedAt

---

## Registration Flow

```
Guest attempts to register for release-required event
                    |
                    v
         +-------------------+
         |  Release required |
         |  for this event?  |
         +-------------------+
                    |
        +-----------+-----------+
        |                       |
        v                       v
       NO                      YES
        |                       |
        v                       v
   +----------+        +-------------------+
   | Continue |        | Has guest signed  |
   | normal   |        | this release?     |
   | flow     |        +-------------------+
   +----------+                 |
                    +-----------+-----------+
                    |                       |
                    v                       v
                   NO                      YES
                    |                       |
                    v                       v
           +---------------+        +----------+
           | Block         |        | Continue |
           | registration  |        | normal   |
           | Show release  |        | flow     |
           | form          |        +----------+
           +---------------+
                    |
                    v
           +---------------+
           | Guest signs   |
           | release       |
           +---------------+
                    |
                    v
           +---------------+
           | Record        |
           | signature     |
           | Continue flow |
           +---------------+
```

---

## Audit Requirements

Every guest release signature must record:

- Guest identity (contactId)
- Event identity (eventId)
- Exact timestamp of signature
- Version of release text signed
- Method of signature (online, in-person, paper)
- IP address (for online signatures)

Release records are immutable. Once signed, a release record cannot be modified
or deleted.

---

## Event Chair Responsibilities

Event Chairs for release-required events must:

1. Ensure the event is marked as requiring a release before registration opens.
2. Select the appropriate release template for the activity type.
3. Verify that all guests have signed before the event (system enforces this).
4. Report any issues with the release process to the VP of Activities.

Event Chairs cannot:

- Bypass the release requirement for individual guests.
- Sign releases on behalf of guests.
- Mark unsigned guests as having signed.

---

## Admin Override Policy

**There is no admin override for unsigned releases.**

If a guest cannot or will not sign the release, they cannot attend the event.
This policy exists to protect:

- The club from liability.
- The guest from participating without informed consent.
- The Event Chair from pressure to make exceptions.

---

## Release Template Management

Release templates are managed by Admins and must include:

- Clear description of activity and risks.
- Explicit assumption of risk statement.
- Waiver of liability language (reviewed by club legal counsel).
- Version number for audit trail.
- Effective date range.

Templates are versioned. When a template is updated, existing signatures remain
valid for the version signed. New registrations use the current version.

---

## Related Documents

- SYSTEM_SPEC.md (Partnership Delegation - non-delegable consent reference)
- docs/rbac/AUTH_AND_RBAC.md (authorization model)

---

*Document maintained by ClubOS development team. Last updated: December 2024*
