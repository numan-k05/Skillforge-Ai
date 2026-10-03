import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

const installedChrome = [process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find((candidate) => candidate && existsSync(candidate));

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.js",
  fullyParallel: true,
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5188",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: installedChrome ? { executablePath: installedChrome } : {},
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } },
    { name: "tablet", use: { ...devices["Desktop Chrome"], viewport: { width: 820, height: 1180 } } },
    { name: "mobile", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: process.env.PLAYWRIGHT_EXTERNAL_SERVER === "1" ? undefined : { command: "node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5188 --strictPort", url: "http://127.0.0.1:5188", reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === "1" },
});
