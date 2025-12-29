# Starling Requirements Specification

```
Status: APPROVED (Interview Complete)
Version: 1.0
Date: December 2025
Stakeholder: EDF
```

---

## Executive Summary

Starling is Murmurant's conversational AI assistant - a deeply integrated alternative interface that can navigate users, answer questions, and **stage actions for user confirmation**. Starling never mutates data directly; users always confirm via button press.

**Core Principle:** *Suggest and stage, never commit.*

---

## Interview Results Summary

| Decision | Choice |
|----------|--------|
| User roles | All roles including Admin |
| Stageable actions | Everything user has permission for |
| Unknown queries | Search + escalate to humans |
| V1 scope | Full member self-service |
| Staging UI | Navigate + highlight (pre-fill form, user confirms) |
| Memory | Full conversation history (persistent) |
| Multi-step workflows | Guided wizard (conversational) |
| Audit level | Full conversation logging |
| UI location | Floating button + drawer |
| Context awareness | Explicit context API (pages register) |
| Avatar | Murmuration animation |
| Voice | Full voice (STT input + TTS output) |
| Sensitive action confirm | Passkey required |
| Reasoning transparency | On request ("why?") |
| RBAC handling | Explain + suggest escalation |
| First domain | Events |

---

## 1. Core Capabilities

### 1.1 Navigation Assistant

Starling can help users find any page or feature:

```
User: "Where do I update my email?"
Starling: "Your email is in Profile Settings. Want me to take you there?"
[Go to Profile Settings]
```

**Implementation:**
- Maintain page registry with descriptions and keywords
- Match user intent to registered pages
- Deep-link to specific sections when possible

### 1.2 Question Answering (RAG)

Starling answers questions from Murmurant's knowledge base:

- Runbooks and how-to guides
- Organization policies (bylaws, rules)
- Event and activity information
- Membership FAQs

**Grounding requirement:** All answers cite their source. If unknown, escalate to human.

### 1.3 Action Staging

Starling can fill out forms on behalf of users, but **never submits**:

```
User: "Sign me up for the hiking trip on Saturday"
Starling: "I found the Mt. Wilson Hike on Saturday at 8am.
          I'll take you to the registration page with your info filled in.
          Just review and click 'Register' to confirm."
[Go to Registration] → (navigates, form pre-filled, submit button highlighted)
```

**Safety invariant:** User must click a button to complete any action.

### 1.4 Guided Wizards

For multi-step workflows, Starling walks users through conversationally:

```
User: "I want to create a hiking event"
Starling: "Great! Let's set up your hike. What's the name of the event?"
User: "Sunset Beach Walk"
Starling: "Nice! What date and time?"
User: "Next Friday at 5pm"
Starling: "Where should members meet?"
User: "Leadbetter Beach parking lot"
Starling: "Got it. Is there a limit on participants?"
User: "20 people max"
Starling: "Here's what I've prepared:
          - Sunset Beach Walk
          - Friday, Jan 10 at 5:00 PM
          - Leadbetter Beach parking lot
          - Capacity: 20

          I'll take you to the event creation page with everything filled in.
          Review the details and click 'Create Event' to publish."
[Go to Create Event]
```

---

## 2. User Interface

### 2.1 Chat Widget

**Location:** Floating button (bottom-right corner) + slide-out drawer

**States:**
- Collapsed: Murmuration-animated icon button
- Expanded: Chat drawer (400px wide, full height)
- Full-page: Optional `/chat` route for complex work

**Avatar:** Animated murmuration pattern (flowing dots) that:
- Pulses gently when idle
- Flows actively when "thinking"
- Settles when complete

### 2.2 Voice Interface

**Input:** Speech-to-text (browser API or Whisper)
**Output:** Text-to-speech for responses

**Activation:**
- Microphone button in chat input
- Wake word (future): "Hey Starling"

**Accessibility:** All voice interactions have text equivalents.

### 2.3 Staging Presentation

When Starling stages an action:

1. Navigate user to the target page
2. Pre-fill form fields with gathered data
3. Highlight the submit/confirm button (pulsing border)
4. Show toast: "Starling filled this form. Review and confirm when ready."

---

## 3. Context Awareness

### 3.1 Context API

Each page registers its context with Starling:

```typescript
// In a page component
useStarlingContext({
  page: 'event-detail',
  entityType: 'event',
  entityId: event.id,
  entityName: event.title,
  availableActions: ['register', 'cancel-registration', 'add-to-calendar'],
  currentState: { isRegistered: registration !== null }
});
```

**Context includes:**
- Current page/route
- Entity being viewed (if any)
- Available actions for user's role
- Current state relevant to actions

### 3.2 Selection Context

Users can select items to "show" Starling:

```
User: (selects 3 members in a list)
User: "Send these members a reminder about the upcoming hike"
Starling: "I'll prepare a reminder email to Jane, Bob, and Carol
          about the Mt. Wilson Hike. Let me take you to the
          compose screen with the recipients and event details filled in."
```

---

## 4. Memory & History

### 4.1 Conversation Persistence

- Full conversation history stored per user
- Conversations grouped by session (with timestamps)
- History searchable by user

### 4.2 Context Continuity

Starling remembers:
- Recent topics discussed
- Actions staged (completed or abandoned)
- User preferences expressed
- Entities user has interacted with

```
User: (yesterday) "Sign me up for hiking events when they're posted"
---
User: (today) "Any new hikes?"
Starling: "Yes! A new Mt. Wilson Hike was just posted for Saturday.
          Based on your standing request, want me to register you?"
```

### 4.3 Privacy Controls

Users can:
- View their conversation history
- Delete specific conversations
- Clear all history
- Disable history (session-only mode)

---

## 5. Permissions & Safety

### 5.1 RBAC Enforcement

Starling respects user's role and capabilities:

- Only shows/suggests actions user is permitted to do
- When user asks about something outside their role:

```
User: "Can I approve this membership application?"
Starling: "Membership approval requires the Membership Chair role.
          Would you like me to help you contact Sarah (Membership Chair)
          about this application?"
[Contact Sarah]  [No thanks]
```

### 5.2 Sensitive Action Confirmation

For destructive or high-impact actions:

| Action Type | Confirmation Required |
|-------------|----------------------|
| View/Navigate | None |
| Personal updates | Click confirm button |
| Create content | Click confirm button |
| Modify others' data | Click confirm + toast warning |
| Delete anything | Click confirm + passkey |
| Admin actions | Click confirm + passkey |

### 5.3 Audit Trail

Every Starling interaction is logged:

```typescript
interface StarlingAuditEntry {
  id: string;
  userId: string;
  timestamp: Date;
  sessionId: string;

  // Conversation
  userMessage: string;
  starlingResponse: string;
  intent: string;
  confidence: number;

  // Action (if staged)
  stagedAction?: {
    type: string;
    targetPage: string;
    formData: Record<string, unknown>;
    confirmed: boolean;
    confirmedAt?: Date;
  };

  // Context
  pageContext?: PageContext;
  retrievedDocs?: string[];
}
```

---

## 6. Reasoning Transparency

### 6.1 On-Request Explanation

Users can ask "why?" to see Starling's reasoning:

```
User: "Why did you suggest that event?"
Starling: "I suggested the Mt. Wilson Hike because:
          1. You've attended 3 hiking events in the past 2 months
          2. It's on a Saturday (you usually attend weekend events)
          3. It has spots available

          Source: Your event history, event details page"
```

### 6.2 Source Citations

When answering from knowledge base:

```
User: "What's the guest policy?"
Starling: "Members can bring up to 2 guests per event. Guests must
          sign a liability waiver at check-in.

          [Source: SBNC Bylaws, Section 4.2]"
```

---

## 7. First Domain: Events

### 7.1 Event Discovery

```
"What events are coming up?"
"Any hikes this week?"
"Show me events I can still register for"
"What's happening Saturday?"
```

### 7.2 Event Registration

```
"Sign me up for the wine tasting"
"Register me and my spouse for the holiday party"
"Cancel my registration for tomorrow's hike"
"Add the book club to my calendar"
```

### 7.3 Event Information

```
"Where is the garden tour meeting?"
"What time does the cooking class start?"
"Who's going to the museum trip?"
"How many spots are left for the concert?"
```

### 7.4 Event Creation (for authorized roles)

```
"Create a new hiking event"
"Schedule a coffee meetup for next Tuesday"
"Copy last month's book club meeting to next month"
```

---

## 8. Technical Architecture

### 8.1 Components

```
┌─────────────────────────────────────────────────────────────┐
│                     STARLING FRONTEND                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Chat Widget │  │ Voice I/O   │  │ Context Provider    │  │
│  │ (React)     │  │ (Web APIs)  │  │ (useStarlingContext)│  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     STARLING API                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ /api/chat   │  │ /api/stage  │  │ /api/context        │  │
│  │ Conversation│  │ Form staging│  │ Page registration   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     STARLING CORE                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Intent      │  │ RAG         │  │ Action              │  │
│  │ Detection   │  │ Retrieval   │  │ Planner             │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ LLM         │  │ History     │  │ Audit               │  │
│  │ (Groq)      │  │ Store       │  │ Logger              │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATA LAYER                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ pgvector    │  │ Prisma      │  │ Conversation        │  │
│  │ (Embeddings)│  │ (Entities)  │  │ History             │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Form Staging Flow

```
1. User: "Sign me up for the hiking event"
2. Starling: Detects intent (event:register)
3. Starling: Queries available events matching "hiking"
4. Starling: Finds Mt. Wilson Hike, checks user eligibility
5. Starling: Prepares staging payload:
   {
     targetPage: '/events/123/register',
     formData: {
       memberId: user.id,
       eventId: 123,
       guestCount: 0
     },
     highlightElement: 'button[type="submit"]'
   }
6. Starling: Responds with preview + "Go to Registration" button
7. User: Clicks button
8. Frontend: Navigates to /events/123/register
9. Frontend: Applies staged form data
10. Frontend: Highlights submit button with pulsing border
11. User: Reviews, clicks "Register"
12. System: Normal form submission (with audit that it was Starling-staged)
```

---

## 9. Implementation Phases

### Phase 1: Foundation (Events Domain)
- [ ] Chat widget UI (floating + drawer)
- [ ] Context API and provider
- [ ] RAG retrieval for event queries
- [ ] Basic intent detection
- [ ] Event discovery conversations
- [ ] Event registration staging

### Phase 2: Full Events + Voice
- [ ] Voice input (speech-to-text)
- [ ] Voice output (TTS)
- [ ] Murmuration avatar animation
- [ ] Event creation wizard
- [ ] Event modification staging
- [ ] Calendar integration

### Phase 3: Expand Domains
- [ ] Membership domain (profile, renewal)
- [ ] Help/FAQ domain
- [ ] Navigation for all pages
- [ ] Multi-domain conversations

### Phase 4: Advanced Features
- [ ] Full conversation history
- [ ] Standing requests ("always notify me...")
- [ ] Proactive suggestions
- [ ] Admin domain support
- [ ] Passkey confirmation for sensitive actions

---

## 10. Success Metrics

| Metric | Target |
|--------|--------|
| Task completion rate | >80% of intents successfully staged |
| Hallucination rate | <2% of responses contain incorrect info |
| Escalation rate | <15% of queries need human help |
| User satisfaction | >4.0/5.0 rating |
| Time to complete | 50% faster than manual navigation |

---

## Related Documents

- [STARLING_SLM_ARCHITECTURE.md](./STARLING_SLM_ARCHITECTURE.md) - LLM/cost architecture
- [CHATBOT_PLUGIN_SPEC.md](./CHATBOT_PLUGIN_SPEC.md) - Original plugin spec
- [CHATBOT_SAFETY_CONTRACT.md](./CHATBOT_SAFETY_CONTRACT.md) - Safety rules
- [VOICE_AND_MESSAGING.md](../brand/VOICE_AND_MESSAGING.md) - Starling personality

---

*This specification was developed through stakeholder interview on December 28, 2025.*
