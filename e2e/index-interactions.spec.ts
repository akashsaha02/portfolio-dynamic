import { test, expect, type Page } from "@playwright/test";
import { expectAxeClean, expectNoHorizontalScroll, waitForHydration, watchConsole } from "./folio-helpers";

// Index template behaviour: contact form (fails closed without keys, like Folio's keyless spec),
// the Home section nav scrollspy (lg and up), and the ⌘K command menu. index-* projects only.

test.beforeEach(({}, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("index-"), "Index only");
});

async function load(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
  await waitForHydration(page);
}

test.describe("contact form", () => {
  const name = (p: Page) => p.locator("#contact-name");
  const email = (p: Page) => p.locator("#contact-email");
  const message = (p: Page) => p.locator("#contact-message");
  const submit = (p: Page) => p.getByRole("button", { name: /^Send/ });
  const summary = (p: Page) => p.locator("form [role=alert]");

  async function fillValid(page: Page) {
    await name(page).fill("Ada Lovelace");
    await email(page).fill("ada@example.com");
    await page.locator("#contact-intent-freelance").check();
    await message(page).fill("Hello, I would like to talk about a project.");
  }

  test("structure: one h1, honeypot hidden from AT, no Turnstile widget without a key", async ({ page }) => {
    const c = watchConsole(page);
    await load(page, "/contact");
    await expect(page.locator("h1")).toHaveCount(1);
    const hp = page.locator('[aria-hidden="true"] input[name=website]');
    await expect(hp).toHaveCount(1);
    await expect(hp).toHaveAttribute("tabindex", "-1");
    await expect(page.locator(".cf-turnstile, iframe[src*='challenges.cloudflare.com']")).toHaveCount(0);
    await expectNoHorizontalScroll(page);
    await expectAxeClean(page);
    expect(c.errors).toEqual([]);
  });

  test("empty submit shows four errors and focuses the alert summary", async ({ page }) => {
    await load(page, "/contact");
    await submit(page).click();
    await expect(summary(page)).toBeFocused();
    await expect(page.locator('[id$="-error"]')).toHaveCount(4);
    await expect(name(page)).toHaveAttribute("aria-invalid", "true");
    await expect(name(page)).toHaveAttribute("aria-describedby", "contact-name-error");
    await expectAxeClean(page);
  });

  test("summary links jump to the field", async ({ page }) => {
    await load(page, "/contact");
    await submit(page).click();
    await expect(summary(page)).toBeFocused();
    await summary(page).getByRole("link").nth(1).click();
    await expect(email(page)).toBeFocused();
  });

  test("a partial submit keeps what was typed", async ({ page }) => {
    await load(page, "/contact");
    await name(page).fill("Ada");
    await email(page).fill("bad");
    await submit(page).click();
    await expect(summary(page)).toBeFocused();
    await expect(name(page)).toHaveValue("Ada");
    await expect(email(page)).toHaveValue("bad");
    await expect(page.locator("#contact-email-error")).toBeVisible();
  });

  test("a valid submit fails closed without a Turnstile secret and keeps the values", async ({ page }) => {
    await load(page, "/contact");
    await fillValid(page);
    await submit(page).click();
    await expect(summary(page)).toBeFocused();
    await expect(summary(page)).toContainText(/The form isn.t available right now/);
    await expect(page.getByRole("button", { name: "Send another message" })).toHaveCount(0);
    await expect(name(page)).toHaveValue("Ada Lovelace");
    await expect(email(page)).toHaveValue("ada@example.com");
    await expect(page.locator("#contact-intent-freelance")).toBeChecked();
    await expect(message(page)).toHaveValue("Hello, I would like to talk about a project.");
    await expectAxeClean(page);
  });

  test("inputs suit phones: 16px+ text and 44px+ fields", async ({ page }) => {
    await load(page, "/contact");
    await expect(email(page)).toHaveAttribute("type", "email");
    await expect(email(page)).toHaveAttribute("autocomplete", "email");
    for (const loc of [name(page), email(page), message(page)]) {
      expect(await loc.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
      expect((await loc.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe("home section nav", () => {
  test("hidden below lg", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 1024, "lg and up only");
    await load(page, "/");
    await expect(page.getByRole("navigation", { name: "Sections" })).toBeHidden();
  });

  test("scrollspy marks the section in view and links jump to it (lg+)", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1024, "needs the lg layout");
    await load(page, "/");
    const nav = page.getByRole("navigation", { name: "Sections" });
    await expect(nav).toBeVisible();
    const current = nav.locator("a[aria-current]");

    await page.evaluate(() => document.getElementById("experience")!.scrollIntoView());
    await expect(current).toHaveCount(1);
    await expect(current).toHaveAttribute("href", "#experience");

    await page.evaluate(() => document.getElementById("work")!.scrollIntoView());
    await expect(current).toHaveAttribute("href", "#work");

    await nav.getByRole("link", { name: "Research" }).click();
    await expect(page).toHaveURL(/#research$/);
    await expect(current).toHaveAttribute("href", "#research");
  });
});

test.describe("command menu (Ctrl/Meta+K)", () => {
  const dialog = (p: Page) => p.getByRole("dialog", { name: "Command menu" });
  const field = (p: Page) => p.getByRole("combobox", { name: "Search commands" });

  test("the shortcut opens it on Home and Esc closes it, returning focus", async ({ page }) => {
    await load(page, "/");
    await page.locator("main").focus();
    await page.keyboard.press("ControlOrMeta+k");
    await expect(dialog(page)).toBeVisible();
    await expect(field(page)).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toBeHidden();
    await expect(page.locator("main#main")).toBeFocused();
  });

  test("works on an inner page: filter, arrow keys, Enter navigates", async ({ page }) => {
    await load(page, "/about");
    await page.keyboard.press("ControlOrMeta+k");
    await expect(field(page)).toBeFocused();
    await field(page).fill("arch");
    const options = dialog(page).getByRole("option");
    await expect(options.first()).toHaveAccessibleName(/Archive/);
    await expect(options.first()).toHaveAttribute("aria-selected", "true");
    await field(page).fill("");
    await page.keyboard.press("ArrowDown");
    await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
    await field(page).fill("older");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/v$/);
    await expect(page.locator("h1")).toHaveText("Older versions");
    await expect(dialog(page)).toBeHidden();
  });

  test("a query with no match says so", async ({ page }) => {
    await load(page, "/");
    await page.keyboard.press("ControlOrMeta+k");
    await field(page).fill("zzzzqqq");
    await expect(dialog(page).getByText(/No commands match/)).toBeVisible();
    await expect(dialog(page).getByRole("option")).toHaveCount(0);
  });
});
