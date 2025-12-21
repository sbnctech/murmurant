import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { defaultPolicyRuntime, type PolicyRuntime } from "./runtime";

export type BoardDecisionsRaw = unknown;

const BOARD_DECISIONS_REL_PATH = path.join(
  process.cwd(),
  "docs",
  "policies",
  "sbnc",
  "BOARD_DECISIONS.yaml"
);

function toStringOrPending(v: unknown): string | "pending" {
  if (typeof v === "string" && v.trim().length > 0) return v;
  return "pending";
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

export function loadBoardDecisionsFile(): { raw: BoardDecisionsRaw; runtime: PolicyRuntime } {
  const runtime: PolicyRuntime = { ...defaultPolicyRuntime };

  const text = fs.readFileSync(BOARD_DECISIONS_REL_PATH, "utf8");
  const raw = YAML.parse(text) as BoardDecisionsRaw;

  const root = asRecord(raw);
  const decisions = asRecord(root["decisions"]);

  const bylawsVersion = asRecord(decisions["bylaws_version"]);
  runtime.bylawsVersion = toStringOrPending(bylawsVersion["decision"]);

  const policyVisibility = asRecord(decisions["policy_visibility"]);
  const policies = asRecord(policyVisibility["policies"]);
  const vis: Record<string, "public" | "members" | "admins" | "pending"> = {};

  for (const [k, v] of Object.entries(policies)) {
    const vv = typeof v === "string" ? v : "pending";
    if (vv === "public" || vv === "members" || vv === "admins" || vv === "pending") vis[k] = vv;
    else vis[k] = "pending";
  }
  runtime.policyVisibility = vis;

  const guestAccess = asRecord(decisions["guest_access"]);
  const guest = typeof guestAccess["decision"] === "string" ? guestAccess["decision"] : "pending";
  runtime.guestAccessMode = guest === "members_only" || guest === "guests_allowed" ? guest : "pending";

  const membershipTerms = asRecord(decisions["membership_terms"]);
  const mt = typeof membershipTerms["decision"] === "string" ? membershipTerms["decision"] : "pending";
  runtime.membershipTermMode = mt === "fixed_term" ? "fixed" : mt === "rolling_term" ? "rolling" : "pending";

  const reg = asRecord(decisions["registration_eligibility"]);
  const r = typeof reg["decision"] === "string" ? reg["decision"] : "pending";
  runtime.registrationEligibilityMode =
    r === "strict_enforcement" || r === "permissive_with_logging" ? r : "pending";

  return { raw, runtime };
}
