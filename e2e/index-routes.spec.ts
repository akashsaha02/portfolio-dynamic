import { test, expect, type Page } from "@playwright/test";
import { expectAxeClean, expectNoHorizontalScroll, waitForHydration, watchConsole } from "./folio-helpers";

// Index template (work plan 6.4): every route renders under it. Runs only in the index-* projects
// (second webServer in playwright.config.ts, built with SITE_TEMPLATE=index, no database).

test.beforeEach(({}, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("index-"), "Index only");
});

const ROUTES = ["/", "/work", "/work/abroadly", "/about", "/contact", "/archive", "/lab", "/v"] as const;

async function load(page: Page, url: string) {
  const res = await page.goto(url);
  await waitForHydration(page);
  return res;
}

/** Visible interactive elements smaller than 44x44 (skip link, honeypot and sr-only text excluded). */
async function smallTargets(page: Page) {
  return page.evaluate(() => {
    const out: string[] = [];
    const sel = 'a[href], button, input:not([type=hidden]), textarea, select, summary, [role=button]';
    for (const el of document.querySelectorAll<HTMLElement>(sel)) {
      if (el.closest('[aria-hidden="true"], [inert], dialog:not([open])')) continue;
      if (el.matches("a[href^='#main']") || el.closest(".sr-only")) continue;
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none") continue;
      // Radios and checkboxes are covered by their 44px label.
      const target = el instanceof HTMLInputElement && /radio|checkbox/.test(el.type) ? (el.closest("label") ?? el) : el;
      const r = target.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.width < 43.5 || r.height < 43.5) {
        out.push(`${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
    }
    return out;
  });
}

for (const url of ROUTES) {
  test.describe(url, () => {
    test("200, one h1, main#main, no console errors, axe clean, no horizontal scroll", async ({ page }) => {
      const c = watchConsole(page);
      const res = await load(page, url);
      expect(res?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("main#main")).toHaveCount(1);
      await expect(page.locator(".tpl-index")).toHaveCount(1);
      await expectNoHorizontalScroll(page);
      await expectAxeClean(page);
      expect(c.errors).toEqual([]);
    });

    test("no horizontal scroll at 320px", async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await load(page, url);
      await expectNoHorizontalScroll(page);
    });

    test("interactive elements are at least 44x44", async ({ page }) => {
      await load(page, url);
      expect(await smallTargets(page)).toEqual([]);
    });
  });
}

test.describe("404", () => {
  test("an unknown case study is a 404 page in the Index template", async ({ page }) => {
    const c = watchConsole(page);
    const res = await load(page, "/work/does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.locator("h1")).toHaveText("Page not found");
    await expect(page.locator("main#main")).toHaveCount(1);
    await expect(page.locator(".tpl-index")).toHaveCount(1);
    await expectNoHorizontalScroll(page);
    await expectAxeClean(page);
    expect(await smallTargets(page)).toEqual([]);
    expect(c.errors.filter((e) => !/404/.test(e))).toEqual([]);
  });

  test("an unmatched URL is a 404 page too", async ({ page }) => {
    const res = await page.goto("/nothing/here");
    expect(res?.status()).toBe(404);
    await expect(page.locator("h1")).toHaveText("Page not found");
  });
});

test.describe("content", () => {
  test("the Folio-only chrome is absent", async ({ page }) => {
    await load(page, "/");
    await expect(page.locator("#f-pre")).toHaveCount(0);
    await expect(page.locator("#folio-menu")).toHaveCount(0);
  });

  test("/archive lists every project with a link to its case study", async ({ page }) => {
    await load(page, "/archive");
    const rows = page.locator("main tbody tr, main [role=row]").filter({ has: page.locator("a") });
    expect(await rows.count()).toBeGreaterThan(1);
    await expect(page.getByRole("link", { name: /abroadly/i }).first()).toHaveAttribute("href", "/work/abroadly");
  });

  test("/v marks Index as the current design and links the Editorial snapshot", async ({ page }) => {
    await load(page, "/v");
    await expect(page.getByText("Current", { exact: true }).first()).toBeVisible();
    await expect(page.locator('main a[href="/v/editorial"]')).toHaveCount(1);
    await expect(page.locator("main").getByText("Folio")).toHaveCount(0);
  });

  test("/lab does not request TF.js before Classify", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (r) => requests.push(r.url()));
    await load(page, "/lab");
    await page.waitForLoadState("networkidle");
    expect(requests.filter((u) => /tfjs|tensorflow|\/lab\/tomato\/model|\.bin(\?|$)/i.test(u))).toEqual([]);
    await expect(page.getByRole("button", { name: "Classify" })).toBeVisible();
  });
});
