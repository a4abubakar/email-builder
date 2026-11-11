import { defineConfig, devices } from "@playwright/test";

const PORT = 3003;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  outputDir: "test-results",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    permissions: ["clipboard-read", "clipboard-write"],
  },
  projects: [
    {
      name: "chromium",
      // `channel: "msedge"` is needed on machines where Playwright's bundled headless shell can't launch.
      // CI and other machines can delete the channel line to use the default Chromium.
      use: { ...devices["Desktop Chrome"], channel: "msedge" },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
