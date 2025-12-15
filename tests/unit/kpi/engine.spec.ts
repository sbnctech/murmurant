/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach } from "vitest";
import { KPIEngine, DefaultConfigLoader } from "../../../src/server/kpi/engine";
import { kpiRegistry } from "../../../src/server/kpi/registry";

class MockEvaluator {
  id: string;
  status: "OK" | "WARNING" | "CRITICAL";
  constructor(id: string, status: "OK" | "WARNING" | "CRITICAL") {
    this.id = id;
    this.status = status;
  }
  async evaluate(config: any, context: any) {
    return {
      kpiId: this.id,
      status: this.status,
      message: config?.name || "mock",
      evaluatedAt: context?.evaluationTime || new Date(),
    };
  }
}

describe("KPIEngine (scaffold)", () => {
  beforeEach(() => {
    kpiRegistry.clear();
  });

  it("runs enabled configs and returns a summary with totals", async () => {
    kpiRegistry.register(new MockEvaluator("test-ok", "OK") as any);
    kpiRegistry.register(new MockEvaluator("test-warning", "WARNING") as any);
    kpiRegistry.register(new MockEvaluator("test-critical", "CRITICAL") as any);

    const configs = [
      { id: "test-ok", name: "Test OK", description: "t", enabled: true, category: "test" },
      { id: "test-warning", name: "Test Warning", description: "t", enabled: true, category: "test" },
      { id: "test-critical", name: "Test Critical", description: "t", enabled: true, category: "test" },
    ];

    const engine = new KPIEngine({ configLoader: new DefaultConfigLoader(configs as any) } as any);

    const anyEngine: any = engine;
    const fn =
      anyEngine.run ??
      anyEngine.execute ??
      anyEngine.evaluateAll ??
      anyEngine.evaluate ??
      anyEngine.runAll;

    expect(typeof fn).toBe("function");

    const summary = await fn.call(engine, { evaluationTime: new Date() });

    expect(summary.total).toBe(3);
    expect(Array.isArray(summary.results)).toBe(true);
    expect(summary.results.length).toBe(3);
    expect(summary.byStatus.OK + summary.byStatus.WARNING + summary.byStatus.CRITICAL).toBe(3);
    expect(summary.overallStatus).toBe("CRITICAL");
  });
});
