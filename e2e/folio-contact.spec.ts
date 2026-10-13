import { test, expect, type Page } from "@playwright/test";
import { expectAxeClean, expectNoHorizontalScroll, isFolio, waitForHydration, watchConsole } from "./folio-helpers";

// Folio Contact page and form (task 1.6; guide §4.6). Folio projects only.
// contactFormEnabled=false is not covered: it needs a content change.

test.beforeEach(({}, testInfo) => {
  test.skip(!isFolio(testInfo), "Folio only");
});

const name = (p: Page) => p.locator("#contact-name");
const email = (p: Page) => p.locator("#contact-email");
const message = (p: Page) => p.locator("#contact-message");
const submit = (p: Page) => p.locator(".f-contact-send button");
const summary = (p: Page) => p.locator(".f-contact-summary[role=alert]");
const FIELDS = ["name", "email", "intent", "message"] as const;

async function open(page: Page) {
  await page.goto("/contact");
  // Wait for hydration so the form is handled by the Server Action, not a native POST.
  await page.waitForLoadState("networkidle");
  await waitForHydration(page);
  await expect(name(page)).toBeVisible();
}

async function fillValid(page: Page) {
  await name(page).fill("Ada Lovelace");
  await email(page).fill("ada@example.com");
  await page.locator("#contact-intent-freelance").check();
  await message(page).fill("Hello, I would like to talk about a project.");
}

test("/contact structure, axe, no horizontal scroll, no console errors", async ({ page }) => {
  const c = watchConsole(page);
  await open(page);
  await expect(page.locator("h1")).toHaveCount(1);
  for (const id of ["full-time", "freelance", "research"]) {
    await expect(page.locator(`#contact-intent-${id}`)).toHaveCount(1);
  }
  const hp = page.locator(".f-hp[aria-hidden] input[name=website]");
  await expect(hp).toHaveCount(1);
  await expect(hp).toHaveAttribute("tabindex", "-1");
  await expectNoHorizontalScroll(page);
  await expectAxeClean(page);
  expect(c.errors).toEqual([]);
});

test("no horizontal scroll at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await open(page);
  await expectNoHorizontalScroll(page);
});

test("empty submit shows four errors and focuses the alert summary", async ({ page }) => {
  await open(page);
  await submit(page).click();
  await expect(summary(page)).toBeFocused();
  for (const f of FIELDS) await expect(page.locator(`#contact-${f}-error`), f).toBeVisible();
  await expect(page.locator('[id$="-error"]')).toHaveCount(4);
  await expect(name(page)).toHaveAttribute("aria-invalid", "true");
  await expect(name(page)).toHaveAttribute("aria-describedby", "contact-name-error");
  await expectAxeClean(page);
});

test("summary links jump to the field", async ({ page }) => {
  await open(page);
  await submit(page).click();
  await expect(summary(page)).toBeFocused();
  await summary(page).getByRole("link").nth(1).click();
  await expect(email(page)).toBeFocused();
});

test("invalid email keeps the other values and flags only the email", async ({ page }) => {
  await open(page);
  await fillValid(page);
  await email(page).fill("not-an-email");
  await submit(page).click();
  await expect(summary(page)).toBeFocused();
  await expect(page.locator("#contact-email-error")).toBeVisible();
  await expect(page.locator('[id$="-error"]')).toHaveCount(1);
  await expect(name(page)).toHaveValue("Ada Lovelace");
  await expect(email(page)).toHaveValue("not-an-email");
  await expect(page.locator("#contact-intent-freelance")).toBeChecked();
  await expect(message(page)).toHaveValue("Hello, I would like to talk about a project.");
});

test("a partial submit refills every field", async ({ page }) => {
  await open(page);
  await name(page).fill("Ada");
  await email(page).fill("bad");
  await page.locator("#contact-intent-research").check();
  await message(page).fill("short");
  await submit(page).click();
  await expect(summary(page)).toBeFocused();
  await expect(name(page)).toHaveValue("Ada");
  await expect(email(page)).toHaveValue("bad");
  await expect(page.locator("#contact-intent-research")).toBeChecked();
  await expect(message(page)).toHaveValue("short");
});

test("valid submit shows the confirmation and focuses its heading", async ({ page }) => {
  await open(page);
  await fillValid(page);
  await submit(page).click();
  const heading = page.locator(".f-contact-sent h2");
  await expect(heading).toBeVisible();
  await expect(heading).toBeFocused();
  await expect(page.locator("form.f-contact-form")).toHaveCount(0);
  await expectAxeClean(page);

  await page.getByRole("button", { name: "Send another message" }).click();
  await expect(name(page)).toBeFocused();
  await expect(name(page)).toHaveValue("");
});

test("a filled honeypot still looks like success", async ({ page }) => {
  await open(page);
  await fillValid(page);
  await page.locator("input[name=website]").evaluate((el: HTMLInputElement) => {
    el.value = "http://spam.example";
  });
  await submit(page).click();
  await expect(page.locator(".f-contact-sent h2")).toBeFocused();
});

test("Tab skips the honeypot", async ({ page }) => {
  await open(page);
  await message(page).focus();
  await page.keyboard.press("Tab");
  await expect(submit(page)).toBeFocused();
});

test("input attributes and sizes suit phones", async ({ page }) => {
  await open(page);
  const em = email(page);
  await expect(em).toHaveAttribute("type", "email");
  await expect(em).toHaveAttribute("inputmode", "email");
  await expect(em).toHaveAttribute("autocomplete", "email");
  await expect(em).toHaveAttribute("maxlength", "254");

  for (const loc of [name(page), em, message(page)]) {
    const px = await loc.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(px).toBeGreaterThanOrEqual(16);
    const box = await loc.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  const targets = [
    submit(page),
    page.locator("label.f-choice").nth(0),
    page.locator("label.f-choice").nth(1),
    page.locator("label.f-choice").nth(2),
  ];
  for (const t of targets) {
    const box = await t.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
  }
});

test("keyboard-only completion with arrow keys on the radios", async ({ page }) => {
  await open(page);
  await name(page).focus();
  await page.keyboard.type("Grace Hopper");
  await page.keyboard.press("Tab");
  await expect(email(page)).toBeFocused();
  await page.keyboard.type("grace@example.com");
  await page.keyboard.press("Tab");
  await expect(page.locator('input[name=intent]:focus')).toHaveCount(1);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(page.locator("#contact-intent-research")).toBeChecked();
  await page.keyboard.press("ArrowUp");
  await expect(page.locator("#contact-intent-freelance")).toBeChecked();
  await page.keyboard.press("Tab");
  await expect(message(page)).toBeFocused();
  await page.keyboard.type("A message long enough to pass.");
  await page.keyboard.press("Tab");
  await expect(submit(page)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator(".f-contact-sent h2")).toBeFocused();
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the form works and the confirmation shows", async ({ page }) => {
    await open(page);
    await submit(page).click();
    await expect(summary(page)).toBeFocused();
    await fillValid(page);
    await submit(page).click();
    await expect(page.locator(".f-contact-sent h2")).toBeFocused();
  });
});
