# Starling Technical Specification

```
Status: DRAFT
Version: 1.0
Date: December 2025
Audience: Engineering
```

---

## Overview

This document specifies the technical architecture for Starling, Murmurant's conversational AI assistant. It covers:

1. Context API - How pages communicate with Starling
2. Form Staging - How Starling prepares actions for user confirmation
3. Intent Detection - How Starling understands user requests
4. Action Planning - How Starling orchestrates multi-step workflows

---

## 1. Context API

### 1.1 Purpose

The Context API allows pages to register their current state with Starling, enabling context-aware conversations.

### 1.2 React Hook: `useStarlingContext`

```typescript
// src/lib/starling/useStarlingContext.ts

import { useEffect, useContext } from 'react';
import { StarlingContext } from './StarlingProvider';

export interface PageContext {
  /** Unique page identifier (e.g., 'event-detail', 'member-profile') */
  page: string;

  /** Human-readable page title */
  pageTitle: string;

  /** Entity being viewed (if any) */
  entity?: {
    type: 'event' | 'member' | 'committee' | 'announcement' | 'registration';
    id: string;
    name: string;
    /** Additional entity data Starling might need */
    data?: Record<string, unknown>;
  };

  /** Actions available on this page for current user */
  availableActions: AvailableAction[];

  /** Current page state relevant to Starling */
  state?: Record<string, unknown>;

  /** Selected items (for bulk operations) */
  selection?: {
    type: string;
    ids: string[];
    names?: string[];
  };
}

export interface AvailableAction {
  /** Action identifier */
  id: string;

  /** Human-readable label */
  label: string;

  /** Natural language triggers (how users might ask for this) */
  triggers: string[];

  /** Form fields this action needs */
  formFields?: FormFieldSpec[];

  /** Target route for staging */
  targetRoute?: string;

  /** Whether this requires passkey confirmation */
  requiresPasskey?: boolean;
}

export interface FormFieldSpec {
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  label: string;
  required: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: unknown;
}

export function useStarlingContext(context: PageContext): void {
  const starling = useContext(StarlingContext);

  useEffect(() => {
    if (starling) {
      starling.registerContext(context);
      return () => starling.unregisterContext(context.page);
    }
  }, [starling, context]);
}
```

### 1.3 Usage Examples

#### Event Detail Page

```typescript
// src/app/(member)/events/[id]/page.tsx

import { useStarlingContext } from '@/lib/starling/useStarlingContext';

export default function EventDetailPage({ event, registration, user }) {
  useStarlingContext({
    page: 'event-detail',
    pageTitle: event.title,
    entity: {
      type: 'event',
      id: event.id,
      name: event.title,
      data: {
        date: event.startDate,
        location: event.location,
        spotsRemaining: event.capacity - event.registrationCount,
        isRegistered: !!registration,
      }
    },
    availableActions: [
      // Only show actions user can perform
      ...(!registration ? [{
        id: 'register',
        label: 'Register for this event',
        triggers: ['sign me up', 'register', 'join', 'attend', 'rsvp yes'],
        formFields: [
          { name: 'guestCount', type: 'number', label: 'Number of guests', required: false, defaultValue: 0 },
          { name: 'dietaryNotes', type: 'text', label: 'Dietary restrictions', required: false },
        ],
        targetRoute: `/events/${event.id}/register`,
      }] : []),

      ...(registration ? [{
        id: 'cancel-registration',
        label: 'Cancel registration',
        triggers: ['cancel', 'unregister', 'remove me', "can't make it", 'rsvp no'],
        targetRoute: `/events/${event.id}/cancel`,
        requiresPasskey: true,
      }] : []),

      {
        id: 'add-to-calendar',
        label: 'Add to calendar',
        triggers: ['add to calendar', 'calendar', 'remind me', 'save the date'],
      },

      // Committee lead actions
      ...(canManageEvent(user, event) ? [{
        id: 'edit-event',
        label: 'Edit event',
        triggers: ['edit', 'change', 'update', 'modify'],
        targetRoute: `/admin/events/${event.id}/edit`,
      }] : []),
    ],
    state: {
      isRegistered: !!registration,
      isFull: event.registrationCount >= event.capacity,
      isPast: new Date(event.startDate) < new Date(),
    }
  });

  // ... rest of component
}
```

#### Member List Page (with selection)

```typescript
// src/app/admin/members/page.tsx

import { useStarlingContext } from '@/lib/starling/useStarlingContext';

export default function MemberListPage({ members }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedMembers = members.filter(m => selectedIds.includes(m.id));

  useStarlingContext({
    page: 'member-list',
    pageTitle: 'Members',
    availableActions: [
      {
        id: 'find-member',
        label: 'Find a member',
        triggers: ['find', 'search', 'look up', 'where is'],
      },
      {
        id: 'export-members',
        label: 'Export member list',
        triggers: ['export', 'download', 'csv', 'spreadsheet'],
      },
    ],
    selection: selectedIds.length > 0 ? {
      type: 'member',
      ids: selectedIds,
      names: selectedMembers.map(m => m.displayName),
    } : undefined,
    state: {
      totalMembers: members.length,
      selectedCount: selectedIds.length,
    }
  });

  // ... rest of component
}
```

### 1.4 Context Provider

```typescript
// src/lib/starling/StarlingProvider.tsx

import React, { createContext, useState, useCallback } from 'react';

interface StarlingContextValue {
  /** Currently registered page context */
  currentContext: PageContext | null;

  /** Register a page context */
  registerContext: (context: PageContext) => void;

  /** Unregister when page unmounts */
  unregisterContext: (pageId: string) => void;

  /** Check if an action is available */
  isActionAvailable: (actionId: string) => boolean;

  /** Get action spec by ID */
  getAction: (actionId: string) => AvailableAction | undefined;
}

export const StarlingContext = createContext<StarlingContextValue | null>(null);

export function StarlingProvider({ children }: { children: React.ReactNode }) {
  const [currentContext, setCurrentContext] = useState<PageContext | null>(null);

  const registerContext = useCallback((context: PageContext) => {
    setCurrentContext(context);
    // Also notify Starling backend of context change
    fetch('/api/starling/context', {
      method: 'POST',
      body: JSON.stringify(context),
    });
  }, []);

  const unregisterContext = useCallback((pageId: string) => {
    setCurrentContext(prev => prev?.page === pageId ? null : prev);
  }, []);

  const isActionAvailable = useCallback((actionId: string) => {
    return currentContext?.availableActions.some(a => a.id === actionId) ?? false;
  }, [currentContext]);

  const getAction = useCallback((actionId: string) => {
    return currentContext?.availableActions.find(a => a.id === actionId);
  }, [currentContext]);

  return (
    <StarlingContext.Provider value={{
      currentContext,
      registerContext,
      unregisterContext,
      isActionAvailable,
      getAction,
    }}>
      {children}
    </StarlingContext.Provider>
  );
}
```

---

## 2. Form Staging Architecture

### 2.1 Staging Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User Request                                                 │
│    "Sign me up for the hiking event"                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Intent Detection                                             │
│    Intent: event:register                                       │
│    Entities: { eventQuery: "hiking" }                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Entity Resolution                                            │
│    Query events matching "hiking"                               │
│    Result: Mt. Wilson Hike (id: evt_123)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Permission Check                                             │
│    User can register? ✓                                        │
│    Event has capacity? ✓                                       │
│    User not already registered? ✓                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Create Staging Payload                                       │
│    {                                                            │
│      stagingId: "stg_abc123",                                  │
│      targetRoute: "/events/evt_123/register",                  │
│      formData: { memberId: "mbr_456", guestCount: 0 },        │
│      expiresAt: "2025-12-28T12:30:00Z"                        │
│    }                                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Return Response with Staging Button                          │
│    "I found the Mt. Wilson Hike on Saturday at 8am.            │
│     I'll take you to registration with your info ready.        │
│     Just review and click 'Register' to confirm."              │
│                                                                 │
│     [Go to Registration]                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (user clicks button)
┌─────────────────────────────────────────────────────────────────┐
│ 7. Navigate with Staging Token                                  │
│    Router.push("/events/evt_123/register?staging=stg_abc123") │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. Target Page Applies Staged Data                              │
│    - Fetches staging payload from API                          │
│    - Pre-fills form fields                                      │
│    - Highlights submit button                                   │
│    - Shows "Starling prepared this" toast                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (user clicks submit)
┌─────────────────────────────────────────────────────────────────┐
│ 9. Normal Form Submission                                       │
│    - Validates form                                             │
│    - Submits to API                                             │
│    - Audit log includes stagingId                              │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Staging Payload Schema

```typescript
// src/lib/starling/types.ts

export interface StagingPayload {
  /** Unique staging ID */
  stagingId: string;

  /** User who initiated the staging */
  userId: string;

  /** Conversation/session ID */
  conversationId: string;

  /** Target route to navigate to */
  targetRoute: string;

  /** Form data to pre-fill */
  formData: Record<string, unknown>;

  /** Which form fields were set by Starling */
  stagedFields: string[];

  /** Element selector to highlight (usually submit button) */
  highlightSelector?: string;

  /** Toast message to show */
  toastMessage?: string;

  /** When this staging expires */
  expiresAt: Date;

  /** Whether this action requires passkey */
  requiresPasskey: boolean;

  /** Metadata for audit trail */
  metadata: {
    intent: string;
    originalQuery: string;
    resolvedEntities: Record<string, unknown>;
  };
}
```

### 2.3 Staging API Endpoints

```typescript
// src/app/api/starling/staging/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { nanoid } from 'nanoid';

// POST /api/starling/staging - Create staging payload
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  const staging = await prisma.starlingStaging.create({
    data: {
      id: `stg_${nanoid(12)}`,
      userId: user.id,
      conversationId: body.conversationId,
      targetRoute: body.targetRoute,
      formData: body.formData,
      stagedFields: body.stagedFields,
      highlightSelector: body.highlightSelector ?? 'button[type="submit"]',
      toastMessage: body.toastMessage ?? 'Starling prepared this form. Review and confirm when ready.',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      requiresPasskey: body.requiresPasskey ?? false,
      metadata: body.metadata,
    }
  });

  return NextResponse.json({ stagingId: staging.id });
}

// GET /api/starling/staging/[id] - Retrieve staging payload
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const staging = await prisma.starlingStaging.findUnique({
    where: { id: params.id }
  });

  if (!staging) {
    return NextResponse.json({ error: 'Staging not found' }, { status: 404 });
  }

  // Security: Only the user who created it can retrieve it
  if (staging.userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Check expiration
  if (staging.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Staging expired' }, { status: 410 });
  }

  return NextResponse.json(staging);
}
```

### 2.4 Staging Consumer Hook

```typescript
// src/lib/starling/useStagedForm.ts

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from '@/components/ui/toast';

interface StagedFormResult<T> {
  /** Whether staging data is being loaded */
  isLoading: boolean;

  /** Staged form data (if any) */
  stagedData: Partial<T> | null;

  /** Which fields were staged */
  stagedFields: string[];

  /** Staging ID for audit trail */
  stagingId: string | null;

  /** Whether passkey is required */
  requiresPasskey: boolean;
}

export function useStagedForm<T extends Record<string, unknown>>(): StagedFormResult<T> {
  const searchParams = useSearchParams();
  const stagingId = searchParams.get('staging');

  const [isLoading, setIsLoading] = useState(!!stagingId);
  const [stagedData, setStagedData] = useState<Partial<T> | null>(null);
  const [stagedFields, setStagedFields] = useState<string[]>([]);
  const [requiresPasskey, setRequiresPasskey] = useState(false);

  useEffect(() => {
    if (!stagingId) return;

    async function loadStaging() {
      try {
        const res = await fetch(`/api/starling/staging/${stagingId}`);
        if (!res.ok) {
          if (res.status === 410) {
            toast.error('This staged action has expired. Please try again.');
          }
          return;
        }

        const staging = await res.json();
        setStagedData(staging.formData as Partial<T>);
        setStagedFields(staging.stagedFields);
        setRequiresPasskey(staging.requiresPasskey);

        // Show toast
        toast.info(staging.toastMessage, {
          duration: 10000,
          icon: '🐦',
        });

        // Highlight submit button
        setTimeout(() => {
          const submitBtn = document.querySelector(staging.highlightSelector);
          if (submitBtn) {
            submitBtn.classList.add('starling-highlight');
          }
        }, 100);

      } catch (error) {
        console.error('Failed to load staging:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadStaging();
  }, [stagingId]);

  return { isLoading, stagedData, stagedFields, stagingId, requiresPasskey };
}
```

### 2.5 Form Integration Example

```typescript
// src/app/(member)/events/[id]/register/page.tsx

import { useStagedForm } from '@/lib/starling/useStagedForm';
import { useForm } from 'react-hook-form';

interface RegistrationForm {
  guestCount: number;
  dietaryNotes: string;
}

export default function EventRegistrationPage({ event }) {
  const { stagedData, stagedFields, stagingId, requiresPasskey, isLoading } =
    useStagedForm<RegistrationForm>();

  const form = useForm<RegistrationForm>({
    defaultValues: {
      guestCount: 0,
      dietaryNotes: '',
      // Staged values override defaults
      ...stagedData,
    }
  });

  async function onSubmit(data: RegistrationForm) {
    // If passkey required, verify first
    if (requiresPasskey) {
      const verified = await verifyPasskey();
      if (!verified) return;
    }

    await fetch(`/api/events/${event.id}/register`, {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        // Include staging ID for audit trail
        _stagingId: stagingId,
      }),
    });
  }

  if (isLoading) return <LoadingSpinner />;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <h1>Register for {event.title}</h1>

      <FormField
        label="Number of guests"
        {...form.register('guestCount')}
        // Visual indicator that Starling filled this
        className={stagedFields.includes('guestCount') ? 'starling-staged' : ''}
      />

      <FormField
        label="Dietary restrictions"
        {...form.register('dietaryNotes')}
        className={stagedFields.includes('dietaryNotes') ? 'starling-staged' : ''}
      />

      <Button type="submit">
        Register
      </Button>
    </form>
  );
}
```

### 2.6 Highlight CSS

```css
/* src/styles/starling.css */

/* Pulsing highlight for submit button */
.starling-highlight {
  animation: starling-pulse 2s ease-in-out infinite;
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.4);
}

@keyframes starling-pulse {
  0%, 100% {
    box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.4);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(30, 64, 175, 0.2);
  }
}

/* Indicator for Starling-filled fields */
.starling-staged {
  border-color: #1e40af;
  background-color: rgba(30, 64, 175, 0.05);
}

.starling-staged::before {
  content: '🐦';
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
}
```

---

## 3. Intent Detection

### 3.1 Intent Schema

```typescript
// src/lib/starling/intents.ts

export interface Intent {
  /** Intent identifier (domain:action) */
  id: string;

  /** Human-readable description */
  description: string;

  /** Example utterances that trigger this intent */
  examples: string[];

  /** Entities to extract from the utterance */
  entities: EntitySlot[];

  /** Required context for this intent */
  requiredContext?: {
    page?: string;
    entityType?: string;
    selection?: boolean;
  };

  /** Handler function */
  handler: string;
}

export interface EntitySlot {
  name: string;
  type: 'event' | 'member' | 'date' | 'number' | 'text' | 'committee';
  required: boolean;
  prompt?: string; // Question to ask if missing
}

export const INTENTS: Intent[] = [
  // Event Discovery
  {
    id: 'event:list',
    description: 'List upcoming events',
    examples: [
      'what events are coming up',
      'show me upcoming events',
      'what\'s happening this week',
      'any events this month',
    ],
    entities: [
      { name: 'timeframe', type: 'date', required: false },
      { name: 'category', type: 'text', required: false },
    ],
    handler: 'handleEventList',
  },

  {
    id: 'event:search',
    description: 'Search for specific events',
    examples: [
      'find hiking events',
      'are there any wine tastings',
      'looking for book club',
    ],
    entities: [
      { name: 'query', type: 'text', required: true },
      { name: 'timeframe', type: 'date', required: false },
    ],
    handler: 'handleEventSearch',
  },

  // Event Registration
  {
    id: 'event:register',
    description: 'Register for an event',
    examples: [
      'sign me up for the hiking event',
      'register for the wine tasting',
      'I want to attend the museum tour',
      'add me to the cooking class',
      'rsvp yes',
    ],
    entities: [
      { name: 'eventQuery', type: 'event', required: true, prompt: 'Which event would you like to register for?' },
      { name: 'guestCount', type: 'number', required: false },
    ],
    handler: 'handleEventRegister',
  },

  {
    id: 'event:cancel',
    description: 'Cancel event registration',
    examples: [
      'cancel my registration',
      'I can\'t make it',
      'remove me from the event',
      'unregister',
      'rsvp no',
    ],
    entities: [
      { name: 'eventQuery', type: 'event', required: true, prompt: 'Which event registration do you want to cancel?' },
    ],
    handler: 'handleEventCancel',
  },

  // Event Creation (committee+)
  {
    id: 'event:create',
    description: 'Create a new event',
    examples: [
      'create a new event',
      'schedule a hiking trip',
      'set up a coffee meetup',
      'plan a dinner outing',
    ],
    entities: [
      { name: 'title', type: 'text', required: true, prompt: 'What would you like to call this event?' },
      { name: 'date', type: 'date', required: true, prompt: 'When should it be?' },
      { name: 'location', type: 'text', required: true, prompt: 'Where will it be held?' },
      { name: 'capacity', type: 'number', required: false, prompt: 'Is there a limit on participants?' },
    ],
    handler: 'handleEventCreate',
  },

  // Navigation
  {
    id: 'nav:page',
    description: 'Navigate to a page',
    examples: [
      'take me to my profile',
      'go to events',
      'open settings',
      'show me the calendar',
    ],
    entities: [
      { name: 'destination', type: 'text', required: true },
    ],
    handler: 'handleNavigation',
  },

  // Help
  {
    id: 'help:howto',
    description: 'Answer how-to questions',
    examples: [
      'how do I update my email',
      'how to register for events',
      'where can I see my registrations',
    ],
    entities: [
      { name: 'topic', type: 'text', required: true },
    ],
    handler: 'handleHowTo',
  },

  {
    id: 'help:explain',
    description: 'Explain a feature or policy',
    examples: [
      'what is the guest policy',
      'explain membership tiers',
      'what does sponsor member mean',
    ],
    entities: [
      { name: 'topic', type: 'text', required: true },
    ],
    handler: 'handleExplain',
  },
];
```

### 3.2 Intent Detection Service

```typescript
// src/lib/starling/intentDetector.ts

import { INTENTS, Intent } from './intents';

interface DetectedIntent {
  intent: Intent;
  confidence: number;
  entities: Record<string, unknown>;
  missingEntities: string[];
}

export async function detectIntent(
  message: string,
  context: PageContext | null,
  conversationHistory: Message[]
): Promise<DetectedIntent | null> {

  // Use LLM to classify intent and extract entities
  const prompt = buildIntentPrompt(message, context, conversationHistory);

  const response = await callLLM(prompt, {
    model: 'mistral-7b',
    temperature: 0.1, // Low temp for classification
    maxTokens: 200,
  });

  const parsed = parseIntentResponse(response);

  if (!parsed) return null;

  const intent = INTENTS.find(i => i.id === parsed.intentId);
  if (!intent) return null;

  // Determine which required entities are missing
  const missingEntities = intent.entities
    .filter(e => e.required && !parsed.entities[e.name])
    .map(e => e.name);

  return {
    intent,
    confidence: parsed.confidence,
    entities: parsed.entities,
    missingEntities,
  };
}

function buildIntentPrompt(
  message: string,
  context: PageContext | null,
  history: Message[]
): string {
  return `You are an intent classifier for a membership organization app.

Available intents:
${INTENTS.map(i => `- ${i.id}: ${i.description}`).join('\n')}

Current context:
- Page: ${context?.page ?? 'unknown'}
- Entity: ${context?.entity ? `${context.entity.type} "${context.entity.name}"` : 'none'}
- Available actions: ${context?.availableActions.map(a => a.id).join(', ') ?? 'none'}

Recent conversation:
${history.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}

User message: "${message}"

Respond with JSON:
{
  "intentId": "the matching intent ID or null",
  "confidence": 0.0-1.0,
  "entities": { extracted entity values },
  "reasoning": "brief explanation"
}`;
}
```

---

## 4. Action Planning

### 4.1 Action Planner

```typescript
// src/lib/starling/actionPlanner.ts

import { DetectedIntent } from './intentDetector';
import { PageContext } from './useStarlingContext';
import { StagingPayload } from './types';

interface ActionPlan {
  /** Type of response */
  type: 'answer' | 'navigate' | 'stage' | 'wizard' | 'clarify' | 'escalate';

  /** Text response to user */
  response: string;

  /** Staging payload (if type === 'stage') */
  staging?: Omit<StagingPayload, 'stagingId' | 'userId' | 'expiresAt'>;

  /** Navigation target (if type === 'navigate') */
  navigateTo?: string;

  /** Follow-up question (if type === 'clarify') */
  clarifyQuestion?: string;

  /** Wizard steps (if type === 'wizard') */
  wizardSteps?: WizardStep[];

  /** Escalation contact (if type === 'escalate') */
  escalateTo?: {
    role: string;
    contact?: string;
  };
}

interface WizardStep {
  id: string;
  question: string;
  entityName: string;
  entityType: string;
  completed: boolean;
  value?: unknown;
}

export async function planAction(
  intent: DetectedIntent,
  context: PageContext | null,
  user: User
): Promise<ActionPlan> {

  // Check if user has permission for this intent
  const permitted = await checkPermission(user, intent.intent.id, context);
  if (!permitted) {
    return {
      type: 'escalate',
      response: `That action requires the ${permitted.requiredRole} role. Would you like me to help you contact someone who can assist?`,
      escalateTo: {
        role: permitted.requiredRole,
        contact: permitted.contactInfo,
      }
    };
  }

  // If required entities are missing, start wizard or clarify
  if (intent.missingEntities.length > 0) {
    return buildWizardPlan(intent);
  }

  // Route to appropriate handler
  switch (intent.intent.handler) {
    case 'handleEventRegister':
      return await planEventRegistration(intent, context, user);
    case 'handleEventCreate':
      return await planEventCreation(intent, context, user);
    case 'handleNavigation':
      return await planNavigation(intent, context);
    case 'handleHowTo':
      return await planHowToAnswer(intent);
    // ... other handlers
  }
}

async function planEventRegistration(
  intent: DetectedIntent,
  context: PageContext | null,
  user: User
): Promise<ActionPlan> {

  // Resolve the event from query or context
  const event = await resolveEvent(intent.entities.eventQuery, context);

  if (!event) {
    return {
      type: 'clarify',
      response: "I couldn't find that event. Could you be more specific about which event you'd like to register for?",
      clarifyQuestion: "Which event would you like to register for?",
    };
  }

  // Check if already registered
  const existingReg = await checkRegistration(user.id, event.id);
  if (existingReg) {
    return {
      type: 'answer',
      response: `You're already registered for ${event.title}! It's on ${formatDate(event.startDate)} at ${event.location}.`,
    };
  }

  // Check capacity
  if (event.isFull) {
    return {
      type: 'answer',
      response: `Sorry, ${event.title} is full. Would you like me to add you to the waitlist?`,
      // Could offer waitlist staging here
    };
  }

  // Build staging payload
  return {
    type: 'stage',
    response: `I found ${event.title} on ${formatDate(event.startDate)} at ${event.location}. I'll take you to the registration page with your info ready. Just review and click "Register" to confirm.`,
    staging: {
      conversationId: context?.conversationId ?? '',
      targetRoute: `/events/${event.id}/register`,
      formData: {
        memberId: user.id,
        guestCount: intent.entities.guestCount ?? 0,
      },
      stagedFields: ['memberId', 'guestCount'],
      highlightSelector: 'button[type="submit"]',
      toastMessage: 'Starling prepared your registration. Review and click Register to confirm.',
      requiresPasskey: false,
      metadata: {
        intent: 'event:register',
        originalQuery: intent.entities.eventQuery,
        resolvedEntities: { eventId: event.id, eventTitle: event.title },
      },
    },
  };
}
```

### 4.2 Wizard Flow for Multi-Step Actions

```typescript
// src/lib/starling/wizardManager.ts

export class WizardManager {
  private steps: WizardStep[];
  private currentStepIndex: number = 0;

  constructor(intent: DetectedIntent) {
    // Build steps from missing entities
    this.steps = intent.missingEntities.map(entityName => {
      const entitySpec = intent.intent.entities.find(e => e.name === entityName)!;
      return {
        id: entityName,
        question: entitySpec.prompt ?? `What is the ${entityName}?`,
        entityName,
        entityType: entitySpec.type,
        completed: false,
      };
    });
  }

  get currentStep(): WizardStep | null {
    return this.steps[this.currentStepIndex] ?? null;
  }

  get isComplete(): boolean {
    return this.steps.every(s => s.completed);
  }

  get collectedValues(): Record<string, unknown> {
    return Object.fromEntries(
      this.steps.filter(s => s.completed).map(s => [s.entityName, s.value])
    );
  }

  processResponse(userMessage: string): { nextQuestion: string | null; complete: boolean } {
    const currentStep = this.currentStep;
    if (!currentStep) return { nextQuestion: null, complete: true };

    // Extract value based on entity type
    const value = extractEntityValue(userMessage, currentStep.entityType);

    if (value !== null) {
      currentStep.completed = true;
      currentStep.value = value;
      this.currentStepIndex++;

      const nextStep = this.currentStep;
      if (nextStep) {
        return { nextQuestion: nextStep.question, complete: false };
      } else {
        return { nextQuestion: null, complete: true };
      }
    } else {
      // Couldn't extract value, ask again
      return {
        nextQuestion: `I didn't quite get that. ${currentStep.question}`,
        complete: false
      };
    }
  }

  getSummary(): string {
    return this.steps
      .filter(s => s.completed)
      .map(s => `- ${s.entityName}: ${s.value}`)
      .join('\n');
  }
}
```

---

## 5. Database Schema Additions

```prisma
// prisma/schema.prisma additions

model StarlingConversation {
  id        String   @id @default(cuid())
  userId    String
  user      Member   @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  messages  StarlingMessage[]
  stagings  StarlingStaging[]

  @@index([userId])
}

model StarlingMessage {
  id             String   @id @default(cuid())
  conversationId String
  conversation   StarlingConversation @relation(fields: [conversationId], references: [id])

  role           String   // 'user' | 'assistant'
  content        String

  // For assistant messages
  intent         String?
  confidence     Float?
  actionType     String?  // 'answer' | 'stage' | 'navigate' | etc.

  // Context at time of message
  pageContext    Json?

  createdAt      DateTime @default(now())

  @@index([conversationId])
}

model StarlingStaging {
  id             String   @id
  userId         String
  conversationId String
  conversation   StarlingConversation @relation(fields: [conversationId], references: [id])

  targetRoute    String
  formData       Json
  stagedFields   String[]
  highlightSelector String
  toastMessage   String
  requiresPasskey Boolean @default(false)

  metadata       Json

  createdAt      DateTime @default(now())
  expiresAt      DateTime

  // Tracking
  consumed       Boolean  @default(false)
  consumedAt     DateTime?
  confirmed      Boolean  @default(false)
  confirmedAt    DateTime?

  @@index([userId])
  @@index([expiresAt])
}

model StarlingAudit {
  id             String   @id @default(cuid())
  userId         String
  conversationId String?

  // What happened
  action         String   // 'message' | 'staging_created' | 'staging_consumed' | 'action_confirmed'

  // Details
  userMessage    String?
  assistantResponse String?
  intent         String?
  stagingId      String?
  targetRoute    String?

  // Context
  pageContext    Json?

  createdAt      DateTime @default(now())

  @@index([userId])
  @@index([createdAt])
}
```

---

## 6. API Routes Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/starling/chat` | POST | Send message, get response |
| `/api/starling/context` | POST | Register page context |
| `/api/starling/staging` | POST | Create staging payload |
| `/api/starling/staging/[id]` | GET | Retrieve staging payload |
| `/api/starling/staging/[id]/confirm` | POST | Mark staging as confirmed |
| `/api/starling/history` | GET | Get conversation history |
| `/api/starling/history/[id]` | DELETE | Delete conversation |

---

## Related Documents

- [STARLING_REQUIREMENTS.md](./STARLING_REQUIREMENTS.md) - Functional requirements
- [STARLING_SLM_ARCHITECTURE.md](./STARLING_SLM_ARCHITECTURE.md) - LLM/RAG architecture
- [STARLING_OPERATOR_CONFIG.md](./STARLING_OPERATOR_CONFIG.md) - Configuration options

---

*Technical Specification v1.0 - December 2025*
