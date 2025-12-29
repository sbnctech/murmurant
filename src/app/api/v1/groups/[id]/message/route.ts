/**
 * Activity Group Message API
 * POST /api/v1/groups/:id/message - Send message to all group members (coordinator only)
 *
 * Charter: P2 (scoped access), P1 (audit)
 *
 * Copyright (c) Murmurant, Inc.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { errors } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { canMessageGroup } from "@/lib/groups";
import { sendEmail } from "@/lib/email";

// Type for Prisma query result
interface MembershipWithMember {
  member: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

// Type for recipient after mapping
interface Recipient {
  id: string;
  email: string;
  name: string;
}

/**
 * POST /api/v1/groups/:id/message
 * Send a message to all group members (coordinator only)
 *
 * Body: {
 *   subject: string,
 *   body: string (plain text or HTML),
 *   isHtml?: boolean (default false)
 * }
 *
 * Note: This sends individual emails to each member.
 * Future enhancement: Use BCC or proper mailing list integration.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;

  try {
    // Check if user can message this group
    if (!(await canMessageGroup(auth.context, id))) {
      return errors.forbidden("Not authorized to send group messages");
    }

    const group = await prisma.activityGroup.findUnique({
      where: { id },
      include: {
        members: {
          where: { leftAt: null },
          include: {
            member: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      return errors.notFound("ActivityGroup", id);
    }

    if (group.status !== "APPROVED") {
      return errors.validation("Cannot send messages to non-approved groups");
    }

    const body = await request.json();
    const { subject, body: messageBody, isHtml } = body;

    if (
      !subject ||
      typeof subject !== "string" ||
      subject.trim().length === 0
    ) {
      return errors.validation("subject is required");
    }

    if (
      !messageBody ||
      typeof messageBody !== "string" ||
      messageBody.trim().length === 0
    ) {
      return errors.validation("body is required");
    }

    // Get sender info
    const sender = await prisma.member.findUnique({
      where: { id: auth.context.memberId },
      select: { firstName: true, lastName: true },
    });

    const senderName = sender
      ? `${sender.firstName} ${sender.lastName}`
      : "Group Coordinator";

    // Prepare email content
    const emailSubject = `[${group.name}] ${subject.trim()}`;
    const recipients: Recipient[] = (
      group.members as MembershipWithMember[]
    )
      .map((m: MembershipWithMember) => ({
        id: m.member.id,
        email: m.member.email,
        name: `${m.member.firstName} ${m.member.lastName}`,
      }))
      .filter((r: Recipient) => r.email); // Only members with email addresses

    if (recipients.length === 0) {
      return errors.validation("No members with email addresses to message");
    }

    // Send emails to all members
    const results: Array<{
      memberId: string;
      email: string;
      success: boolean;
      messageId?: string;
      error?: string;
    }> = [];

    for (const recipient of recipients) {
      try {
        const result = await sendEmail({
          to: recipient.email,
          subject: emailSubject,
          ...(isHtml === true
            ? { html: messageBody.trim() }
            : { text: messageBody.trim() }),
        });
        results.push({
          memberId: recipient.id,
          email: recipient.email,
          success: true,
          messageId: result.messageId,
        });
      } catch (error) {
        results.push({
          memberId: recipient.id,
          email: recipient.email,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "GROUP_MESSAGE_SEND",
        resourceType: "ActivityGroup",
        resourceId: id,
        memberId: auth.context.memberId,
        after: {
          subject: emailSubject,
          recipientCount: recipients.length,
          successCount,
          failureCount,
          isHtml: isHtml === true,
        },
      },
    });

    return NextResponse.json({
      groupId: id,
      groupName: group.name,
      subject: emailSubject,
      sentBy: senderName,
      recipientCount: recipients.length,
      successCount,
      failureCount,
      message:
        failureCount === 0
          ? `Message sent to ${successCount} members`
          : `Message sent to ${successCount} members, ${failureCount} failed`,
      ...(failureCount > 0
        ? {
            failures: results
              .filter((r) => !r.success)
              .map((r) => ({ email: r.email, error: r.error })),
          }
        : {}),
    });
  } catch (error) {
    console.error("Error sending group message:", error);
    return errors.internal("Failed to send group message");
  }
}
