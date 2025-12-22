/**
 * KPI Configuration Loader
 *
 * Provides a simple interface for loading KPI configuration.
 * Currently file-based, designed to be swapped for database loading later.
 *
 * Usage:
 *   const config = await loadKpiConfig();
 *   const dashboard = getDashboardConfig(config, "admin-summary");
 */

import type {
  KpiConfig,
  KpiDashboardConfig,
  KpiMetricConfig,
  KpiRole,
} from "./types";
import { validateKpiConfig, getEffectiveTarget } from "./types";
import { defaultKpiConfig } from "./defaults";

/**
 * Configuration source type for future extensibility
 */
export type ConfigSource = "FILE" | "DATABASE" | "HYBRID";

/**
 * Loader options
 */
export interface KpiLoaderOptions {
  /** Source to load from (default: FILE) */
  source?: ConfigSource;
  /** Whether to validate on load (default: true) */
  validate?: boolean;
  /** Cache TTL in seconds (default: 300) */
  cacheTtlSeconds?: number;
}

/**
 * Simple in-memory cache for config
 */
interface ConfigCache {
  config: KpiConfig | null;
  loadedAt: number;
  ttlMs: number;
}

const cache: ConfigCache = {
  config: null,
  loadedAt: 0,
  ttlMs: 300 * 1000,
};

/**
 * Load KPI configuration
 *
 * Currently loads from file-based defaults.
 * Future: Can be extended to load from database.
 */
export async function loadKpiConfig(
  options: KpiLoaderOptions = {}
): Promise<KpiConfig> {
  const { source = "FILE", validate = true, cacheTtlSeconds = 300 } = options;

  // Update cache TTL
  cache.ttlMs = cacheTtlSeconds * 1000;

  // Check cache
  const now = Date.now();
  if (cache.config && now - cache.loadedAt < cache.ttlMs) {
    return cache.config;
  }

  let config: KpiConfig;

  switch (source) {
    case "FILE":
      config = loadFromFile();
      break;
    case "DATABASE":
      // Future: Load from database
      // config = await loadFromDatabase();
      throw new Error("DATABASE source not yet implemented");
    case "HYBRID":
      // Future: Load from DB with file fallback
      // config = await loadHybrid();
      throw new Error("HYBRID source not yet implemented");
    default:
      config = loadFromFile();
  }

  // Validate if requested
  if (validate) {
    const result = validateKpiConfig(config);
    if (!result.success) {
      const errorMsg = result.errors
        ?.map((e) => `${e.path}: ${e.message}`)
        .join("; ");
      throw new Error(`Invalid KPI configuration: ${errorMsg}`);
    }
    config = result.data!;
  }

  // Update cache
  cache.config = config;
  cache.loadedAt = now;

  return config;
}

/**
 * Load configuration from file-based defaults
 */
function loadFromFile(): KpiConfig {
  return {
    ...defaultKpiConfig,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Clear the config cache
 * Useful for testing or after config updates
 */
export function clearKpiConfigCache(): void {
  cache.config = null;
  cache.loadedAt = 0;
}

/**
 * Get a specific dashboard configuration by ID
 */
export function getDashboardConfig(
  config: KpiConfig,
  dashboardId: string
): KpiDashboardConfig | undefined {
  return config.dashboards.find((d) => d.dashboardId === dashboardId);
}

/**
 * Get all dashboards visible to a specific role
 */
export function getDashboardsForRole(
  config: KpiConfig,
  role: KpiRole
): KpiDashboardConfig[] {
  return config.dashboards.filter((d) => d.visibleTo.includes(role));
}

/**
 * Get metrics visible to a specific role from a dashboard
 */
export function getMetricsForRole(
  dashboard: KpiDashboardConfig,
  role: KpiRole
): KpiMetricConfig[] {
  return dashboard.metrics
    .filter((m) => m.enabled && m.visibleTo.includes(role))
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Get a specific metric configuration by ID
 */
export function getMetricConfig(
  config: KpiConfig,
  metricId: string
): KpiMetricConfig | undefined {
  for (const dashboard of config.dashboards) {
    const metric = dashboard.metrics.find((m) => m.id === metricId);
    if (metric) return metric;
  }
  return undefined;
}

/**
 * Get the effective target for a metric for the current month
 */
export function getMetricTarget(metric: KpiMetricConfig): number | undefined {
  if (!metric.target) return undefined;
  const currentMonth = new Date().getMonth() + 1; // 1-12
  return getEffectiveTarget(metric.target, currentMonth);
}

/**
 * Check if a metric value is within thresholds
 * Returns: "OK" | "WARNING" | "DANGER"
 */
export function evaluateMetricStatus(
  metric: KpiMetricConfig,
  value: number,
  previousValue?: number
): "OK" | "WARNING" | "DANGER" {
  const { thresholds, trendDirection } = metric;
  if (!thresholds) return "OK";

  // Check absolute thresholds
  if (trendDirection === "UP_GOOD" || trendDirection === "NEUTRAL") {
    if (
      thresholds.dangerBelow !== undefined &&
      value < thresholds.dangerBelow
    ) {
      return "DANGER";
    }
    if (
      thresholds.warningBelow !== undefined &&
      value < thresholds.warningBelow
    ) {
      return "WARNING";
    }
  }

  if (trendDirection === "DOWN_GOOD" || trendDirection === "NEUTRAL") {
    if (
      thresholds.dangerAbove !== undefined &&
      value > thresholds.dangerAbove
    ) {
      return "DANGER";
    }
    if (
      thresholds.warningAbove !== undefined &&
      value > thresholds.warningAbove
    ) {
      return "WARNING";
    }
  }

  // Check change percentage thresholds
  if (previousValue !== undefined && previousValue !== 0) {
    const changePercent = Math.abs(
      ((value - previousValue) / previousValue) * 100
    );

    if (
      thresholds.changeDangerPercent !== undefined &&
      changePercent >= thresholds.changeDangerPercent
    ) {
      return "DANGER";
    }
    if (
      thresholds.changeWarningPercent !== undefined &&
      changePercent >= thresholds.changeWarningPercent
    ) {
      return "WARNING";
    }
  }

  return "OK";
}

/**
 * Type guard for checking if a role has access to a dashboard
 */
export function canAccessDashboard(
  dashboard: KpiDashboardConfig,
  role: KpiRole
): boolean {
  return dashboard.visibleTo.includes(role);
}

/**
 * Type guard for checking if a role has access to a metric
 */
export function canAccessMetric(
  metric: KpiMetricConfig,
  role: KpiRole
): boolean {
  return metric.visibleTo.includes(role);
}
