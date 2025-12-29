#!/usr/bin/env npx tsx
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const RED = "\x1b[31m", GREEN = "\x1b[32m", YELLOW = "\x1b[33m", CYAN = "\x1b[36m", BOLD = "\x1b[1m", NC = "\x1b[0m";

const DISALLOWED_PHRASES = [
  { pattern: /\bautomatically\s+(?:handles?|manages?|decides?|processes?|deletes?|removes?)\b/i, description: "Implies hidden automation", suggestion: 'Use "system proposes, operator approves"' },
  { pattern: /\b(?:system|Murmurant)\s+decides?\b/i, description: "Implies system authority over human", suggestion: 'Use "system proposes" or "operator decides"' },
  { pattern: /\bmagic(?:ally)?\b/i, description: '"Magic" implies unpredictable behavior', suggestion: "Describe mechanism explicitly" },
  { pattern: /\bseamless(?:ly)?\s+(?:migrat|transition|convert|transform|handl)/i, description: '"Seamless" hides complexity', suggestion: 'Use "explicit" or "reviewable"' },
  { pattern: /\bwill\s+auto-?(?:delete|remove|archive|purge|clean|fix|correct|heal)\b/i, description: "Auto-actions without authorization", suggestion: "Describe trigger mechanism" },
];

const NEGATIVE_CONTEXT = [/not\s+acceptable/i, /must\s+not/i, /should\s+not/i, /avoid\b/i, /prevent\b/i, /detect\b/i, /##.*analysis/i, /cause\b.*silent/i];
const CHECK_DIRS = ["docs/ARCH", "docs/IMPORTING", "docs/BIZ"];
const EXCLUDE_FILES = ["ADVERSARIAL_TRUST_REVIEW.md", "TRUST_MODEL_GLOSSARY.md", "BRAND_AND_VOICE.md", "WA_REGISTRATION_PIPELINE_ANALYSIS.md"];

function hasEscape(line: string, phrase: string): boolean {
  const m = /<!--\s*docs-trust-allow:\s*([^>]+)\s*-->/gi.exec(line);
  return m ? m[1].toLowerCase().split(",").some(a => phrase.toLowerCase().includes(a.trim())) : false;
}

interface Violation {
  file: string;
  line: number;
  col: number;
  text: string;
  phrase: string;
  pattern: RegExp;
  description: string;
  suggestion: string;
}

function checkFile(fp: string) {
  const violations: Violation[] = [];
  if (EXCLUDE_FILES.includes(path.basename(fp))) return [];
  const lines = fs.readFileSync(fp, "utf-8").split("\n");
  lines.forEach((line, i) => {
    for (const rule of DISALLOWED_PHRASES) {
      const m = rule.pattern.exec(line);
      if (m && !hasEscape(line, m[0]) && !NEGATIVE_CONTEXT.some(p => p.test(line))) {
        violations.push({ file: fp, line: i+1, col: m.index+1, text: line.trim(), phrase: m[0], ...rule });
      }
    }
  });
  return violations;
}

function findFiles(): string[] {
  const files: string[] = [];
  for (const dir of CHECK_DIRS) {
    if (!fs.existsSync(dir)) continue;
    try { files.push(...execSync(`find "${dir}" -name "*.md" -type f`, { encoding: "utf-8" }).trim().split("\n").filter(Boolean)); } catch {}
  }
  return files;
}

function main() {
  console.log(`${CYAN}${BOLD}== Docs Trust Language Check ==${NC}\n`);
  const files = findFiles();
  console.log(`Found ${files.length} file(s)\n`);
  const violations = files.flatMap(checkFile);
  if (violations.length === 0) { console.log(`${GREEN}✓ No violations found.${NC}`); process.exit(0); }
  console.log(`${RED}${BOLD}✗ ${violations.length} violation(s)${NC}\n`);
  violations.forEach(v => console.log(`${YELLOW}${v.file}:${v.line}${NC} ${RED}${v.phrase}${NC}\n  ${v.description}\n  ${CYAN}Fix:${NC} ${v.suggestion}\n`));
  process.exit(1);
}
main();
