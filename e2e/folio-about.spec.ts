import { test, expect } from "@playwright/test";
import { expectAxeClean, expectNoHorizontalScroll, isFolio, watchConsole } from "./folio-helpers";

// Folio About page (task 1.6; guide §4.5). Folio projects only.

test.beforeEach(({}, testInfo) => {
  test.skip(!isFolio(testInfo), "Folio only");
});

test("/about structure, axe, no horizontal scroll, no console errors", async ({ page }) => {
  const c = watchConsole(page);
  await page.goto("/about");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("h1#about-title")).toBeVisible();

  await expect(page.locator("#services-title")).toBeVisible();
  await expect(page.locator("ol.f-about-services > li")).toHaveCount(3);
  for (const id of ["toolkit-title", "education-title", "now-title"]) {
    await expect(page.locator(`#${id}`), id).toBeVisible();
  }
  await expect(page.locator("section[aria-labelledby=now-title] time[datetime]")).toHaveAttribute(
    "datetime",
    /^\d{4}-\d{2}-\d{2}/,
  );

  await expectNoHorizontalScroll(page);
  await expectAxeClean(page);
  expect(c.errors).toEqual([]);
});

test("/about has no horizontal scroll at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/about");
  await expect(page.locator("h1")).toBeVisible();
  await expectNoHorizontalScroll(page);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("/about content is visible immediately", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator("h1#about-title")).toBeVisible();
    await expect(page.locator("#now-title")).toBeVisible();
  });
});
