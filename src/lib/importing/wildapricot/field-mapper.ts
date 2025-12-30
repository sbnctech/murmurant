/**
 * Wild Apricot Field Mapper
 *
 * Copyright © 2025 Murmurant, Inc.
 *
 * Manages the mapping between Wild Apricot custom fields and Murmurant fields.
 * Supports automatic discovery of WA field schema and flexible mapping options.
 *
 * Charter Principles:
 * - P5: Reversibility (waRawData preserves all original field values)
 * - P7: Observability (field mappings are explicit and queryable)
 */

import { prisma } from "@/lib/prisma";
import { WildApricotClient } from "./client";
import type { WAContactField, WAFieldValue } from "./types";

// ============================================================================
// Field Definition Sync
// ============================================================================

export interface FieldSyncResult {
  created: number;
  updated: number;
  total: number;
}

/**
 * Sync WA contact field definitions to the database.
 * This discovers what custom fields exist in the WA account.
 */
export async function syncWaFieldDefinitions(
  client: WildApricotClient
): Promise<FieldSyncResult> {
  const waFields = await client.fetchContactFields();

  let created = 0;
  let updated = 0;

  for (const field of waFields) {
    const existing = await prisma.waContactFieldDef.findUnique({
      where: { waFieldId: field.Id },
    });

    if (existing) {
      // Update if changed
      await prisma.waContactFieldDef.update({
        where: { waFieldId: field.Id },
        data: {
          fieldName: field.FieldName,
          systemCode: field.SystemCode,
          fieldType: field.FieldType,
          isSystem: field.IsSystem,
          allowedValues: field.AllowedValues ? field.AllowedValues : undefined,
        },
      });
      updated++;
    } else {
      // Create new
      await prisma.waContactFieldDef.create({
        data: {
          waFieldId: field.Id,
          fieldName: field.FieldName,
          systemCode: field.SystemCode,
          fieldType: field.FieldType,
          isSystem: field.IsSystem,
          allowedValues: field.AllowedValues ? field.AllowedValues : undefined,
        },
      });
      created++;
    }
  }

  return {
    created,
    updated,
    total: waFields.length,
  };
}

/**
 * Get all WA field definitions from the database.
 */
export async function getWaFieldDefinitions() {
  return prisma.waContactFieldDef.findMany({
    include: {
      fieldMappings: {
        include: {
          customFieldDef: true,
        },
      },
    },
    orderBy: { fieldName: "asc" },
  });
}

// ============================================================================
// Field Mapping Types
// ============================================================================

export type MappingType =
  | "murmurant_field"  // Map to a built-in Murmurant Member field
  | "custom_field"     // Map to a Murmurant custom field
  | "ignore";          // Don't import this field

export interface FieldMappingInput {
  waFieldId: number;
  mappingType: MappingType;
  targetField?: string;        // For murmurant_field: the field name on Member model
  customFieldDefId?: string;   // For custom_field: the CustomFieldDef to use
}

// ============================================================================
// Field Mapping Operations
// ============================================================================

/**
 * Set the mapping for a WA field.
 */
export async function setFieldMapping(input: FieldMappingInput): Promise<void> {
  // Find the WA field definition
  const fieldDef = await prisma.waContactFieldDef.findUnique({
    where: { waFieldId: input.waFieldId },
  });

  if (!fieldDef) {
    throw new Error(`WA field with ID ${input.waFieldId} not found`);
  }

  // Upsert the mapping
  await prisma.waFieldMapping.upsert({
    where: { waFieldDefId: fieldDef.id },
    create: {
      waFieldDefId: fieldDef.id,
      mappingType: input.mappingType,
      targetField: input.mappingType === "murmurant_field" ? input.targetField : null,
      customFieldDefId: input.mappingType === "custom_field" ? input.customFieldDefId : null,
    },
    update: {
      mappingType: input.mappingType,
      targetField: input.mappingType === "murmurant_field" ? input.targetField : null,
      customFieldDefId: input.mappingType === "custom_field" ? input.customFieldDefId : null,
    },
  });
}

/**
 * Get all field mappings.
 */
export async function getFieldMappings() {
  return prisma.waFieldMapping.findMany({
    include: {
      waFieldDef: true,
      customFieldDef: true,
    },
  });
}

/**
 * Clear mapping for a WA field (remove it).
 */
export async function clearFieldMapping(waFieldId: number): Promise<void> {
  const fieldDef = await prisma.waContactFieldDef.findUnique({
    where: { waFieldId },
  });

  if (fieldDef) {
    await prisma.waFieldMapping.deleteMany({
      where: { waFieldDefId: fieldDef.id },
    });
  }
}

// ============================================================================
// Default Mappings
// ============================================================================

/**
 * Built-in Murmurant Member fields that can be mapped to WA fields.
 */
export const MURMURANT_MEMBER_FIELDS = [
  { field: "phone", label: "Phone", waSystemCodes: ["Phone", "MobilePhone", "HomePhone", "WorkPhone"] },
  // Note: firstName, lastName, email are handled directly from WAContact properties
  // Additional fields can be added here as the Member model expands
] as const;

/**
 * Apply default mappings based on WA system codes.
 * This sets up common mappings automatically.
 */
export async function applyDefaultMappings(): Promise<number> {
  let applied = 0;

  for (const mapping of MURMURANT_MEMBER_FIELDS) {
    for (const systemCode of mapping.waSystemCodes) {
      const fieldDef = await prisma.waContactFieldDef.findFirst({
        where: { systemCode },
      });

      if (fieldDef) {
        // Check if already mapped
        const existing = await prisma.waFieldMapping.findUnique({
          where: { waFieldDefId: fieldDef.id },
        });

        if (!existing) {
          await prisma.waFieldMapping.create({
            data: {
              waFieldDefId: fieldDef.id,
              mappingType: "murmurant_field",
              targetField: mapping.field,
            },
          });
          applied++;
        }
      }
    }
  }

  return applied;
}

// ============================================================================
// Field Value Extraction
// ============================================================================

/**
 * Build a lookup map of field mappings for efficient access during import.
 * Key: WA field name, Value: mapping info
 */
export async function buildFieldMappingLookup(): Promise<Map<string, {
  mappingType: MappingType;
  targetField: string | null;
  customFieldDefId: string | null;
}>> {
  const mappings = await prisma.waFieldMapping.findMany({
    include: {
      waFieldDef: true,
    },
  });

  const lookup = new Map<string, {
    mappingType: MappingType;
    targetField: string | null;
    customFieldDefId: string | null;
  }>();

  for (const mapping of mappings) {
    lookup.set(mapping.waFieldDef.fieldName, {
      mappingType: mapping.mappingType as MappingType,
      targetField: mapping.targetField,
      customFieldDefId: mapping.customFieldDefId,
    });

    // Also add by system code if present
    if (mapping.waFieldDef.systemCode) {
      lookup.set(mapping.waFieldDef.systemCode, {
        mappingType: mapping.mappingType as MappingType,
        targetField: mapping.targetField,
        customFieldDefId: mapping.customFieldDefId,
      });
    }
  }

  return lookup;
}

/**
 * Extract a specific field value from WA FieldValues array.
 */
export function extractFieldValue(
  fieldValues: WAFieldValue[],
  fieldNameOrCode: string
): unknown {
  const field = fieldValues.find(
    (f) => f.FieldName === fieldNameOrCode || f.SystemCode === fieldNameOrCode
  );
  return field?.Value ?? null;
}

/**
 * Extract phone number from WA FieldValues (common utility).
 */
export function extractPhone(fieldValues: WAFieldValue[]): string | null {
  // Try multiple phone field names in priority order
  const phoneFields = ["Phone", "MobilePhone", "Cell Phone", "Home Phone", "Work Phone"];

  for (const fieldName of phoneFields) {
    const value = extractFieldValue(fieldValues, fieldName);
    if (value && typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

/**
 * Convert all WA FieldValues to a JSON object for storage in waRawData.
 * This preserves all original field values for future reference.
 */
export function fieldValuesToJson(fieldValues: WAFieldValue[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const field of fieldValues) {
    // Use FieldName as key, with SystemCode as fallback for disambiguation
    const key = field.SystemCode ? `${field.FieldName} (${field.SystemCode})` : field.FieldName;
    result[key] = field.Value;
  }

  return result;
}

// ============================================================================
// Custom Field Value Storage
// ============================================================================

/**
 * Store a custom field value for a member.
 */
export async function storeCustomFieldValue(
  customFieldDefId: string,
  memberId: string,
  value: unknown
): Promise<void> {
  await prisma.customFieldValue.upsert({
    where: {
      customFieldDefId_entityId: {
        customFieldDefId,
        entityId: memberId,
      },
    },
    create: {
      customFieldDefId,
      entityId: memberId,
      value: value as object,
    },
    update: {
      value: value as object,
    },
  });
}

/**
 * Get all custom field values for a member.
 */
export async function getMemberCustomFields(memberId: string) {
  return prisma.customFieldValue.findMany({
    where: {
      entityId: memberId,
      customFieldDef: {
        entityType: "member",
      },
    },
    include: {
      customFieldDef: true,
    },
  });
}

// ============================================================================
// Stats and Reporting
// ============================================================================

export interface FieldMappingStats {
  totalWaFields: number;
  mappedToMurmurant: number;
  mappedToCustom: number;
  ignored: number;
  unmapped: number;
  systemFields: number;
  customFields: number;
}

/**
 * Get statistics about field mappings.
 */
export async function getFieldMappingStats(): Promise<FieldMappingStats> {
  const [allFields, mappings] = await Promise.all([
    prisma.waContactFieldDef.findMany(),
    prisma.waFieldMapping.findMany(),
  ]);

  const mappingsByDefId = new Map(mappings.map((m) => [m.waFieldDefId, m]));

  let mappedToMurmurant = 0;
  let mappedToCustom = 0;
  let ignored = 0;
  let unmapped = 0;
  let systemFields = 0;
  let customFields = 0;

  for (const field of allFields) {
    if (field.isSystem) {
      systemFields++;
    } else {
      customFields++;
    }

    const mapping = mappingsByDefId.get(field.id);
    if (!mapping) {
      unmapped++;
    } else if (mapping.mappingType === "murmurant_field") {
      mappedToMurmurant++;
    } else if (mapping.mappingType === "custom_field") {
      mappedToCustom++;
    } else if (mapping.mappingType === "ignore") {
      ignored++;
    }
  }

  return {
    totalWaFields: allFields.length,
    mappedToMurmurant,
    mappedToCustom,
    ignored,
    unmapped,
    systemFields,
    customFields,
  };
}
