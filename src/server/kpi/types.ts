export type KPIStatus = "OK" | "WARNING" | "CRITICAL" | "UNKNOWN";

export type KPIView =
  | "board"
  | "vp_activities"
  | "vp_membership"
  | "treasurer"
  | "tech";

export interface KPIResult {
  kpiId: string;
  name: string;
  status: KPIStatus;
  message: string;
  evaluatedAt: Date;

  view?: KPIView;
  details?: Record<string, unknown>;
  links?: Array<{ label: string; href: string }>;
  metadata?: Record<string, unknown>;
}

export interface KPIConfig {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  category: string;

  view?: KPIView;

  thresholds?: Record<string, number>;
  flags?: Record<string, boolean>;
}

export interface KPIContext {
  evaluationTime: Date;
  startDate?: Date;
  endDate?: Date;
  view?: KPIView;
}

export interface KPIConfigLoader {
  loadConfigs(): Promise<KPIConfig[]>;
  loadConfig(kpiId: string): Promise<KPIConfig | undefined>;
}

export interface KPIEngineOptions {
  timeoutMs?: number;
  configLoader?: KPIConfigLoader;
  parallel?: boolean;
}

export interface KPIRunSummary {
  runStartedAt: Date;
  runCompletedAt: Date;
  evaluatedAt: Date;
  overallStatus: KPIStatus;
  byStatus: Record<KPIStatus, number>;
  results: KPIResult[];
  total: number;
}

export interface KPIEvaluator {
  id: string;
  evaluate(config: KPIConfig, context: KPIContext): Promise<KPIResult>;
}

export const DEFAULT_KPI_CONFIGS: KPIConfig[] = [];
