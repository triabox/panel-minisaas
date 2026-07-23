import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: [
      "tests/unit/**/*.test.ts",
      "tests/integration/**/*.test.ts",
    ],
    // Vitest 4: archivos secuenciales y un solo worker — los integ tests
    // comparten la DB de test y no toleran ejecución concurrente.
    fileParallelism: false,
    pool: "forks",
    sequence: { concurrent: false },
    testTimeout: 15_000,
    hookTimeout: 15_000,
    reporters: ["default"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
