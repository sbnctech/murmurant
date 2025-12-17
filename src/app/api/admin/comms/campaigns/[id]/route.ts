// Copyright (c) Santa Barbara Newcomers Club
// Message campaign management API - Get, Update, Delete, Send

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/auth";
import { createAuditLog } from "@/lib/publishing/permissions";
import { resolveMailingListRecipients } from "@/lib/publishing/audience";
import { replaceTokens, getEmailProvider } from "@/lib/publishing/email";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/admin/comms/campaigns/[id] - Get campaign by ID
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "comms:manage");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const campaign = await prisma.messageCampaign.findUnique({
    where: { id },
    include: {
      messageTemplate: { select: { id: true, name: true, slug: true, subject: true, bodyHtml: true, bodyText: true } },
      mailingList: { select: { id: true, name: true, slug: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (!campaign) {
    return NextResponse.json(
      { error: "Not Found", message: "Campaign not found" },
      { status: 404 }
    );
  }

  // Get delivery stats
  const stats = await prisma.deliveryLog.groupBy({
    by: ["status"],
    where: { campaignId: id },
    _count: { status: true },
  });

  const deliveryStats = {
    total: 0,
    delivered: 0,
    failed: 0,
    bounced: 0,
    pending: 0,
  };

  for (const stat of stats) {
    deliveryStats.total += stat._count.status;
    if (stat.status === "DELIVERED") deliveryStats.delivered = stat._count.status;
    if (stat.status === "FAILED") deliveryStats.failed = stat._count.status;
    if (stat.status === "BOUNCED") deliveryStats.bounced = stat._count.status;
    if (stat.status === "PENDING") deliveryStats.pending = stat._count.status;
  }

  return NextResponse.json({ campaign, deliveryStats });
}

// PUT /api/admin/comms/campaigns/[id] - Update campaign
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "comms:manage");
  if (!auth.ok) return auth.response;

  if (auth.context.globalRole !== "admin") {
    return NextResponse.json(
      { error: "Forbidden", message: "Only administrators can edit campaigns" },
      { status: 403 }
    );
  }

  const { id } = await params;

  const existing = await prisma.messageCampaign.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Not Found", message: "Campaign not found" },
      { status: 404 }
    );
  }

  // Cannot edit campaigns that are sending or sent
  if (existing.status === "SENDING" || existing.status === "SENT") {
    return NextResponse.json(
      { error: "Bad Request", message: "Cannot edit a campaign that is sending or has been sent" },
      { status: 400 }
    );
  }

  let body: {
    name?: string;
    messageTemplateId?: string;
    mailingListId?: string | null;
    audienceRuleId?: string | null;
    scheduledAt?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Validate template if provided
  if (body.messageTemplateId) {
    const template = await prisma.messageTemplate.findUnique({
      where: { id: body.messageTemplateId },
    });
    if (!template) {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid messageTemplateId" },
        { status: 400 }
      );
    }
  }

  // Validate mailing list if provided
  if (body.mailingListId) {
    const mailingList = await prisma.mailingList.findUnique({
      where: { id: body.mailingListId },
    });
    if (!mailingList) {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid mailingListId" },
        { status: 400 }
      );
    }
  }

  const campaign = await prisma.messageCampaign.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      messageTemplateId: body.messageTemplateId ?? existing.messageTemplateId,
      mailingListId: body.mailingListId !== undefined ? body.mailingListId : existing.mailingListId,
      audienceRuleId: body.audienceRuleId !== undefined ? body.audienceRuleId : existing.audienceRuleId,
      scheduledAt: body.scheduledAt !== undefined
        ? (body.scheduledAt ? new Date(body.scheduledAt) : null)
        : existing.scheduledAt,
    },
    include: {
      messageTemplate: { select: { id: true, name: true } },
      mailingList: { select: { id: true, name: true } },
    },
  });

  await createAuditLog({
    action: "UPDATE",
    resourceType: "campaign",
    resourceId: campaign.id,
    memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
    before: { name: existing.name, status: existing.status },
    after: { name: campaign.name, status: campaign.status },
  });

  return NextResponse.json({ campaign });
}

// DELETE /api/admin/comms/campaigns/[id] - Delete campaign
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "comms:manage");
  if (!auth.ok) return auth.response;

  if (auth.context.globalRole !== "admin") {
    return NextResponse.json(
      { error: "Forbidden", message: "Only administrators can delete campaigns" },
      { status: 403 }
    );
  }

  const { id } = await params;

  const existing = await prisma.messageCampaign.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Not Found", message: "Campaign not found" },
      { status: 404 }
    );
  }

  // Cannot delete campaigns that are currently sending
  if (existing.status === "SENDING") {
    return NextResponse.json(
      { error: "Bad Request", message: "Cannot delete a campaign that is currently sending" },
      { status: 400 }
    );
  }

  // Delete delivery logs first
  await prisma.deliveryLog.deleteMany({ where: { campaignId: id } });

  // Delete campaign
  await prisma.messageCampaign.delete({ where: { id } });

  await createAuditLog({
    action: "DELETE",
    resourceType: "campaign",
    resourceId: id,
    memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
    before: { name: existing.name, status: existing.status },
  });

  return NextResponse.json({ success: true });
}

// POST /api/admin/comms/campaigns/[id] - Send, schedule, or cancel campaign
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "comms:manage");
  if (!auth.ok) return auth.response;

  if (auth.context.globalRole !== "admin") {
    return NextResponse.json(
      { error: "Forbidden", message: "Only administrators can send campaigns" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  const existing = await prisma.messageCampaign.findUnique({
    where: { id },
    include: {
      messageTemplate: true,
      mailingList: true,
    },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Not Found", message: "Campaign not found" },
      { status: 404 }
    );
  }

  if (action === "send") {
    // Validate campaign is ready to send
    if (existing.status !== "DRAFT" && existing.status !== "SCHEDULED") {
      return NextResponse.json(
        { error: "Bad Request", message: "Campaign must be in DRAFT or SCHEDULED status to send" },
        { status: 400 }
      );
    }

    if (!existing.mailingListId) {
      return NextResponse.json(
        { error: "Bad Request", message: "Campaign must have a mailing list" },
        { status: 400 }
      );
    }

    const template = existing.messageTemplate;
    if (!template) {
      return NextResponse.json(
        { error: "Bad Request", message: "Campaign must have a message template" },
        { status: 400 }
      );
    }

    // Mark campaign as sending
    await prisma.messageCampaign.update({
      where: { id },
      data: { status: "SENDING" },
    });

    // Get recipients
    const recipients = await resolveMailingListRecipients(existing.mailingListId);

    if (recipients.length === 0) {
      await prisma.messageCampaign.update({
        where: { id },
        data: { status: "DRAFT" },
      });
      return NextResponse.json(
        { error: "Bad Request", message: "Mailing list has no recipients" },
        { status: 400 }
      );
    }

    // Create delivery logs and send emails
    const emailProvider = getEmailProvider();
    let successCount = 0;
    let failCount = 0;

    for (const recipient of recipients) {
      // Create pending delivery log
      const deliveryLog = await prisma.deliveryLog.create({
        data: {
          campaignId: id,
          recipientId: recipient.id,
          recipientEmail: recipient.email,
          status: "PENDING",
        },
      });

      try {
        // Replace tokens with member data
        const tokenContext = {
          member: {
            id: recipient.id,
            firstName: recipient.firstName,
            lastName: recipient.lastName,
            email: recipient.email,
          },
          club: {
            name: "Santa Barbara Newcomers Club",
            website: "https://sbnewcomers.org",
            email: "info@sbnewcomers.org",
          },
        };

        const personalizedSubject = replaceTokens(template.subject, tokenContext);
        const personalizedHtml = replaceTokens(template.bodyHtml, tokenContext);
        const personalizedText = template.bodyText ? replaceTokens(template.bodyText, tokenContext) : undefined;

        // Send email
        const result = await emailProvider.send({
          to: recipient.email,
          subject: personalizedSubject,
          html: personalizedHtml,
          text: personalizedText,
        });

        // Update delivery log
        await prisma.deliveryLog.update({
          where: { id: deliveryLog.id },
          data: {
            status: result.success ? "DELIVERED" : "FAILED",
            providerMsgId: result.messageId,
            bounceReason: result.error,
            sentAt: result.success ? new Date() : null,
          },
        });

        if (result.success) successCount++;
        else failCount++;
      } catch (error) {
        // Update delivery log with error
        await prisma.deliveryLog.update({
          where: { id: deliveryLog.id },
          data: {
            status: "FAILED",
            bounceReason: error instanceof Error ? error.message : "Unknown error",
          },
        });
        failCount++;
      }
    }

    // Update campaign status
    const campaign = await prisma.messageCampaign.update({
      where: { id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        totalRecipients: recipients.length,
        successCount,
        failureCount: failCount,
      },
    });

    await createAuditLog({
      action: "SEND",
      resourceType: "campaign",
      resourceId: campaign.id,
      memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
      after: {
        status: "SENT",
        recipientCount: recipients.length,
        successCount,
        failCount,
      },
    });

    return NextResponse.json({
      campaign,
      message: `Campaign sent to ${recipients.length} recipients`,
      stats: { total: recipients.length, success: successCount, failed: failCount },
    });
  }

  if (action === "schedule") {
    // Parse scheduled time from body
    let body: { scheduledAt: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    if (!body.scheduledAt) {
      return NextResponse.json(
        { error: "Bad Request", message: "scheduledAt is required" },
        { status: 400 }
      );
    }

    const scheduledAt = new Date(body.scheduledAt);
    if (scheduledAt <= new Date()) {
      return NextResponse.json(
        { error: "Bad Request", message: "scheduledAt must be in the future" },
        { status: 400 }
      );
    }

    const campaign = await prisma.messageCampaign.update({
      where: { id },
      data: {
        status: "SCHEDULED",
        scheduledAt,
      },
    });

    await createAuditLog({
      action: "UPDATE",
      resourceType: "campaign",
      resourceId: campaign.id,
      memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
      after: { status: "SCHEDULED", scheduledAt: scheduledAt.toISOString() },
    });

    return NextResponse.json({ campaign, message: "Campaign scheduled" });
  }

  if (action === "cancel") {
    if (existing.status !== "SCHEDULED") {
      return NextResponse.json(
        { error: "Bad Request", message: "Only scheduled campaigns can be cancelled" },
        { status: 400 }
      );
    }

    const campaign = await prisma.messageCampaign.update({
      where: { id },
      data: {
        status: "CANCELLED",
        scheduledAt: null,
      },
    });

    await createAuditLog({
      action: "UPDATE",
      resourceType: "campaign",
      resourceId: campaign.id,
      memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
      after: { status: "CANCELLED" },
    });

    return NextResponse.json({ campaign, message: "Campaign cancelled" });
  }

  if (action === "preview") {
    const template = existing.messageTemplate;
    if (!template) {
      return NextResponse.json(
        { error: "Bad Request", message: "Campaign must have a message template for preview" },
        { status: 400 }
      );
    }

    // Use sample member data for preview
    const sampleContext = {
      member: {
        id: "sample-id",
        firstName: "Sample",
        lastName: "Member",
        email: "sample@example.com",
      },
      club: {
        name: "Santa Barbara Newcomers Club",
        website: "https://sbnewcomers.org",
        email: "info@sbnewcomers.org",
      },
    };

    return NextResponse.json({
      preview: {
        subject: replaceTokens(template.subject, sampleContext),
        bodyHtml: replaceTokens(template.bodyHtml, sampleContext),
        bodyText: template.bodyText ? replaceTokens(template.bodyText, sampleContext) : null,
      },
    });
  }

  return NextResponse.json(
    { error: "Bad Request", message: "Invalid action. Use ?action=send, ?action=schedule, ?action=cancel, or ?action=preview" },
    { status: 400 }
  );
}
