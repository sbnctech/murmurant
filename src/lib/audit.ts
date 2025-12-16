// Copyright (c) Santa Barbara Newcomers Club
//
// Minimal audit helper to unblock compilation and provide a consistent call site.
// This is intentionally conservative: it never logs secrets, never throws, and
// can be extended later to write to AuditLog in Prisma.

export type AuditEvent = {
  action: string;
  actorId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
};

function safeMetadata(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== "object") return null;
  return input as Record<string, unknown>;
}

export const audit = {
  async write(event: AuditEvent): Promise<void> {
    // No-op placeholder for now.
    // Future: persist to Prisma AuditLog model and/or structured logging.
    void event;
  },

  async mutation(args: {
    action: string;
    actorId?: string | null;
    targetType?: string | null;
    targetId?: string | null;
    metadata?: unknown;
  }): Promise<void> {
    await audit.write({
      action: args.action,
      actorId: args.actorId ?? null,
      targetType: args.targetType ?? null,
      targetId: args.targetId ?? null,
      metadata: safeMetadata(args.metadata),
    });
  },
};
