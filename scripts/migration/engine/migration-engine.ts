/**
 * ClubOS Migration Engine
 *
 * Orchestrates the staged migration pipeline:
 *   Extract → Normalize → Simulate → Load → Verify → Sync → Cutover
 *
 * Design principles:
 *   - Each stage is independently runnable
 *   - No stage writes to production DB
 *   - All stages support dry-run mode
 *   - Failures halt progression (fail-fast)
 *   - Human steward sign-off required before cutover
 */

import type {
  MigrationConfig,
  MigrationReport,
  MigrationRunOptions,
} from '../lib/types';

// ============================================================================
// Stage Definitions
// ============================================================================

export type StageName =
  | 'extract'
  | 'normalize'
  | 'simulate'
  | 'load'
  | 'verify'
  | 'sync'
  | 'cutover';

export interface StageResult {
  stage: StageName;
  status: 'PASS' | 'FAIL' | 'SKIPPED';
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
  checks: Record<string, CheckResult>;
  errors: StageError[];
  artifacts: Record<string, unknown>;
}

export interface CheckResult {
  name: string;
  pass: boolean;
  expected?: unknown;
  actual?: unknown;
  message?: string;
}

export interface StageError {
  code: string;
  message: string;
  context?: Record<string, unknown>;
  recoverable: boolean;
}

export interface StageContext {
  runId: string;
  orgId: string;
  config: MigrationConfig;
  options: MigrationRunOptions;
  previousResults: Map<StageName, StageResult>;
  artifacts: Map<string, unknown>;
}

export type StageExecutor = (context: StageContext) => Promise<StageResult>;

// ============================================================================
// Stage Registry
// ============================================================================

const stages: Map<StageName, StageExecutor> = new Map();

/**
 * Register a stage executor
 */
export function registerStage(name: StageName, executor: StageExecutor): void {
  stages.set(name, executor);
}

/**
 * Get all registered stages in execution order
 */
export function getStageOrder(): StageName[] {
  return ['extract', 'normalize', 'simulate', 'load', 'verify', 'sync', 'cutover'];
}

/**
 * Check if a stage is registered
 */
export function isStageRegistered(name: StageName): boolean {
  return stages.has(name);
}

// ============================================================================
// Migration Engine
// ============================================================================

export interface MigrationEngineOptions {
  orgId: string;
  config: MigrationConfig;
  runOptions: MigrationRunOptions;
  startStage?: StageName;
  endStage?: StageName;
}

export interface MigrationRunResult {
  runId: string;
  orgId: string;
  status: 'PASS' | 'FAIL' | 'PARTIAL';
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
  stagesRun: StageName[];
  stageResults: Map<StageName, StageResult>;
  cutoverReady: boolean;
  report: MigrationReport;
}

/**
 * Execute the migration pipeline
 *
 * @param options - Engine configuration
 * @returns Migration run result with all stage outcomes
 */
export async function runMigration(
  options: MigrationEngineOptions
): Promise<MigrationRunResult> {
  const runId = generateRunId();
  const startedAt = new Date();

  const context: StageContext = {
    runId,
    orgId: options.orgId,
    config: options.config,
    options: options.runOptions,
    previousResults: new Map(),
    artifacts: new Map(),
  };

  const stageOrder = getStageOrder();
  const startIdx = options.startStage
    ? stageOrder.indexOf(options.startStage)
    : 0;
  const endIdx = options.endStage
    ? stageOrder.indexOf(options.endStage)
    : stageOrder.length - 1;

  const stagesToRun = stageOrder.slice(startIdx, endIdx + 1);
  const stageResults = new Map<StageName, StageResult>();
  let overallStatus: 'PASS' | 'FAIL' | 'PARTIAL' = 'PASS';

  for (const stageName of stagesToRun) {
    const executor = stages.get(stageName);

    if (!executor) {
      // Stage not implemented yet - create placeholder result
      const placeholderResult: StageResult = {
        stage: stageName,
        status: 'SKIPPED',
        startedAt: new Date(),
        completedAt: new Date(),
        durationMs: 0,
        checks: {},
        errors: [
          {
            code: 'STAGE_NOT_IMPLEMENTED',
            message: `Stage '${stageName}' is not yet implemented`,
            recoverable: true,
          },
        ],
        artifacts: {},
      };
      stageResults.set(stageName, placeholderResult);
      context.previousResults.set(stageName, placeholderResult);
      overallStatus = 'PARTIAL';
      continue;
    }

    try {
      const result = await executor(context);
      stageResults.set(stageName, result);
      context.previousResults.set(stageName, result);

      if (result.status === 'FAIL') {
        overallStatus = 'FAIL';
        // Fail-fast: stop pipeline on failure
        break;
      }
    } catch (error) {
      const errorResult: StageResult = {
        stage: stageName,
        status: 'FAIL',
        startedAt: new Date(),
        completedAt: new Date(),
        durationMs: 0,
        checks: {},
        errors: [
          {
            code: 'STAGE_EXCEPTION',
            message: error instanceof Error ? error.message : String(error),
            recoverable: false,
          },
        ],
        artifacts: {},
      };
      stageResults.set(stageName, errorResult);
      overallStatus = 'FAIL';
      break;
    }
  }

  const completedAt = new Date();

  return {
    runId,
    orgId: options.orgId,
    status: overallStatus,
    startedAt,
    completedAt,
    durationMs: completedAt.getTime() - startedAt.getTime(),
    stagesRun: stagesToRun,
    stageResults,
    cutoverReady: overallStatus === 'PASS' && stagesToRun.includes('cutover'),
    report: buildReport(runId, options, stageResults, startedAt, completedAt),
  };
}

/**
 * Run a single stage (for testing or re-runs)
 */
export async function runSingleStage(
  stageName: StageName,
  context: StageContext
): Promise<StageResult> {
  const executor = stages.get(stageName);

  if (!executor) {
    throw new Error(`Stage '${stageName}' is not registered`);
  }

  return executor(context);
}

// ============================================================================
// Helpers
// ============================================================================

function generateRunId(): string {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15);
  const random = Math.random().toString(36).slice(2, 8);
  return `mig-${timestamp}-${random}`;
}

function buildReport(
  runId: string,
  options: MigrationEngineOptions,
  stageResults: Map<StageName, StageResult>,
  startedAt: Date,
  completedAt: Date
): MigrationReport {
  // Build a summary report from stage results
  // This is a minimal implementation - stages will populate their own sections
  return {
    runId,
    startedAt,
    completedAt,
    dryRun: options.runOptions.dryRun,
    config: {
      source: options.config.source,
      target: options.config.target,
      version: options.config.version,
    },
    summary: {
      totalRecords: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      duration_ms: completedAt.getTime() - startedAt.getTime(),
    },
    members: {
      totalRows: 0,
      parsed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      records: [],
    },
    events: {
      totalRows: 0,
      parsed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      records: [],
    },
    registrations: {
      totalRows: 0,
      parsed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      records: [],
    },
    errors: [],
    idMapping: {
      members: [],
      events: [],
    },
  };
}

// ============================================================================
// Stage Status Helpers
// ============================================================================

/**
 * Create a passing check result
 */
export function passCheck(
  name: string,
  expected?: unknown,
  actual?: unknown
): CheckResult {
  return { name, pass: true, expected, actual };
}

/**
 * Create a failing check result
 */
export function failCheck(
  name: string,
  message: string,
  expected?: unknown,
  actual?: unknown
): CheckResult {
  return { name, pass: false, message, expected, actual };
}

/**
 * Create a stage result helper
 */
export function createStageResult(
  stage: StageName,
  status: 'PASS' | 'FAIL' | 'SKIPPED',
  startedAt: Date,
  checks: Record<string, CheckResult>,
  errors: StageError[] = [],
  artifacts: Record<string, unknown> = {}
): StageResult {
  const completedAt = new Date();
  return {
    stage,
    status,
    startedAt,
    completedAt,
    durationMs: completedAt.getTime() - startedAt.getTime(),
    checks,
    errors,
    artifacts,
  };
}
