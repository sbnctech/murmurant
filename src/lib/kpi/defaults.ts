/**
 * Default KPI Configuration
 *
 * File-based configuration that can later be migrated to database.
 * Includes sensible defaults for a club management system with
 * seasonal adjustments for year-over-year comparisons.
 */

import type { KpiConfig } from "./types";

/**
 * Default KPI configuration for Murmurant
 *
 * This configuration defines:
 * - Admin dashboard metrics (membership, events, registrations)
 * - President/VP dashboard with strategic metrics
 * - Seasonal adjustments for clubs with variable activity patterns
 */
export const defaultKpiConfig: KpiConfig = {
  schemaVersion: 1,
  updatedAt: new Date().toISOString(),
  defaults: {
    comparisonMode: "YOY",
    timeWindow: "MONTH",
    refreshIntervalSeconds: 300,
  },
  dashboards: [
    {
      dashboardId: "admin-summary",
      name: "Admin Dashboard Summary",
      description: "Core metrics for day-to-day administration",
      defaultComparisonMode: "YOY",
      defaultTimeWindow: "MONTH",
      refreshIntervalSeconds: 300,
      visibleTo: ["ADMIN", "PRESIDENT", "VP_ACTIVITIES", "TECH_CHAIR"],
      metrics: [
        {
          id: "active-members",
          metricType: "ACTIVE_MEMBERS",
          label: "Active Members",
          description: "Members with ACTIVE status",
          enabled: true,
          timeWindow: "MONTH",
          comparisonMode: "YOY",
          trendDirection: "UP_GOOD",
          thresholds: {
            warningBelow: 100,
            dangerBelow: 50,
            changeWarningPercent: 10,
            changeDangerPercent: 20,
          },
          target: {
            value: 200,
            monthlyAdjustments: {
              "1": 0.9,
              "2": 0.95,
              "3": 1.0,
              "4": 1.05,
              "5": 1.1,
              "6": 0.85,
              "7": 0.8,
              "8": 0.85,
              "9": 1.05,
              "10": 1.1,
              "11": 1.0,
              "12": 0.9,
            },
          },
          visibleTo: ["ADMIN", "PRESIDENT", "VP_ACTIVITIES", "TECH_CHAIR"],
          displayOrder: 0,
          unit: "COUNT",
          decimals: 0,
        },
        {
          id: "new-members-month",
          metricType: "NEW_MEMBERS",
          label: "New Members",
          description: "Members joined this period",
          enabled: true,
          timeWindow: "MONTH",
          comparisonMode: "YOY",
          trendDirection: "UP_GOOD",
          thresholds: {
            warningBelow: 5,
            dangerBelow: 2,
            changeWarningPercent: 25,
            changeDangerPercent: 50,
          },
          target: {
            value: 15,
            monthlyAdjustments: {
              "1": 1.2,
              "2": 1.1,
              "3": 1.0,
              "4": 0.9,
              "5": 0.8,
              "6": 0.6,
              "7": 0.5,
              "8": 0.6,
              "9": 1.3,
              "10": 1.2,
              "11": 1.0,
              "12": 0.7,
            },
          },
          visibleTo: ["ADMIN", "PRESIDENT", "VP_ACTIVITIES", "TECH_CHAIR"],
          displayOrder: 1,
          unit: "COUNT",
          decimals: 0,
        },
        {
          id: "total-events",
          metricType: "TOTAL_EVENTS",
          label: "Total Events",
          description: "Events in the system",
          enabled: true,
          timeWindow: "MONTH",
          comparisonMode: "YOY",
          trendDirection: "UP_GOOD",
          visibleTo: [
            "ADMIN",
            "PRESIDENT",
            "VP_ACTIVITIES",
            "TECH_CHAIR",
            "EVENT_CHAIR",
          ],
          displayOrder: 2,
          unit: "COUNT",
          decimals: 0,
        },
        {
          id: "registrations",
          metricType: "REGISTRATIONS",
          label: "Registrations",
          description: "Total event registrations",
          enabled: true,
          timeWindow: "MONTH",
          comparisonMode: "YOY",
          trendDirection: "UP_GOOD",
          thresholds: {
            changeWarningPercent: 15,
            changeDangerPercent: 30,
          },
          visibleTo: [
            "ADMIN",
            "PRESIDENT",
            "VP_ACTIVITIES",
            "TECH_CHAIR",
            "EVENT_CHAIR",
          ],
          displayOrder: 3,
          unit: "COUNT",
          decimals: 0,
        },
        {
          id: "waitlisted",
          metricType: "WAITLISTED",
          label: "Waitlisted",
          description: "Registrations with WAITLISTED status",
          enabled: true,
          timeWindow: "MONTH",
          comparisonMode: "YOY",
          trendDirection: "NEUTRAL",
          visibleTo: [
            "ADMIN",
            "PRESIDENT",
            "VP_ACTIVITIES",
            "TECH_CHAIR",
            "EVENT_CHAIR",
          ],
          displayOrder: 4,
          unit: "COUNT",
          decimals: 0,
        },
      ],
    },
    {
      dashboardId: "executive-overview",
      name: "Executive Overview",
      description: "Strategic metrics for club leadership",
      defaultComparisonMode: "YOY",
      defaultTimeWindow: "QUARTER",
      refreshIntervalSeconds: 600,
      visibleTo: ["PRESIDENT", "VP_ACTIVITIES", "TREASURER"],
      metrics: [
        {
          id: "member-retention",
          metricType: "MEMBER_RETENTION_RATE",
          label: "Member Retention",
          description: "Percentage of members retained from previous year",
          enabled: true,
          timeWindow: "YEAR",
          comparisonMode: "YOY",
          trendDirection: "UP_GOOD",
          thresholds: {
            warningBelow: 80,
            dangerBelow: 70,
          },
          target: {
            value: 85,
          },
          visibleTo: ["PRESIDENT", "VP_ACTIVITIES", "TREASURER"],
          displayOrder: 0,
          unit: "PERCENT",
          decimals: 1,
        },
        {
          id: "event-fill-rate",
          metricType: "EVENT_FILL_RATE",
          label: "Event Fill Rate",
          description: "Average percentage of event capacity filled",
          enabled: true,
          timeWindow: "QUARTER",
          comparisonMode: "YOY",
          trendDirection: "UP_GOOD",
          thresholds: {
            warningBelow: 60,
            dangerBelow: 40,
            warningAbove: 95,
          },
          target: {
            value: 75,
          },
          visibleTo: ["PRESIDENT", "VP_ACTIVITIES"],
          displayOrder: 1,
          unit: "PERCENT",
          decimals: 1,
        },
        {
          id: "avg-event-size",
          metricType: "AVERAGE_EVENT_SIZE",
          label: "Avg Event Size",
          description: "Average number of registrants per event",
          enabled: true,
          timeWindow: "QUARTER",
          comparisonMode: "YOY",
          trendDirection: "UP_GOOD",
          thresholds: {
            warningBelow: 10,
            dangerBelow: 5,
          },
          visibleTo: ["PRESIDENT", "VP_ACTIVITIES"],
          displayOrder: 2,
          unit: "COUNT",
          decimals: 1,
        },
        {
          id: "churned-members",
          metricType: "CHURNED_MEMBERS",
          label: "Churned Members",
          description: "Members who did not renew",
          enabled: true,
          timeWindow: "QUARTER",
          comparisonMode: "YOY",
          trendDirection: "DOWN_GOOD",
          thresholds: {
            warningAbove: 20,
            dangerAbove: 40,
          },
          visibleTo: ["PRESIDENT", "TREASURER"],
          displayOrder: 3,
          unit: "COUNT",
          decimals: 0,
        },
      ],
    },
    {
      dashboardId: "event-chair-view",
      name: "Event Chair Dashboard",
      description: "Metrics for event chairs to track their events",
      defaultComparisonMode: "PRIOR_PERIOD",
      defaultTimeWindow: "MONTH",
      refreshIntervalSeconds: 300,
      visibleTo: ["EVENT_CHAIR", "VP_ACTIVITIES", "ADMIN"],
      metrics: [
        {
          id: "upcoming-events",
          metricType: "UPCOMING_EVENTS",
          label: "Upcoming Events",
          description: "Events scheduled in the next 30 days",
          enabled: true,
          timeWindow: "ROLLING_30D",
          comparisonMode: "PRIOR_PERIOD",
          trendDirection: "NEUTRAL",
          visibleTo: ["EVENT_CHAIR", "VP_ACTIVITIES", "ADMIN"],
          displayOrder: 0,
          unit: "COUNT",
          decimals: 0,
        },
        {
          id: "attendance-rate",
          metricType: "ATTENDANCE_RATE",
          label: "Attendance Rate",
          description:
            "Percentage of registrants who attended (for past events)",
          enabled: true,
          timeWindow: "ROLLING_90D",
          comparisonMode: "YOY",
          trendDirection: "UP_GOOD",
          thresholds: {
            warningBelow: 75,
            dangerBelow: 60,
          },
          target: {
            value: 85,
          },
          visibleTo: ["EVENT_CHAIR", "VP_ACTIVITIES", "ADMIN"],
          displayOrder: 1,
          unit: "PERCENT",
          decimals: 1,
        },
      ],
    },
  ],
};

/**
 * Seasonal adjustment explanations for documentation
 *
 * Monthly multipliers are based on typical club activity patterns:
 * - Jan (0.9): Post-holiday slowdown
 * - Feb (0.95): Gradual ramp-up
 * - Mar (1.0): Normal activity
 * - Apr (1.05): Spring events boost
 * - May (1.1): Peak spring activity
 * - Jun (0.85): Early summer decline
 * - Jul (0.8): Summer low
 * - Aug (0.85): Late summer, slight recovery
 * - Sep (1.05): Fall kickoff
 * - Oct (1.1): Peak fall activity
 * - Nov (1.0): Normal (Thanksgiving impact)
 * - Dec (0.9): Holiday slowdown
 */
export const SEASONAL_ADJUSTMENT_NOTES = {
  description:
    "Multipliers adjust targets based on typical club activity patterns",
  patterns: {
    peakMonths: ["May", "October"],
    lowMonths: ["July", "August"],
    transitionMonths: ["January", "September"],
  },
};
