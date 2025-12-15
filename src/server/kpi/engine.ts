/**
 * KPI Engine - Orchestrates KPI evaluation.
 */

import { kpiRegistry } from "./registry";
import {
  KPIConfig,
  KPIConfigLoader,
  KPIContext,
  KPIEngineOptions,
  KPIResult,
  KPIRunSummary,
  KPIStatus,
  DEFAULT_KPI_CONFIGS,
} from "./types";

const DEFAULT_TIMEOUT_MS = 30000;

const STATUS_SEVERITY: Record<KPIStatus, number> = {
  OK: 0,
  UNKNOWN: 1,
  WARNING: 2,
  CRITICAL: 3,
};

export class DefaultConfigLoader implements KPIConfigLoader {
  constructor(private configs: KPIConfig[] = DEFAULT_KPI_CONFIGS) {}

  async loadConfigs(): Promise<KPIConfig[]> {
    return this.configs.filter((c) => c.enabled);
  }

  async loadConfig(id: string): Promise<KPIConfig | undefined> {
    return this.configs.find((c) => c.id === id);
  }
}

export class KPIEngine {
  private configLoader: KPIConfigLoader;
  private parallel: boolean;
  private timeoutMs: number;

  constructor(options: KPIEngineOptions = {}) {
    this.configLoader = options.configLoader ?? new DefaultConfigLoader();
    this.parallel = options.parallel ?? true;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async runAll(partialContext?: Partial<KPIContext>): Promise<KPIRunSummary> {
    const runStartedAt = new Date();
    const context = this.buildContext(partialContext);
    const configs = await this.configLoader.loadConfigs();

    let results: KPIResult[];
    if (this.parallel) {
      results = await Promise.all(
        configs.map((config) => this.evaluateWithTimeout(config, context))
      );
    } else {
      results = [];
      for (const config of configs) {
        results.push(await this.evaluateWithTimeout(config, context));
      }
    }

    const runCompletedAt = new Date();
    return this.buildSummary(runStartedAt, runCompletedAt, results);
  }

  async runOne(
    kpiId: string,
    partialContext?: Partial<KPIContext>
  ): Promise<KPIResult> {
    const context = this.buildContext(partialContext);
    const config = await this.configLoader.loadConfig(kpiId);

    if (!config) {
      return {
        kpiId,
        name: kpiId,
        status: "UNKNOWN",
        message: `KPI configuration not found for id '${kpiId}'`,
        evaluatedAt: context.evaluationTime,
      };
    }

    return this.evaluateWithTimeout(config, context);
  }

  private buildContext(partial?: Partial<KPIContext>): KPIContext {
    return {
      evaluationTime: partial?.evaluationTime ?? new Date(),
      startDate: partial?.startDate,
      endDate: partial?.endDate,
    };
  }

  private async evaluateWithTimeout(
    config: KPIConfig,
    context: KPIContext
  ): Promise<KPIResult> {
    const evaluator = kpiRegistry.get(config.id);

    if (!evaluator) {
      return {
        kpiId: config.id,
        name: config.name,
        status: "UNKNOWN",
        message: `No evaluator registered for KPI '${config.id}'`,
        evaluatedAt: context.evaluationTime,
      };
    }

    try {
      const result = await Promise.race([
        evaluator.evaluate(config, context),
        this.createTimeout(),
      ]);
      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        kpiId: config.id,
        name: config.name,
        status: "UNKNOWN",
        message: `Evaluation failed: ${message}`,
        evaluatedAt: context.evaluationTime,
      };
    }
  }

  private createTimeout(): Promise<KPIResult> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Evaluation timeout after ${this.timeoutMs}ms`));
      }, this.timeoutMs);
    });
  }

  private buildSummary(
    runStartedAt: Date,
    runCompletedAt: Date,
    results: KPIResult[]
  ): KPIRunSummary {
    const byStatus: Record<KPIStatus, number> = {
      OK: 0,
      WARNING: 0,
      CRITICAL: 0,
      UNKNOWN: 0,
    };

    let overallStatus: KPIStatus = "OK";
    for (const result of results) {
      byStatus[result.status]++;
      if (STATUS_SEVERITY[result.status] > STATUS_SEVERITY[overallStatus]) {
        overallStatus = result.status;
      }
    }

    return {
      runStartedAt,
      runCompletedAt,
    evaluatedAt: runCompletedAt,
      total: results.length,
      byStatus,
      overallStatus,
      results,
    };
  }
}

export function createKPIEngine(options?: KPIEngineOptions): KPIEngine {
  return new KPIEngine(options);
}
