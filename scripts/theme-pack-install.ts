#!/usr/bin/env npx tsx

/**
 * Theme Pack Install Script
 *
 * Installs a theme pack into the ClubOS repo.
 * Idempotent - safe to run multiple times.
 *
 * Usage:
 *   npx tsx scripts/theme-pack-install.ts <pack-name>
 *
 * Example:
 *   npx tsx scripts/theme-pack-install.ts sbnc
 *
 * The script will:
 * 1. Look for theme-packs/<pack-name>-pack/ directory (or unzip .zip if needed)
 * 2. Read MANIFEST.json
 * 3. Copy files to their destinations
 * 4. Update index files to include the new theme/templates
 */

import { execSync } from "child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
} from "fs";
import { join, resolve, dirname } from "path";

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage: npx tsx scripts/theme-pack-install.ts <pack-name>");
  console.error("Example: npx tsx scripts/theme-pack-install.ts sbnc");
  process.exit(1);
}

const packName = args[0];
const rootDir = resolve(__dirname, "..");
const packsDir = join(rootDir, "theme-packs");
const packDir = join(packsDir, `${packName}-pack`);
const packZip = join(packsDir, `${packName}-pack.zip`);

// Check if we need to unzip first
if (!existsSync(packDir) && existsSync(packZip)) {
  console.log(`Extracting ${packZip}...`);
  execSync(`cd "${packsDir}" && unzip -o "${packName}-pack.zip"`, {
    stdio: "inherit",
  });
}

// Verify pack exists
if (!existsSync(packDir)) {
  console.error(`Error: Pack not found: ${packDir}`);
  console.error(`Also checked for: ${packZip}`);
  process.exit(1);
}

// Read manifest
const manifestPath = join(packDir, "MANIFEST.json");
if (!existsSync(manifestPath)) {
  console.error(`Error: MANIFEST.json not found: ${manifestPath}`);
  process.exit(1);
}

interface ManifestFile {
  source: string;
  destination: string;
  type: string;
}

interface Manifest {
  name: string;
  version: string;
  description: string;
  files: ManifestFile[];
  themeId: string;
}

const manifest: Manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));

console.log(`Installing theme pack: ${manifest.name} v${manifest.version}`);
console.log(`Description: ${manifest.description}`);
console.log("");

// Copy files
console.log("Copying files...");
for (const file of manifest.files) {
  const sourcePath = join(packDir, file.source);
  const destPath = join(rootDir, file.destination);

  if (!existsSync(sourcePath)) {
    console.warn(`  Warning: Source file not found: ${file.source}`);
    continue;
  }

  // Ensure destination directory exists
  const destDir = dirname(destPath);
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }

  copyFileSync(sourcePath, destPath);
  console.log(`  Copied: ${file.destination}`);
}

// Update theme index if installing a theme
const themeIndexPath = join(rootDir, "src/styles/themes/index.css");
if (existsSync(themeIndexPath) && manifest.themeId) {
  console.log("");
  console.log("Updating theme index...");

  const themeIndexContent = readFileSync(themeIndexPath, "utf-8");
  const themeImport = `@import './${manifest.themeId}.css';`;

  if (!themeIndexContent.includes(themeImport)) {
    // Add import before the closing comment or at the end
    const updatedContent = themeIndexContent.trimEnd() + `\n\n/* ${manifest.name} theme */\n${themeImport}\n`;
    writeFileSync(themeIndexPath, updatedContent);
    console.log(`  Added import for ${manifest.themeId}.css`);
  } else {
    console.log(`  Theme already imported: ${manifest.themeId}.css`);
  }
}

// Update template index files
const memberIndexPath = join(rootDir, "src/templates/member/index.ts");
const adminIndexPath = join(rootDir, "src/templates/admin/index.ts");

// These are typically already set up, so we just verify they exist
if (existsSync(memberIndexPath)) {
  console.log(`  Member template index exists: ${memberIndexPath}`);
}
if (existsSync(adminIndexPath)) {
  console.log(`  Admin template index exists: ${adminIndexPath}`);
}

console.log("");
console.log(`Success! Theme pack "${manifest.name}" installed.`);
console.log("");
console.log("To use this theme, set data-theme on your root element:");
console.log(`  <html data-theme="${manifest.themeId}">`);
console.log("");
console.log("Or add ?theme=" + manifest.themeId + " to the URL in development.");
