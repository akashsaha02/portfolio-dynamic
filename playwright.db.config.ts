import { defineConfig } from "@playwright/test";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  DB_APP_PORT,
  DB_BASE_URL,
  DB_MONGO_PORT,
  TURNSTILE_TEST_SECRET,
  TURNSTILE_TEST_SITE_KEY,
} from "./e2e/db-env";
import { viewports } from "./e2e/viewports";

// DB-backed e2e: `npm run test:e2e:db`. One Folio server on PW_PORT_BASE+2 built WITH the Turnstile
// test site key and DATABASE_URI pointing at an in-memory MongoDB that e2e/db-server.mjs seeds
// (nothing touches Atlas). The default suite (playwright.config.ts) stays keyless and DB-free so
// its fail-closed contact tests keep working.
//
// Projects: folio-db-<viewport> run the Folio contact spec (success path, message lands in the DB);
// db-backend runs after them (it edits content and the template, so it must not overlap them).
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["html", { open: "never", outputFolder: "playwright-report-db" }], ["list"]],
  outputDir: "test-results-db",
  use: { trace: "on-first-retry" },
  webServer: {
    command: "node e2e/db-server.mjs",
    env: {
      DB_APP_PORT: String(DB_APP_PORT),
      DB_MONGO_PORT: String(DB_MONGO_PORT),
      TURNSTILE_SITE_KEY: TURNSTILE_TEST_SITE_KEY,
      TURNSTILE_SECRET: TURNSTILE_TEST_SECRET,
      ADMIN_EMAIL,
      ADMIN_PASSWORD,
    },
    url: DB_BASE_URL,
    // Always a fresh database: a reused server would carry old messages and edits.
    reuseExistingServer: false,
    timeout: 600_000,
    stdout: "pipe",
    stderr: "pipe",
  },
  projects: [
    ...viewports.map((v) => ({
      ...v,
      name: `folio-db-${v.name}`,
      testMatch: /folio-contact\.spec\.ts/,
      use: { ...v.use, baseURL: DB_BASE_URL },
    })),
    {
      name: "db-backend",
      testMatch: /db-backend\.spec\.ts/,
      dependencies: viewports.map((v) => `folio-db-${v.name}`),
      fullyParallel: false,
      use: { ...viewports[3].use, baseURL: DB_BASE_URL },
    },
  ],
});
