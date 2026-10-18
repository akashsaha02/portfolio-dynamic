import { test, expect, type Page } from "@playwright/test";
import { expectAxeClean, expectNoHorizontalScroll, isFolio, waitForHydration, watchConsole } from "./folio-helpers";
import { adminLogin, isDb, mongoFind, useClientIp } from "./db-helpers";

// Folio Contact page and form (task 1.6; guide §4.6). Folio projects only.
// contactFormEnabled=false is not covered: it needs a content change.
//
// Two servers run this file:
// - folio-* (playwright.config.ts): keyless and DB-free, so a valid submit FAILS CLOSED.
// - folio-db-* (playwright.db.config.ts, `npm run test:e2e:db`): built with the Turnstile test site
//   key, secret + in-memory Mongo, so a valid submit SUCCEEDS and the message lands in `messages`.

let clientIp = "";
test.beforeEach(async ({ context }, testInfo) => {
  test.skip(!isFolio(testInfo), "Folio only");
  // A distinct client IP per test so the 5-per-hour rate limit is never hit.
  if (isDb(testInfo)) clientIp = await useClientIp(context);
});

/** Fail-closed tests only make sense on the keyless server. */
const keylessOnly = (testInfo: import("@playwright/test").TestInfo) =>
  test.skip(isDb(testInfo), "keyless server only: the keyed server accepts valid submissions");

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

/**
 * Keyed server: the widget loads on the first interaction with the form and a single-use token
 * lands in the form once Cloudflare's test key answers. Clicking before `ready` would post no token.
 * Keyless server: there is no widget, nothing to wait for.
 */
async function waitForCheck(page: Page) {
  const status = page.locator(".f-check-status");
  if ((await status.count()) === 0) return;
  await expect(status).toHaveAttribute("data-state", "ready", { timeout: 30_000 });
}

/** Message landed: via the REST API with the admin JWT, and no raw IP anywhere. */
async function expectMessageStored(emailAddr: string, body: string) {
  const { api } = await adminLogin();
  let doc: Record<string, unknown> | undefined;
  await expect
    .poll(
      async () => {
        const res = await api.get(`/api/messages?where[email][equals]=${encodeURIComponent(emailAddr)}&limit=5`);
        doc = ((await res.json()) as { docs: Record<string, unknown>[] }).docs[0];
        return doc?.id ? 1 : 0;
      },
      { timeout: 15_000 },
    )
    .toBe(1);
  expect(doc).toMatchObject({ name: "Ada Lovelace", email: emailAddr, intent: "freelance", body, read: false });
  await api.dispose();

  // Straight from Mongo: the stored document carries no IP, and the rate-limit key is a hash.
  const [raw] = await mongoFind("messages", { email: emailAddr });
  expect(JSON.stringify(raw)).not.toContain(clientIp);
  expect(Object.keys(raw).filter((k) => /ip|forwarded|address/i.test(k))).toEqual([]);
  const limits = await mongoFind("rate-limits");
  expect(limits.length).toBeGreaterThan(0);
  expect(JSON.stringify(limits)).not.toContain(clientIp);
  for (const l of limits) expect(l.key).toMatch(/^[0-9a-f]{64}$/);
}

const VALID_BODY = "Hello, I would like to talk about a project.";
const uniqueEmail = () => `ada+${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

// Since task 2.5 the form calls the real submitContact. The keyless e2e build has no Turnstile
// secret, so a valid submit fails closed. These helpers assert that documented behaviour.
const FAIL_CLOSED = /The form isn.t available right now/;
async function expectFailClosed(page: Page) {
  await expect(summary(page)).toBeFocused();
  await expect(summary(page)).toContainText(FAIL_CLOSED);
  await expect(page.locator(".f-contact-sent")).toHaveCount(0);
  await expect(name(page)).toHaveValue("Ada Lovelace");
  await expect(email(page)).toHaveValue("ada@example.com");
  await expect(page.locator("#contact-intent-freelance")).toBeChecked();
  await expect(message(page)).toHaveValue("Hello, I would like to talk about a project.");
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

test("valid submit fails closed without a Turnstile secret and keeps the values", async ({ page }, testInfo) => {
  keylessOnly(testInfo);
  await open(page);
  await fillValid(page);
  await submit(page).click();
  await expectFailClosed(page);
  await expectAxeClean(page);
});

test("valid submit shows the confirmation, stores the message and offers another", async ({ page }, testInfo) => {
  test.skip(!isDb(testInfo), "needs the keyed + DB server (npm run test:e2e:db)");
  const addr = uniqueEmail();
  await open(page);
  await fillValid(page);
  await email(page).fill(addr);
  await waitForCheck(page);
  await submit(page).click();
  const heading = page.locator(".f-contact-sent h2");
  await expect(heading).toBeVisible();
  await expect(heading).toBeFocused();
  await expect(page.locator("form.f-contact-form")).toHaveCount(0);
  await expectAxeClean(page);
  await expectMessageStored(addr, VALID_BODY);

  await page.getByRole("button", { name: "Send another message" }).click();
  await expect(name(page)).toBeFocused();
  await expect(name(page)).toHaveValue("");
  await expect(email(page)).toHaveValue("");
  await expect(message(page)).toHaveValue("");
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

test("keyboard-only completion with arrow keys on the radios", async ({ page }, testInfo) => {
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
  await waitForCheck(page);
  await expect(submit(page)).toBeFocused();
  await page.keyboard.press("Enter");
  if (isDb(testInfo)) {
    // Keyed server: the keyboard path reaches the confirmation.
    await expect(page.locator(".f-contact-sent h2")).toBeFocused();
  } else {
    // Keyless server: fails closed.
    await expect(summary(page)).toContainText(FAIL_CLOSED);
    await expect(page.locator(".f-contact-sent")).toHaveCount(0);
  }
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the form works and fails closed without a Turnstile secret", async ({ page }, testInfo) => {
    keylessOnly(testInfo);
    await open(page);
    await submit(page).click();
    await expect(summary(page)).toBeFocused();
    await fillValid(page);
    await submit(page).click();
    await expectFailClosed(page);
  });

  test("the confirmation shows", async ({ page }, testInfo) => {
    test.skip(!isDb(testInfo), "needs the keyed + DB server (npm run test:e2e:db)");
    await open(page);
    await submit(page).click();
    await expect(summary(page)).toBeFocused();
    await fillValid(page);
    await waitForCheck(page);
    await submit(page).click();
    await expect(page.locator(".f-contact-sent h2")).toBeFocused();
  });
});
