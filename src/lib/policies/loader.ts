/**
 * Policy Registry Loader
 *
 * Loads and parses the canonical POLICY_REGISTRY.yaml file.
 * Provides typed access to club policies for UI display and enforcement.
 *
 * Charter Principles:
 * - N5: No hidden rules - policies are visible and documented
 * - P5: Visible state - policy status is queryable
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import * as fs from "fs";
import * as path from "path";
import yaml from "js-yaml";

// Policy categories as defined in the registry
export type PolicyCategory =
  | "Events"
  | "Membership"
  | "Privacy"
  | "Communications"
  | "Finance"
  | "Governance";

// Policy status
export type PolicyStatus = "active" | "draft" | "deprecated";

// Enforcement level
export type EnforcementLevel = "automatic" | "manual" | "advisory";

/**
 * A policy as defined in POLICY_REGISTRY.yaml
 */
export interface Policy {
  id: string;
  title: string;
  shortTitle: string;
  category: PolicyCategory;
  status: PolicyStatus;
  effectiveDate: string;
  summary: string;
  description: string;
  enforcementLevel: EnforcementLevel;
  enforcementPoints: string[];
  relatedDocs: string[];
  approvedBy: string;
  approvalDate: string;
  reviewSchedule: string;
  nextReviewDate: string;
}

/**
 * Registry metadata
 */
export interface PolicyRegistryMetadata {
  totalPolicies: number;
  byCategory: Record<PolicyCategory, number>;
  byStatus: Record<PolicyStatus, number>;
}

/**
 * The full policy registry structure
 */
export interface PolicyRegistry {
  version: string;
  lastUpdated: string;
  maintainer: string;
  policies: Policy[];
  metadata: PolicyRegistryMetadata;
}

// Cache the loaded registry
let cachedRegistry: PolicyRegistry | null = null;

/**
 * Load the policy registry from YAML file.
 * Results are cached for performance.
 */
export function loadPolicyRegistry(): PolicyRegistry {
  if (cachedRegistry) {
    return cachedRegistry;
  }

  const registryPath = path.join(
    process.cwd(),
    "docs/policies/POLICY_REGISTRY.yaml"
  );

  if (!fs.existsSync(registryPath)) {
    throw new Error(`Policy registry not found at: ${registryPath}`);
  }

  const fileContent = fs.readFileSync(registryPath, "utf8");
  const registry = yaml.load(fileContent) as PolicyRegistry;

  // Validate required fields
  if (!registry.policies || !Array.isArray(registry.policies)) {
    throw new Error("Invalid policy registry: missing policies array");
  }

  cachedRegistry = registry;
  return registry;
}

/**
 * Clear the cached registry (useful for testing)
 */
export function clearPolicyCache(): void {
  cachedRegistry = null;
}

/**
 * Get all policies, optionally filtered by category or status
 */
export function getPolicies(filters?: {
  category?: PolicyCategory;
  status?: PolicyStatus;
  search?: string;
}): Policy[] {
  const registry = loadPolicyRegistry();
  let policies = registry.policies;

  if (filters?.category) {
    policies = policies.filter((p) => p.category === filters.category);
  }

  if (filters?.status) {
    policies = policies.filter((p) => p.status === filters.status);
  }

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    policies = policies.filter(
      (p) =>
        p.id.toLowerCase().includes(searchLower) ||
        p.title.toLowerCase().includes(searchLower) ||
        p.shortTitle.toLowerCase().includes(searchLower) ||
        p.summary.toLowerCase().includes(searchLower) ||
        p.category.toLowerCase().includes(searchLower)
    );
  }

  return policies;
}

/**
 * Get a single policy by ID
 */
export function getPolicyById(id: string): Policy | undefined {
  const registry = loadPolicyRegistry();
  return registry.policies.find((p) => p.id === id);
}

/**
 * Get registry metadata
 */
export function getPolicyMetadata(): PolicyRegistryMetadata {
  const registry = loadPolicyRegistry();
  return registry.metadata;
}

/**
 * Get all unique categories from the registry
 */
export function getPolicyCategories(): PolicyCategory[] {
  const registry = loadPolicyRegistry();
  const categories = new Set<PolicyCategory>();
  registry.policies.forEach((p) => categories.add(p.category));
  return Array.from(categories).sort();
}

/**
 * Check if a policy ID exists in the registry
 */
export function policyExists(id: string): boolean {
  const registry = loadPolicyRegistry();
  return registry.policies.some((p) => p.id === id);
}

/**
 * Get all policy IDs (useful for validation)
 */
export function getAllPolicyIds(): string[] {
  const registry = loadPolicyRegistry();
  return registry.policies.map((p) => p.id);
}
