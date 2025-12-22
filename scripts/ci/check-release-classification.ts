type ReleaseClass = "experimental" | "candidate" | "stable";

function fail(msg: string): never {
  console.error(msg);
  process.exit(1);
}

const bodyArg = process.argv.slice(2).join(" ").trim();
const body = (bodyArg || process.env.PR_BODY || "").trim();

if (!body) {
  fail("✗ Missing PR body input. Pass as argv or PR_BODY env var.");
}

export function _parseReleaseClassificationRaw(text: string): ReleaseClass | null {
  const t = text;

  const checkbox = t.match(/\[\s*[xX]\s*\]\s*(experimental|candidate|stable)\b/i);
  if (checkbox?.[1]) return checkbox[1].toLowerCase() as ReleaseClass;

  const line = t.match(/\brelease\s+classification\s*:\s*(experimental|candidate|stable)\b/i);
  if (line?.[1]) return line[1].toLowerCase() as ReleaseClass;

  const alt = t.match(/\brelease[-\s]?classification\s*:\s*(experimental|candidate|stable)\b/i);
  if (alt?.[1]) return alt[1].toLowerCase() as ReleaseClass;

  return null;
}

const selected = _parseReleaseClassificationRaw(body);

if (!selected) {
  fail("✗ No release classification selected. Select one of: experimental, candidate, stable");
}

console.log(`✓ Release classification: ${selected}`);

export {}; // Make this file a module for TS imports

export function parseReleaseClassification(text: string): {
  valid: boolean;
  classification: ReleaseClass | null;
  error: string | null;
  selectedCount: number;
} {
  if (!text || !text.trim()) {
    return { valid: false, classification: null, error: "PR body is empty", selectedCount: 0 };
  }
  const matches = (text.match(/\b(experimental|candidate|stable)\b/gi) || [])
    .map(s => s.toLowerCase());
  const uniq = Array.from(new Set(matches));
  if (uniq.length === 1) {
    return { valid: true, classification: uniq[0] as ReleaseClass, error: null, selectedCount: 1 };
  }
  if (uniq.length === 0) {
    return {
      valid: false,
      classification: null,
      error: "No release classification selected. Select one of: experimental, candidate, stable",
      selectedCount: 0,
    };
  }
  return {
    valid: false,
    classification: null,
    error: `Multiple classifications selected: ${uniq.join(", ")}`,
    selectedCount: uniq.length,
  };
}

export {};
