import { defineConfig } from "@playwright/test";
import { viewports } from "./e2e/viewports";

// Bento, Brutal and Terminal e2e: `npm run test:e2e:templates`. One server per template, each built
// with SITE_TEMPLATE=<id> into .next-<id> (no database, so the template comes from the environment
// at build time) on PW_PORT_BASE+4..+6. It is a separate config so the main e2e job's time doesn't
// grow with every template; CI runs it as its own job. PW_TEMPLATES=bento,terminal limits it.
// Projects "<id>-phone" (Pixel 7, Chromium) and "<id>-desktop" (1440) run e2e/tpl-*.spec.ts.
const base = Number(process.env.PW_PORT_BASE ?? 3100);
const all = ["bento", "brutal", "terminal"] as const;
const wanted = (process.env.PW_TEMPLATES ?? all.join(","))
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const templates = all
  .map((id, i) => ({ id, port: base + 4 + i }))
  .filter((t) => wanted.includes(t.id));
const phone = viewports.find((v) => v.name === "phone")!;
const desktop = viewports.find((v) => v.name === "desktop")!;

export default defineConfig({
  testDir: "./e2e",
  testMatch: /tpl-.*\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["html", { open: "never", outputFolder: "playwright-report-templates" }], ["list"]],
  outputDir: "test-results-templates",
  use: { trace: "on-first-retry" },
  webServer: templates.map((t) => ({
    command: `npm run build && npm run start -- -p ${t.port}`,
    // Empty values beat .env.local: static content, keyless contact form, realtime and analytics off.
    env: {
      NEXT_DIST_DIR: `.next-${t.id}`,
      SITE_TEMPLATE: t.id,
      DATABASE_URI: "",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "",
      TURNSTILE_SECRET_KEY: "",
      ABLY_API_KEY: "",
      VERCEL_ANALYTICS_TOKEN: "",
    },
    url: `http://localhost:${t.port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 600_000,
  })),
  projects: templates.flatMap((t) =>
    [phone, desktop].map((v) => ({
      ...v,
      name: `${t.id}-${v.name}`,
      use: { ...v.use, baseURL: `http://localhost:${t.port}` },
    })),
  ),
});
