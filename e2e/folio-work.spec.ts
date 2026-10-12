import { test, expect, type Page } from "@playwright/test";
import { expectAxeClean, expectNoHorizontalScroll, isFolio, watchConsole } from "./folio-helpers";

// Folio Work index and case studies (task 1.5; guide §4.3, §4.4). Folio projects only.

test.beforeEach(({}, testInfo) => {
  test.skip(!isFolio(testInfo), "Folio only");
});

const filterBtn = (page: Page, name: string) =>
  page.getByRole("group", { name: "Filter by type" }).getByRole("button", { name: new RegExp(`^${name}`) });
const status = (page: Page) => page.locator("main [role=status]");
const count = async (page: Page) => Number((await status(page).innerText()).split(" ")[0]);

test.describe("/work", () => {
  test("loads with one h1, no console errors, axe clean, no horizontal scroll", async ({ page }) => {
    const c = watchConsole(page);
    await page.goto("/work");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText("Work");
    await expectNoHorizontalScroll(page);
    await expectAxeClean(page);
    expect(c.errors).toEqual([]);
  });

  test("no horizontal scroll at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/work");
    await expect(page.locator("h1")).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test("filter chips toggle aria-pressed and update the count", async ({ page }) => {
    await page.goto("/work");
    const all = filterBtn(page, "All");
    const ml = filterBtn(page, "Machine learning");
    const fs = filterBtn(page, "Full-stack");
    await expect(all).toHaveAttribute("aria-pressed", "true");
    await expect(ml).toHaveAttribute("aria-pressed", "false");
    const total = await count(page);
    expect(total).toBeGreaterThan(1);

    await ml.click();
    await expect(ml).toHaveAttribute("aria-pressed", "true");
    await expect(all).toHaveAttribute("aria-pressed", "false");
    await expect(page).toHaveURL(/\?type=ml$/);
    await expect(status(page)).not.toHaveText(`${total} projects`);
    const mlCount = await count(page);
    expect(mlCount).toBeLessThan(total);

    await fs.click();
    await expect(page).toHaveURL(/\?type=fullstack$/);
    await expect(status(page)).toHaveText(`${total - mlCount} projects`);

    await all.click();
    await expect(page).not.toHaveURL(/type=/);
    await expect(status(page)).toHaveText(`${total} projects`);
  });

  test("?type=ml deep link and back/forward restore the filter", async ({ page }) => {
    await page.goto("/work?type=ml");
    await expect(filterBtn(page, "Machine learning")).toHaveAttribute("aria-pressed", "true");
    await expect(filterBtn(page, "All")).toHaveAttribute("aria-pressed", "false");
    const mlText = (await status(page).innerText()).trim();

    await filterBtn(page, "All").click();
    await expect(filterBtn(page, "All")).toHaveAttribute("aria-pressed", "true");
    await expect(status(page)).not.toHaveText(mlText);

    await page.goBack();
    await expect(filterBtn(page, "Machine learning")).toHaveAttribute("aria-pressed", "true");
    await expect(status(page)).toHaveText(mlText);

    await page.goForward();
    await expect(filterBtn(page, "All")).toHaveAttribute("aria-pressed", "true");
  });

  test("case-study links open in place, the rest in a new tab", async ({ page }) => {
    await page.goto("/work");
    const tiles = page.locator(".f-work-tiles a");
    const n = await tiles.count();
    expect(n).toBeGreaterThan(2);
    let internal = 0;
    for (let i = 0; i < n; i++) {
      const a = tiles.nth(i);
      const href = (await a.getAttribute("href")) ?? "";
      if (href.startsWith("/work/")) {
        internal++;
        expect(await a.getAttribute("target"), href).toBeNull();
      } else {
        expect(await a.getAttribute("target"), href).toBe("_blank");
      }
    }
    expect(internal).toBeGreaterThanOrEqual(2);
  });

  test("layout follows pointer and width", async ({ page }, testInfo) => {
    await page.goto("/work");
    const rows = page.locator(".f-work-rows");
    const tiles = page.locator(".f-work-tiles");
    if (testInfo.project.name === "folio-desktop") {
      await expect(rows).toBeVisible();
      await expect(tiles).toBeHidden();
      const layout = page.getByRole("group", { name: "Layout" });
      await expect(layout.getByRole("button", { name: "List" })).toHaveAttribute("aria-pressed", "true");
      await layout.getByRole("button", { name: "Grid" }).click();
      await expect(layout.getByRole("button", { name: "Grid" })).toHaveAttribute("aria-pressed", "true");
      await expect(tiles).toBeVisible();
      await expect(rows).toBeHidden();
      await layout.getByRole("button", { name: "List" }).click();
      await expect(rows).toBeVisible();
      await expect(tiles).toBeHidden();
    } else {
      await expect(tiles).toBeVisible();
      await expect(rows).toBeHidden();
      await expect(page.locator(".f-work-views")).toBeHidden();
    }
  });
});

test.describe("/work on a wide touch screen", () => {
  test.use({ viewport: { width: 1280, height: 800 }, hasTouch: true });

  test("shows tiles and no List/Grid toggle", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "folio-tablet", "one project is enough");
    await page.goto("/work");
    await expect(page.locator(".f-work-tiles")).toBeVisible();
    await expect(page.locator(".f-work-rows")).toBeHidden();
    await expect(page.locator(".f-work-views")).toBeHidden();
    await expectNoHorizontalScroll(page);
  });
});

const CASES = [
  { slug: "abroadly", name: "Abroadly", next: "nook", phones: true },
  { slug: "nook", name: "Nook", next: "abroadly", phones: false },
];

for (const c of CASES) {
  test.describe(`/work/${c.slug}`, () => {
    test("structure, facts, story order, phones", async ({ page }) => {
      const con = watchConsole(page);
      await page.goto(`/work/${c.slug}`);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toHaveText(c.name);

      const terms = await page.locator("main dl dt").allInnerTexts();
      expect(terms.map((t) => t.trim())).toEqual(["Role", "Stack", "Year", "Links"]);

      const story = ["Problem", "What I built", "How it works", "Outcome"];
      const h2s = (await page.locator("main h2").allInnerTexts()).map((t) => t.trim()).filter((t) => story.includes(t));
      expect(h2s).toEqual(story);

      await expect(page.locator(".f-phones")).toHaveCount(c.phones ? 1 : 0);
      await expect(page.locator("#nook-phones")).toHaveCount(0);

      await expectNoHorizontalScroll(page);
      await expectAxeClean(page);
      expect(con.errors).toEqual([]);
    });

    test("Next project goes to the other case study", async ({ page }) => {
      await page.goto(`/work/${c.slug}`);
      const link = page.locator("#next-title").locator("xpath=..").getByRole("link");
      await expect(link).toHaveAttribute("href", `/work/${c.next}`);
      await link.click();
      await expect(page).toHaveURL(new RegExp(`/work/${c.next}$`));
      await expect(page.locator("h1")).toHaveCount(1);
    });
  });
}
