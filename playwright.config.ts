import { defineConfig } from "@playwright/test";
import { viewports } from "./e2e/viewports";

// One Folio server, built into .next-folio (next.config.ts reads NEXT_DIST_DIR; `build` and
// `start` must agree) and served on PW_PORT_BASE (default 3100, what CI uses). Projects are named
// "folio-<viewport>"; specs key off that prefix. Run one with `npx playwright test --project=folio-phone`.
// PW_PORT_BASE moves the server so parallel worktrees can each run their own.
//
// This suite is DB-free and keyless. The DB-backed suite (contact success path, Phase 3 backend
// behaviour) is playwright.db.config.ts: `npm run test:e2e:db`, server on base+2.
const port = Number(process.env.PW_PORT_BASE ?? 3100);

export default defineConfig({
  testDir: "./e2e",
  testIgnore: /db-backend\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["html", { open: "never", outputFolder: "playwright-report" }], ["list"]],
  outputDir: "test-results",
  use: { trace: "on-first-retry" },
  webServer: {
    command: `npm run build && npm run start -- -p ${port}`,
    // DATABASE_URI and the Turnstile keys are forced empty (an empty value beats .env.local), so
    // the site reads the static content and the contact form fails closed.
    env: {
      NEXT_DIST_DIR: ".next-folio",
      DATABASE_URI: "",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "",
      TURNSTILE_SECRET_KEY: "",
    },
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
  projects: viewports.map((v) => ({
    ...v,
    name: `folio-${v.name}`,
    use: { ...v.use, baseURL: `http://localhost:${port}` },
  })),
});
