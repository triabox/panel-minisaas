import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

loadEnv();

const TEST_PORT = 3100;
const TEST_BASE_URL = `http://localhost:${TEST_PORT}`;

if (!process.env.TEST_DATABASE_URL) {
  throw new Error(
    "Configurá TEST_DATABASE_URL en .env (apuntando a la DB lacasita_test).",
  );
}

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",
  globalSetup: path.resolve(__dirname, "tests/e2e/global-setup.ts"),
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: [["list"]],
  use: {
    baseURL: TEST_BASE_URL,
    headless: true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npx next dev --port ${TEST_PORT}`,
    url: TEST_BASE_URL,
    timeout: 120_000,
    reuseExistingServer: false,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      DATABASE_URL: process.env.TEST_DATABASE_URL!,
      DIRECT_URL: process.env.TEST_DATABASE_URL!,
      NODE_ENV: "development",
    },
  },
});
