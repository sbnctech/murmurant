/**
 * Feature Flag Registry
 *
 * Central registry of all feature flags and kill switches in ClubOS.
 * Each flag must be defined here with its metadata before use.
 *
 * See docs/reliability/FEATURE_FLAGS.md for usage documentation.
 */

/**
 * Surface where the flag applies
 */
export type FlagSurface = "api" | "ui" | "worker" | "migration" | "all";

/**
 * Flag definition with all required metadata
 */
export interface FlagDefinition {
  /** Unique identifier for the flag (snake_case) */
  key: string;
  /** Human-readable description of what this flag controls */
  description: string;
  /** Default value when not set via environment */
  defaultValue: boolean;
  /** True if this can be used as a kill switch (defaults to ON, disables on failure) */
  killSwitchEligible: boolean;
  /** Where this flag applies */
  surface: FlagSurface;
  /** Team or person responsible for this flag */
  owner: string;
  /** Optional notes about the flag (e.g., cleanup timeline) */
  notes?: string;
  /** ISO date when this flag was added */
  addedAt: string;
}

/**
 * Central registry of all feature flags.
 *
 * Adding a flag:
 * 1. Add entry here with all required fields
 * 2. Use isEnabled("key") in code
 * 3. Set CLUBOS_FLAG_KEY=1 or 0 in environment
 *
 * Conventions:
 * - Kill switches: default to true (ON), set to false to disable
 * - Feature flags: default to false (OFF), set to true to enable
 */
export const FLAG_REGISTRY: readonly FlagDefinition[] = [
  // Kill Switches (default ON, can be disabled in emergency)
  {
    key: "event_postmortem_enabled",
    description: "Enable event postmortem UI for completed/cancelled events",
    defaultValue: true,
    killSwitchEligible: true,
    surface: "ui",
    owner: "platform",
    addedAt: "2025-12-21",
  },
  {
    key: "transition_widget_enabled",
    description: "Enable leadership transition widget in admin dashboard",
    defaultValue: true,
    killSwitchEligible: true,
    surface: "ui",
    owner: "platform",
    addedAt: "2025-12-21",
  },
  {
    key: "email_sending_enabled",
    description: "Enable actual email sending (disable to use mock)",
    defaultValue: true,
    killSwitchEligible: true,
    surface: "all",
    owner: "platform",
    addedAt: "2025-12-21",
  },
  {
    key: "migration_mode_enabled",
    description: "Master switch for Migration Mode (WA sync, event matching, etc.)",
    defaultValue: false, // Opt-in behavior, defaults OFF
    killSwitchEligible: true,
    surface: "all",
    owner: "platform",
    notes: "Controls MF-1 through MF-9 migration features",
    addedAt: "2025-12-21",
  },

  // Feature Flags (default OFF, gradually rolled out)
  {
    key: "governance_annotations_ui",
    description: "Enable governance annotations panel in admin UI",
    defaultValue: false,
    killSwitchEligible: false,
    surface: "ui",
    owner: "platform",
    notes: "Expected cleanup: 2025-Q1",
    addedAt: "2025-12-21",
  },
  {
    key: "debug_mode_ui",
    description: "Show debug information panels in admin UI",
    defaultValue: false,
    killSwitchEligible: false,
    surface: "ui",
    owner: "platform",
    addedAt: "2025-12-21",
  },
  {
    key: "membership_tiers_enabled",
    description: "Enable MembershipTier functionality for WA migrations",
    defaultValue: false,
    killSwitchEligible: true,
    surface: "migration",
    owner: "platform",
    notes: "Gates tier seeding and migration tier mapping (Issue #276)",
    addedAt: "2025-12-24",
  },
] as const;

// Type for valid flag keys
export type FlagKey = (typeof FLAG_REGISTRY)[number]["key"];

// Build a lookup map for O(1) access
const FLAG_MAP = new Map<string, FlagDefinition>();
for (const flag of FLAG_REGISTRY) {
  if (FLAG_MAP.has(flag.key)) {
    throw new Error(`Duplicate flag key in registry: ${flag.key}`);
  }
  FLAG_MAP.set(flag.key, flag);
}

/**
 * Get a flag definition by key
 */
export function getDefinition(key: string): FlagDefinition | undefined {
  return FLAG_MAP.get(key);
}

/**
 * Get all kill-switch-eligible flags
 */
export function getKillSwitches(): FlagDefinition[] {
  return FLAG_REGISTRY.filter((f) => f.killSwitchEligible);
}
