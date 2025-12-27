/**
 * Admin Action Guards with Audit Logging
 *
 * Security Invariants:
 * - AG-1: All guarded actions produce audit entries
 * - AG-2: Denied actions are logged with denial reason
 * - AG-3: Actor identity is always captured
 * - AG-4: Before/after state captured for mutations
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { NextRequest } from "next/server";
import { EventStatus, AuditAction } from "@prisma/client";
import { AuthContext, hasCapability } from "@/lib/auth";
import { createAuditEntry } from "@/lib/audit";
import {
  EventRowContext,
  EventAction,
  PolicyDecision,
  canViewEvent,
  canEditEventContent,
  canEditEventStatus,
  canDeleteEvent,
  canRegisterForEvent,
  buildEventAuditContext,
} from "./event-row-policy";

export type GuardResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "INVALID_STATE"; auditId?: string };

export interface GuardContext {
  actor: AuthContext;
  req?: NextRequest;
  event: EventRowContext;
}

export interface GuardOptions {
  skipAudit?: boolean;
  metadata?: Record<string, unknown>;
}

function mapToAuditAction(action: EventAction, allowed: boolean): AuditAction {
  if (action === "delete" && !allowed) return "DELETE";
  switch (action) {
    case "view":
    case "view_details":
    case "edit_content":
    case "edit_status":
      return "UPDATE";
    case "delete":
      return "DELETE";
    case "register":
      return "EVENT_REGISTER";
    case "cancel_registration":
      return "EVENT_CANCEL_REGISTRATION";
    default:
      return "UPDATE";
  }
}

async function auditGuardAction(
  action: EventAction,
  ctx: GuardContext,
  decision: PolicyDecision,
  opts?: GuardOptions
): Promise<void> {
  if (opts?.skipAudit) return;
  const auditContext = buildEventAuditContext(action, ctx.actor, ctx.event, decision);
  await createAuditEntry({
    action: mapToAuditAction(action, decision.allowed),
    resourceType: "Event",
    resourceId: ctx.event.id,
    actor: ctx.actor,
    req: ctx.req,
    metadata: { ...auditContext, ...opts?.metadata, guardAction: action, decision: decision.allowed ? "ALLOWED" : "DENIED" },
  });
}

export async function guardViewEvent(ctx: GuardContext, opts?: GuardOptions): Promise<GuardResult<PolicyDecision>> {
  const decision = canViewEvent(ctx.actor, ctx.event);
  await auditGuardAction("view", ctx, decision, opts);
  if (!decision.allowed) return { ok: false, error: decision.reason, code: "FORBIDDEN" };
  return { ok: true, data: decision };
}

export async function guardEditEventContent(ctx: GuardContext, opts?: GuardOptions): Promise<GuardResult<PolicyDecision>> {
  const decision = canEditEventContent(ctx.actor, ctx.event);
  await auditGuardAction("edit_content", ctx, decision, opts);
  if (!decision.allowed) return { ok: false, error: decision.reason, code: decision.reason.includes("status") ? "INVALID_STATE" : "FORBIDDEN" };
  return { ok: true, data: decision };
}

export async function guardEditEventStatus(ctx: GuardContext, targetStatus: EventStatus, opts?: GuardOptions): Promise<GuardResult<PolicyDecision>> {
  const decision = canEditEventStatus(ctx.actor, ctx.event, targetStatus);
  await createAuditEntry({
    action: "UPDATE",
    resourceType: "Event",
    resourceId: ctx.event.id,
    actor: ctx.actor,
    req: ctx.req,
    before: { status: ctx.event.status },
    after: { status: targetStatus },
    metadata: { ...buildEventAuditContext("edit_status", ctx.actor, ctx.event, decision), targetStatus, transition: `${ctx.event.status} -> ${targetStatus}`, decision: decision.allowed ? "ALLOWED" : "DENIED", ...opts?.metadata },
  });
  if (!decision.allowed) return { ok: false, error: decision.reason, code: "FORBIDDEN" };
  return { ok: true, data: decision };
}

export async function guardDeleteEvent(ctx: GuardContext, opts?: GuardOptions): Promise<GuardResult<PolicyDecision>> {
  const decision = canDeleteEvent(ctx.actor, ctx.event);
  await auditGuardAction("delete", ctx, decision, opts);
  if (!decision.allowed) return { ok: false, error: decision.reason, code: "FORBIDDEN" };
  return { ok: true, data: decision };
}

export async function guardEventRegistration(ctx: GuardContext, opts?: GuardOptions): Promise<GuardResult<PolicyDecision>> {
  const decision = canRegisterForEvent(ctx.actor, ctx.event);
  await auditGuardAction("register", ctx, decision, opts);
  if (!decision.allowed) return { ok: false, error: decision.reason, code: decision.reason.includes("Authentication") ? "UNAUTHORIZED" : "FORBIDDEN" };
  return { ok: true, data: decision };
}

export async function guardBulkStatusChange(
  actor: AuthContext,
  events: EventRowContext[],
  targetStatus: EventStatus,
  req?: NextRequest,
  opts?: GuardOptions
): Promise<{ allowed: EventRowContext[]; denied: Array<{ event: EventRowContext; reason: string }> }> {
  const allowed: EventRowContext[] = [];
  const denied: Array<{ event: EventRowContext; reason: string }> = [];
  for (const event of events) {
    const decision = canEditEventStatus(actor, event, targetStatus);
    await createAuditEntry({
      action: "UPDATE",
      resourceType: "Event",
      resourceId: event.id,
      actor,
      req,
      before: { status: event.status },
      after: { status: targetStatus },
      metadata: { bulkOperation: true, targetStatus, decision: decision.allowed ? "ALLOWED" : "DENIED", reason: decision.reason, ...opts?.metadata },
    });
    if (decision.allowed) allowed.push(event);
    else denied.push({ event, reason: decision.reason });
  }
  return { allowed, denied };
}

export function canPerformAdminOverride(actor: AuthContext): boolean {
  return hasCapability(actor.globalRole, "admin:full");
}

export async function guardAdminOverride(
  action: EventAction,
  ctx: GuardContext,
  justification: string,
  opts?: GuardOptions
): Promise<GuardResult<void>> {
  if (!canPerformAdminOverride(ctx.actor)) {
    await createAuditEntry({
      action: "UPDATE",
      resourceType: "Event",
      resourceId: ctx.event.id,
      actor: ctx.actor,
      req: ctx.req,
      metadata: { action, override: "ATTEMPTED", justification, decision: "DENIED", reason: "Actor does not have admin:full capability", ...opts?.metadata },
    });
    return { ok: false, error: "Admin override requires admin:full capability", code: "FORBIDDEN" };
  }
  await createAuditEntry({
    action: "UPDATE",
    resourceType: "Event",
    resourceId: ctx.event.id,
    actor: ctx.actor,
    req: ctx.req,
    metadata: { action, override: "APPROVED", justification, decision: "ALLOWED", reason: "Admin override with justification", normalPolicyWouldDeny: !canViewEvent(ctx.actor, ctx.event).allowed, ...opts?.metadata },
  });
  return { ok: true, data: undefined };
}

export interface EscalationAttempt {
  type: "role_bypass" | "status_bypass" | "ownership_bypass" | "capability_bypass";
  actor: AuthContext;
  event: EventRowContext;
  attemptedAction: EventAction;
  denialReason: string;
}

export async function logEscalationAttempt(attempt: EscalationAttempt, req?: NextRequest): Promise<void> {
  await createAuditEntry({
    action: "UPDATE",
    resourceType: "Event",
    resourceId: attempt.event.id,
    actor: attempt.actor,
    req,
    metadata: { escalationType: attempt.type, attemptedAction: attempt.attemptedAction, denialReason: attempt.denialReason, actorRole: attempt.actor.globalRole, eventStatus: attempt.event.status, isEventChair: attempt.actor.memberId === attempt.event.eventChairId, securityAlert: true },
  });
  console.warn(`[SECURITY] Escalation attempt: ${attempt.type} by ${attempt.actor.email} (${attempt.actor.globalRole}) on event ${attempt.event.id}`);
}

export function detectEscalationPattern(action: EventAction, actor: AuthContext, event: EventRowContext, denialReason: string): EscalationAttempt | null {
  if (actor.globalRole === "member" && action === "edit_content") {
    return { type: "role_bypass", actor, event, attemptedAction: action, denialReason };
  }
  if (action === "delete" && !hasCapability(actor.globalRole, "events:delete")) {
    return { type: "capability_bypass", actor, event, attemptedAction: action, denialReason };
  }
  if (actor.globalRole === "event-chair" && event.eventChairId !== actor.memberId && (action === "edit_content" || action === "edit_status")) {
    return { type: "ownership_bypass", actor, event, attemptedAction: action, denialReason };
  }
  if (action === "edit_content" && !["DRAFT", "CHANGES_REQUESTED"].includes(event.status)) {
    return { type: "status_bypass", actor, event, attemptedAction: action, denialReason };
  }
  return null;
}
