export type FeatureFlag =
  | "native-auth"
  | "native-payments"
  | "native-email"
  | "wa-sync"
  | "wa-import";

const defaultFlags: Record<FeatureFlag, boolean> = {
  "native-auth": false,
  "native-payments": false,
  "native-email": false,
  "wa-sync": true,
  "wa-import": true,
};

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  const envKey = `FEATURE_${flag.toUpperCase().replace(/-/g, "_")}`;
  const envValue = process.env[envKey];
  if (envValue !== undefined) {
    return envValue === "true" || envValue === "1";
  }
  return defaultFlags[flag];
}

export function getEnabledFeatures(): FeatureFlag[] {
  return (Object.keys(defaultFlags) as FeatureFlag[]).filter(isFeatureEnabled);
}
