// Copyright (c) Murmurant, Inc.
// Starling chatbot type definitions

import type { GlobalRole } from "@/lib/auth";

// ============================================================================
// RBAC & VISIBILITY
// ============================================================================

/**
 * Knowledge visibility levels (strict hierarchy)
 * - public: Anyone, including unauthenticated visitors
 * - member: Any authenticated member
 * - staff: Officers, chairs, and admins
 */
export type KnowledgeVisibility = "public" | "member" | "staff";

/**
 * Map GlobalRole to visibility level for filtering
 * Staff roles see everything; members see member+public; public sees public only
 */
export function getVisibilityForRole(role: GlobalRole | null): KnowledgeVisibility {
  if (!role) return "public";

  // Staff-level roles (officers, chairs, admins)
  const staffRoles: GlobalRole[] = [
    "admin",
    "president",
    "past-president",
    "vp-activities",
    "vp-communications",
    "event-chair",
    "webmaster",
    "secretary",
    "parliamentarian",
  ];

  if (staffRoles.includes(role)) return "staff";
  return "member";
}

/**
 * Check if a user can see content at a given visibility level
 */
export function canSeeVisibility(
  userVisibility: KnowledgeVisibility,
  contentVisibility: KnowledgeVisibility
): boolean {
  const hierarchy: KnowledgeVisibility[] = ["public", "member", "staff"];
  return hierarchy.indexOf(userVisibility) >= hierarchy.indexOf(contentVisibility);
}

// ============================================================================
// RESPONSE TONE
// ============================================================================

/**
 * Response tone based on user role
 * - technical: Direct, jargon-friendly, less hand-holding (webmaster, admin)
 * - operational: Efficient, action-oriented (officers)
 * - friendly: Warm, accessible, more context (regular members)
 */
export type ResponseTone = "technical" | "operational" | "friendly";

/**
 * Get appropriate response tone for a role
 */
export function getToneForRole(role: GlobalRole | null): ResponseTone {
  if (!role) return "friendly";

  // Technical roles get direct, jargon-friendly responses
  if (role === "admin" || role === "webmaster") return "technical";

  // Officers get operational, efficient responses
  const operationalRoles: GlobalRole[] = [
    "president",
    "past-president",
    "vp-activities",
    "vp-communications",
    "secretary",
    "parliamentarian",
    "event-chair",
  ];

  if (operationalRoles.includes(role)) return "operational";

  return "friendly";
}

/**
 * Tone-specific system prompt additions
 */
export const TONE_PROMPTS: Record<ResponseTone, string> = {
  technical: `You are speaking with a technical user (likely the webmaster or admin).
Be direct and concise. Skip unnecessary pleasantries. Use technical terminology freely.
If there are multiple approaches, briefly list tradeoffs. Don't sugarcoat issues.
Format: bullet points, code snippets where relevant, no fluff.
Example: "pgvector index needs VACUUM after bulk inserts. Run: npm run starling:sync"`,

  operational: `You are speaking with a club officer (board member, chair, or similar dignitary).
Address them with the mock respect befitting their elevated station. A light, knowing tone
that acknowledges their Important Role while being genuinely helpful.
Be efficient and action-oriented. Focus on what they can do, not background they already know.
Highlight deadlines, dependencies, and who needs to approve what.
Example: "As befits your distinguished office, you have the power to approve this directly.
The VP Activities will also need to sign off. Deadline: Friday."`,

  friendly: `You are speaking with a club member. Be warm and helpful.
Explain context and background when useful. Avoid jargon or explain it.
Offer to help with related questions. Be encouraging.
Format: conversational, with clear explanations and helpful suggestions.
Example: "Great question! Here's how to register for events..."`,
};

/**
 * User context for Starling (combines auth + preferences)
 */
export interface StarlingUserContext {
  userId: string;
  memberId?: string;
  email: string;
  displayName: string;
  globalRole: GlobalRole;
  organizationId?: string;

  // Derived
  visibility: KnowledgeVisibility;
  tone: ResponseTone;
}

/**
 * Build Starling user context from session
 */
export function buildStarlingUserContext(session: {
  userAccountId: string;
  memberId?: string;
  email: string;
  displayName: string;
  globalRole: GlobalRole;
  organizationId?: string;
}): StarlingUserContext {
  return {
    userId: session.userAccountId,
    memberId: session.memberId,
    email: session.email,
    displayName: session.displayName,
    globalRole: session.globalRole,
    organizationId: session.organizationId,
    visibility: getVisibilityForRole(session.globalRole),
    tone: getToneForRole(session.globalRole),
  };
}

// ============================================================================
// PAGE CONTEXT
// ============================================================================

/**
 * Page context registered by components
 */
export interface PageContext {
  /** Unique page identifier (e.g., 'event-detail', 'member-profile') */
  page: string;

  /** Human-readable page title */
  pageTitle: string;

  /** Entity being viewed (if any) */
  entity?: EntityContext;

  /** Actions available on this page for current user */
  availableActions: AvailableAction[];

  /** Current page state relevant to Starling */
  state?: Record<string, unknown>;

  /** Selected items (for bulk operations) */
  selection?: SelectionContext;
}

export interface EntityContext {
  type: "event" | "member" | "committee" | "announcement" | "registration";
  id: string;
  name: string;
  /** Additional entity data Starling might need */
  data?: Record<string, unknown>;
}

export interface SelectionContext {
  type: string;
  ids: string[];
  names?: string[];
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
  type: "text" | "number" | "date" | "select" | "boolean";
  label: string;
  required: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: unknown;
}

/**
 * Staging payload for form pre-filling
 */
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
  highlightSelector: string;

  /** Toast message to show */
  toastMessage: string;

  /** When this staging expires */
  expiresAt: Date;

  /** Whether this action requires passkey */
  requiresPasskey: boolean;

  /** Metadata for audit trail */
  metadata: StagingMetadata;
}

export interface StagingMetadata {
  intent: string;
  originalQuery: string;
  resolvedEntities: Record<string, unknown>;
}

/**
 * Chat message in conversation
 */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;

  /** For assistant messages */
  intent?: string;
  confidence?: number;
  actionType?: ActionType;

  /** Staging action (if any) */
  staging?: {
    stagingId: string;
    targetRoute: string;
    buttonLabel: string;
  };

  /** Sources cited */
  sources?: string[];
}

export type ActionType =
  | "answer"
  | "navigate"
  | "stage"
  | "wizard"
  | "clarify"
  | "escalate";

/**
 * Conversation session
 */
export interface Conversation {
  id: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Intent definition
 */
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

  /** Handler function name */
  handler: string;
}

export interface EntitySlot {
  name: string;
  type: "event" | "member" | "date" | "number" | "text" | "committee";
  required: boolean;
  /** Question to ask if missing */
  prompt?: string;
}

/**
 * Detected intent with extracted entities
 */
export interface DetectedIntent {
  /** Intent identifier (e.g., "event:list", "nav:profile") */
  intent: string;
  confidence: number;
  entities: Record<string, string>;
  rawMessage: string;
}

/**
 * Action plan response
 * Simpler structure for quick intent-based actions
 */
export interface ActionPlan {
  /** Type of response */
  type: ActionType;

  /** Description of the action */
  description?: string;

  /** Text response to user */
  response?: string;

  /** Navigation target (if type === 'navigate' or 'stage') */
  target?: string;

  /** Staging payload (if type === 'stage') */
  staging?: Omit<StagingPayload, "stagingId" | "userId" | "expiresAt">;

  /** Form data for staging */
  formData?: Record<string, unknown>;

  /** Navigation target (if type === 'navigate') - alias for target */
  navigateTo?: string;

  /** Follow-up question (if type === 'clarify') */
  clarifyQuestion?: string;

  /** Suggested follow-up actions */
  suggestions?: string[];

  /** Wizard steps (if type === 'wizard') */
  wizardSteps?: WizardStep[];

  /** Escalation contact (if type === 'escalate') */
  escalateTo?: {
    role: string;
    contact?: string;
  };

  /** Additional data */
  data?: Record<string, unknown>;

  /** Sources cited */
  sources?: string[];
}

export interface WizardStep {
  id: string;
  question: string;
  entityName: string;
  entityType: string;
  completed: boolean;
  value?: unknown;
}

/**
 * Chat API request
 */
export interface ChatRequest {
  message: string;
  conversationId?: string;
  pageContext?: PageContext;
}

/**
 * Chat API response
 */
export interface ChatResponse {
  conversationId: string;
  message: ChatMessage;
}

/**
 * Audit entry for Starling interactions
 */
export interface StarlingAuditEntry {
  id: string;
  userId: string;
  conversationId?: string;
  timestamp: Date;

  action:
    | "message"
    | "staging_created"
    | "staging_consumed"
    | "action_confirmed"
    | "permission_denied";

  userMessage?: string;
  assistantResponse?: string;
  intent?: string;
  confidence?: number;

  stagingId?: string;
  targetRoute?: string;

  pageContext?: PageContext;
}
