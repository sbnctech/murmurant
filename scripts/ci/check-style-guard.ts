type Finding = { file: string; line: number; kind: string; text: string };

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const INCLUDE_DIRS = [
  "src/app",
  "src/components",
];

const EXCLUDE_DIRS = [
  "node_modules",
  ".next",
  "dist",
  "build",
];

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;
const INLINE_STYLE_RE = /\bstyle\s*=\s*\{\{/g;

const ALLOWLIST_FILES: string[] = [
  "src/app/globals.css",
  "src/styles/tokens/tokens.css",
  "src/styles/themes/base.css",
  "src/styles/themes/sbnc.css",
];

function isExcluded(p: string) {
  return EXCLUDE_DIRS.some((d) => p.includes(`${path.sep}${d}${path.sep}`));
}

function walk(dir: string, out: string[]) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return;
  const entries = fs.readdirSync(full, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(full, e.name);
    if (isExcluded(p)) continue;
    if (e.isDirectory()) walk(path.join(dir, e.name), out);
    else out.push(path.join(dir, e.name));
  }
}

function rel(p: string) {
  return p.split(path.sep).join("/");
}

function main() {
  const files: string[] = [];
  for (const d of INCLUDE_DIRS) walk(d, files);

  const findings: Finding[] = [];

  for (const f of files) {
    const rf = rel(f);

    if (!rf.endsWith(".ts") && !rf.endsWith(".tsx")) continue;
    if (ALLOWLIST_FILES.includes(rf)) continue;

    const text = fs.readFileSync(path.join(ROOT, f), "utf8");
    const lines = text.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const hex = line.match(HEX_RE);
      if (hex) {
        findings.push({ file: rf, line: i + 1, kind: "HEX_COLOR", text: line.trim() });
      }

      if (INLINE_STYLE_RE.test(line)) {
        findings.push({ file: rf, line: i + 1, kind: "INLINE_STYLE", text: line.trim() });
      }
    }
  }

  if (findings.length === 0) {
    console.log("OK: style guardrails passed (no hex colors or inline style={{}} found in TS/TSX).");
    return;
  }

  console.error("FAIL: style guardrails found violations:");
  for (const f of findings.slice(0, 200)) {
    console.error(`${f.file}:${f.line} ${f.kind} ${f.text}`);
  }
  console.error("");
  console.error("Fix:");
  console.error("- Replace hex colors with tokens (var(--token-...)) via classNames or CSS.");
  console.error("- Replace inline style={{}} with token-based classes or a small variant system.");
  process.exit(1);
}

main();

