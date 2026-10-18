import { defineConfig } from "@playwright/test";
import { viewports } from "./e2e/viewports";

// Both templates are built and served side by side: Editorial from .next on :3100, Folio from
// .next-folio on :3101 (next.config.ts reads NEXT_DIST_DIR; `build` and `start` must agree).
// Editorial projects keep the plain names, Folio projects are prefixed "folio-". Run one side
// with `npx playwright test --project=folio-phone` etc.; `--project` also skips the other server's
// tests but both servers still start (set PW_TEMPLATE=folio|editorial to start only one).
// PW_PORT_BASE moves both servers (Editorial = base, Folio = base+1) so parallel worktrees can
// each run their own; default 3100 is what CI uses.
//
// This suite is DB-free and keyless. The DB-backed suite (contact success path, Phase 3 backend
// behaviour) is playwright.db.config.ts: `npm run test:e2e:db`, server on base+2.
const portBase = Number(process.env.PW_PORT_BASE ?? 3100);
const only = process.env.PW_TEMPLATE;
const withEditorial = only !== "folio";
const withFolio = only !== "editorial";

const server = (template: "editorial" | "folio", port: number, distDir: string) => ({
  command: `npm run build && npm run start -- -p ${port}`,
  // DATABASE_URI and the Turnstile keys are forced empty (an empty value beats .env.local), so
  // the site reads the static content and the contact form fails closed.
  env: {
    SITE_TEMPLATE: template,
    NEXT_DIST_DIR: distDir,
    DATABASE_URI: "",
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: "",
    TURNSTILE_SECRET_KEY: "",
  },
  url: `http://localhost:${port}`,
  reuseExistingServer: !process.env.CI,
  timeout: 300_000,
});

export default defineConfig({
  testDir: "./e2e",
  testIgnore: /db-backend\.spec\.ts/,
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
