import { describe, expect, test } from "vitest";
import fs from "fs";
import path from "path";

function walk(dir: string, out: string[]) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === ".next" || ent.name === "dist") continue;
      walk(p, out);
    } else {
      if (p.endsWith(".ts") || p.endsWith(".tsx")) out.push(p);
    }
  }
}

describe("timezone guardrails", () => {
  test("disallow locale formatting in src/ (use timezone helpers)", () => {
    const root = process.cwd();
    const srcDir = path.join(root, "src");
    const files: string[] = [];
    walk(srcDir, files);

    // Allow files that correctly use Intl.DateTimeFormat with explicit timeZone option
    const allow = new Set([
      path.join(srcDir, "lib", "timezone.ts"),
      path.join(srcDir, "lib", "calendar", "ics.ts"), // Uses timeZone param correctly
    ]);

    const forbidden: Array<{ file: string; line: number; snippet: string }> = [];
    // Note: .toLocaleString() is allowed for number formatting
    // Only block date-specific locale methods
    const patterns: RegExp[] = [
      /\.toLocaleDateString\s*\(/,
      /\.toLocaleTimeString\s*\(/,
      /Intl\.DateTimeFormat\s*\(/,
    ];

    for (const f of files) {
      if (allow.has(f)) continue;
      const txt = fs.readFileSync(f, "utf8");
      const lines = txt.split("\n");
      for (let i = 0; i < lines.length; i++) {
        for (const re of patterns) {
          if (re.test(lines[i])) {
            forbidden.push({
              file: path.relative(root, f),
              line: i + 1,
              snippet: lines[i].trim(),
            });
          }
        }
      }
    }

    const msg = forbidden.map((x) => `${x.file}:${x.line} ${x.snippet}`).join("\n");
    expect(msg, msg).toBe("");
  });
});
