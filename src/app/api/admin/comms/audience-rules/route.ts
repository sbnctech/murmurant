// Copyright © 2025 Murmurant, Inc.
// Audience rule management API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/auth";
import { createAuditLog } from "@/lib/publishing/permissions";
import { getAudienceCount, AudienceRules } from "@/lib/publishing/audience";

// GET /api/admin/comms/audience-rules - List all audience rules
export async function GET(req: NextRequest) {
  const auth = await requireCapability(req, "comms:manage");
  if (!auth.ok) return auth.response;

  const rules = await prisma.audienceRule.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      rules: true,
      updatedAt: true,
    },
  });

  // Get audience counts for each rule
  const rulesWithCounts = await Promise.all(
    rules.map(async (rule) => {
      const count = await getAudienceCount(rule.rules as AudienceRules);
      return { ...rule, audienceCount: count };
    })
  );

  return NextResponse.json({ rules: rulesWithCounts });
}

// POST /api/admin/comms/audience-rules - Create new audience rule
export async function POST(req: NextRequest) {
  const auth = await requireCapability(req, "comms:manage");
  if (!auth.ok) return auth.response;

  if (auth.context.globalRole !== "admin") {
    return NextResponse.json(
      { error: "Forbidden", message: "Only administrators can create audience rules" },
      { status: 403 }
    );
  }

  let body: {
    name: string;
    description?: string;
    rules: unknown;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body.name) {
    return NextResponse.json(
      { error: "Bad Request", message: "name is required" },
      { status: 400 }
    );
  }

  if (!body.rules || typeof body.rules !== "object") {
    return NextResponse.json(
      { error: "Bad Request", message: "rules must be an object" },
      { status: 400 }
    );
  }

  // Validate the rules structure
  const rules = body.rules as AudienceRules;
  const validKeys = [
    "isPublic",
    "roles",
    "membershipStatuses",
    "memberIds",
    "committeeIds",
    "joinedAfterDays",
    "joinedBeforeDate",
    "excludeMemberIds",
  ];
  const invalidKeys = Object.keys(rules).filter((k) => !validKeys.includes(k));
  if (invalidKeys.length > 0) {
    return NextResponse.json(
      { error: "Bad Request", message: `Invalid rule keys: ${invalidKeys.join(", ")}` },
      { status: 400 }
    );
  }

  const audienceRule = await prisma.audienceRule.create({
    data: {
      name: body.name,
      description: body.description || null,
      rules: body.rules as object,
    },
  });

  // Get the audience count
  const audienceCount = await getAudienceCount(audienceRule.rules as AudienceRules);

  await createAuditLog({
    action: "CREATE",
    resourceType: "audience_rule",
    resourceId: audienceRule.id,
    memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
    after: { name: audienceRule.name },
  });

  return NextResponse.json({ rule: { ...audienceRule, audienceCount } }, { status: 201 });
}

// PUT /api/admin/comms/audience-rules - Update audience rule (expects ?id=xxx in query)
export async function PUT(req: NextRequest) {
  const auth = await requireCapability(req, "comms:manage");
  if (!auth.ok) return auth.response;

  if (auth.context.globalRole !== "admin") {
    return NextResponse.json(
      { error: "Forbidden", message: "Only administrators can edit audience rules" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Bad Request", message: "id query parameter is required" },
      { status: 400 }
    );
  }

  const existing = await prisma.audienceRule.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Not Found", message: "Audience rule not found" },
      { status: 404 }
    );
  }

  let body: {
    name?: string;
    description?: string | null;
    rules?: unknown;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Validate the rules structure if provided
  if (body.rules) {
    if (typeof body.rules !== "object") {
      return NextResponse.json(
        { error: "Bad Request", message: "rules must be an object" },
        { status: 400 }
      );
    }

    const rules = body.rules as AudienceRules;
    const validKeys = [
      "isPublic",
      "roles",
      "membershipStatuses",
      "memberIds",
      "committeeIds",
      "joinedAfterDays",
      "joinedBeforeDate",
      "excludeMemberIds",
    ];
    const invalidKeys = Object.keys(rules).filter((k) => !validKeys.includes(k));
    if (invalidKeys.length > 0) {
      return NextResponse.json(
        { error: "Bad Request", message: `Invalid rule keys: ${invalidKeys.join(", ")}` },
        { status: 400 }
      );
    }
  }

  const audienceRule = await prisma.audienceRule.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      description: body.description !== undefined ? body.description : existing.description,
      rules: body.rules ? (body.rules as object) : undefined,
    },
  });

  // Get the audience count
  const audienceCount = await getAudienceCount(audienceRule.rules as AudienceRules);

  await createAuditLog({
    action: "UPDATE",
    resourceType: "audience_rule",
    resourceId: audienceRule.id,
    memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
    before: { name: existing.name },
    after: { name: audienceRule.name },
  });

  return NextResponse.json({ rule: { ...audienceRule, audienceCount } });
}

// DELETE /api/admin/comms/audience-rules - Delete audience rule (expects ?id=xxx in query)
export async function DELETE(req: NextRequest) {
  const auth = await requireCapability(req, "comms:manage");
  if (!auth.ok) return auth.response;

  if (auth.context.globalRole !== "admin") {
    return NextResponse.json(
      { error: "Forbidden", message: "Only administrators can delete audience rules" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Bad Request", message: "id query parameter is required" },
      { status: 400 }
    );
  }

  const existing = await prisma.audienceRule.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Not Found", message: "Audience rule not found" },
      { status: 404 }
    );
  }

  // Check if rule is in use by mailing lists
  const listsUsingRule = await prisma.mailingList.count({ where: { audienceRuleId: id } });
  if (listsUsingRule > 0) {
    return NextResponse.json(
      { error: "Conflict", message: `Cannot delete audience rule - ${listsUsingRule} mailing list(s) are using it` },
      { status: 409 }
    );
  }

  // Check if rule is in use by pages
  const pagesUsingRule = await prisma.page.count({ where: { audienceRuleId: id } });
  if (pagesUsingRule > 0) {
    return NextResponse.json(
      { error: "Conflict", message: `Cannot delete audience rule - ${pagesUsingRule} page(s) are using it` },
      { status: 409 }
    );
  }

  await prisma.audienceRule.delete({ where: { id } });

  await createAuditLog({
    action: "DELETE",
    resourceType: "audience_rule",
    resourceId: id,
    memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
    before: { name: existing.name },
  });

  return NextResponse.json({ success: true });
}
