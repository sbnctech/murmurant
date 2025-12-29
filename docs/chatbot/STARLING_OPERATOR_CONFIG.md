# Starling Configuration Questionnaire

```
Status: Template
Purpose: Operator questionnaire for configuring Starling per organization
Audience: Organization administrators during onboarding
```

---

## Instructions

This questionnaire configures how Starling (the Murmurant assistant) works for your organization. Your answers determine what Starling can do, how it behaves, and what safety controls are in place.

**Default values** are marked with ✓. If you're unsure, the defaults follow Murmurant's recommended practices.

Complete this form during onboarding. Settings can be changed later in Admin > Starling Configuration.

---

## Organization Information

**Organization Name:** _______________________

**Primary Contact:** _______________________

**Date:** _______________________

---

## 1. User Access

### 1.1 Which roles should have access to Starling?

- [ ] All members (✓ default)
- [ ] Active members only
- [ ] Committee members and above
- [ ] Board and Admin only

### 1.2 Should guests/non-members see Starling?

- [ ] Yes, with limited capabilities (FAQ only)
- [ ] Yes, for event discovery only
- [ ] No, members only (✓ default)

---

## 2. Capabilities

### 2.1 What can Starling help users do?

Check all that apply:

**Navigation & Information (recommended for all)**
- [x] Answer FAQ questions (✓ default)
- [x] Navigate to pages (✓ default)
- [x] Explain how to do things (✓ default)
- [x] Search for events and activities (✓ default)

**Personal Actions (member self-service)**
- [x] Stage event registration (✓ default)
- [x] Stage RSVP changes (✓ default)
- [x] Stage profile updates (✓ default)
- [ ] Stage membership renewal
- [ ] Stage payment actions

**Committee Actions (for authorized roles)**
- [ ] Stage event creation (✓ default)
- [ ] Stage attendance recording
- [ ] Stage member communications
- [ ] Stage roster management

**Admin Actions**
- [ ] Stage member management
- [ ] Stage policy changes
- [ ] Stage report generation
- [ ] Full admin support

### 2.2 Action staging policy

How should Starling present actions it prepares?

- [ ] Navigate to page with form pre-filled, highlight submit button (✓ default)
- [ ] Show preview in chat, user clicks to go to page
- [ ] Show confirmation modal before navigating

---

## 3. Knowledge Base

### 3.1 What should Starling know about?

- [x] Murmurant features and how-to guides (✓ always included)
- [x] Your organization's events and activities (✓ default)
- [ ] Your organization's bylaws and policies
- [ ] Your organization's history and background
- [ ] Committee descriptions and contacts
- [ ] Custom FAQ content (you'll provide)

### 3.2 How should Starling handle questions it can't answer?

- [ ] Say "I don't have information about that" and suggest general help
- [ ] Offer to connect user with a specific role (e.g., "Contact the Membership Chair") (✓ default)
- [ ] Search the web for general questions, escalate org-specific questions
- [ ] Always escalate to human support

### 3.3 Who should unknown questions escalate to?

| Topic | Contact Role |
|-------|--------------|
| Membership questions | _______________________ |
| Event questions | _______________________ |
| Technical/website issues | _______________________ |
| General inquiries | _______________________ |

---

## 4. Conversation Settings

### 4.1 Should Starling remember conversation history?

- [ ] No, fresh start each session (most private)
- [ ] Remember within session only
- [ ] Remember for 7 days
- [ ] Full history with user control (✓ default)

### 4.2 How should Starling handle multi-step tasks?

- [ ] One action at a time, user confirms each step
- [ ] Conversational wizard - gather info, then stage final result (✓ default)
- [ ] Batch multiple actions for single confirmation

### 4.3 Should Starling be proactive?

- [ ] No, only respond when asked (✓ default)
- [ ] Suggest relevant actions based on current page
- [ ] Remind users of pending tasks (renewals, incomplete registrations)
- [ ] Notify about new events matching interests

---

## 5. User Interface

### 5.1 Where should Starling appear?

- [x] Floating button in corner of every page (✓ default)
- [ ] Only on specific pages: _______________________
- [ ] Dedicated /chat page only
- [ ] Embedded widget on homepage

### 5.2 What should the chat button look like?

- [ ] Murmurant logo (murmuration pattern) (✓ default)
- [ ] Text label: "Ask Starling"
- [ ] Generic chat bubble icon
- [ ] Custom: _______________________

### 5.3 Avatar animation

- [ ] Static icon
- [ ] Subtle pulse when idle, flowing when thinking (✓ default)
- [ ] No avatar, text only

### 5.4 Voice capabilities

- [ ] Text only (✓ default for v1)
- [ ] Voice input (speech-to-text)
- [ ] Full voice (input and spoken responses)

---

## 6. Safety & Confirmation

### 6.1 Starling's core safety rule (not configurable)

> **Starling never directly changes data.** All actions are staged for user confirmation. Users must click a button to complete any action.

This cannot be changed. It ensures users always maintain control.

### 6.2 What actions require extra confirmation?

**Standard confirmation (click submit button):**
- Personal profile updates
- Event registration
- RSVP changes

**Enhanced confirmation (passkey/password):**
Check which actions should require passkey:

- [ ] Canceling registrations (✓ default)
- [ ] Deleting anything
- [ ] Modifying other members' data
- [ ] Administrative actions
- [ ] Financial actions
- [ ] All actions (maximum security)

### 6.3 Should Starling explain its reasoning?

- [ ] Only when user asks "why?" (✓ default)
- [ ] Always show sources for answers
- [ ] Never (just give answers)

### 6.4 How should Starling handle permission boundaries?

When a user asks about something outside their role:

- [ ] Silently ignore (don't mention it exists)
- [ ] Explain the limitation (✓ default)
- [ ] Explain and offer to contact someone who can help (✓ recommended)

---

## 7. Audit & Compliance

### 7.1 What should be logged?

- [x] All staged actions and confirmations (✓ required)
- [x] Action attempts that were denied (✓ required)
- [ ] Full conversation transcripts (✓ default)
- [ ] Anonymized analytics only

### 7.2 Who can view Starling logs?

- [ ] Admins only (✓ default)
- [ ] Board members and above
- [ ] Specific role: _______________________

### 7.3 Conversation retention

- [ ] 30 days
- [ ] 90 days (✓ default)
- [ ] 1 year
- [ ] Indefinite (until manually deleted)

---

## 8. Personality & Voice

### 8.1 How should Starling introduce itself?

Default greeting:
> "Hi! I'm Starling, your [Organization Name] assistant. I can help you find events, register for activities, update your profile, and answer questions. What can I help you with?"

Custom greeting (optional):
_________________________________________________________________
_________________________________________________________________

### 8.2 Tone preference

- [ ] Friendly and casual ("Hey! Let me help you with that...")
- [ ] Warm but professional (✓ default) ("I'd be happy to help you register for that event.")
- [ ] Formal and efficient ("Registration confirmed. The event details are as follows...")

### 8.3 Should Starling use your organization's terminology?

Provide any custom terms:

| Standard Term | Your Term |
|---------------|-----------|
| Member | _____________ |
| Event | _____________ |
| Committee | _____________ |
| Registration | _____________ |
| _____________ | _____________ |

---

## 9. Launch Settings

### 9.1 How should we roll out Starling?

- [ ] Full launch to all users
- [ ] Soft launch to board/admins first (✓ recommended)
- [ ] Beta with volunteer testers
- [ ] Specific committee: _______________________

### 9.2 Feedback collection

- [ ] Show "Was this helpful?" after each response (✓ default)
- [ ] Link to feedback form
- [ ] No feedback collection

### 9.3 When should Starling go live?

- [ ] Immediately after configuration
- [ ] After staff training
- [ ] Specific date: _______________________

---

## 10. Summary & Sign-off

### Your Starling Configuration Summary

Based on your answers:

- **Access:** [All members / Committee+ / Admin only]
- **Capabilities:** [FAQ + Navigation + Member self-service + Committee actions]
- **Voice:** [Text only / Voice input / Full voice]
- **Memory:** [Session only / 7 days / Full history]
- **Safety:** [Standard / Enhanced confirmation for sensitive actions]
- **Launch:** [Full / Soft launch / Beta]

### Approval

- [ ] I have reviewed this configuration
- [ ] I understand that Starling never directly modifies data
- [ ] I am authorized to configure Starling for this organization

**Signature:** _______________________

**Date:** _______________________

---

## What Happens Next

1. Our team will configure Starling based on your answers
2. We'll set up your knowledge base (events, policies, FAQ)
3. You'll receive a preview environment to test
4. After your approval, we'll launch according to your rollout plan

**Questions?** Contact your Murmurant account manager or email support@murmurant.com

---

## Appendix: Default Configuration (SBNC)

For reference, here is the Santa Barbara Newcomers Club configuration:

| Setting | SBNC Value |
|---------|------------|
| User access | All members |
| Guest access | Event discovery only |
| Capabilities | Full member self-service + Committee actions |
| Action staging | Navigate + highlight |
| Memory | Full history with user control |
| Workflows | Guided wizard |
| Voice | Full voice |
| Sensitive confirmation | Passkey required |
| Transparency | On request |
| RBAC handling | Explain + suggest escalation |
| First domain | Events |
| Audit | Full conversation logging |

---

*Template version 1.0 - December 2025*
