/**
 * Policy Capture Library
 *
 * Captures organization policies from WA (where possible) and generates
 * a policy bundle for ClubOS migration. Supports manual template generation
 * for policies that cannot be auto-captured.
 *
 * Related: Issue #275 (Policy Capture), #202 (WA Migration), #263 (Policy Layer)
 */

import * as fs from "fs";
import * as path from "path";
import type { PolicyValueMap, PolicyKey } from "../../../src/lib/policy/types";
import { POLICY_DEFAULTS } from "../../../src/lib/policy/getPolicy";

// =============================================================================
// Types
// =============================================================================

/**
 * Source of a policy value
 */
export type PolicySource =
  | "wa_api" // Captured from WA API
  | "manual" // Manually provided by operator
  | "default" // Using platform default
  | "template"; // Placeholder needing manual fill

/**
 * A captured policy entry with source tracking
 */
export interface CapturedPolicy<K extends PolicyKey = PolicyKey> {
  key: K;
  value: PolicyValueMap[K] | null;
  source: PolicySource;
  description: string;
  required: boolean;
  validationError?: string;
}

/**
 * Policy bundle - the output artifact
 */
export interface PolicyBundle {
  version: "1.0";
  generatedAt: string;
  organizationName: string;
  policies: CapturedPolicy[];
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
  metadata: {
    waAccountId?: string;
    captureMode: "auto" | "template" | "validate";
    templateSections: string[];
  };
}

/**
 * Validation result
 */
export interface PolicyValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingRequired: string[];
  invalidValues: { key: string; error: string }[];
}

// =============================================================================
// Policy Definitions
// =============================================================================

/**
 * Policy definitions with metadata for capture and validation.
 * Defines which policies are required, their descriptions, and capture sources.
 */
export const POLICY_DEFINITIONS: Record<
  PolicyKey,
  {
    description: string;
    required: boolean;
    capturable: boolean; // Can be auto-captured from WA
    category: string;
  }
> = {
  // Membership lifecycle
  "membership.newbieDays": {
    description: "Days a member is considered a 'newbie' (new member)",
    required: false,
    capturable: false,
    category: "membership",
  },
  "membership.extendedDays": {
    description: "Days of membership to qualify as 'extended' member",
    required: false,
    capturable: false,
    category: "membership",
  },
  "membership.gracePeriodDays": {
    description: "Grace period days before lapsed status after expiration",
    required: false,
    capturable: false,
    category: "membership",
  },
  "membership.renewalReminderDays": {
    description: "Days before expiration to send renewal reminder",
    required: false,
    capturable: false,
    category: "membership",
  },

  // Scheduling
  "scheduling.timezone": {
    description: "Organization timezone (IANA format, e.g., 'America/Los_Angeles')",
    required: true,
    capturable: false,
    category: "scheduling",
  },
  "scheduling.registrationOpenDay": {
    description: "Day of week event registration opens (0=Sunday, 6=Saturday)",
    required: false,
    capturable: false,
    category: "scheduling",
  },
  "scheduling.registrationOpenHour": {
    description: "Hour of day event registration opens (0-23)",
    required: false,
    capturable: false,
    category: "scheduling",
  },
  "scheduling.eventArchiveDays": {
    description: "Days after an event ends before archiving",
    required: false,
    capturable: false,
    category: "scheduling",
  },
  "scheduling.announcementDay": {
    description: "Day of week for weekly announcements (0=Sunday)",
    required: false,
    capturable: false,
    category: "scheduling",
  },
  "scheduling.announcementHour": {
    description: "Hour for announcements (0-23)",
    required: false,
    capturable: false,
    category: "scheduling",
  },

  // Governance
  "governance.minutesReviewDays": {
    description: "Days allowed for reviewing meeting minutes",
    required: false,
    capturable: false,
    category: "governance",
  },
  "governance.boardEligibilityDays": {
    description: "Days of membership required for board eligibility",
    required: false,
    capturable: false,
    category: "governance",
  },
  "governance.quorumPercentage": {
    description: "Percentage of board required for quorum",
    required: false,
    capturable: false,
    category: "governance",
  },

  // KPI
  "kpi.membershipWarningThreshold": {
    description: "Membership count below which to show warning",
    required: false,
    capturable: false,
    category: "kpi",
  },
  "kpi.membershipDangerThreshold": {
    description: "Membership count below which to show danger alert",
    required: false,
    capturable: false,
    category: "kpi",
  },
  "kpi.eventAttendanceWarningPercent": {
    description: "Event attendance percentage below which to warn",
    required: false,
    capturable: false,
    category: "kpi",
  },
  "kpi.eventAttendanceDangerPercent": {
    description: "Event attendance percentage below which to alert",
    required: false,
    capturable: false,
    category: "kpi",
  },

  // Display
  "display.organizationName": {
    description: "Organization display name",
    required: true,
    capturable: true, // Can get from WA account info
    category: "display",
  },
  "display.memberTermSingular": {
    description: "Term for a single member (e.g., 'member', 'participant')",
    required: false,
    capturable: false,
    category: "display",
  },
  "display.memberTermPlural": {
    description: "Plural term for members",
    required: false,
    capturable: false,
    category: "display",
  },

  // Membership Tiers
  "membership.tiers.enabled": {
    description: "Enable membership tier mapping during migration",
    required: false,
    capturable: false,
    category: "tiers",
  },
  "membership.tiers.defaultCode": {
    description: "Default tier code for unmapped WA membership levels",
    required: false,
    capturable: false,
    category: "tiers",
  },
  "membership.tiers.waMapping": {
    description:
      "Mapping of WA membership level names to ClubOS tier codes. " +
      "NOTE: WA membership level API may not be available; manual mapping is acceptable.",
    required: false,
    capturable: false, // WA membership levels API is unreliable
    category: "tiers",
  },
};

// =============================================================================
// Template Generation
// =============================================================================

/**
 * Generate an empty policy template for manual completion.
 * Does not require WA access.
 */
export function generatePolicyTemplate(
  organizationName: string = "YOUR_ORGANIZATION_NAME"
): PolicyBundle {
  const policies: CapturedPolicy[] = [];

  for (const [key, def] of Object.entries(POLICY_DEFINITIONS)) {
    const policyKey = key as PolicyKey;
    policies.push({
      key: policyKey,
      value: null,
      source: "template",
      description: def.description,
      required: def.required,
    });
  }

  // Sort policies by category then key for deterministic output
  policies.sort((a, b) => {
    const catA = POLICY_DEFINITIONS[a.key].category;
    const catB = POLICY_DEFINITIONS[b.key].category;
    if (catA !== catB) return catA.localeCompare(catB);
    return a.key.localeCompare(b.key);
  });

  return {
    version: "1.0",
    generatedAt: new Date().toISOString(),
    organizationName,
    policies,
    validation: {
      valid: false,
      errors: ["Template requires manual completion"],
      warnings: [],
    },
    metadata: {
      captureMode: "template",
      templateSections: getTemplateSections(policies),
    },
  };
}

/**
 * Get unique template sections (policies needing manual fill)
 */
function getTemplateSections(policies: CapturedPolicy[]): string[] {
  const sections = new Set<string>();
  for (const p of policies) {
    if (p.source === "template" && p.value === null) {
      sections.add(POLICY_DEFINITIONS[p.key].category);
    }
  }
  return [...sections].sort();
}

// =============================================================================
// Policy Capture (Best-Effort from WA)
// =============================================================================

/**
 * Capture policies with best-effort WA integration.
 * Falls back to templates for uncapturable policies.
 *
 * @param waAccountInfo - Optional WA account info if available
 * @param existingMapping - Optional existing mapping file to merge
 */
export function capturePolicies(options: {
  waAccountInfo?: { name?: string; id?: string };
  existingMapping?: Partial<PolicyValueMap>;
  useDefaults?: boolean;
}): PolicyBundle {
  const { waAccountInfo, existingMapping = {}, useDefaults = false } = options;

  const policies: CapturedPolicy[] = [];
  const warnings: string[] = [];

  for (const [key, def] of Object.entries(POLICY_DEFINITIONS)) {
    const policyKey = key as PolicyKey;
    let value: PolicyValueMap[PolicyKey] | null = null;
    let source: PolicySource = "template";

    // 1. Check if provided in existing mapping
    if (policyKey in existingMapping && existingMapping[policyKey] !== undefined) {
      value = existingMapping[policyKey] as PolicyValueMap[PolicyKey];
      source = "manual";
    }
    // 2. Try to capture from WA if capturable
    else if (def.capturable && waAccountInfo) {
      const captured = captureFromWA(policyKey, waAccountInfo);
      if (captured !== null) {
        value = captured;
        source = "wa_api";
      }
    }
    // 3. Use default if allowed and available
    if (value === null && useDefaults) {
      value = POLICY_DEFAULTS[policyKey];
      source = "default";
    }

    // Add warning for uncapturable required fields
    if (value === null && def.required) {
      warnings.push(`Required policy "${policyKey}" needs manual entry`);
    }

    policies.push({
      key: policyKey,
      value,
      source,
      description: def.description,
      required: def.required,
    });
  }

  // Sort for deterministic output
  policies.sort((a, b) => {
    const catA = POLICY_DEFINITIONS[a.key].category;
    const catB = POLICY_DEFINITIONS[b.key].category;
    if (catA !== catB) return catA.localeCompare(catB);
    return a.key.localeCompare(b.key);
  });

  const validation = validatePolicies(policies);

  return {
    version: "1.0",
    generatedAt: new Date().toISOString(),
    organizationName:
      waAccountInfo?.name ||
      (existingMapping["display.organizationName"] as string) ||
      "UNKNOWN",
    policies,
    validation: {
      valid: validation.valid,
      errors: validation.errors,
      warnings: [...warnings, ...validation.warnings],
    },
    metadata: {
      waAccountId: waAccountInfo?.id,
      captureMode: "auto",
      templateSections: getTemplateSections(policies),
    },
  };
}

/**
 * Attempt to capture a policy value from WA account info.
 * Returns null if not capturable.
 */
function captureFromWA(
  key: PolicyKey,
  waAccountInfo: { name?: string; id?: string }
): PolicyValueMap[PolicyKey] | null {
  switch (key) {
    case "display.organizationName":
      return waAccountInfo.name || null;
    default:
      return null;
  }
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Validate a set of captured policies.
 */
export function validatePolicies(policies: CapturedPolicy[]): PolicyValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingRequired: string[] = [];
  const invalidValues: { key: string; error: string }[] = [];

  for (const policy of policies) {
    // Check required fields
    if (policy.required && (policy.value === null || policy.value === undefined)) {
      missingRequired.push(policy.key);
      errors.push(`Missing required policy: ${policy.key}`);
    }

    // Validate specific policy values
    if (policy.value !== null) {
      const validationError = validatePolicyValue(policy.key, policy.value);
      if (validationError) {
        invalidValues.push({ key: policy.key, error: validationError });
        errors.push(`Invalid value for ${policy.key}: ${validationError}`);
      }
    }

    // Warn about template placeholders
    if (policy.source === "template" && policy.value === null) {
      warnings.push(`Policy "${policy.key}" is using template placeholder`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    missingRequired,
    invalidValues,
  };
}

/**
 * Validate a specific policy value.
 * Returns error message or null if valid.
 */
function validatePolicyValue(key: PolicyKey, value: unknown): string | null {
  switch (key) {
    case "scheduling.timezone":
      if (typeof value !== "string" || !value.includes("/")) {
        return "Must be a valid IANA timezone (e.g., 'America/Los_Angeles')";
      }
      break;

    case "scheduling.registrationOpenDay":
    case "scheduling.announcementDay":
      if (typeof value !== "number" || value < 0 || value > 6) {
        return "Must be a number 0-6 (0=Sunday, 6=Saturday)";
      }
      break;

    case "scheduling.registrationOpenHour":
    case "scheduling.announcementHour":
      if (typeof value !== "number" || value < 0 || value > 23) {
        return "Must be a number 0-23";
      }
      break;

    case "governance.quorumPercentage":
      if (typeof value !== "number" || value < 0 || value > 100) {
        return "Must be a percentage 0-100";
      }
      break;

    case "membership.tiers.waMapping":
      if (typeof value !== "object" || value === null) {
        return "Must be an object mapping WA level names to tier codes";
      }
      break;

    case "display.organizationName":
      if (typeof value !== "string" || value.trim().length === 0) {
        return "Must be a non-empty string";
      }
      break;
  }

  return null;
}

/**
 * Validate a policy bundle from a file.
 */
export function validatePolicyBundle(bundle: PolicyBundle): PolicyValidationResult {
  return validatePolicies(bundle.policies);
}

// =============================================================================
// File I/O
// =============================================================================

/**
 * Load a policy bundle from a JSON file.
 */
export function loadPolicyBundle(filePath: string): PolicyBundle {
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content) as PolicyBundle;
}

/**
 * Write a policy bundle to JSON and markdown files.
 * Returns paths to written files.
 */
export function writePolicyBundle(
  bundle: PolicyBundle,
  outputDir: string
): { jsonPath: string; mdPath: string } {
  const dir = path.resolve(outputDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const jsonPath = path.join(dir, "policy.json");
  const mdPath = path.join(dir, "policy.md");

  // Write JSON (deterministic: sorted keys)
  fs.writeFileSync(jsonPath, JSON.stringify(bundle, null, 2));

  // Write human-readable markdown
  fs.writeFileSync(mdPath, generatePolicyMarkdown(bundle));

  return { jsonPath, mdPath };
}

/**
 * Generate human-readable markdown report from policy bundle.
 */
export function generatePolicyMarkdown(bundle: PolicyBundle): string {
  const lines: string[] = [];

  lines.push("# Policy Capture Report");
  lines.push("");
  lines.push(`**Organization:** ${bundle.organizationName}`);
  lines.push(`**Generated:** ${bundle.generatedAt}`);
  lines.push(`**Mode:** ${bundle.metadata.captureMode}`);
  lines.push("");

  // Validation status
  lines.push("## Validation Status");
  lines.push("");
  if (bundle.validation.valid) {
    lines.push("**Status: VALID**");
  } else {
    lines.push("**Status: INVALID - Action Required**");
    lines.push("");
    if (bundle.validation.errors.length > 0) {
      lines.push("### Errors");
      lines.push("");
      for (const error of bundle.validation.errors) {
        lines.push(`- ${error}`);
      }
      lines.push("");
    }
  }

  if (bundle.validation.warnings.length > 0) {
    lines.push("### Warnings");
    lines.push("");
    for (const warning of bundle.validation.warnings) {
      lines.push(`- ${warning}`);
    }
    lines.push("");
  }

  // Group policies by category
  const byCategory = new Map<string, CapturedPolicy[]>();
  for (const policy of bundle.policies) {
    const cat = POLICY_DEFINITIONS[policy.key].category;
    if (!byCategory.has(cat)) {
      byCategory.set(cat, []);
    }
    byCategory.get(cat)!.push(policy);
  }

  lines.push("## Policies by Category");
  lines.push("");

  const categoryNames: Record<string, string> = {
    display: "Display & Terminology",
    governance: "Governance",
    kpi: "KPI Thresholds",
    membership: "Membership Lifecycle",
    scheduling: "Event Scheduling",
    tiers: "Membership Tiers",
  };

  for (const [category, policies] of [...byCategory.entries()].sort()) {
    lines.push(`### ${categoryNames[category] || category}`);
    lines.push("");
    lines.push("| Policy | Value | Source | Required |");
    lines.push("|--------|-------|--------|----------|");

    for (const p of policies) {
      const valueStr =
        p.value === null
          ? "_NEEDS ENTRY_"
          : typeof p.value === "object"
            ? JSON.stringify(p.value)
            : String(p.value);
      const requiredStr = p.required ? "Yes" : "No";
      lines.push(`| \`${p.key}\` | ${valueStr} | ${p.source} | ${requiredStr} |`);
    }
    lines.push("");
  }

  // Template sections needing attention
  if (bundle.metadata.templateSections.length > 0) {
    lines.push("## Sections Needing Manual Entry");
    lines.push("");
    lines.push(
      "The following sections have policies that need manual configuration:"
    );
    lines.push("");
    for (const section of bundle.metadata.templateSections) {
      lines.push(`- ${categoryNames[section] || section}`);
    }
    lines.push("");
    lines.push("Edit `policy.json` to fill in the missing values, then run:");
    lines.push("");
    lines.push("```bash");
    lines.push("npx tsx scripts/migration/capture-policies.ts --validate-only --mapping-file policy.json");
    lines.push("```");
    lines.push("");
  }

  // Tier mapping section
  lines.push("## WA Membership Level Mapping");
  lines.push("");
  lines.push(
    "> **Note:** The WA membership level API may not be available or reliable. " +
    "Manual mapping is acceptable and often necessary."
  );
  lines.push("");

  const tierMapping = bundle.policies.find(
    (p) => p.key === "membership.tiers.waMapping"
  );
  if (tierMapping?.value && typeof tierMapping.value === "object") {
    lines.push("Current mapping:");
    lines.push("");
    lines.push("| WA Level | ClubOS Tier Code |");
    lines.push("|----------|------------------|");
    for (const [waLevel, tierCode] of Object.entries(tierMapping.value as Record<string, string>)) {
      lines.push(`| ${waLevel} | ${tierCode} |`);
    }
    lines.push("");
  } else {
    lines.push("No tier mapping configured. To enable tier mapping:");
    lines.push("");
    lines.push("1. Set `membership.tiers.enabled` to `true`");
    lines.push("2. Add WA level → tier code mappings to `membership.tiers.waMapping`");
    lines.push("3. Set `membership.tiers.defaultCode` for unmapped levels");
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Merge a partial mapping into defaults to create a complete policy map.
 */
export function mergeWithDefaults(
  partial: Partial<PolicyValueMap>
): PolicyValueMap {
  return { ...POLICY_DEFAULTS, ...partial };
}

/**
 * Extract just the values from a policy bundle into a PolicyValueMap.
 */
export function extractPolicyValues(bundle: PolicyBundle): Partial<PolicyValueMap> {
  const result: Partial<PolicyValueMap> = {};
  for (const policy of bundle.policies) {
    if (policy.value !== null) {
      (result as Record<string, unknown>)[policy.key] = policy.value;
    }
  }
  return result;
}
