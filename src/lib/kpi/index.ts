/**
 * KPI Configuration Module
 *
 * Provides configuration management for KPI widgets including:
 * - Type definitions and Zod schemas for validation
 * - Default configuration with sensible club management defaults
 * - Loader interface for file-based (future: database) config loading
 * - Utility functions for role-based access and threshold evaluation
 *
 * @example
 * ```typescript
 * import {
 *   loadKpiConfig,
 *   getDashboardConfig,
 *   getMetricsForRole,
 *   evaluateMetricStatus
 * } from "@/lib/kpi";
 *
 * // Load configuration
 * const config = await loadKpiConfig();
 *
 * // Get admin dashboard
 * const dashboard = getDashboardConfig(config, "admin-summary");
 *
 * // Get metrics visible to VP Activities
 * const metrics = getMetricsForRole(dashboard, "VP_ACTIVITIES");
 *
 * // Evaluate a metric value
 * const status = evaluateMetricStatus(metric, currentValue, previousValue);
 * ```
 */

// Types and schemas
export {
  // Enums/schemas
  ComparisonModeSchema,
  TimeWindowSchema,
  TrendDirectionSchema,
  KpiRoleSchema,
  MetricTypeSchema,
  ThresholdConfigSchema,
  TargetConfigSchema,
  KpiMetricConfigSchema,
  KpiDashboardConfigSchema,
  KpiConfigSchema,
  // Types
  type ComparisonMode,
  type TimeWindow,
  type TrendDirection,
  type KpiRole,
  type MetricType,
  type ThresholdConfig,
  type TargetConfig,
  type KpiMetricConfig,
  type KpiDashboardConfig,
  type KpiConfig,
  type KpiConfigValidationResult,
  // Functions
  validateKpiConfig,
  getEffectiveTarget,
} from "./types";

// Defaults
export { defaultKpiConfig, SEASONAL_ADJUSTMENT_NOTES } from "./defaults";

// Loader
export {
  type ConfigSource,
  type KpiLoaderOptions,
  loadKpiConfig,
  clearKpiConfigCache,
  getDashboardConfig,
  getDashboardsForRole,
  getMetricsForRole,
  getMetricConfig,
  getMetricTarget,
  evaluateMetricStatus,
  canAccessDashboard,
  canAccessMetric,
} from "./loader";
