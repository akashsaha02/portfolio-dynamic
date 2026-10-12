import { defineConfig, devices } from "@playwright/test";

// Two templates share the routes and next.config.ts has no distDir override, so both builds
// write to .next. They therefore run one after the other: PW_TEMPLATE selects which build and
// which projects this invocation covers. `npm run test:e2e` (e2e/run.mjs) runs both in sequence.
const TEMPLATE = process.env.PW_TEMPLATE === "folio" ? "folio" : "editorial";
const PORT = TEMPLATE === "folio" ? 3101 : 3100;
const prefix = TEMPLATE === "folio" ? "folio-" : "";

const viewports = [
  { name: "phone", use: { ...devices["Pixel 7"], viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true } },
  { name: "phone-large", use: { ...devices["iPhone 14"], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  { name: "tablet", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 }, hasTouch: true } },
  { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
];

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["html", { open: "never", outputFolder: `playwright-report/${TEMPLATE}` }], ["list"]],
  outputDir: `test-results/${TEMPLATE}`,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    env: { SITE_TEMPLATE: TEMPLATE },
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
  projects: viewports.map((v) => ({ ...v, name: prefix + v.name })),
});
