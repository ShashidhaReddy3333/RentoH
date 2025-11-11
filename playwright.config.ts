import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env["CI"];

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: isCI ? 2 : 1,
  timeout: 60000,
  reporter: isCI ? "github" : "list",
  use: {
    baseURL: process.env["PLAYWRIGHT_BASE_URL"] ?? "http://localhost:3000",
    trace: "retain-on-failure",
    actionTimeout: 15000,
    navigationTimeout: 30000
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: {
    command:
      process.env["PLAYWRIGHT_START_COMMAND"] ??
      "npm run dev -- --hostname 127.0.0.1 --port 3000",
    url: process.env["PLAYWRIGHT_BASE_URL"] ?? "http://localhost:3000",
    reuseExistingServer: !isCI,
    timeout: 120_000,
    env: {
      BYPASS_SUPABASE_AUTH: "1"
    }
  }
});
