/**
 * Widget Type and Data CRUD Operations
 *
 * Copyright © 2025 Murmurant, Inc.
 *
 * Manages widget type definitions and widget data storage.
 * Implements approval workflow for new widget types.
 *
 * Charter Principles:
 * - P1: Audit trail (approval tracked with timestamp and approver)
 * - P3: State machine (WidgetTypeStatus enum with explicit transitions)
 * - P2: Authorization (approval requires admin privileges)
 */

import { prisma } from "@/lib/prisma";
import { WidgetTypeStatus, Prisma } from "@prisma/client";
import { validateWidgetType, type ValidationResult } from "./validation";

// ============================================================================
// Widget Type Operations
// ============================================================================

export interface CreateWidgetTypeInput {
  slug: string;
  name: string;
  description?: string;
  dataSchema: Record<string, unknown>;
  entityScopes: string[];
}

export interface UpdateWidgetTypeInput {
  name?: string;
  description?: string;
  dataSchema?: Record<string, unknown>;
  entityScopes?: string[];
}

/**
 * Create a new widget type in DRAFT status.
 */
export async function createWidgetType(input: CreateWidgetTypeInput) {
  return prisma.widgetType.create({
    data: {
      slug: input.slug,
      name: input.name,
      description: input.description,
      dataSchema: input.dataSchema as Prisma.InputJsonValue,
      entityScopes: input.entityScopes,
      status: WidgetTypeStatus.DRAFT,
      schemaVersion: 1,
    },
  });
}

/**
 * Get a widget type by slug.
 */
export async function getWidgetTypeBySlug(slug: string) {
  return prisma.widgetType.findUnique({
    where: { slug },
    include: {
      approvedBy: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });
}

/**
 * Get a widget type by ID.
 */
export async function getWidgetTypeById(id: string) {
  return prisma.widgetType.findUnique({
    where: { id },
    include: {
      approvedBy: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });
}

/**
 * List all widget types with optional status filter.
 */
export async function listWidgetTypes(status?: WidgetTypeStatus) {
  return prisma.widgetType.findMany({
    where: status ? { status } : undefined,
    orderBy: { name: "asc" },
    include: {
      approvedBy: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });
}

/**
 * Update a widget type (only allowed in DRAFT status).
 */
export async function updateWidgetType(id: string, input: UpdateWidgetTypeInput) {
  const existing = await prisma.widgetType.findUnique({ where: { id } });

  if (!existing) {
    throw new Error("Widget type not found");
  }

  if (existing.status !== WidgetTypeStatus.DRAFT) {
    throw new Error(`Cannot update widget type in ${existing.status} status`);
  }

  return prisma.widgetType.update({
    where: { id },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.dataSchema && { dataSchema: input.dataSchema as Prisma.InputJsonValue }),
      ...(input.entityScopes && { entityScopes: input.entityScopes }),
    },
  });
}

/**
 * Delete a widget type (only allowed in DRAFT status).
 */
export async function deleteWidgetType(id: string) {
  const existing = await prisma.widgetType.findUnique({ where: { id } });

  if (!existing) {
    throw new Error("Widget type not found");
  }

  if (existing.status !== WidgetTypeStatus.DRAFT) {
    throw new Error(`Cannot delete widget type in ${existing.status} status`);
  }

  return prisma.widgetType.delete({ where: { id } });
}

// ============================================================================
// Widget Type Workflow
// ============================================================================

/**
 * Submit a widget type for validation.
 * Transitions: DRAFT → PENDING_VALIDATION
 */
export async function submitForValidation(id: string): Promise<{
  success: boolean;
  widgetType?: Awaited<ReturnType<typeof getWidgetTypeById>>;
  validation?: ValidationResult;
}> {
  const existing = await prisma.widgetType.findUnique({ where: { id } });

  if (!existing) {
    throw new Error("Widget type not found");
  }

  if (existing.status !== WidgetTypeStatus.DRAFT) {
    throw new Error(`Cannot submit widget type in ${existing.status} status`);
  }

  // Run validation
  const validation = validateWidgetType({
    slug: existing.slug,
    name: existing.name,
    description: existing.description,
    dataSchema: existing.dataSchema,
    entityScopes: existing.entityScopes,
  });

  if (validation.valid) {
    // Transition to PENDING_APPROVAL
    const updated = await prisma.widgetType.update({
      where: { id },
      data: {
        status: WidgetTypeStatus.PENDING_APPROVAL,
        validatedAt: new Date(),
        validationReport: {
          valid: true,
          errors: [],
          warnings: validation.warnings,
        } as unknown as Prisma.InputJsonValue,
      },
      include: {
        approvedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return { success: true, widgetType: updated, validation };
  } else {
    // Transition to VALIDATION_FAILED
    const updated = await prisma.widgetType.update({
      where: { id },
      data: {
        status: WidgetTypeStatus.VALIDATION_FAILED,
        validatedAt: new Date(),
        validationReport: {
          valid: false,
          errors: validation.errors,
          warnings: validation.warnings,
        } as unknown as Prisma.InputJsonValue,
      },
      include: {
        approvedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return { success: false, widgetType: updated, validation };
  }
}

/**
 * Reset a failed widget type back to DRAFT for editing.
 * Transitions: VALIDATION_FAILED → DRAFT
 */
export async function resetToDraft(id: string) {
  const existing = await prisma.widgetType.findUnique({ where: { id } });

  if (!existing) {
    throw new Error("Widget type not found");
  }

  if (existing.status !== WidgetTypeStatus.VALIDATION_FAILED) {
    throw new Error(`Cannot reset widget type in ${existing.status} status`);
  }

  return prisma.widgetType.update({
    where: { id },
    data: {
      status: WidgetTypeStatus.DRAFT,
      validatedAt: null,
      validationReport: Prisma.JsonNull,
    },
  });
}

/**
 * Approve a validated widget type.
 * Transitions: PENDING_APPROVAL → APPROVED
 */
export async function approveWidgetType(id: string, approverId: string) {
  const existing = await prisma.widgetType.findUnique({ where: { id } });

  if (!existing) {
    throw new Error("Widget type not found");
  }

  if (existing.status !== WidgetTypeStatus.PENDING_APPROVAL) {
    throw new Error(`Cannot approve widget type in ${existing.status} status`);
  }

  return prisma.widgetType.update({
    where: { id },
    data: {
      status: WidgetTypeStatus.APPROVED,
      approvedAt: new Date(),
      approvedById: approverId,
    },
    include: {
      approvedBy: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });
}

/**
 * Reject a widget type pending approval.
 * Transitions: PENDING_APPROVAL → REJECTED
 */
export async function rejectWidgetType(id: string, reason: string) {
  const existing = await prisma.widgetType.findUnique({ where: { id } });

  if (!existing) {
    throw new Error("Widget type not found");
  }

  if (existing.status !== WidgetTypeStatus.PENDING_APPROVAL) {
    throw new Error(`Cannot reject widget type in ${existing.status} status`);
  }

  return prisma.widgetType.update({
    where: { id },
    data: {
      status: WidgetTypeStatus.REJECTED,
      rejectionReason: reason,
    },
  });
}

/**
 * Deprecate an approved widget type.
 * Transitions: APPROVED → DEPRECATED
 */
export async function deprecateWidgetType(id: string) {
  const existing = await prisma.widgetType.findUnique({ where: { id } });

  if (!existing) {
    throw new Error("Widget type not found");
  }

  if (existing.status !== WidgetTypeStatus.APPROVED) {
    throw new Error(`Cannot deprecate widget type in ${existing.status} status`);
  }

  return prisma.widgetType.update({
    where: { id },
    data: {
      status: WidgetTypeStatus.DEPRECATED,
    },
  });
}

// ============================================================================
// Widget Data Operations
// ============================================================================

export interface WidgetDataInput {
  widgetTypeSlug: string;
  scopeType: "global" | "page" | "member" | "event";
  scopeId?: string;
  data: Record<string, unknown>;
}

/**
 * Validate data against widget type schema (basic validation).
 *
 * Note: This is a simplified validator that checks basic type constraints.
 * For production use with complex schemas, consider adding a full JSON Schema
 * validator library like AJV.
 */
export function validateWidgetData(
  schema: Record<string, unknown>,
  data: unknown
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const validateNode = (
    schemaNode: Record<string, unknown>,
    dataNode: unknown,
    path: string
  ): void => {
    const expectedType = schemaNode.type as string | string[] | undefined;

    // Type validation
    if (expectedType) {
      const types = Array.isArray(expectedType) ? expectedType : [expectedType];
      const actualType = getJsonType(dataNode);

      if (!types.includes(actualType) && !(types.includes("null") && dataNode === null)) {
        errors.push(`${path}: expected ${types.join("|")}, got ${actualType}`);
        return;
      }
    }

    // Object property validation
    if (schemaNode.type === "object" && typeof dataNode === "object" && dataNode !== null) {
      const properties = schemaNode.properties as Record<string, Record<string, unknown>> | undefined;
      const required = schemaNode.required as string[] | undefined;

      // Check required properties
      if (required) {
        for (const prop of required) {
          if (!(prop in (dataNode as Record<string, unknown>))) {
            errors.push(`${path}: missing required property "${prop}"`);
          }
        }
      }

      // Validate each property
      if (properties) {
        for (const [key, propSchema] of Object.entries(properties)) {
          if (key in (dataNode as Record<string, unknown>)) {
            validateNode(propSchema, (dataNode as Record<string, unknown>)[key], `${path}.${key}`);
          }
        }
      }
    }

    // Array item validation
    if (schemaNode.type === "array" && Array.isArray(dataNode)) {
      const items = schemaNode.items as Record<string, unknown> | undefined;
      const maxItems = schemaNode.maxItems as number | undefined;

      if (maxItems !== undefined && dataNode.length > maxItems) {
        errors.push(`${path}: array exceeds maxItems (${dataNode.length} > ${maxItems})`);
      }

      if (items) {
        for (let i = 0; i < dataNode.length; i++) {
          validateNode(items, dataNode[i], `${path}[${i}]`);
        }
      }
    }

    // String constraints
    if (schemaNode.type === "string" && typeof dataNode === "string") {
      const maxLength = schemaNode.maxLength as number | undefined;
      const minLength = schemaNode.minLength as number | undefined;
      const enumValues = schemaNode.enum as string[] | undefined;

      if (maxLength !== undefined && dataNode.length > maxLength) {
        errors.push(`${path}: string exceeds maxLength (${dataNode.length} > ${maxLength})`);
      }
      if (minLength !== undefined && dataNode.length < minLength) {
        errors.push(`${path}: string below minLength (${dataNode.length} < ${minLength})`);
      }
      if (enumValues && !enumValues.includes(dataNode)) {
        errors.push(`${path}: value not in enum [${enumValues.join(", ")}]`);
      }
    }

    // Number constraints
    if ((schemaNode.type === "number" || schemaNode.type === "integer") && typeof dataNode === "number") {
      const maximum = schemaNode.maximum as number | undefined;
      const minimum = schemaNode.minimum as number | undefined;

      if (maximum !== undefined && dataNode > maximum) {
        errors.push(`${path}: number exceeds maximum (${dataNode} > ${maximum})`);
      }
      if (minimum !== undefined && dataNode < minimum) {
        errors.push(`${path}: number below minimum (${dataNode} < ${minimum})`);
      }
      if (schemaNode.type === "integer" && !Number.isInteger(dataNode)) {
        errors.push(`${path}: expected integer, got float`);
      }
    }
  };

  validateNode(schema, data, "");

  return { valid: errors.length === 0, errors };
}

/**
 * Get the JSON type of a value.
 */
function getJsonType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "number") return Number.isInteger(value) ? "integer" : "number";
  return typeof value;
}

/**
 * Set widget data for a scope.
 * Only allowed for APPROVED widget types.
 */
export async function setWidgetData(input: WidgetDataInput) {
  // Get the widget type
  const widgetType = await prisma.widgetType.findUnique({
    where: { slug: input.widgetTypeSlug },
  });

  if (!widgetType) {
    throw new Error(`Widget type "${input.widgetTypeSlug}" not found`);
  }

  if (widgetType.status !== WidgetTypeStatus.APPROVED) {
    throw new Error(`Widget type "${input.widgetTypeSlug}" is not approved`);
  }

  // Check scope is allowed
  if (!widgetType.entityScopes.includes(input.scopeType)) {
    throw new Error(
      `Scope "${input.scopeType}" not allowed for widget type "${input.widgetTypeSlug}"`
    );
  }

  // Validate data against schema
  const validation = validateWidgetData(
    widgetType.dataSchema as Record<string, unknown>,
    input.data
  );

  if (!validation.valid) {
    throw new Error(`Invalid widget data: ${validation.errors.join(", ")}`);
  }

  // Upsert the widget data
  // Note: Prisma composite unique with nullable field requires explicit null handling
  const scopeIdValue = input.scopeId ?? null;
  return prisma.widgetData.upsert({
    where: {
      widgetTypeId_scopeType_scopeId: {
        widgetTypeId: widgetType.id,
        scopeType: input.scopeType,
        scopeId: scopeIdValue as string, // Cast needed for Prisma composite unique with nullable field
      },
    },
    create: {
      widgetTypeId: widgetType.id,
      scopeType: input.scopeType,
      scopeId: input.scopeId ?? null,
      data: input.data as Prisma.InputJsonValue,
      schemaVersion: widgetType.schemaVersion,
    },
    update: {
      data: input.data as Prisma.InputJsonValue,
      schemaVersion: widgetType.schemaVersion,
    },
  });
}

/**
 * Get widget data for a scope.
 */
export async function getWidgetData(
  widgetTypeSlug: string,
  scopeType: string,
  scopeId?: string
) {
  const widgetType = await prisma.widgetType.findUnique({
    where: { slug: widgetTypeSlug },
  });

  if (!widgetType) {
    return null;
  }

  const scopeIdValue = scopeId ?? null;
  return prisma.widgetData.findUnique({
    where: {
      widgetTypeId_scopeType_scopeId: {
        widgetTypeId: widgetType.id,
        scopeType,
        scopeId: scopeIdValue as string, // Cast needed for Prisma composite unique with nullable field
      },
    },
    include: {
      widgetType: true,
    },
  });
}

/**
 * List all widget data for a widget type.
 */
export async function listWidgetData(widgetTypeSlug: string, scopeType?: string) {
  const widgetType = await prisma.widgetType.findUnique({
    where: { slug: widgetTypeSlug },
  });

  if (!widgetType) {
    return [];
  }

  return prisma.widgetData.findMany({
    where: {
      widgetTypeId: widgetType.id,
      ...(scopeType && { scopeType }),
    },
    include: {
      widgetType: true,
    },
  });
}

/**
 * Delete widget data for a scope.
 */
export async function deleteWidgetData(
  widgetTypeSlug: string,
  scopeType: string,
  scopeId?: string
) {
  const widgetType = await prisma.widgetType.findUnique({
    where: { slug: widgetTypeSlug },
  });

  if (!widgetType) {
    throw new Error(`Widget type "${widgetTypeSlug}" not found`);
  }

  return prisma.widgetData.deleteMany({
    where: {
      widgetTypeId: widgetType.id,
      scopeType,
      scopeId: scopeId ?? null,
    },
  });
}

// ============================================================================
// Widget Type Stats
// ============================================================================

export interface WidgetTypeStats {
  total: number;
  byStatus: Record<WidgetTypeStatus, number>;
  dataCount: number;
}

/**
 * Get widget type statistics.
 */
export async function getWidgetTypeStats(): Promise<WidgetTypeStats> {
  const [widgetTypes, dataCount] = await Promise.all([
    prisma.widgetType.findMany({ select: { status: true } }),
    prisma.widgetData.count(),
  ]);

  const byStatus = {} as Record<WidgetTypeStatus, number>;
  for (const status of Object.values(WidgetTypeStatus)) {
    byStatus[status] = 0;
  }

  for (const wt of widgetTypes) {
    byStatus[wt.status]++;
  }

  return {
    total: widgetTypes.length,
    byStatus,
    dataCount,
  };
}
