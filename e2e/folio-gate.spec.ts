import { test, expect, type Page } from "@playwright/test";
import { expectNoHorizontalScroll } from "./folio-helpers";

// Phase 1 gate (finding F-20): behaviour verified by hand at the gate, now locked in. Folio only.

test.beforeEach(({}, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("folio-"), "Folio only");
});

const KEY = "folio:preloader";
const pre = (page: Page) => page.locator("#f-pre");
const skipPreloader = (page: Page) => page.addInitScript((k) => sessionStorage.setItem(k, "1"), KEY);

test.describe("preloader", () => {
  test("runs on the first load of a session, never again, and never scrolls sideways", async ({ page }) => {
    await page.goto("/");
    // The inline script sets data-run before first paint; it is removed again when the lift ends.
    await expect(pre(page)).toHaveAttribute("data-run", "");
    await expectNoHorizontalScroll(page);
    expect(await page.evaluate((k) => sessionStorage.getItem(k), KEY)).toBe("1");
    await expect(pre(page)).not.toHaveAttribute("data-run", "", { timeout: 5000 });
    await expect(pre(page)).toBeHidden();

    await page.reload();
    await expect(pre(page)).not.toHaveAttribute("data-run", "");
    await expect(pre(page)).toBeHidden();
  });

  test("is skipped when the session key is already set", async ({ page }) => {
    await skipPreloader(page);
    await page.goto("/");
    await expect(pre(page)).not.toHaveAttribute("data-run", "");
    await expect(pre(page)).toBeHidden();
  });

  test("only exists on Home", async ({ page }) => {
    await page.goto("/about");
    await expect(pre(page)).toHaveCount(0);
  });

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });
    test("never runs and sets no key", async ({ page }) => {
      await page.goto("/");
      await expect(pre(page)).not.toHaveAttribute("data-run", "");
      await expect(pre(page)).toBeHidden();
      expect(await page.evaluate((k) => sessionStorage.getItem(k), KEY)).toBeNull();
    });
  });
});

test.describe("hover modal", () => {
  test.beforeEach(async ({ page }) => {
    await skipPreloader(page); // so it cannot cover the rows
  });
  const modal = (page: Page) => page.locator(".f-hm");
  const rows = (page: Page) => page.locator(".f-recent-rows");

  test("mounts on hover with a fine pointer at 1440 and dims the other rows", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "folio-desktop", "fine pointer project");
    await page.goto("/");
    await expect(rows(page)).toHaveCount(1);
    const items = rows(page).locator("li");
    expect(await items.count()).toBeGreaterThan(1);
    await items.first().scrollIntoViewIfNeeded();
    await items.first().hover();
    await expect(modal(page)).toHaveCount(1);
    await expect
      .poll(() =>
        items.nth(1).evaluate((el) => Math.min(...Array.from(el.querySelectorAll(".f-row-link > *")).map((n) => Number(getComputedStyle(n).opacity)))),
      )
      .toBeLessThan(1);
  });

  test("absent on touch projects", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "folio-desktop", "touch only");
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(modal(page)).toHaveCount(0);
  });

  test.describe("narrow fine pointer (< 1024)", () => {
    test.use({ viewport: { width: 900, height: 800 }, hasTouch: false, isMobile: false });
    test("rows are hidden (tiles shown)", async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "folio-desktop", "one project is enough");
      await page.goto("/");
      await expect(rows(page)).toBeHidden(); // tiles, not rows, below 1024
      // Note: the modal component itself still mounts here (useFinePointer has no width check), but
      // it has no rows to follow; reported as a minor source observation, not asserted.
    });
  });

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });
    test("no modal even with a fine pointer", async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "folio-desktop", "fine pointer project");
      await page.goto("/");
      const row = rows(page).locator("li").first();
      await row.scrollIntoViewIfNeeded();
      await row.hover();
      await page.waitForLoadState("networkidle");
      await expect(modal(page)).toHaveCount(0);
    });
  });
});

test.describe("navigation and shell", () => {
  test.beforeEach(async ({ page }) => {
    await skipPreloader(page);
  });

  test("back restores the scroll position", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => window.scrollTo(0, 900));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(800);
    const y = await page.evaluate(() => Math.round(window.scrollY));
    await page.locator('footer a[href="/about"], header a[href="/about"]').first().evaluate((a: HTMLElement) => a.click());
    await expect(page).toHaveURL(/\/about$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect.poll(() => page.evaluate((y0) => Math.abs(window.scrollY - y0), y), { timeout: 5000 }).toBeLessThan(40);
  });

  test("burger appears only after the hero has left the viewport", async ({ page }) => {
    await page.goto("/");
    const burger = page.locator(".f-burger button");
    const hero = page.locator("[data-folio-hero]").first();
    await expect(hero).toHaveCount(1);
    await expect(burger).toBeHidden();
    const heroBottom = () => hero.evaluate((el) => el.getBoundingClientRect().bottom + window.scrollY);
    await page.evaluate((b) => window.scrollTo(0, b - window.innerHeight + 200), await heroBottom());
    await expect(burger).toBeHidden(); // hero still partly in view
    await page.evaluate((b) => window.scrollTo(0, b + 50), await heroBottom());
    await expect(burger).toBeVisible();
  });

  test("Contact footer is compact: no repeated contact block or link", async ({ page }) => {
    await page.goto("/contact");
    const footer = page.locator("footer");
    await expect(footer).toHaveCount(1);
    await expect(footer).not.toHaveAttribute("aria-labelledby", /.*/); // full footer is labelled by its CTA title
    await expect(footer.locator("#footer-title")).toHaveCount(0);
    await expect(footer.locator('a[href="/contact"]')).toHaveCount(0);
  });

  test("404 page", async ({ page }) => {
    const res = await page.goto("/no-such-page");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found");
    await expect(page.locator('nav[aria-label="Ways back"] a')).toHaveCount(3);
    await expectNoHorizontalScroll(page);
  });
});
