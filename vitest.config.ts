import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.spec.ts", "tests/unit/**/*.spec.tsx"],
    env: {
      // Set dummy DATABASE_URL for unit tests that import modules with Prisma
      DATABASE_URL: "postgresql://dummy:dummy@localhost:5432/dummy_test",
    },
  },
});
