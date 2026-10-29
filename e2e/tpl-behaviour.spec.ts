import { test, expect, type Page } from "@playwright/test";
import { expectAxeClean, expectNoHorizontalScroll, watchConsole } from "./folio-helpers";
import { load, tplOf } from "./template-helpers";

// Contact form, command menu, lab, realtime and Terminal naming for Bento, Brutal and Terminal.

test.describe("contact form", () => {
  const name = (p: Page) => p.locator("#contact-name");
  const email = (p: Page) => p.locator("#contact-email");
  const message = (p: Page) => p.locator("#contact-message");
  const submit = (p: Page) => p.getByRole("button", { name: /^Send/ });
  const summary = (p: Page) => p.locator("form [role=alert]");

  test("structure: honeypot hidden from AT, no Turnstile widget without a key", async ({ page }) => {
    const c = watchConsole(page);
    await load(page, "/contact");
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
    await expectAxeClean(page);
  });

  test("a valid submit fails closed without a Turnstile secret and keeps the values", async ({ page }) => {
    await load(page, "/contact");
    await name(page).fill("Ada Lovelace");
    await email(page).fill("ada@example.com");
    await page.locator("#contact-intent-freelance").check();
    await message(page).fill("Hello, I would like to talk about a project.");
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

test.describe("command menu (Ctrl/Meta+K)", () => {
  const dialog = (p: Page) => p.getByRole("dialog", { name: "Command menu" });
  const field = (p: Page) => p.getByRole("combobox", { name: "Search commands" });

  test("the shortcut opens it and Esc closes it, returning focus", async ({ page }) => {
    await load(page, "/");
    await page.locator("main").focus();
    await page.keyboard.press("ControlOrMeta+k");
    await expect(dialog(page)).toBeVisible();
    await expect(field(page)).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toBeHidden();
    await expect(page.locator("main#main")).toBeFocused();
  });

  test("filter and Enter navigates", async ({ page }) => {
    await load(page, "/about");
    await page.keyboard.press("ControlOrMeta+k");
    await expect(field(page)).toBeFocused();
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
  });
});

test("/lab does not request TF.js before Classify", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));
  await load(page, "/lab");
  await page.waitForLoadState("networkidle");
  expect(requests.filter((u) => /tfjs|tensorflow|\/lab\/tomato\/model|\.bin(\?|$)/i.test(u))).toEqual([]);
  await expect(page.getByRole("button", { name: "Classify" })).toBeVisible();
});

test.describe("realtime off", () => {
  test("no live-visitor badge, no reactions, no Ably traffic", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (r) => requests.push(r.url()));
    for (const url of ["/", "/work/abroadly"]) {
      await load(page, url);
      await page.waitForLoadState("networkidle");
      await expect(page.locator("[data-live-visitors], [data-reactions]")).toHaveCount(0);
    }
    expect(requests.filter((u) => /ably/i.test(u))).toEqual([]);
  });
});

test.describe("terminal navigation names", () => {
  test("each header link's accessible name equals its visible text", async ({ page }, testInfo) => {
    test.skip(tplOf(testInfo.project.name) !== "terminal", "Terminal only");
    await load(page, "/");
    const nav = page.getByRole("navigation", { name: "Main" });
    for (const label of ["work", "archive", "lab", "about", "contact"]) {
      const link = nav.getByRole("link", { name: label, exact: true });
      await expect(link).toHaveCount(1);
      await expect(link).toHaveText(label);
    }
  });
});
