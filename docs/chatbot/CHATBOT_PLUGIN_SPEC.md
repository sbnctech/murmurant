# Starling Chatbot Specification

```
Status: APPROVED
Version: 2.0
Date: December 2025
Previous: v1.0 (Read-Only Plugin Spec)
```

---

## Overview

Starling is Murmurant's conversational AI assistant — a deeply integrated alternative interface that can:

1. **Answer questions** from the knowledge base (FAQ, how-to, policies)
2. **Navigate users** to any page or feature
3. **Stage actions** by pre-filling forms for user confirmation

**Core Principle:** *Suggest and stage, never commit.* Starling never directly mutates data.

---

## Brand Identity

The chatbot is named **Starling** — the Murmurant assistant. See [VOICE_AND_MESSAGING.md](../brand/VOICE_AND_MESSAGING.md#chatbot-personality-starling) for personality guidelines.

**Starling's voice:**
- Professional but friendly, like a capable colleague
- Direct — answer the question first, then elaborate
- Helpful — offer next steps or related actions
- Human — use contractions, short sentences, natural language
- Humble — admit when you don't know something
- Proactive — anticipate follow-up questions

**Starling does NOT:**
- Use jargon or system IDs in responses
- Say "I am unable to..." or other robotic phrases
- Use marketing language or enthusiasm inflation
- Claim capabilities beyond what's implemented
- Directly modify any data (staging only)

---

## Capabilities

### Tier 1: Information & Navigation
- Answer FAQ questions using RAG retrieval
- Explain how to do things (step-by-step)
- Navigate users to any page or feature
- Search for events, members, content

### Tier 2: Member Self-Service (Staged)
- Stage event registration
- Stage RSVP changes
- Stage profile updates
- Stage membership renewal

### Tier 3: Committee Actions (Staged)
- Stage event creation (guided wizard)
- Stage attendance recording
- Stage member communications

### Tier 4: Admin Actions (Staged + Passkey)
- Stage member management
- Stage policy changes
- Stage report generation

**All Tier 2-4 actions use form staging** — Starling fills out forms, users confirm with a button click.

---

## Safety Contract

### What Starling CAN Do
- Read any data the user has permission to view
- Navigate to any page the user can access
- Pre-fill forms with gathered information
- Search the knowledge base
- Escalate to human contacts

### What Starling CANNOT Do
- Submit forms or confirm actions
- Modify any database records directly
- Bypass RBAC or expose hidden entities
- Access data outside user's permissions
- Send emails or communications

### Confirmation Requirements

| Action Type | Confirmation |
|-------------|--------------|
| View/Navigate | None |
| Personal updates | Click submit button |
| Create content | Click submit button |
| Modify others' data | Submit + toast warning |
| Delete anything | Submit + passkey |
| Admin actions | Submit + passkey |

---

## Architecture

```
User Message
     │
     ▼
┌─────────────────┐     ┌─────────────────┐
│ Intent Detection │────▶│ Entity Resolution│
└─────────────────┘     └─────────────────┘
     │                           │
     ▼                           ▼
┌─────────────────┐     ┌─────────────────┐
│ Permission Check│     │ RAG Retrieval   │
└─────────────────┘     └─────────────────┘
     │                           │
     └─────────┬─────────────────┘
               ▼
     ┌─────────────────┐
     │ Action Planning │
     └─────────────────┘
               │
     ┌─────────┴─────────┐
     ▼                   ▼
┌─────────┐       ┌─────────────┐
│ Answer  │       │ Stage Action│
└─────────┘       └─────────────┘
                         │
                         ▼
               ┌─────────────────┐
               │ Navigate + Fill │
               │ Highlight Submit│
               └─────────────────┘
```

See [STARLING_TECHNICAL_SPEC.md](./STARLING_TECHNICAL_SPEC.md) for detailed architecture.

---

## Context API

Pages register their context with Starling:

```typescript
useStarlingContext({
  page: 'event-detail',
  pageTitle: event.title,
  entity: {
    type: 'event',
    id: event.id,
    name: event.title,
  },
  availableActions: [
    { id: 'register', triggers: ['sign me up', 'register'] },
    { id: 'cancel', triggers: ['cancel', 'unregister'] },
  ],
  state: { isRegistered: !!registration }
});
```

This enables context-aware responses and action suggestions.

---

## Form Staging Flow

1. User: "Sign me up for the hiking event"
2. Starling detects intent: `event:register`
3. Starling resolves event, checks permissions
4. Starling creates staging payload
5. Starling responds with preview + "Go to Registration" button
6. User clicks button → navigates to form
7. Form loads with staged data pre-filled
8. Submit button is highlighted
9. User reviews and clicks Submit
10. Normal form submission (with audit trail noting Starling staged it)

---

## Audit Requirements

Every Starling interaction is logged:

- User message and Starling response
- Detected intent and confidence
- Page context at time of message
- Staged actions (created, consumed, confirmed)
- Permission denials

Full conversation transcripts are retained per operator configuration (default: 90 days).

---

## LLM Infrastructure

Starling uses a cost-effective RAG + SLM architecture:

- **Retrieval**: pgvector embeddings in Neon database
- **Generation**: Groq or Together.ai (Mistral 7B)
- **Fallback**: OpenAI for edge cases

Estimated cost: $25-40/month for typical club usage.

See [STARLING_SLM_ARCHITECTURE.md](./STARLING_SLM_ARCHITECTURE.md) for details.

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [STARLING_REQUIREMENTS.md](./STARLING_REQUIREMENTS.md) | Full functional requirements |
| [STARLING_TECHNICAL_SPEC.md](./STARLING_TECHNICAL_SPEC.md) | Context API, staging, intent detection |
| [STARLING_SLM_ARCHITECTURE.md](./STARLING_SLM_ARCHITECTURE.md) | LLM/RAG/cost architecture |
| [STARLING_OPERATOR_CONFIG.md](./STARLING_OPERATOR_CONFIG.md) | Per-organization configuration |
| [CHATBOT_SAFETY_CONTRACT.md](./CHATBOT_SAFETY_CONTRACT.md) | Safety rules summary |
| [VOICE_AND_MESSAGING.md](../brand/VOICE_AND_MESSAGING.md) | Starling personality |

---

## Implementation Phases

### Phase 1: Events Domain
- Chat widget UI
- Context API
- RAG for event queries
- Event registration staging

### Phase 2: Voice + Full Events
- Speech-to-text input
- Text-to-speech output
- Event creation wizard
- Murmuration avatar

### Phase 3: Expand Domains
- Membership domain
- Help/FAQ domain
- Full navigation

### Phase 4: Advanced
- Conversation history
- Proactive suggestions
- Admin domain
- Passkey confirmation

---

*Specification v2.0 - December 2025*
