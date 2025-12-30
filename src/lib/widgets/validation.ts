/**
 * Widget Type Validation
 *
 * Copyright © 2025 Murmurant, Inc.
 *
 * Validates widget type definitions before approval.
 * Ensures security, data integrity, and proper schema design.
 *
 * Charter Principles:
 * - P2: Default deny (widgets must pass validation before approval)
 * - P9: Fail closed (reject on any validation error)
 */

// ============================================================================
// Validation Types
// ============================================================================

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  rule: string;
  message: string;
  severity: ValidationSeverity;
  path?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface WidgetTypeInput {
  slug: string;
  name: string;
  description?: string | null;
  dataSchema: unknown;
  entityScopes: string[];
}

// ============================================================================
// Validation Rules
// ============================================================================

type ValidationRule = (input: WidgetTypeInput) => ValidationIssue[];

/**
 * Rule: slug must be valid (lowercase, alphanumeric, dashes)
 */
const validSlugRule: ValidationRule = (input) => {
  const issues: ValidationIssue[] = [];
  const slugPattern = /^[a-z][a-z0-9-]*[a-z0-9]$/;

  if (!input.slug || input.slug.length < 3) {
    issues.push({
      rule: "valid-slug",
      message: "Slug must be at least 3 characters",
      severity: "error",
    });
  } else if (input.slug.length > 50) {
    issues.push({
      rule: "valid-slug",
      message: "Slug must be at most 50 characters",
      severity: "error",
    });
  } else if (!slugPattern.test(input.slug)) {
    issues.push({
      rule: "valid-slug",
      message: "Slug must be lowercase alphanumeric with dashes, start with letter",
      severity: "error",
    });
  }

  return issues;
};

/**
 * Rule: name must be present and reasonable length
 */
const validNameRule: ValidationRule = (input) => {
  const issues: ValidationIssue[] = [];

  if (!input.name || input.name.trim().length < 2) {
    issues.push({
      rule: "valid-name",
      message: "Name must be at least 2 characters",
      severity: "error",
    });
  } else if (input.name.length > 100) {
    issues.push({
      rule: "valid-name",
      message: "Name must be at most 100 characters",
      severity: "error",
    });
  }

  return issues;
};

/**
 * Rule: dataSchema must be valid JSON Schema (basic structural validation)
 */
const validJsonSchemaRule: ValidationRule = (input) => {
  const issues: ValidationIssue[] = [];

  if (!input.dataSchema || typeof input.dataSchema !== "object") {
    issues.push({
      rule: "valid-json-schema",
      message: "dataSchema must be a valid JSON Schema object",
      severity: "error",
    });
    return issues;
  }

  const schema = input.dataSchema as Record<string, unknown>;

  // Basic JSON Schema validation checks
  const validTypes = ["object", "array", "string", "number", "integer", "boolean", "null"];

  // Check root has a type or is a valid schema structure
  if (!schema.type && !schema.properties && !schema.oneOf && !schema.anyOf && !schema.allOf) {
    issues.push({
      rule: "valid-json-schema",
      message: "Schema must define type, properties, or composition keywords",
      severity: "error",
    });
  }

  // If type is specified, validate it
  if (schema.type) {
    if (typeof schema.type === "string" && !validTypes.includes(schema.type)) {
      issues.push({
        rule: "valid-json-schema",
        message: `Invalid type "${schema.type}". Must be one of: ${validTypes.join(", ")}`,
        severity: "error",
      });
    } else if (Array.isArray(schema.type)) {
      for (const t of schema.type) {
        if (!validTypes.includes(t as string)) {
          issues.push({
            rule: "valid-json-schema",
            message: `Invalid type "${t}" in type array`,
            severity: "error",
          });
        }
      }
    }
  }

  return issues;
};

/**
 * Rule: Schema must enforce max data size (maxLength, maxItems, etc.)
 */
const maxDataSizeRule: ValidationRule = (input) => {
  const issues: ValidationIssue[] = [];

  if (!input.dataSchema || typeof input.dataSchema !== "object") {
    return issues; // Will be caught by valid-json-schema rule
  }

  const schema = input.dataSchema as Record<string, unknown>;

  // Check if schema has type constraints
  const checkNode = (node: unknown, path: string): void => {
    if (!node || typeof node !== "object") return;

    const obj = node as Record<string, unknown>;

    // Check string type for maxLength
    if (obj.type === "string" && !obj.maxLength && !obj.enum) {
      issues.push({
        rule: "max-data-size",
        message: `String property at ${path || "root"} should have maxLength`,
        severity: "warning",
        path,
      });
    }

    // Check array type for maxItems
    if (obj.type === "array" && typeof obj.maxItems !== "number") {
      issues.push({
        rule: "max-data-size",
        message: `Array property at ${path || "root"} must have maxItems`,
        severity: "error",
        path,
      });
    }

    // Check object type for additionalProperties
    if (obj.type === "object") {
      if (obj.additionalProperties === true || obj.additionalProperties === undefined) {
        if (!obj.maxProperties) {
          issues.push({
            rule: "max-data-size",
            message: `Object at ${path || "root"} with additionalProperties should have maxProperties`,
            severity: "warning",
            path,
          });
        }
      }
    }

    // Recursively check properties
    if (obj.properties && typeof obj.properties === "object") {
      for (const [key, value] of Object.entries(obj.properties as Record<string, unknown>)) {
        checkNode(value, `${path}${path ? "." : ""}${key}`);
      }
    }

    // Check array items
    if (obj.items && typeof obj.items === "object") {
      checkNode(obj.items, `${path}[]`);
    }
  };

  checkNode(schema, "");

  return issues;
};

/**
 * Rule: No arbitrary HTML without sanitization marker
 */
const noArbitraryHtmlRule: ValidationRule = (input) => {
  const issues: ValidationIssue[] = [];

  if (!input.dataSchema || typeof input.dataSchema !== "object") {
    return issues;
  }

  const checkNode = (node: unknown, path: string): void => {
    if (!node || typeof node !== "object") return;

    const obj = node as Record<string, unknown>;

    // Check for format: html without x-sanitize marker
    if (obj.format === "html" && !obj["x-sanitize"]) {
      issues.push({
        rule: "no-arbitrary-html",
        message: `HTML field at ${path || "root"} requires x-sanitize: true marker`,
        severity: "error",
        path,
      });
    }

    // Recursively check
    if (obj.properties && typeof obj.properties === "object") {
      for (const [key, value] of Object.entries(obj.properties as Record<string, unknown>)) {
        checkNode(value, `${path}${path ? "." : ""}${key}`);
      }
    }

    if (obj.items && typeof obj.items === "object") {
      checkNode(obj.items, `${path}[]`);
    }
  };

  checkNode(input.dataSchema as Record<string, unknown>, "");

  return issues;
};

/**
 * Rule: entityScopes must be non-empty and valid
 */
const validScopesRule: ValidationRule = (input) => {
  const issues: ValidationIssue[] = [];
  const validScopes = ["global", "page", "member", "event"];

  if (!input.entityScopes || !Array.isArray(input.entityScopes) || input.entityScopes.length === 0) {
    issues.push({
      rule: "scope-declared",
      message: "entityScopes must be a non-empty array",
      severity: "error",
    });
    return issues;
  }

  for (const scope of input.entityScopes) {
    if (!validScopes.includes(scope)) {
      issues.push({
        rule: "scope-declared",
        message: `Invalid scope "${scope}". Valid scopes: ${validScopes.join(", ")}`,
        severity: "error",
      });
    }
  }

  return issues;
};

/**
 * Rule: Warn on potential PII field names
 */
const noPiiFieldsRule: ValidationRule = (input) => {
  const issues: ValidationIssue[] = [];
  const piiPatterns = [
    /ssn/i, /social.*security/i, /password/i, /secret/i, /token/i,
    /credit.*card/i, /bank.*account/i, /routing.*number/i,
  ];

  if (!input.dataSchema || typeof input.dataSchema !== "object") {
    return issues;
  }

  const checkNode = (node: unknown, path: string): void => {
    if (!node || typeof node !== "object") return;

    const obj = node as Record<string, unknown>;

    if (obj.properties && typeof obj.properties === "object") {
      for (const [key, value] of Object.entries(obj.properties as Record<string, unknown>)) {
        const fieldPath = `${path}${path ? "." : ""}${key}`;

        for (const pattern of piiPatterns) {
          if (pattern.test(key)) {
            issues.push({
              rule: "no-pii-fields",
              message: `Field "${key}" at ${fieldPath} appears to be PII - ensure proper handling`,
              severity: "warning",
              path: fieldPath,
            });
            break;
          }
        }

        checkNode(value, fieldPath);
      }
    }

    if (obj.items && typeof obj.items === "object") {
      checkNode(obj.items, `${path}[]`);
    }
  };

  checkNode(input.dataSchema as Record<string, unknown>, "");

  return issues;
};

/**
 * Rule: Description should be provided
 */
const descriptionPresentRule: ValidationRule = (input) => {
  const issues: ValidationIssue[] = [];

  if (!input.description || input.description.trim().length < 10) {
    issues.push({
      rule: "description-present",
      message: "Widget should have a description of at least 10 characters",
      severity: "warning",
    });
  }

  return issues;
};

// ============================================================================
// Validation Runner
// ============================================================================

/**
 * All validation rules in order of execution.
 */
const VALIDATION_RULES: ValidationRule[] = [
  validSlugRule,
  validNameRule,
  validJsonSchemaRule,
  maxDataSizeRule,
  noArbitraryHtmlRule,
  validScopesRule,
  noPiiFieldsRule,
  descriptionPresentRule,
];

/**
 * Validate a widget type definition.
 */
export function validateWidgetType(input: WidgetTypeInput): ValidationResult {
  const allIssues: ValidationIssue[] = [];

  for (const rule of VALIDATION_RULES) {
    const issues = rule(input);
    allIssues.push(...issues);
  }

  const errors = allIssues.filter((i) => i.severity === "error");
  const warnings = allIssues.filter((i) => i.severity === "warning");

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
