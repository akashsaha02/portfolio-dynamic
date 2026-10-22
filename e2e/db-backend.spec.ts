import { test, expect, request, type APIRequestContext } from "@playwright/test";
import { adminLogin, type AdminSession } from "./db-helpers";
import { DB_BASE_URL } from "./db-env";

// Phase 3 backend behaviour against the keyed, seeded, DB-backed server (playwright.db.config.ts,
// `npm run test:e2e:db`): header hardening (N-01), edit -> live without a rebuild, draft -> preview
// only, the availability toggle (updateTag, visible on the very next request) and the template
// switch. Serial: these tests change shared content, and each puts it back.
//
// Revalidation from REST writes is stale-while-revalidate (`revalidateTag(tag, "max")`): the first
// request after a write may still get the old page and triggers the re-render, so those checks poll.

test.describe.configure({ mode: "serial" });

const SLUG = "abroadly";
let admin: AdminSession;
let anon: APIRequestContext;
let projectId: string;
let originalSummary: string;

test.beforeAll(async () => {
  admin = await adminLogin();
  anon = await request.newContext({ baseURL: DB_BASE_URL });
  const res = await admin.api.get(`/api/projects?where[slug][equals]=${SLUG}&draft=false&depth=0&limit=1`);
  const doc = ((await res.json()) as { docs: Array<{ id: string; summary: string }> }).docs[0];
  expect(doc, "seeded project").toBeTruthy();
  projectId = doc.id;
  originalSummary = doc.summary;
});

test.afterAll(async () => {
  // Put everything back: published summary (also drops any saved draft), template, availability.
  if (admin) {
    await admin.api.patch(`/api/projects/${projectId}`, { data: { summary: originalSummary, _status: "published" } });
    await admin.api.post("/api/globals/site-settings", { data: { activeTemplate: "folio" } });
    await admin.api.dispose();
  }
  await anon?.dispose();
});

const page = (path: string) => async () => (await anon.get(path)).text();
const stamp = () => `E2E-${Date.now()}`;

test("N-01: uploads get the sandbox CSP, pages only frame-ancestors", async () => {
  const media = await anon.get("/api/media?limit=1&depth=0");
  const url = ((await media.json()) as { docs: Array<{ url: string }> }).docs[0]?.url;
  expect(url, "a seeded media file").toMatch(/^\/api\/media\/file\//);

  const file = await anon.get(url);
  expect(file.status()).toBe(200);
  const fileCsp = file.headers()["content-security-policy"];
  expect(fileCsp).toContain("sandbox");
  expect(fileCsp).toContain("default-src 'none'");
  expect(fileCsp).toContain("frame-ancestors 'self'");

  const home = await anon.get("/");
  expect(home.headers()["content-security-policy"]).toBe("frame-ancestors 'self'");
});

test("edit -> live: a project summary change shows on the public page without a rebuild", async () => {
  const marker = stamp();
  const res = await admin.api.patch(`/api/projects/${projectId}`, {
    data: { summary: `${originalSummary} ${marker}`, _status: "published" },
  });
  expect(res.ok()).toBe(true);
  await expect.poll(async () => (await page(`/work/${SLUG}`)()).includes(marker), { timeout: 20_000 }).toBe(true);
});

test("draft -> preview only: anonymous visitors never see it, the admin preview does", async ({ browser }) => {
  const marker = stamp();
  const res = await admin.api.patch(`/api/projects/${projectId}?draft=true`, {
    data: { summary: `${originalSummary} ${marker}` },
  });
  expect(res.ok()).toBe(true);

  // Anonymous: not on the case study, and /api/draft refuses without a session.
  expect(await page(`/work/${SLUG}`)()).not.toContain(marker);
  const refused = await anon.get(`/api/draft?path=/work/${SLUG}`, { maxRedirects: 0 });
  expect(refused.status()).toBe(401);

  // Admin: preview shows the draft with the banner.
  const context = await browser.newContext({ baseURL: DB_BASE_URL, storageState: admin.storageState });
  const tab = await context.newPage();
  await tab.goto(`/api/draft?path=/work/${SLUG}`);
  await expect(tab).toHaveURL(new RegExp(`/work/${SLUG}$`));
  const banner = tab.getByRole("complementary", { name: "Preview" });
  await expect(banner).toContainText("unpublished drafts");
  // The case study shows the summary only in its meta description (and Open Graph tags).
  const description = tab.locator('meta[name="description"]');
  await expect(description).toHaveAttribute("content", new RegExp(marker));

  // Exit preview: back on this page, published version, no banner.
  await banner.getByRole("button", { name: "Exit preview" }).click();
  await expect(tab).toHaveURL(new RegExp(`/work/${SLUG}$`));
  await expect(tab.getByRole("complementary", { name: "Preview" })).toHaveCount(0);
  await expect(description).not.toHaveAttribute("content", new RegExp(marker));
  await context.close();
});

test("availability toggle (updateTag): the hero changes on the next request", async ({ browser }) => {
  // The status dot in the hero chip is drawn unless the status is "closed".
  const dot = (html: string) => /f-hero-role[\s\S]*?<\/div>/.exec(html)?.[0].includes("f-dot") ?? false;
  expect(dot(await page("/")())).toBe(true); // seeded status is "open"

  const context = await browser.newContext({ baseURL: DB_BASE_URL, storageState: admin.storageState });
  const tab = await context.newPage();
  await tab.goto("/admin");
  const group = tab.getByRole("group", { name: "Availability status" });
  await expect(group).toBeVisible({ timeout: 30_000 });

  await group.getByRole("button", { name: /^Closed/ }).click();
  await expect(tab.getByRole("status").filter({ hasText: "Saved. Availability is now Closed." })).toBeVisible();
  // updateTag expires the cache for the next visitor: no polling, the very next request is new.
  expect(dot(await page("/")())).toBe(false);

  await group.getByRole("button", { name: /^Open/ }).click();
  await expect(tab.getByRole("status").filter({ hasText: "Saved. Availability is now Open." })).toBeVisible();
  expect(dot(await page("/")())).toBe(true);
  await context.close();
});

test("retired template id: saving \"editorial\" is coerced to Folio and the site stays Folio", async () => {
  const isFolio = async () => (await page("/")()).includes("tpl-folio");
  expect(await isFolio()).toBe(true);

  const res = await admin.api.post("/api/globals/site-settings", { data: { activeTemplate: "editorial" } });
  expect(res.ok()).toBe(true);
  const saved = await admin.api.get("/api/globals/site-settings");
  expect((await saved.json()).activeTemplate).toBe("folio");
  expect(await isFolio()).toBe(true);
});

// ---- Phase 6: template preview (6.4), template activation, analytics widget (6.8) ----

test("template preview: 401 anonymous, 400 for an unknown id, and no cookie is set either way", async () => {
  const anonymous = await anon.get("/api/template-preview?template=index&path=/", { maxRedirects: 0 });
  expect(anonymous.status()).toBe(401);
  expect(anonymous.headers()["set-cookie"] ?? "").toBe("");

  for (const bad of ["nope", "editorial", ""]) {
    const res = await admin.api.get(`/api/template-preview?template=${bad}&path=/`, { maxRedirects: 0 });
    expect(res.status(), `template=${bad}`).toBe(400);
    expect(res.headers()["set-cookie"] ?? "").toBe("");
  }
});

test("template preview: the admin sees Index with the banner, anonymous visitors still get Folio, exit clears it", async ({ browser }) => {
  expect(await (await anon.get("/")).text()).toContain("tpl-folio");

  const context = await browser.newContext({ baseURL: DB_BASE_URL, storageState: admin.storageState });
  const tab = await context.newPage();
  await tab.goto("/api/template-preview?template=index&path=/");
  await expect(tab).toHaveURL(/\/$/);
  await expect(tab.locator(".tpl-index")).toHaveCount(1);
  await expect(tab.locator(".tpl-folio")).toHaveCount(0);
  const banner = tab.getByRole("complementary", { name: "Preview" });
  await expect(banner).toContainText("Previewing the Index template");

  // The preview is this browser's only: a visitor without the cookie still gets the published Folio.
  const html = await (await anon.get("/")).text();
  expect(html).toContain("tpl-folio");
  expect(html).not.toContain("tpl-index");

  // It sticks across pages while the preview lasts.
  await tab.goto("/about");
  await expect(tab.locator(".tpl-index")).toHaveCount(1);

  await tab.goto("/");
  await tab.getByRole("complementary", { name: "Preview" }).getByRole("button", { name: "Exit preview" }).click();
  await expect(tab.getByRole("complementary", { name: "Preview" })).toHaveCount(0);
  await expect(tab.locator(".tpl-folio")).toHaveCount(1);
  await expect(tab.locator(".tpl-index")).toHaveCount(0);
  const cookies = await context.cookies();
  expect(cookies.filter((c) => /template/i.test(c.name))).toEqual([]);
  await context.close();
});

test("activating Index through site-settings switches / for anonymous visitors, then Folio comes back", async () => {
  const set = (activeTemplate: string) => admin.api.post("/api/globals/site-settings", { data: { activeTemplate } });
  try {
    const res = await set("index");
    expect(res.ok()).toBe(true);
    expect((await (await admin.api.get("/api/globals/site-settings")).json()).activeTemplate).toBe("index");
    await expect.poll(async () => (await page("/")()).includes("tpl-index"), { timeout: 20_000 }).toBe(true);
    // Other routes revalidate stale-while-revalidate too: the first request may be the old page.
    for (const path of ["/work", "/archive", "/v"]) {
      await expect.poll(async () => (await page(path)()).includes("tpl-index"), { timeout: 20_000, message: path }).toBe(true);
      expect(await page(path)(), path).not.toContain("tpl-folio");
    }
    expect((await anon.get("/work/does-not-exist")).status()).toBe(404);
  } finally {
    expect((await set("folio")).ok()).toBe(true);
  }
  await expect.poll(async () => (await page("/")()).includes("tpl-folio"), { timeout: 20_000 }).toBe(true);
  expect(await page("/")()).not.toContain("tpl-index");
});

test("analytics widget: the dashboard shows the not-set-up state without a token", async ({ browser }) => {
  const context = await browser.newContext({ baseURL: DB_BASE_URL, storageState: admin.storageState });
  const tab = await context.newPage();
  await tab.goto("/admin");
  const widget = tab.locator("section.ak-widget").filter({ has: tab.locator("#ak-analytics-title") });
  await expect(widget).toBeVisible({ timeout: 30_000 });
  await expect(widget).toContainText("Not set up yet");
  await expect(widget).toContainText("VERCEL_ANALYTICS_TOKEN");
  await context.close();
});

test("templates widget: the dashboard offers a preview link for Index", async ({ browser }) => {
  const context = await browser.newContext({ baseURL: DB_BASE_URL, storageState: admin.storageState });
  const tab = await context.newPage();
  await tab.goto("/admin");
  await expect(tab.locator('a[href*="/api/template-preview?template=index"]').first()).toBeVisible({ timeout: 30_000 });
  await context.close();
});
