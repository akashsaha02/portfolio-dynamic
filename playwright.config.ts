import { defineConfig, devices } from "@playwright/test";

// Both templates are built and served side by side: Editorial from .next on :3100, Folio from
// .next-folio on :3101 (next.config.ts reads NEXT_DIST_DIR; `build` and `start` must agree).
// Editorial projects keep the plain names, Folio projects are prefixed "folio-". Run one side
// with `npx playwright test --project=folio-phone` etc.; `--project` also skips the other server's
// tests but both servers still start (set PW_TEMPLATE=folio|editorial to start only one).
// PW_PORT_BASE moves both servers (Editorial = base, Folio = base+1) so parallel worktrees can
// each run their own; default 3100 is what CI uses.
const portBase = Number(process.env.PW_PORT_BASE ?? 3100);
const only = process.env.PW_TEMPLATE;
const withEditorial = only !== "folio";
const withFolio = only !== "editorial";

const viewports = [
  { name: "phone", use: { ...devices["Pixel 7"], viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true } },
  {
    name: "phone-large",
    use: { ...devices["iPhone 14"], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    // WebKit hydrates slowly under full-matrix CPU load; only this project gets the longer expect timeout.
    expect: { timeout: 15_000 },
  },
  { name: "tablet", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 }, hasTouch: true } },
  { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
];

const server = (template: "editorial" | "folio", port: number, distDir: string) => ({
  command: `npm run build && npm run start -- -p ${port}`,
  env: { SITE_TEMPLATE: template, NEXT_DIST_DIR: distDir },
  url: `http://localhost:${port}`,
  reuseExistingServer: !process.env.CI,
  timeout: 300_000,
});

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["html", { open: "never", outputFolder: "playwright-report" }], ["list"]],
  outputDir: "test-results",
  use: { trace: "on-first-retry" },
  webServer: [
    ...(withEditorial ? [server("editorial", portBase, ".next")] : []),
    ...(withFolio ? [server("folio", portBase + 1, ".next-folio")] : []),
  ],
  projects: [
    ...(withEditorial
      ? viewports.map((v) => ({ ...v, use: { ...v.use, baseURL: `http://localhost:${portBase}` } }))
      : []),
    ...(withFolio
      ? viewports.map((v) => ({
          ...v,
          name: `folio-${v.name}`,
          use: { ...v.use, baseURL: `http://localhost:${portBase + 1}` },
        }))
      : []),
  ],
});
