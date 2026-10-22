import { test, expect } from "@playwright/test";
import { staticSiteContent } from "../lib/static-content";
import { expectAxeClean, expectNoHorizontalScroll, isFolio, gotoFolio, watchConsole } from "./folio-helpers";

// Folio /archive (6.1) and /v (6.3), plus the frozen /v/editorial snapshot. Folio projects only.

test.beforeEach(({}, testInfo) => {
  test.skip(!isFolio(testInfo), "Folio only");
});

const projects = staticSiteContent().projects;

test.describe("/archive", () => {
  test("loads cleanly: one h1, axe clean, no horizontal scroll, no console errors", async ({ page }) => {
    const c = watchConsole(page);
    const res = await gotoFolio(page, "/archive");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText("Archive");
    await expectNoHorizontalScroll(page);
    await expectAxeClean(page);
    expect(c.errors).toEqual([]);
  });

  test("no horizontal scroll at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/archive");
    await expect(page.locator("h1")).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test("lists every project once, with its links", async ({ page }) => {
    await page.goto("/archive");
    const rows = page.locator("table tbody tr");
    await expect(rows).toHaveCount(projects.length);
    for (const p of projects) {
      const row = rows.filter({ has: page.getByRole("rowheader", { name: new RegExp(`^${p.name}`) }) });
      await expect(row, p.name).toHaveCount(1);
      const caseLink = row.locator(`a[href="/work/${p.slug}"]`);
      await expect(caseLink).toHaveCount(p.caseStudy ? 1 : 0);
    }
    // External links open a new tab safely.
    const external = page.locator("table tbody a[target=_blank]");
    expect(await external.count()).toBeGreaterThan(0);
    for (const rel of await external.evaluateAll((els) => els.map((e) => e.getAttribute("rel") ?? ""))) {
      expect(rel).toContain("noopener");
    }
  });

  test("links are at least 44px tall; the table says what each column is", async ({ page }) => {
    await page.goto("/archive");
    const links = page.locator("table tbody a:visible");
    const n = await links.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) expect((await links.nth(i).boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expect(page.getByRole("table", { name: "Archive" })).toBeVisible();
  });

  test("a case-study link navigates to it", async ({ page }) => {
    await gotoFolio(page, "/archive");
    const withCase = projects.find((p) => p.caseStudy)!;
    await page.locator(`table tbody a[href="/work/${withCase.slug}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/work/${withCase.slug}$`));
    await expect(page.locator("h1")).toHaveCount(1);
  });
});

test.describe("/v", () => {
  test("loads cleanly with cards for Folio (current) and Editorial, not Index", async ({ page }) => {
    const c = watchConsole(page);
    const res = await gotoFolio(page, "/v");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText("Older versions");
    const cards = page.locator("main article");
    await expect(cards).toHaveCount(2);
    const folio = cards.filter({ has: page.getByRole("heading", { name: /^Folio/ }) });
    await expect(folio.getByText("Current", { exact: true })).toBeVisible();
    await expect(folio.getByRole("link")).toHaveAttribute("href", "/");
    await expect(page.locator("main").getByRole("heading", { name: /^Index/ })).toHaveCount(0);
    await expectNoHorizontalScroll(page);
    await expectAxeClean(page);
    expect(c.errors).toEqual([]);
  });

  test("the Editorial card links to the snapshot", async ({ page }) => {
    await page.goto("/v");
    const link = page.locator("main article").getByRole("link", { name: /^Editorial/ });
    await expect(link).toHaveAttribute("href", "/v/editorial");
    // A stretched link: the whole card (the link's ::after) is the tap target.
    expect((await page.locator("main article").filter({ has: link }).boundingBox())!.height).toBeGreaterThanOrEqual(44);
  });

  test("no horizontal scroll at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/v");
    await expect(page.locator("h1")).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
});

test.describe("/v/editorial snapshot", () => {
  test("answers 200 with X-Robots-Tag: noindex", async ({ request }) => {
    const res = await request.get("/v/editorial");
    expect(res.status()).toBe(200);
    expect(res.headers()["x-robots-tag"]).toContain("noindex");
    expect(await res.text()).toContain('name="robots" content="noindex"');
  });

  test("shows the archived-version banner linking back to the live site", async ({ page }) => {
    await page.goto("/v/editorial");
    const banner = page.getByLabel("Archived version");
    await expect(banner).toContainText("older version of this site");
    await expect(banner.getByRole("link")).toHaveAttribute("href", "/");
    await expectNoHorizontalScroll(page);
  });
});
