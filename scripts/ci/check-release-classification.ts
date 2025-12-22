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

function parseReleaseClassification(text: string): ReleaseClass | null {
  const t = text;

  const checkbox = t.match(/\[\s*[xX]\s*\]\s*(experimental|candidate|stable)\b/i);
  if (checkbox?.[1]) return checkbox[1].toLowerCase() as ReleaseClass;

  const line = t.match(/\brelease\s+classification\s*:\s*(experimental|candidate|stable)\b/i);
  if (line?.[1]) return line[1].toLowerCase() as ReleaseClass;

  const alt = t.match(/\brelease[-\s]?classification\s*:\s*(experimental|candidate|stable)\b/i);
  if (alt?.[1]) return alt[1].toLowerCase() as ReleaseClass;

  return null;
}

const selected = parseReleaseClassification(body);

if (!selected) {
  fail("✗ No release classification selected. Select one of: experimental, candidate, stable");
}

console.log(`✓ Release classification: ${selected}`);
