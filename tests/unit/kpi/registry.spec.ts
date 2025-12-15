import { describe, it, expect, beforeEach } from "vitest";
import { kpiRegistry } from "../../../src/server/kpi/registry";

class MockEvaluator {
  id: string;
  constructor(id: string) {
    this.id = id;
  }
  async evaluate() {
    return { kpiId: this.id, status: "OK", message: "ok", evaluatedAt: new Date() };
  }
}

describe("KPIRegistry", () => {
  beforeEach(() => {
    kpiRegistry.clear();
  });

  it("registers evaluators and can retrieve them by id", () => {
    const e1 = new MockEvaluator("kpi-1") as any;
    const e2 = new MockEvaluator("kpi-2") as any;

    kpiRegistry.register(e1);
    kpiRegistry.register(e2);

    expect(kpiRegistry.size).toBe(2);
    expect(kpiRegistry.has("kpi-1")).toBe(true);
    expect(kpiRegistry.get("kpi-2")).toBe(e2);
  });

  it("throws on duplicate register", () => {
    const e1 = new MockEvaluator("dup") as any;
    kpiRegistry.register(e1);
    expect(() => kpiRegistry.register(e1)).toThrow();
  });

  it("unregister removes evaluator", () => {
    const e1 = new MockEvaluator("kpi-x") as any;
    kpiRegistry.register(e1);

    expect(kpiRegistry.unregister("kpi-x")).toBe(true);
    expect(kpiRegistry.has("kpi-x")).toBe(false);
    expect(kpiRegistry.size).toBe(0);
  });

  it("clear removes all evaluators", () => {
    kpiRegistry.register(new MockEvaluator("a") as any);
    kpiRegistry.register(new MockEvaluator("b") as any);
    expect(kpiRegistry.size).toBe(2);

    kpiRegistry.clear();
    expect(kpiRegistry.size).toBe(0);
  });
});
