import { test, expect } from "@playwright/test";
import { expectAxeClean, expectNoHorizontalScroll, watchConsole } from "./folio-helpers";
import { ROUTES, load, smallTargets, tplOf } from "./template-helpers";

// Bento, Brutal and Terminal: every route renders under the template. Generic over the project
// name ("<id>-phone"); runs only from playwright.templates.config.ts.

for (const url of ROUTES) {
  test.describe(url, () => {
    test("200, one h1, main#main, no console errors, axe clean, no horizontal scroll", async ({ page }, testInfo) => {
      const id = tplOf(testInfo.project.name);
      const c = watchConsole(page);
      const res = await load(page, url);
      expect(res?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("main#main")).toHaveCount(1);
      await expect(page.locator(`.tpl-${id}`)).toHaveCount(1);
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
  test("an unknown case study is a 404 page in the template", async ({ page }, testInfo) => {
    const id = tplOf(testInfo.project.name);
    const c = watchConsole(page);
    const res = await load(page, "/work/does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.locator("h1")).toHaveText("Page not found");
    await expect(page.locator("main#main")).toHaveCount(1);
    await expect(page.locator(`.tpl-${id}`)).toHaveCount(1);
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

  test("/archive links every project to its case study", async ({ page }) => {
    await load(page, "/archive");
    await expect(page.locator('main a[href="/work/abroadly"]').first()).toBeAttached();
    await expect(page.locator('main a[href="/work/nook"]').first()).toBeAttached();
  });

  test("/v links the Editorial snapshot", async ({ page }) => {
    await load(page, "/v");
    await expect(page.locator('main a[href="/v/editorial"]')).toHaveCount(1);
  });
});
