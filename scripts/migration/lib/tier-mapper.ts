/**
 * Membership Tier Mapper
 *
 * Maps WA membership levels to Murmurant MembershipTier IDs.
 * Gated by feature flag: membership_tiers_enabled
 *
 * Related: Issue #276, #275, #202
 */

import { PrismaClient } from "@prisma/client";
import { isEnabled } from "../../../src/lib/flags";
import { getPolicy } from "../../../src/lib/policy/getPolicy";

// =============================================================================
// Types
// =============================================================================

export interface TierMapping {
  waLevel: string;
  tierCode: string;
  tierId: string;
}

export interface TierMapperResult {
  enabled: boolean;
  mappings: Map<string, string>; // WA level -> tier ID
  tierCodes: Map<string, string>; // tier code -> tier ID
  defaultTierId: string | null;
  missing: string[];
  errors: string[];
}

// =============================================================================
// Feature Flag Check
// =============================================================================

/**
 * Check if tier mapping is enabled.
 * Migration engine should fail fast if this returns false and tiers are expected.
 */
export function isTierMappingEnabled(): boolean {
  return isEnabled("membership_tiers_enabled");
}

// =============================================================================
// Tier Mapper
// =============================================================================

/**
 * Load tier mappings from database and policy.
 * Returns a mapper that can resolve WA levels to Murmurant tier IDs.
 */
export async function loadTierMappings(
  prisma: PrismaClient
): Promise<TierMapperResult> {
  const result: TierMapperResult = {
    enabled: isTierMappingEnabled(),
    mappings: new Map(),
    tierCodes: new Map(),
    defaultTierId: null,
    missing: [],
    errors: [],
  };

  // If feature flag is off, return empty result
  if (!result.enabled) {
    return result;
  }

  try {
    // Get WA level mapping from policy
    const waMapping = getPolicy("membership.tiers.waMapping", { orgId: "tenant-zero" });
    const defaultCode = getPolicy("membership.tiers.defaultCode", { orgId: "tenant-zero" });

    // Load all tiers from database
    const tiers = await prisma.membershipTier.findMany({
      select: { id: true, code: true },
    });

    // Build code -> ID lookup
    for (const tier of tiers) {
      result.tierCodes.set(tier.code, tier.id);
    }

    // Set default tier ID
    if (defaultCode && result.tierCodes.has(defaultCode)) {
      result.defaultTierId = result.tierCodes.get(defaultCode)!;
    }

    // Build WA level -> tier ID mappings
    for (const [waLevel, tierCode] of Object.entries(waMapping)) {
      if (result.tierCodes.has(tierCode)) {
        result.mappings.set(waLevel, result.tierCodes.get(tierCode)!);
      } else {
        result.missing.push(`Tier code "${tierCode}" (for WA level "${waLevel}") not found in database`);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    result.errors.push(`Failed to load tier mappings: ${message}`);
  }

  return result;
}

/**
 * Resolve a WA membership level to a Murmurant tier ID.
 */
export function resolveTierId(
  waLevel: string,
  mapper: TierMapperResult
): { tierId: string | null; error?: string } {
  // If not enabled, return null (no tier assignment)
  if (!mapper.enabled) {
    return { tierId: null };
  }

  // Look up direct mapping
  const tierId = mapper.mappings.get(waLevel);
  if (tierId) {
    return { tierId };
  }

  // Fall back to default
  if (mapper.defaultTierId) {
    return { tierId: mapper.defaultTierId };
  }

  // No mapping found
  return {
    tierId: null,
    error: `No tier mapping for WA level "${waLevel}" and no default tier configured`,
  };
}

/**
 * Validate that tier mapping is complete before running migration.
 * Returns errors if any required tiers are missing.
 */
export function validateTierMapper(mapper: TierMapperResult): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [...mapper.errors, ...mapper.missing];

  if (mapper.enabled && !mapper.defaultTierId) {
    errors.push("Default tier is not configured or not found in database");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
