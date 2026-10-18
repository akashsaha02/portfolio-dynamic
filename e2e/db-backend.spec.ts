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
  await expect(tab.locator("body")).toContainText(marker);

  // Exit preview: back on this page, published version, no banner.
  await banner.getByRole("button", { name: "Exit preview" }).click();
  await expect(tab).toHaveURL(new RegExp(`/work/${SLUG}$`));
  await expect(tab.getByRole("complementary", { name: "Preview" })).toHaveCount(0);
  await expect(tab.locator("body")).not.toContainText(marker);
  await context.close();
});

test("availability toggle (updateTag): the hero changes on the next request", async ({ browser }) => {
  // The status dot in the hero chip is drawn unless the status is "closed".
  const dot = (html: string) => /f-hero-role.*?<\/div>/s.exec(html)?.[0].includes("f-dot") ?? false;
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

test("template switch: site-settings activeTemplate changes the template on `/`", async () => {
  const isFolio = async () => (await page("/")()).includes("tpl-folio");
  expect(await isFolio()).toBe(true);

  const set = (activeTemplate: string) => admin.api.post("/api/globals/site-settings", { data: { activeTemplate } });
  expect((await set("editorial")).ok()).toBe(true);
  await expect.poll(isFolio, { timeout: 20_000 }).toBe(false);

  expect((await set("folio")).ok()).toBe(true);
  await expect.poll(isFolio, { timeout: 20_000 }).toBe(true);
});
