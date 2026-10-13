import { test, expect, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { gotoFolio } from "./folio-helpers";

// Folio global shell (task 1.2, guide §4.1/§4.2): top bar, burger, menu dialog, footer, skip link.
// Folio projects only. The hero lands in 1.3, so the burger is driven through its 100svh sentinel
// (or the hero once it exists) by scrolling a screen and a half down the home page.

const PROFILE_EMAIL = "akashsaha1313@gmail.com";
const MD = 768; // Tailwind md breakpoint

test.beforeEach(({}, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("folio-"), "Folio only");
});

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < MD;
const burger = (page: Page) => page.locator(".f-burger button");
const topMenuButton = (page: Page) => page.locator('header button[aria-controls="folio-menu"]');
const dialog = (page: Page) => page.locator("#folio-menu");
const closeButton = (page: Page) => page.locator("[data-menu-close]");

async function scrollPastHero(page: Page) {
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5));
  await expect(burger(page)).toBeVisible();
}

/** Opens the menu the way a visitor on this viewport would; returns the trigger used. */
async function openMenu(page: Page): Promise<Locator> {
  const trigger = isPhone(page) ? topMenuButton(page) : burger(page);
  if (!isPhone(page)) await scrollPastHero(page);
  await trigger.click();
  await expect(dialog(page)).toBeVisible();
  return trigger;
}

async function focusIsInside(page: Page, selector: string) {
  return page.evaluate((s) => !!document.activeElement?.closest(s), selector);
}

async function noHorizontalScroll(page: Page) {
  const m = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, w: window.innerWidth }));
  expect(m.s, `scrollWidth ${m.s} > innerWidth ${m.w}`).toBeLessThanOrEqual(m.w);
}

test.describe("top bar", () => {
  test.beforeEach(async ({ page }) => {
    await gotoFolio(page, "/");
  });

  test("logo links home", async ({ page }) => {
    await expect(page.locator("header").getByRole("link", { name: /Code by Akash/ })).toHaveAttribute("href", "/");
  });

  test("phone shows only Menu; md+ shows the three links", async ({ page }) => {
    const nav = page.locator("header nav");
    if (isPhone(page)) {
      await expect(topMenuButton(page)).toBeVisible();
      await expect(nav).toBeHidden();
      for (const name of ["Work", "About", "Contact"]) {
        await expect(page.locator("header").getByRole("link", { name, exact: true })).toBeHidden();
      }
    } else {
      await expect(topMenuButton(page)).toBeHidden();
      for (const [name, href] of [["Work", "/work"], ["About", "/about"], ["Contact", "/contact"]]) {
        await expect(nav.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
      }
    }
  });

  test("every visible interactive element is at least 44x44", async ({ page }) => {
    const items = page.locator("header").locator("a:visible, button:visible");
    const count = await items.count();
    expect(count).toBeGreaterThan(1);
    for (let i = 0; i < count; i++) {
      const box = await items.nth(i).boundingBox();
      expect(box?.width, `item ${i} width`).toBeGreaterThanOrEqual(44);
      expect(box?.height, `item ${i} height`).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe("burger", () => {
  test("is hidden and not focusable at the top, visible after scrolling", async ({ page }) => {
    await gotoFolio(page, "/");
    await expect(burger(page)).toBeHidden();
    await expect(burger(page)).toHaveCount(1);
    expect(await burger(page).evaluate((el) => getComputedStyle(el).visibility)).toBe("hidden");
    await scrollPastHero(page);
    await burger(page).focus();
    await expect(burger(page)).toBeFocused();
    // It scales in, so measure once the transition has settled.
    await expect.poll(async () => (await burger(page).boundingBox())?.width ?? 0).toBeGreaterThanOrEqual(44);
    await expect.poll(async () => (await burger(page).boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(burger(page)).toBeHidden();
  });
});

test.describe("menu", () => {
  test.beforeEach(async ({ page }) => {
    await gotoFolio(page, "/");
  });

  test("opens from its trigger, aria-expanded toggles, focus lands on close", async ({ page }) => {
    const trigger = isPhone(page) ? topMenuButton(page) : burger(page);
    if (!isPhone(page)) await scrollPastHero(page);
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(dialog(page)).toHaveAttribute("role", "dialog");
    await expect(dialog(page)).toHaveAttribute("aria-modal", "true");
    await trigger.click();
    await expect(dialog(page)).toBeVisible();
    await expect(closeButton(page)).toBeFocused();
    await expect(page.locator("html")).toHaveAttribute("data-folio-menu-open", "");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await closeButton(page).click();
    await expect(dialog(page)).toBeHidden();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();
    await expect(page.locator("html")).not.toHaveAttribute("data-folio-menu-open", "");
  });

  test("the burger opens it too (phone, after scrolling)", async ({ page }) => {
    test.skip(!isPhone(page), "covered for md+ above");
    await scrollPastHero(page);
    await burger(page).click();
    await expect(dialog(page)).toBeVisible();
    await expect(closeButton(page)).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(burger(page)).toBeFocused();
  });

  test("Tab and Shift+Tab stay inside the dialog", async ({ page, browserName }) => {
    await openMenu(page);
    // WebKit's default Tab skips links, so from the close button focus may leave the document for
    // the browser UI (body); it must still never land on the inert page behind the panel.
    const ok = async () =>
      (await focusIsInside(page, "#folio-menu")) ||
      (browserName === "webkit" && (await page.evaluate(() => document.activeElement === document.body)));
    for (const key of ["Tab", "Shift+Tab"]) {
      for (let i = 0; i < 14; i++) {
        await page.keyboard.press(key);
        expect(await ok(), `${key} #${i + 1}`).toBe(true);
        expect(await focusIsInside(page, "[inert]"), `${key} #${i + 1} on inert page`).toBe(false);
      }
    }
  });

  test("Esc closes and returns focus to the trigger", async ({ page }) => {
    const trigger = await openMenu(page);
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("backdrop click closes (md+)", async ({ page }) => {
    test.skip(isPhone(page), "the panel is full screen on phones");
    await openMenu(page);
    await page.mouse.click(20, 300);
    await expect(dialog(page)).toBeHidden();
  });

  test("locks page scroll and makes the page inert while open", async ({ page, browserName }) => {
    await openMenu(page);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe("hidden");
    // Mobile WebKit has no mouse wheel; the overflow check above covers it there.
    if (browserName !== "webkit") {
      const before = await page.evaluate(() => window.scrollY);
      await page.mouse.move(5, 300);
      await page.mouse.wheel(0, 600);
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(before);
    }
    expect(await page.evaluate(() => document.querySelector("main")?.closest("[inert]") !== null)).toBe(true);
  });

  test("no serious or critical axe violations and no horizontal scroll while open", async ({ page }) => {
    await openMenu(page);
    await noHorizontalScroll(page);
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(blocking.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
  });

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("opens instantly with focus inside, closes with Esc", async ({ page }) => {
      await gotoFolio(page, "/");
      const trigger = isPhone(page) ? topMenuButton(page) : burger(page);
      if (!isPhone(page)) await scrollPastHero(page);
      await trigger.click();
      // No waiting for a slide: the panel must be usable straight away.
      await expect(closeButton(page)).toBeFocused({ timeout: 1000 });
      expect(await focusIsInside(page, "#folio-menu")).toBe(true);
      await expect(dialog(page)).toBeVisible({ timeout: 1000 });
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
    });
  });
});

test.describe("footer", () => {
  test.beforeEach(async ({ page }) => {
    await gotoFolio(page, "/");
  });

  test("Get in touch goes to /contact", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer).toBeAttached();
    await expect(footer.getByRole("link", { name: "Get in touch" })).toHaveAttribute("href", "/contact");
  });

  test("version, socials and no horizontal scroll", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer.getByText("Version")).toBeAttached();
    expect(await footer.locator('ul[aria-labelledby="footer-socials"] a').count()).toBeGreaterThan(0);
    await noHorizontalScroll(page);
  });

  test("copy email announces and (Chromium) fills the clipboard", async ({ page, context, browserName }) => {
    if (browserName === "chromium") await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const copy = page.locator('footer button[aria-label^="Copy email"]');
    const status = page.locator("footer [role=status]");
    await copy.scrollIntoViewIfNeeded();
    await expect(copy).toHaveAttribute("aria-label", `Copy email address ${PROFILE_EMAIL}`);
    await copy.click();
    await expect(status).toHaveText("Email address copied");
    if (browserName === "chromium") {
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(PROFILE_EMAIL);
    }
  });

  test("local time replaces --:-- after hydration", async ({ page }) => {
    const time = page.locator("footer time");
    await expect(time).toHaveText(/^\d{2}:\d{2}/, { timeout: 20_000 });
    await expect(page.locator("footer").getByText("--:--")).toHaveCount(0);
  });

  test("local time is a placeholder in the server HTML", async ({ request }) => {
    const html = await (await request.get("/")).text();
    expect(html).toContain("--:--");
  });
});

test.describe("skip link", () => {
  test("is first in tab order, >= 44px, Enter moves focus to main#main", async ({ page, browserName }) => {
    await gotoFolio(page, "/");
    // WebKit's default Tab skips links; focus the skip link directly there.
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    if (browserName === "webkit") await skip.focus();
    await expect(skip).toBeFocused();
    const box = await skip.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    await page.keyboard.press("Enter");
    await expect(page.locator("main#main")).toBeFocused();
  });
});
