import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    channel: "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "galaxy-tab-s9-plus-landscape",
      use: {
        browserName: "chromium",
        // This is an automation candidate, not a claim about the device's
        // unmeasured Android Chrome CSS viewport.
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 2,
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: "compact-tablet-landscape",
      use: {
        browserName: "chromium",
        viewport: { width: 1024, height: 640 },
        deviceScaleFactor: 2,
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: "portrait-orientation-guard",
      use: {
        browserName: "chromium",
        viewport: { width: 800, height: 1280 },
        deviceScaleFactor: 2,
        hasTouch: true,
        isMobile: true,
      },
    },
  ],
  webServer: {
    command: "pnpm dev --hostname 127.0.0.1 --port 3100",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
