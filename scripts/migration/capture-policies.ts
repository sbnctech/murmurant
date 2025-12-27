#!/usr/bin/env npx tsx
/**
 * Policy Capture Script
 *
 * Captures organization policies for ClubOS migration.
 * Generates a policy bundle artifact for operator review and validation.
 *
 * Usage:
 *   # Generate empty template (no WA access needed)
 *   npx tsx scripts/migration/capture-policies.ts --generate-template
 *
 *   # Best-effort capture with WA (falls back to template for uncapturable)
 *   npx tsx scripts/migration/capture-policies.ts
 *
 *   # Validate an existing mapping file
 *   npx tsx scripts/migration/capture-policies.ts --validate-only --mapping-file policy.json
 *
 *   # Capture with existing mapping merged in
 *   npx tsx scripts/migration/capture-policies.ts --mapping-file my-policies.json
 *
 *   # Use defaults for non-required fields
 *   npx tsx scripts/migration/capture-policies.ts --use-defaults
 *
 * Environment:
 *   WA_API_KEY       - Wild Apricot API key (optional, for org name capture)
 *   WA_ACCOUNT_ID    - Wild Apricot account ID (optional)
 *   OUTPUT_DIR       - Output directory (default: ./migration-output)
 *
 * Related: Issue #275, #202, #263
 */

import * as fs from "fs";
import {
  generatePolicyTemplate,
  capturePolicies,
  validatePolicyBundle,
  loadPolicyBundle,
  writePolicyBundle,
  extractPolicyValues,
} from "./lib/policy-capture";
import type { PolicyValueMap } from "../../src/lib/policy/types";

// =============================================================================
// CLI Parsing
// =============================================================================

interface CliOptions {
  generateTemplate: boolean;
  validateOnly: boolean;
  mappingFile?: string;
  useDefaults: boolean;
  outputDir: string;
  organizationName?: string;
  verbose: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    generateTemplate: false,
    validateOnly: false,
    useDefaults: false,
    outputDir: process.env.OUTPUT_DIR || "./migration-output",
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--generate-template":
        options.generateTemplate = true;
        break;
      case "--validate-only":
        options.validateOnly = true;
        break;
      case "--mapping-file":
        options.mappingFile = args[++i];
        break;
      case "--use-defaults":
        options.useDefaults = true;
        break;
      case "--output-dir":
        options.outputDir = args[++i];
        break;
      case "--org-name":
        options.organizationName = args[++i];
        break;
      case "--verbose":
      case "-v":
        options.verbose = true;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
      default:
        if (arg.startsWith("-")) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
Policy Capture Script

Generates a policy bundle for ClubOS migration. Supports three modes:
1. --generate-template: Create empty template for manual completion
2. (default): Best-effort capture with WA, template for rest
3. --validate-only: Validate an existing mapping file

Usage:
  npx tsx scripts/migration/capture-policies.ts [options]

Options:
  --generate-template    Generate empty template (no WA access needed)
  --validate-only        Only validate, don't generate new bundle
  --mapping-file <file>  Existing policy JSON to validate or merge
  --use-defaults         Use platform defaults for optional fields
  --output-dir <dir>     Output directory (default: ./migration-output)
  --org-name <name>      Organization name (overrides WA capture)
  --verbose, -v          Verbose output
  --help, -h             Show this help

Environment Variables:
  WA_API_KEY             Wild Apricot API key (for org name capture)
  WA_ACCOUNT_ID          Wild Apricot account ID
  OUTPUT_DIR             Default output directory

Examples:
  # Generate template for manual completion
  npx tsx scripts/migration/capture-policies.ts --generate-template

  # Validate a completed mapping
  npx tsx scripts/migration/capture-policies.ts --validate-only --mapping-file policy.json

  # Capture with defaults for optional fields
  npx tsx scripts/migration/capture-policies.ts --use-defaults --org-name "My Club"
`);
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
  const options = parseArgs();

  console.log("\n" + "=".repeat(60));
  console.log("ClubOS Policy Capture");
  console.log("=".repeat(60) + "\n");

  // Mode: Validate only
  if (options.validateOnly) {
    if (!options.mappingFile) {
      console.error("ERROR: --validate-only requires --mapping-file");
      process.exit(1);
    }
    await runValidateOnly(options);
    return;
  }

  // Mode: Generate template
  if (options.generateTemplate) {
    await runGenerateTemplate(options);
    return;
  }

  // Mode: Best-effort capture
  await runCapture(options);
}

async function runValidateOnly(options: CliOptions): Promise<void> {
  console.log(`[validate] Loading: ${options.mappingFile}`);

  if (!fs.existsSync(options.mappingFile!)) {
    console.error(`ERROR: File not found: ${options.mappingFile}`);
    process.exit(1);
  }

  const bundle = loadPolicyBundle(options.mappingFile!);
  const result = validatePolicyBundle(bundle);

  console.log("");
  if (result.valid) {
    console.log("[validate] Result: VALID");
    console.log("");
    console.log("All required policies are present and valid.");
    console.log("This policy bundle is ready for migration.");
  } else {
    console.log("[validate] Result: INVALID");
    console.log("");

    if (result.errors.length > 0) {
      console.log("Errors:");
      for (const error of result.errors) {
        console.log(`  - ${error}`);
      }
      console.log("");
    }

    if (result.missingRequired.length > 0) {
      console.log("Missing required policies:");
      for (const key of result.missingRequired) {
        console.log(`  - ${key}`);
      }
      console.log("");
    }

    console.log("Please fix the errors above and run validation again.");
    process.exit(1);
  }

  if (result.warnings.length > 0) {
    console.log("Warnings:");
    for (const warning of result.warnings) {
      console.log(`  - ${warning}`);
    }
    console.log("");
  }

  console.log("=".repeat(60) + "\n");
}

async function runGenerateTemplate(options: CliOptions): Promise<void> {
  console.log("[template] Generating empty policy template...");

  const bundle = generatePolicyTemplate(
    options.organizationName || "YOUR_ORGANIZATION_NAME"
  );

  const { jsonPath, mdPath } = writePolicyBundle(bundle, options.outputDir);

  console.log("");
  console.log("[template] Output files:");
  console.log(`  - ${jsonPath}`);
  console.log(`  - ${mdPath}`);
  console.log("");
  console.log("Next steps:");
  console.log("1. Edit policy.json to fill in required values");
  console.log("2. Review policy.md for guidance on each field");
  console.log("3. Run validation:");
  console.log(
    `   npx tsx scripts/migration/capture-policies.ts --validate-only --mapping-file ${jsonPath}`
  );
  console.log("");
  console.log("=".repeat(60) + "\n");
}

async function runCapture(options: CliOptions): Promise<void> {
  console.log("[capture] Starting policy capture...");

  // Load existing mapping if provided
  let existingMapping: Partial<PolicyValueMap> = {};
  if (options.mappingFile) {
    if (!fs.existsSync(options.mappingFile)) {
      console.error(`ERROR: File not found: ${options.mappingFile}`);
      process.exit(1);
    }
    console.log(`[capture] Loading existing mapping: ${options.mappingFile}`);
    const bundle = loadPolicyBundle(options.mappingFile);
    existingMapping = extractPolicyValues(bundle);
  }

  // Get WA account info if available
  let waAccountInfo: { name?: string; id?: string } | undefined;
  const waApiKey = process.env.WA_API_KEY;
  const waAccountId = process.env.WA_ACCOUNT_ID;

  if (waApiKey && waAccountId) {
    console.log("[capture] WA credentials found, attempting to fetch org info...");
    try {
      waAccountInfo = await fetchWaAccountInfo(waApiKey, waAccountId);
      console.log(`[capture] Organization: ${waAccountInfo.name}`);
    } catch (error) {
      console.log(
        `[capture] Could not fetch WA info: ${(error as Error).message}`
      );
      console.log("[capture] Continuing with manual/default values...");
    }
  } else {
    console.log("[capture] No WA credentials, using manual/default values");
  }

  // Override org name if provided
  if (options.organizationName) {
    waAccountInfo = { ...waAccountInfo, name: options.organizationName };
  }

  // Capture policies
  const bundle = capturePolicies({
    waAccountInfo,
    existingMapping,
    useDefaults: options.useDefaults,
  });

  // Write output
  const { jsonPath, mdPath } = writePolicyBundle(bundle, options.outputDir);

  console.log("");
  console.log("[capture] Output files:");
  console.log(`  - ${jsonPath}`);
  console.log(`  - ${mdPath}`);
  console.log("");

  // Report validation status
  if (bundle.validation.valid) {
    console.log("[capture] Validation: PASSED");
  } else {
    console.log("[capture] Validation: NEEDS ATTENTION");
    console.log("");
    if (bundle.validation.errors.length > 0) {
      console.log("Errors to fix:");
      for (const error of bundle.validation.errors) {
        console.log(`  - ${error}`);
      }
      console.log("");
    }
  }

  if (bundle.metadata.templateSections.length > 0) {
    console.log("Sections needing manual entry:");
    for (const section of bundle.metadata.templateSections) {
      console.log(`  - ${section}`);
    }
    console.log("");
    console.log("Edit policy.json, then validate:");
    console.log(
      `  npx tsx scripts/migration/capture-policies.ts --validate-only --mapping-file ${jsonPath}`
    );
  }

  console.log("");
  console.log("=".repeat(60) + "\n");
}

/**
 * Fetch basic account info from WA API.
 * Minimal implementation - just gets org name.
 */
async function fetchWaAccountInfo(
  apiKey: string,
  accountId: string
): Promise<{ name?: string; id?: string }> {
  // Get OAuth token
  const tokenResponse = await fetch(
    "https://oauth.wildapricot.org/auth/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`APIKEY:${apiKey}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials&scope=auto",
    }
  );

  if (!tokenResponse.ok) {
    throw new Error(`WA auth failed: ${tokenResponse.status}`);
  }

  const tokenData = (await tokenResponse.json()) as { access_token: string };

  // Get account info
  const accountResponse = await fetch(
    `https://api.wildapricot.org/v2.2/accounts/${accountId}`,
    {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/json",
      },
    }
  );

  if (!accountResponse.ok) {
    throw new Error(`WA account fetch failed: ${accountResponse.status}`);
  }

  const accountData = (await accountResponse.json()) as { Name?: string };

  return {
    name: accountData.Name,
    id: accountId,
  };
}

// Run
main().catch((error) => {
  console.error("FATAL:", error);
  process.exit(1);
});
