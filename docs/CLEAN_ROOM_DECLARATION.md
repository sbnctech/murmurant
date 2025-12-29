# Clean-Room Development Declaration

Murmurant is developed under a clean-room methodology.

## Scope

The following sources have **not** been used in the design or implementation of Murmurant:
- Proprietary source code from Wild Apricot or any other SaaS platform
- Decompiled, reverse-engineered, or inferred internal logic
- Non-public APIs, schemas, or administrative tooling
- Confidential documentation obtained under customer or administrator access

## Permitted Inputs

Design decisions may be informed by:
- Publicly documented software engineering practices
- General governance and access-control models
- Public product documentation and marketing materials
- First-hand operational experience as an end-user
- Original threat modeling and failure-mode analysis

## Design Philosophy

Murmurant architecture emphasizes:
- Explicit guarantees over implicit behavior
- Server-side enforcement of authority
- Time-bounded and auditable privilege
- Prevention of escalation and cross-tenant leakage

These choices represent an independent architectural approach and are not intended to replicate any third-party system.

## Ongoing Commitment

Contributors are expected to:
- Avoid importing third-party proprietary logic
- Document assumptions and enforcement rationale
- Favor original naming and abstractions
- Flag potential IP concerns early

This declaration exists to protect contributors, users, and downstream adopters.
