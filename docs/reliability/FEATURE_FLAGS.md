# Feature Flags and Kill Switches

**Status:** Normative
**Last Updated:** 2025-12-21

---

## Purpose

This document describes ClubOS's feature flag system, which provides:

- **Gradual rollout** of new features
- **Kill switches** for instant feature disable in production
- **Environment-driven configuration** without code changes
- **Type-safe flag evaluation** in application code

---

## Quick Reference

### Check if a flag is enabled

```typescript
import { isEnabled } from "@/lib/flags";

if (isEnabled("event_postmortem_enabled")) {
  // Show postmortem UI
}
```

### Check kill switch status

```typescript
import { isKillSwitchActive } from "@/lib/flags";

if (!isKillSwitchActive("email_sending_enabled")) {
  console.warn("Email sending disabled via kill switch");
  return mockSendEmail(payload);
}
```

### Set flag via environment

```bash
# Enable a flag
CLUBOS_FLAG_EVENT_POSTMORTEM_ENABLED=1

# Disable a flag (kill switch)
CLUBOS_FLAG_EMAIL_SENDING_ENABLED=0
```

---

## Concepts

### Feature Flags vs Kill Switches

| Aspect | Feature Flag | Kill Switch |
|--------|--------------|-------------|
| Default | Off (false) | On (true) |
| Purpose | Gradual rollout of new features | Instant disable in emergency |
| Use case | "Show new UI to 10% of users" | "Disable payments if gateway down" |
| Registry field | `killSwitchEligible: false` | `killSwitchEligible: true` |

### Kill Switch Requirements

A flag can be marked as `killSwitchEligible: true` only if:

1. **Graceful degradation**: Feature degrades safely when disabled
2. **No data corruption**: Disabling does not corrupt or lose data
3. **Immediate effect**: No cache invalidation or restart needed
4. **Reversible**: Can be re-enabled without side effects

---

## How to Add a Flag

### Step 1: Add to Registry

Edit `src/lib/flags/registry.ts`:

```typescript
export const FLAG_REGISTRY: readonly FlagDefinition[] = [
  // ... existing flags ...

  {
    key: "my_new_feature",
    description: "Enable the new feature for all users",
    defaultValue: false,           // Off by default for new features
    killSwitchEligible: false,     // true if can be used as kill switch
    surface: "ui",                 // Where it applies: api, ui, worker, migration, all
    owner: "platform",             // Team responsible
    notes: "Expected cleanup: 2025-Q2",
    addedAt: "2025-12-21",
  },
];
```

### Step 2: Use in Code

```typescript
import { isEnabled } from "@/lib/flags";

export function MyComponent() {
  if (!isEnabled("my_new_feature")) {
    return <LegacyComponent />;
  }
  return <NewComponent />;
}
```

### Step 3: Set Environment Variable (Optional)

If the default isn't what you want:

```bash
# In .env or Netlify environment
CLUBOS_FLAG_MY_NEW_FEATURE=1
```

---

## Environment Variable Convention

Flags are controlled via environment variables with this naming:

```
CLUBOS_FLAG_{UPPERCASE_KEY}
```

| Flag Key | Environment Variable |
|----------|---------------------|
| `event_postmortem_enabled` | `CLUBOS_FLAG_EVENT_POSTMORTEM_ENABLED` |
| `email_sending_enabled` | `CLUBOS_FLAG_EMAIL_SENDING_ENABLED` |
| `migration_mode_enabled` | `CLUBOS_FLAG_MIGRATION_MODE_ENABLED` |

**Values:**

- `1` or `true` = enabled
- `0` or `false` = disabled
- Not set = use default from registry

---

## Setting Flags in Netlify

### For All Deploys

1. Go to **Site settings** > **Environment variables**
2. Add the variable with the appropriate value
3. Trigger a new deploy (or wait for next deploy)

### For Preview Deploys

1. Use branch-specific environment variables in Netlify
2. Or add to `netlify.toml`:

```toml
[context.deploy-preview.environment]
CLUBOS_FLAG_DEBUG_MODE_UI = "1"
```

### For Production Emergencies (Kill Switch)

1. Go to Netlify dashboard
2. Site settings > Environment variables
3. Change the kill switch variable (e.g., `CLUBOS_FLAG_EMAIL_SENDING_ENABLED=0`)
4. Trigger immediate redeploy or wait for next request (env vars are read per-request)

---

## API Reference

### `isEnabled(key: string, ctx?: FlagContext): boolean`

Check if a flag is enabled.

```typescript
import { isEnabled } from "@/lib/flags";

// Simple check
if (isEnabled("my_feature")) {
  // Feature is enabled
}

// With test override
const result = isEnabled("my_feature", {
  overrides: { my_feature: true }
});
```

### `isKillSwitchActive(key: string): boolean`

Semantic alias for `isEnabled()`. Use for kill switches to make intent clear.

```typescript
import { isKillSwitchActive } from "@/lib/flags";

if (!isKillSwitchActive("email_sending_enabled")) {
  console.warn("[kill-switch] Email sending disabled");
  return mockSend();
}
```

### `evaluateFlag(key: string, ctx?: FlagContext): FlagEvaluationResult`

Get detailed evaluation result for debugging.

```typescript
import { evaluateFlag } from "@/lib/flags";

const result = evaluateFlag("my_feature");
// {
//   key: "my_feature",
//   enabled: false,
//   source: "default",      // "override" | "env" | "default"
//   envVar: "CLUBOS_FLAG_MY_FEATURE",
//   envValue: undefined,
//   defaultValue: false
// }
```

### `getAllFlagStatus(): FlagEvaluationResult[]`

Get status of all flags. Useful for admin dashboards.

```typescript
import { getAllFlagStatus } from "@/lib/flags";

const status = getAllFlagStatus();
// Array of evaluation results for all registered flags
```

### `getKillSwitchStatus(): FlagEvaluationResult[]`

Get status of kill switches only. Useful for incident response.

```typescript
import { getKillSwitchStatus } from "@/lib/flags";

const switches = getKillSwitchStatus();
// Only flags with killSwitchEligible: true
```

---

## Testing with Flags

### Override in Tests

Use the `overrides` context to control flags in tests:

```typescript
import { isEnabled } from "@/lib/flags";

describe("MyFeature", () => {
  it("shows new UI when flag enabled", () => {
    const enabled = isEnabled("my_feature", {
      overrides: { my_feature: true }
    });
    expect(enabled).toBe(true);
  });

  it("shows legacy UI when flag disabled", () => {
    const enabled = isEnabled("my_feature", {
      overrides: { my_feature: false }
    });
    expect(enabled).toBe(false);
  });
});
```

### Reset Logging

The flag system logs first evaluation of each flag. Reset for clean test output:

```typescript
import { resetFlagLogging } from "@/lib/flags";

beforeEach(() => {
  resetFlagLogging();
});
```

---

## Flag Lifecycle

### Adding a Flag

1. Add to registry with `addedAt` date
2. Default to `false` for new features
3. Document expected cleanup timeline in `notes`

### Rolling Out

1. Deploy with flag off (default)
2. Enable for preview/staging: set env var to `1`
3. Enable for production when ready
4. Monitor for issues

### Cleaning Up

1. Once feature is stable and flag is always-on:
2. Remove flag checks from code
3. Remove from registry
4. Remove environment variable

**Target timeline:** Flags should be cleaned up within 90 days of full rollout.

---

## Current Flags

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `event_postmortem_enabled` | Kill switch | true | Event postmortem UI |
| `transition_widget_enabled` | Kill switch | true | Leadership transition widget |
| `email_sending_enabled` | Kill switch | true | Actual email sending |
| `governance_annotations_ui` | Feature | false | Governance annotations panel |
| `debug_mode_ui` | Feature | false | Debug info in admin UI |
| `migration_mode_enabled` | Kill switch | false | Migration Mode master switch |

---

## Troubleshooting

### Flag not taking effect

1. Check environment variable name matches convention:
   `CLUBOS_FLAG_{UPPERCASE_KEY}`

2. Check value is `1` or `0` (not `true`/`false` string unless intentional)

3. Check for typos in flag key

4. Check logs for flag evaluation on first access

### Unknown flag key warning

If using a flag key not in registry:

- Flag will evaluate to `false` (fail closed)
- Warning logged to console
- Add flag to registry to fix

### Flag logged multiple times

Flags are only logged on first evaluation per process. If seeing multiple logs:

- You may be running multiple processes
- Call `resetFlagLogging()` if intentional (e.g., in tests)

---

## See Also

- MULTITENANT_RELEASE_READINESS.md (TODO: create reliability/MULTITENANT_RELEASE_READINESS.md) - Kill switch requirements for releases
- WA_FUTURE_FAILURE_IMMUNITY.md (TODO: create architecture/WA_FUTURE_FAILURE_IMMUNITY.md) - MF-7 pattern
- FEATURE_RISK_AND_FIELD_TESTING_MODEL.md (TODO: create ops/FEATURE_RISK_AND_FIELD_TESTING_MODEL.md) - Feature rollout stages

---

*This document is normative for feature flag usage.*
