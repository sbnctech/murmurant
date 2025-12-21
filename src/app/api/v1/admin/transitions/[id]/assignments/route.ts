import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { errors } from "@/lib/api";
import { auditMutation } from "@/lib/audit";
import { addAssignment, createAssignmentSchema } from "@/lib/serviceHistory";
import {
  canAssignRoles,
  canAssignToCommittee,
  createDelegationAuditMetadata,
} from "@/lib/auth/delegation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/admin/transitions/:id/assignments
 *
 * Add an assignment to a transition plan (DRAFT status only).
 * Requires users:manage capability.
 *
 * Request body:
 * - memberId: UUID (required)
 * - serviceType: ServiceType (required)
 * - roleTitle: string (required)
 * - committeeId: UUID (optional)
 * - isOutgoing: boolean (required)
 * - existingServiceId: UUID (optional, for outgoing)
 * - notes: string (optional)
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "users:manage");
  if (!auth.ok) return auth.response;

  const { id: planId } = await params;

  try {
    const body = await req.json();

    const parseResult = createAssignmentSchema.safeParse(body);
    if (!parseResult.success) {
      return errors.validation(
        parseResult.error.issues.map((e) => e.message).join(", ")
      );
    }

    // DM-3: Check if user has authority to assign roles at all
    // Charter P2: Default deny, least privilege
    if (!canAssignRoles(auth.context.globalRole)) {
      await auditMutation(req, auth.context, {
        action: "CREATE",
        capability: "roles:assign",
        objectType: "TransitionAssignment",
        objectId: planId,
        metadata: createDelegationAuditMetadata("ASSIGNMENT_DENIED_NO_AUTHORITY", {
          assignerMemberId: auth.context.memberId,
          assignerRole: auth.context.globalRole,
          targetCommitteeId: parseResult.data.committeeId,
          reason: "User lacks roles:assign capability",
        }),
      });
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "You do not have authority to assign roles. Required capability: roles:assign",
          code: "DELEGATION_DENIED_DM3",
        },
        { status: 403 }
      );
    }

    // DM-4: Check if target committee is within user's delegation scope
    // Charter P2: Object-scoped authorization
    if (parseResult.data.committeeId) {
      const scopeCheck = await canAssignToCommittee(
        auth.context.memberId,
        auth.context.globalRole,
        parseResult.data.committeeId
      );

      if (!scopeCheck.allowed) {
        await auditMutation(req, auth.context, {
          action: "CREATE",
          capability: "roles:assign",
          objectType: "TransitionAssignment",
          objectId: planId,
          metadata: createDelegationAuditMetadata("CROSS_SCOPE_BLOCKED", {
            assignerMemberId: auth.context.memberId,
            assignerRole: auth.context.globalRole,
            targetCommitteeId: parseResult.data.committeeId,
            reason: scopeCheck.reason,
          }),
        });
        return NextResponse.json(
          {
            error: "Forbidden",
            message: scopeCheck.reason || "Cannot assign roles outside your committee scope",
            code: "DELEGATION_DENIED_DM4",
            assignerCommittees: scopeCheck.assignerCommittees,
            targetCommittee: scopeCheck.targetCommitteeId,
          },
          { status: 403 }
        );
      }
    }

    const assignment = await addAssignment(planId, parseResult.data);

    await auditMutation(req, auth.context, {
      action: "CREATE",
      capability: "users:manage",
      objectType: "TransitionAssignment",
      objectId: assignment.id,
      metadata: { planId, isOutgoing: assignment.isOutgoing, roleTitle: assignment.roleTitle },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("Error adding assignment:", error);
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return errors.notFound("TransitionPlan", planId);
      }
      if (error.message.includes("DRAFT")) {
        return errors.conflict("Can only add assignments to DRAFT plans", {
          planId,
        });
      }
      return errors.internal(error.message);
    }
    return errors.internal("Failed to add assignment");
  }
}
