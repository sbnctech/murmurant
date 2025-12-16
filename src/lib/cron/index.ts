/**
 * Cron Job Utilities
 *
 * Provides idempotent job execution, authentication, and observability
 * for cron-over-HTTP endpoints.
 *
 * Charter Principles:
 * - P7: Observability is a product feature
 * - P9: Security must fail closed
 */

export {
  withJobRun,
  generateRequestId,
  getLatestJobRun,
  getJobRunHistory,
  type JobRunOptions,
  type JobRunResult,
} from "./withJobRun";

export {
  verifyCronAuth,
  cronErrorResponse,
  type CronAuthResult,
} from "./auth";
