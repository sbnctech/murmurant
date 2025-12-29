<!--
  Copyright © 2025 Murmurant, Inc. All rights reserved.
-->

# Documentation Policy

## Purpose

This policy defines what documentation can be exposed to users (via help docs, chatbots, public APIs) versus what must remain internal.

## Directory Structure

```
docs/
├── public/           # Safe for users, chatbots, public docs
│   ├── help/         # How-to guides for end users
│   ├── faq/          # Common questions and answers
│   └── api/          # Public API reference
│
├── internal/         # NEVER expose externally
│   ├── backlog/      # Feature specs and roadmap
│   ├── architecture/ # Technical implementation details
│   └── strategy/     # Competitive analysis, pricing, positioning
│
└── DOCUMENTATION_POLICY.md  # This file
```

## Classification Rules

### PUBLIC (docs/public/)

Content that helps users accomplish tasks. Safe to:

- Include in help documentation
- Train customer-facing chatbots
- Reference in marketing materials
- Share in support conversations

**Examples:**

- "How to create an anonymous survey"
- "Setting up post-event feedback"
- "Managing activity groups"
- API endpoint documentation
- Feature descriptions (what it does, not why we built it)

**Criteria:**

- Answers "How do I...?" questions
- Describes visible product behavior
- Contains no strategic rationale
- Contains no competitive comparisons
- Contains no pricing strategy
- Contains no implementation details beyond API contracts

### INTERNAL (docs/internal/)

Strategic and architectural content. NEVER:

- Expose to customer-facing chatbots
- Include in public documentation
- Share with users or prospects
- Commit to public repositories

**Examples:**

- Feature backlog and specifications
- Competitive analysis
- Pricing strategy and unit economics
- Architecture decisions and tradeoffs
- Security implementation details
- Why we prioritized X over Y

**Why protect this?**

- Reveals strategic thinking competitors could exploit
- Contains implementation details that could aid attackers
- Shows roadmap that competitors could race to beat
- Exposes business model assumptions

## Chatbot Training Rules

When training or configuring a customer-facing chatbot:

1. **ONLY** use content from `docs/public/`
2. **NEVER** include content from `docs/internal/`
3. **NEVER** include this policy document
4. Configure deflection responses for out-of-scope questions (see CHATBOT_GUARDRAILS.md)

## Review Process

Before adding documentation:

1. Determine classification (public vs internal)
2. Place in correct directory
3. If uncertain, default to internal

Before exposing any documentation to chatbots or public:

1. Verify it's in `docs/public/`
2. Review for accidental strategic content
3. Remove any "why" explanations that reveal competitive positioning

---

_Policy version 1.0 - Last updated 2025-12-29_
