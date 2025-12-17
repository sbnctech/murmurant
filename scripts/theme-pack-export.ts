#!/usr/bin/env npx tsx

/**
 * Theme Pack Export Script
 *
 * Exports a theme pack as a zip archive.
 *
 * Usage:
 *   npx tsx scripts/theme-pack-export.ts <pack-name>
 *
 * Example:
 *   npx tsx scripts/theme-pack-export.ts sbnc
 *
 * Output:
 *   Creates theme-packs/<pack-name>.zip
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join, resolve } from "path";

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage: npx tsx scripts/theme-pack-export.ts <pack-name>");
  console.error("Example: npx tsx scripts/theme-pack-export.ts sbnc");
  process.exit(1);
}

const packName = args[0];
const rootDir = resolve(__dirname, "..");
const packsDir = join(rootDir, "theme-packs");
const packDir = join(packsDir, `${packName}-pack`);
const outputZip = join(packsDir, `${packName}-pack.zip`);

// Verify pack exists
if (!existsSync(packDir)) {
  console.error(`Error: Pack directory not found: ${packDir}`);
  console.error(`Available packs:`);
  const dirs = execSync(`ls -d ${packsDir}/*-pack 2>/dev/null || true`, {
    encoding: "utf-8",
  });
  if (dirs.trim()) {
    dirs
      .trim()
      .split("\n")
      .forEach((d) => console.error(`  - ${d.split("/").pop()?.replace("-pack", "")}`));
  } else {
    console.error("  (none found)");
  }
  process.exit(1);
}

// Verify MANIFEST.json exists
const manifestPath = join(packDir, "MANIFEST.json");
if (!existsSync(manifestPath)) {
  console.error(`Error: MANIFEST.json not found in pack: ${manifestPath}`);
  process.exit(1);
}

// Read manifest for display
const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));

console.log(`Exporting theme pack: ${manifest.name} v${manifest.version}`);
console.log(`Description: ${manifest.description}`);
console.log(`Files: ${manifest.files.length}`);
console.log("");

// Create zip archive
try {
  // Remove existing zip if present
  if (existsSync(outputZip)) {
    execSync(`rm "${outputZip}"`);
  }

  // Create zip from pack directory
  execSync(`cd "${packsDir}" && zip -r "${packName}-pack.zip" "${packName}-pack"`, {
    stdio: "inherit",
  });

  console.log("");
  console.log(`Success! Created: ${outputZip}`);
  console.log("");
  console.log("To install this pack in another repo:");
  console.log(`  1. Copy ${packName}-pack.zip to the target repo's theme-packs/ directory`);
  console.log(`  2. Run: npx tsx scripts/theme-pack-install.ts ${packName}`);
} catch (error) {
  console.error("Error creating zip archive:", error);
  process.exit(1);
}
