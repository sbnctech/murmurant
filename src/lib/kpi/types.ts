/**
 * KPI Configuration Types and Zod Schemas
 *
 * Defines the structure for KPI widgets configuration including:
 * - Metric definitions
 * - Thresholds (warning/danger levels)
 * - Targets (goals)
 * - Time windows and comparison modes
 * - Role-based visibility
 */

import { z } from "zod";

/**
 * Comparison modes for KPI metrics
 * - YOY: Year-over-year (same period last year)
 * - MOM: Month-over-month
 * - WOW: Week-over-week
 * - PRIOR_PERIOD: Previous period of same length
 * - TARGET: Compare against target value
 */
export const ComparisonModeSchema = z.enum([
  "YOY",
  "MOM",
  "WOW",
  "PRIOR_PERIOD",
  "TARGET",
]);
export type ComparisonMode = z.infer<typeof ComparisonModeSchema>;

/**
 * Time window definitions for aggregating metrics
 */
export const TimeWindowSchema = z.enum([
  "DAY",
  "WEEK",
  "MONTH",
  "QUARTER",
  "YEAR",
  "ROLLING_7D",
  "ROLLING_30D",
  "ROLLING_90D",
  "ROLLING_365D",
]);
export type TimeWindow = z.infer<typeof TimeWindowSchema>;

/**
 * Trend direction for display purposes
 */
export const TrendDirectionSchema = z.enum(["UP_GOOD", "DOWN_GOOD", "NEUTRAL"]);
export type TrendDirection = z.infer<typeof TrendDirectionSchema>;

/**
 * Available roles for visibility control
 */
export const KpiRoleSchema = z.enum([
  "ADMIN",
  "PRESIDENT",
  "VP_ACTIVITIES",
  "TREASURER",
  "TECH_CHAIR",
  "EVENT_CHAIR",
  "MEMBER",
  "PUBLIC",
]);
export type KpiRole = z.infer<typeof KpiRoleSchema>;

/**
 * Metric types available in the system
 */
export const MetricTypeSchema = z.enum([
  "ACTIVE_MEMBERS",
  "NEW_MEMBERS",
  "CHURNED_MEMBERS",
  "TOTAL_EVENTS",
  "UPCOMING_EVENTS",
  "REGISTRATIONS",
  "WAITLISTED",
  "ATTENDANCE_RATE",
  "REVENUE",
  "AVERAGE_EVENT_SIZE",
  "MEMBER_RETENTION_RATE",
  "EVENT_FILL_RATE",
]);
export type MetricType = z.infer<typeof MetricTypeSchema>;

/**
 * Threshold configuration for a metric
 * Defines warning and danger levels
 */
export const ThresholdConfigSchema = z.object({
  /** Value below which status is WARNING (for UP_GOOD metrics) */
  warningBelow: z.number().optional(),
  /** Value below which status is DANGER (for UP_GOOD metrics) */
  dangerBelow: z.number().optional(),
  /** Value above which status is WARNING (for DOWN_GOOD metrics) */
  warningAbove: z.number().optional(),
  /** Value above which status is DANGER (for DOWN_GOOD metrics) */
  dangerAbove: z.number().optional(),
  /** Percentage change that triggers warning */
  changeWarningPercent: z.number().min(0).max(100).optional(),
  /** Percentage change that triggers danger */
  changeDangerPercent: z.number().min(0).max(100).optional(),
});
export type ThresholdConfig = z.infer<typeof ThresholdConfigSchema>;

/**
 * Target configuration with optional seasonal adjustments
 */
export const TargetConfigSchema = z.object({
  /** Default target value */
  value: z.number(),
  /** Monthly adjustments for seasonal variations (1-12) */
  monthlyAdjustments: z
    .record(z.string(), z.number())
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const keys = Object.keys(val);
        return keys.every((k) => {
          const num = parseInt(k, 10);
          return num >= 1 && num <= 12;
        });
      },
      { message: "Monthly adjustment keys must be 1-12" }
    ),
});
export type TargetConfig = z.infer<typeof TargetConfigSchema>;

/**
 * Configuration for a single KPI metric
 */
export const KpiMetricConfigSchema = z.object({
  /** Unique identifier for this metric config */
  id: z.string().min(1),
  /** The type of metric being tracked */
  metricType: MetricTypeSchema,
  /** Human-readable label */
  label: z.string().min(1),
  /** Optional description */
  description: z.string().optional(),
  /** Whether this metric is enabled */
  enabled: z.boolean().default(true),
  /** Time window for aggregation */
  timeWindow: TimeWindowSchema.default("MONTH"),
  /** Comparison mode for trend calculation */
  comparisonMode: ComparisonModeSchema.default("YOY"),
  /** How to interpret trend direction */
  trendDirection: TrendDirectionSchema.default("UP_GOOD"),
  /** Threshold configuration */
  thresholds: ThresholdConfigSchema.optional(),
  /** Target configuration */
  target: TargetConfigSchema.optional(),
  /** Roles that can view this metric */
  visibleTo: z.array(KpiRoleSchema).min(1),
  /** Display order (lower = first) */
  displayOrder: z.number().int().min(0).default(0),
  /** Unit of measurement for display */
  unit: z.enum(["COUNT", "PERCENT", "CURRENCY", "RATE"]).default("COUNT"),
  /** Number of decimal places to display */
  decimals: z.number().int().min(0).max(4).default(0),
});
export type KpiMetricConfig = z.infer<typeof KpiMetricConfigSchema>;

/**
 * Dashboard-level KPI configuration
 */
export const KpiDashboardConfigSchema = z.object({
  /** Dashboard identifier */
  dashboardId: z.string().min(1),
  /** Human-readable name */
  name: z.string().min(1),
  /** Description */
  description: z.string().optional(),
  /** Metrics to display on this dashboard */
  metrics: z.array(KpiMetricConfigSchema).min(1),
  /** Default comparison mode for the dashboard */
  defaultComparisonMode: ComparisonModeSchema.default("YOY"),
  /** Default time window for the dashboard */
  defaultTimeWindow: TimeWindowSchema.default("MONTH"),
  /** Refresh interval in seconds (0 = no auto-refresh) */
  refreshIntervalSeconds: z.number().int().min(0).default(0),
  /** Roles that can view this dashboard */
  visibleTo: z.array(KpiRoleSchema).min(1),
});
export type KpiDashboardConfig = z.infer<typeof KpiDashboardConfigSchema>;

/**
 * Global KPI configuration
 */
export const KpiConfigSchema = z.object({
  /** Schema version for migrations */
  schemaVersion: z.literal(1),
  /** Last updated timestamp */
  updatedAt: z.string().datetime(),
  /** Global defaults */
  defaults: z.object({
    comparisonMode: ComparisonModeSchema.default("YOY"),
    timeWindow: TimeWindowSchema.default("MONTH"),
    refreshIntervalSeconds: z.number().int().min(0).default(300),
  }),
  /** Dashboard configurations */
  dashboards: z.array(KpiDashboardConfigSchema),
});
export type KpiConfig = z.infer<typeof KpiConfigSchema>;

/**
 * Validation result type
 */
export interface KpiConfigValidationResult {
  success: boolean;
  data?: KpiConfig;
  errors?: Array<{
    path: string;
    message: string;
  }>;
}

/**
 * Validate KPI configuration
 */
export function validateKpiConfig(config: unknown): KpiConfigValidationResult {
  const result = KpiConfigSchema.safeParse(config);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  };
}

/**
 * Get effective target value for a given month (with seasonal adjustment)
 */
export function getEffectiveTarget(
  target: TargetConfig,
  month: number
): number {
  if (!target.monthlyAdjustments) {
    return target.value;
  }

  const adjustment = target.monthlyAdjustments[month.toString()];
  if (adjustment === undefined) {
    return target.value;
  }

  return target.value * adjustment;
}
