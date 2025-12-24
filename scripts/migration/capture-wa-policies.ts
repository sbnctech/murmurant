#!/usr/bin/env npx tsx
/**
 * WA Policy Capture CLI
 *
 * Extracts organization policies from Wild Apricot and produces
 * a migration bundle ready for import.
 *
 * Usage:
 *   npx tsx scripts/migration/capture-wa-policies.ts --output-dir ./migration_bundle
 *   npx tsx scripts/migration/capture-wa-policies.ts --validate-only --mapping-file ./mapping.json
 *
 * Environment:
 *   WA_API_KEY     - Wild Apricot API key
 *   WA_ACCOUNT_ID  - Wild Apricot account ID
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { createWAClient } from "../../src/lib/importing/wildapricot";
import {
  fetchMembershipLevels,
  generateMappingTemplate,
  loadMappingFile,
  saveMappingFile,
  validateMappingFile,
  generatePolicyCaptureReport,
  renderReportAsMarkdown,
  writeMigrationBundle,
} from "./lib/policy-capture";
import {
  SourceOrgInfo,
  CapturedMembershipLevel,
  MembershipLevelMappingFile,
} from "./lib/policy-capture-types";

// ANSI colors
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const NC = "\x1b[0m";

// ============================================================================
// CLI Helpers
// ============================================================================

function printUsage(): void {
  console.log(`
${CYAN}WA Policy Capture${NC}

Extracts organization policies from Wild Apricot for migration to ClubOS.

${YELLOW}Usage:${NC}
  npx tsx scripts/migration/capture-wa-policies.ts [options]

${YELLOW}Options:${NC}
  --output-dir <path>     Output directory for migration bundle (default: ./migration_bundle)
  --mapping-file <path>   Use existing mapping file instead of generating new one
  --validate-only         Only validate mapping file, don't capture policies
  --generate-template     Generate template mapping file and exit
  --help                  Show this help message

${YELLOW}Environment Variables:${NC}
  WA_API_KEY              Wild Apricot API key (required unless --validate-only)
  WA_ACCOUNT_ID           Wild Apricot account ID (required unless --validate-only)

${YELLOW}Examples:${NC}
  # Full capture with API
  WA_API_KEY=xxx WA_ACCOUNT_ID=123 npx tsx scripts/migration/capture-wa-policies.ts

  # Validate existing mapping
  npx tsx scripts/migration/capture-wa-policies.ts --validate-only --mapping-file ./mapping.json

  # Generate template for manual entry
  npx tsx scripts/migration/capture-wa-policies.ts --generate-template --output-dir ./migration_bundle
`);
}

function parseArgs(): {
  outputDir: string;
  mappingFile: string | null;
  validateOnly: boolean;
  generateTemplate: boolean;
  help: boolean;
} {
  const args = process.argv.slice(2);
  const result = {
    outputDir: "./migration_bundle",
    mappingFile: null as string | null,
    validateOnly: false,
    generateTemplate: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--output-dir":
        result.outputDir = args[++i];
        break;
      case "--mapping-file":
        result.mappingFile = args[++i];
        break;
      case "--validate-only":
        result.validateOnly = true;
        break;
      case "--generate-template":
        result.generateTemplate = true;
        break;
      case "--help":
        result.help = true;
        break;
    }
  }

  return result;
}

async function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ============================================================================
// Main Flow
// ============================================================================

async function runCapture(args: ReturnType<typeof parseArgs>): Promise<void> {
  console.log(`\n${CYAN}=== WA Policy Capture ===${NC}\n`);

  const accountId = process.env.WA_ACCOUNT_ID || "";

  // Step 1: Try to fetch membership levels from API
  console.log(`${YELLOW}Step 1: Fetching membership levels from WA API...${NC}`);

  let capturedLevels: CapturedMembershipLevel[] = [];
  let apiError: string | undefined;

  if (process.env.WA_API_KEY && process.env.WA_ACCOUNT_ID) {
    const client = createWAClient();
    const result = await fetchMembershipLevels(client);
    capturedLevels = result.levels;
    apiError = result.error;

    if (apiError) {
      console.log(`${RED}API Error: ${apiError}${NC}`);
    } else if (capturedLevels.length === 0) {
      console.log(`${YELLOW}No membership levels found via API.${NC}`);
    } else {
      console.log(`${GREEN}Found ${capturedLevels.length} membership levels.${NC}`);
      for (const level of capturedLevels) {
        console.log(`  - ${level.name} (ID: ${level.waId}, Fee: $${level.fee})`);
      }
    }
  } else {
    console.log(`${YELLOW}WA_API_KEY or WA_ACCOUNT_ID not set. Using manual fallback.${NC}`);
    apiError = "Credentials not provided";
  }

  // Step 2: Handle mapping file
  console.log(`\n${YELLOW}Step 2: Preparing membership level mapping...${NC}`);

  let mapping: MembershipLevelMappingFile;

  if (args.mappingFile) {
    // Use provided mapping file
    console.log(`Loading mapping from: ${args.mappingFile}`);
    const loadResult = loadMappingFile(args.mappingFile);

    if ("error" in loadResult) {
      console.error(`${RED}${loadResult.error}${NC}`);
      process.exit(1);
    }

    mapping = loadResult;
  } else if (capturedLevels.length > 0) {
    // Generate mapping from captured levels
    console.log("Generating mapping from captured levels...");
    mapping = generateMappingTemplate(capturedLevels);
    mapping.source = "api";

    // Auto-map obvious cases
    for (const entry of mapping.levels) {
      const nameLower = entry.waName.toLowerCase();
      if (nameLower.includes("active") || nameLower.includes("member")) {
        entry.clubosTier = "active";
      } else if (nameLower.includes("lapsed") || nameLower.includes("expired")) {
        entry.clubosTier = "lapsed";
      } else if (nameLower.includes("pending")) {
        entry.clubosTier = "pending_new";
      } else if (nameLower.includes("suspended")) {
        entry.clubosTier = "suspended";
      } else if (nameLower.includes("guest") || nameLower.includes("contact")) {
        entry.clubosTier = "not_a_member";
      }
    }
  } else {
    // No API data and no mapping file - generate template for manual entry
    console.log("No membership levels available. Generating template for manual entry...");
    mapping = generateMappingTemplate([]);
  }

  // Save mapping file
  const mappingPath = path.join(args.outputDir, "mappings", "membership_levels_mapping.json");
  console.log(`\nSaving mapping to: ${mappingPath}`);
  const saveResult = saveMappingFile(mappingPath, mapping);

  if (!saveResult.success) {
    console.error(`${RED}${saveResult.error}${NC}`);
    process.exit(1);
  }

  // Step 3: Validate mapping
  console.log(`\n${YELLOW}Step 3: Validating mapping...${NC}`);

  const validation = validateMappingFile(mapping, capturedLevels);

  if (validation.warnings.length > 0) {
    console.log(`\n${YELLOW}Warnings:${NC}`);
    for (const warn of validation.warnings) {
      console.log(`  - ${warn.level}: ${warn.message}`);
    }
  }

  if (!validation.valid) {
    console.log(`\n${RED}Validation failed:${NC}`);
    for (const err of validation.errors) {
      console.log(`  - ${err.level}: ${err.message}`);
    }
    console.log(`\n${YELLOW}Please edit the mapping file and re-run:${NC}`);
    console.log(`  ${mappingPath}`);
    console.log(`\nThen validate with:`);
    console.log(`  npx tsx scripts/migration/capture-wa-policies.ts --validate-only --mapping-file ${mappingPath}`);
    process.exit(1);
  }

  console.log(`${GREEN}Validation passed!${NC}`);
  console.log(`  - Total levels: ${validation.summary.totalLevels}`);
  console.log(`  - Mapped: ${validation.summary.mappedLevels}`);
  console.log(`  - Ignored: ${validation.summary.ignoredLevels}`);

  // Step 4: Generate report and write bundle
  console.log(`\n${YELLOW}Step 4: Writing migration bundle...${NC}`);

  const report = generatePolicyCaptureReport(accountId, capturedLevels, mapping, validation);

  const sourceOrg: SourceOrgInfo = {
    accountId,
    name: `WA Account ${accountId}`,
    timezone: null,
    extractedAt: new Date().toISOString(),
    apiStatus: apiError ? "failed" : capturedLevels.length > 0 ? "success" : "partial",
    errors: apiError ? [apiError] : [],
  };

  const bundleResult = writeMigrationBundle(args.outputDir, {
    sourceOrg,
    capturedLevels,
    mapping,
    report,
  });

  if (!bundleResult.success) {
    console.error(`${RED}${bundleResult.error}${NC}`);
    process.exit(1);
  }

  console.log(`${GREEN}Migration bundle written to: ${args.outputDir}${NC}`);
  console.log(`\nBundle contents:`);
  console.log(`  - source_org.json`);
  console.log(`  - policies/membership_levels.json`);
  console.log(`  - mappings/membership_levels_mapping.json`);
  console.log(`  - reports/policy_capture_report.md`);
  console.log(`  - reports/policy_capture_report.json`);

  console.log(`\n${GREEN}=== Policy Capture Complete ===${NC}\n`);
}

async function runValidateOnly(args: ReturnType<typeof parseArgs>): Promise<void> {
  console.log(`\n${CYAN}=== Validate Mapping File ===${NC}\n`);

  if (!args.mappingFile) {
    console.error(`${RED}--mapping-file is required with --validate-only${NC}`);
    process.exit(1);
  }

  console.log(`Loading: ${args.mappingFile}`);
  const loadResult = loadMappingFile(args.mappingFile);

  if ("error" in loadResult) {
    console.error(`${RED}${loadResult.error}${NC}`);
    process.exit(1);
  }

  const validation = validateMappingFile(loadResult);

  if (validation.warnings.length > 0) {
    console.log(`\n${YELLOW}Warnings:${NC}`);
    for (const warn of validation.warnings) {
      console.log(`  - ${warn.level}: ${warn.message}`);
    }
  }

  if (!validation.valid) {
    console.log(`\n${RED}Validation failed:${NC}`);
    for (const err of validation.errors) {
      console.log(`  - ${err.level}: ${err.message}`);
    }
    process.exit(1);
  }

  console.log(`\n${GREEN}Validation passed!${NC}`);
  console.log(`  - Total levels: ${validation.summary.totalLevels}`);
  console.log(`  - Mapped: ${validation.summary.mappedLevels}`);
  console.log(`  - Ignored: ${validation.summary.ignoredLevels}`);
}

async function runGenerateTemplate(args: ReturnType<typeof parseArgs>): Promise<void> {
  console.log(`\n${CYAN}=== Generate Mapping Template ===${NC}\n`);

  const mapping = generateMappingTemplate([]);

  const mappingPath = path.join(args.outputDir, "mappings", "membership_levels_mapping.json");
  console.log(`Generating template: ${mappingPath}`);

  const saveResult = saveMappingFile(mappingPath, mapping);

  if (!saveResult.success) {
    console.error(`${RED}${saveResult.error}${NC}`);
    process.exit(1);
  }

  console.log(`${GREEN}Template generated!${NC}`);
  console.log(`\nEdit the file to add your WA membership levels and their ClubOS tier mappings.`);
  console.log(`\nThen run:`);
  console.log(`  npx tsx scripts/migration/capture-wa-policies.ts --mapping-file ${mappingPath}`);
}

// ============================================================================
// Entry Point
// ============================================================================

async function main(): Promise<void> {
  const args = parseArgs();

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  if (args.validateOnly) {
    await runValidateOnly(args);
  } else if (args.generateTemplate) {
    await runGenerateTemplate(args);
  } else {
    await runCapture(args);
  }
}

main().catch((error) => {
  console.error(`${RED}Fatal error: ${error.message}${NC}`);
  process.exit(1);
});
