import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const useRealBackend = process.env.E2E_USE_REAL_BACKEND === "1";
const apiUrl = useRealBackend
  ? (process.env.E2E_API_URL ?? "https://dev.climabalance.org")
  : "http://localhost:3001";

export default defineConfig({
  testDir: "./specs",
  testMatch: "**/*.e2e.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["html", { outputFolder: "../playwright-report" }], ["list"]],
  use: {
    baseURL: "http://127.0.0.1:5174",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
        launchOptions: {
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        },
      },
    },
  ],
  webServer: {
    command:
      "/home/marcelo/.bun/bin/bun x vite --host 127.0.0.1 --strictPort --port 5174",
    url: "http://127.0.0.1:5174",
    reuseExistingServer: !useRealBackend,
    cwd: path.resolve(__dirname, ".."),
    env: {
      VITE_API_URL: apiUrl,
      E2E_USE_REAL_BACKEND: useRealBackend ? "1" : "0",
    },
    timeout: 120000,
  },
});
