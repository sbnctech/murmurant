import type { KPIEvaluator } from "./types";

export class KPIRegistry {
  private readonly byId = new Map<string, KPIEvaluator>();

  get size(): number {
    return this.byId.size;
  }

  clear(): void {
    this.byId.clear();
  }

  has(id: string): boolean {
    return this.byId.has(id);
  }

  get(id: string): KPIEvaluator | undefined {
    return this.byId.get(id);
  }

  getIds(): string[] {
    return Array.from(this.byId.keys());
  }

  getAll(): KPIEvaluator[] {
    return Array.from(this.byId.values());
  }

  register(evaluator: KPIEvaluator): void {
    if (this.byId.has(evaluator.id)) {
      throw new Error(`KPI evaluator already registered: ${evaluator.id}`);
    }
    this.byId.set(evaluator.id, evaluator);
  }

  unregister(id: string): boolean {
    return this.byId.delete(id);
  }
}

/*
 * Existing files import { kpiRegistry } from "./registry"
 */
export const kpiRegistry = new KPIRegistry();
