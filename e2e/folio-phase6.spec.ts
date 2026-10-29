import { test, expect, type Page } from "@playwright/test";
import { expectAxeClean, expectNoHorizontalScroll, gotoFolio, isFolio, watchConsole } from "./folio-helpers";

// Folio Phase 6 features: ⌘K command menu (6.2), annotations (6.6), page curtain (6.9), Lab (6.7)
// and the realtime features being OFF in the keyless build (6.5). Folio projects only.

test.beforeEach(({}, testInfo) => {
  test.skip(!isFolio(testInfo), "Folio only");
});

const MD = 768;
const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < MD;
const isDesktop = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1200;

const cmdDialog = (p: Page) => p.getByRole("dialog", { name: "Command menu" });
const cmdField = (p: Page) => p.getByRole("combobox", { name: "Search commands" });
const options = (p: Page) => cmdDialog(p).getByRole("option");

test.describe("⌘K command menu", () => {
  test("the shortcut opens it, Esc closes it and focus returns", async ({ page }) => {
    await gotoFolio(page, "/");
    await page.locator("main#main").focus();
    await page.keyboard.press("ControlOrMeta+k");
    await expect(cmdDialog(page)).toBeVisible();
    await expect(cmdField(page)).toBeFocused();
    await expect(cmdField(page)).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(cmdDialog(page)).toBeHidden();
    await expect(page.locator("main#main")).toBeFocused();
  });

  test("the shortcut toggles it closed again", async ({ page }) => {
    await gotoFolio(page, "/about");
    await page.keyboard.press("ControlOrMeta+k");
    await expect(cmdDialog(page)).toBeVisible();
    await page.keyboard.press("ControlOrMeta+k");
    await expect(cmdDialog(page)).toBeHidden();
  });

  test("the dialog chunk is not requested before the first open", async ({ page }) => {
    const scripts: string[] = [];
    page.on("request", (r) => {
      if (r.resourceType() === "script") scripts.push(r.url());
    });
    await gotoFolio(page, "/about");
    await page.waitForLoadState("networkidle");
    const before = [...new Set(scripts)];
    for (const url of before) {
      const body = await (await page.request.get(url)).text();
      expect(body.includes("Search commands"), `dialog code already in ${url}`).toBe(false);
    }
    await page.keyboard.press("ControlOrMeta+k");
    await expect(cmdDialog(page)).toBeVisible();
    const added = scripts.filter((u) => !before.includes(u));
    expect(added.length, "opening should fetch the lazy dialog chunk").toBeGreaterThan(0);
    const bodies = await Promise.all([...new Set(added)].map(async (u) => (await page.request.get(u)).text()));
    expect(bodies.some((b) => b.includes("Search commands"))).toBe(true);
  });

  test("filtering, arrow keys and Enter navigate", async ({ page }) => {
    await gotoFolio(page, "/about");
    await page.keyboard.press("ControlOrMeta+k");
    await expect(cmdField(page)).toBeFocused();

    const total = await options(page).count();
    expect(total).toBeGreaterThan(5);
    await cmdField(page).fill("arch");
    await expect(options(page).first()).toHaveAccessibleName(/Archive/);
    expect(await options(page).count()).toBeLessThan(total);
    await expect(options(page).first()).toHaveAttribute("aria-selected", "true");

    await cmdField(page).fill("");
    await expect(options(page)).toHaveCount(total);
    await page.keyboard.press("ArrowDown");
    await expect(options(page).nth(1)).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowUp");
    await expect(options(page).first()).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowUp"); // wraps to the last
    await expect(options(page).last()).toHaveAttribute("aria-selected", "true");

    await cmdField(page).fill("older");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/v$/);
    await expect(page.locator("h1")).toHaveText("Older versions");
    await expect(cmdDialog(page)).toBeHidden();
  });

  test("the combobox points at the highlighted option", async ({ page }) => {
    await gotoFolio(page, "/");
    await page.keyboard.press("ControlOrMeta+k");
    const id = await cmdField(page).getAttribute("aria-activedescendant");
    expect(id).toBeTruthy();
    await expect(page.locator(`[id="${id}"]`)).toHaveAttribute("aria-selected", "true");
    await expectAxeClean(page);
  });

  test("no horizontal scroll while open", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await gotoFolio(page, "/");
    await page.keyboard.press("ControlOrMeta+k");
    await expect(cmdDialog(page)).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test("touch: the menu panel has an entry; fine pointer: the top bar has the pill", async ({ page }) => {
    await gotoFolio(page, "/");
    const pill = page.getByRole("button", { name: "Open the command menu" });
    if (isDesktop(page)) {
      await expect(pill).toBeVisible();
      await pill.click();
      await expect(cmdDialog(page)).toBeVisible();
      return;
    }
    await expect(pill).toBeHidden();
    if (isPhone(page)) {
      await page.locator('header button[aria-controls="folio-menu"]').click();
    } else {
      await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5));
      await page.locator(".f-burger button").click();
    }
    await expect(page.locator("#folio-menu")).toBeVisible();
    await page.getByRole("button", { name: "Search and shortcuts" }).click();
    await expect(page.locator("#folio-menu")).toBeHidden();
    await expect(cmdDialog(page)).toBeVisible();
    await expect(cmdField(page)).toBeFocused();
  });
});

test.describe("annotations", () => {
  const toggle = (p: Page) => p.getByRole("button", { name: "How this was built" });
  const note = (p: Page) => p.locator("footer [role=note]").first();

  test("off by default; the toggle shows the notes and the choice survives a reload", async ({ page }) => {
    await gotoFolio(page, "/about");
    await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator("html")).not.toHaveAttribute("data-annotations", /.*/);
    await expect(note(page)).toBeHidden();

    await toggle(page).click();
    await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("html")).toHaveAttribute("data-annotations", "");
    await expect(note(page)).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("folio:annotations"))).toBe("on");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-annotations", "");
    await gotoFolio(page, "/about");
    await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
    await expect(note(page)).toBeVisible();
    await expectNoHorizontalScroll(page);

    await toggle(page).click();
    await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
    await expect(note(page)).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem("folio:annotations"))).toBeNull();
  });

  test("the command menu toggles them and announces it", async ({ page }) => {
    await gotoFolio(page, "/about");
    await page.keyboard.press("ControlOrMeta+k");
    await cmdField(page).fill("notes");
    await page.keyboard.press("Enter");
    await expect(page.locator("html")).toHaveAttribute("data-annotations", "");
    await expect(page.getByRole("status").filter({ hasText: "Notes on how this was built are shown" })).toHaveCount(1);
  });

  test("with notes on, a page is axe clean with no horizontal scroll", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("folio:annotations", "on"));
    await gotoFolio(page, "/");
    await expect(page.locator("html")).toHaveAttribute("data-annotations", "");
    // Notes fade in (@starting-style) and form choices tween colour: let every transition finish,
    // or axe measures contrast on half-transparent text and fails at random.
    await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== "running"), null, { timeout: 10_000 });
    await expectNoHorizontalScroll(page);
    await expectAxeClean(page);
  });
});

test.describe("page curtain", () => {
  test("after a client navigation the title is right and nothing is left covering the page", async ({ page }, testInfo) => {
    test.skip(testInfo.project.use.reducedMotion === "reduce", "no curtain with reduced motion");
    await gotoFolio(page, "/");
    // A client-side navigation through the command menu (router.push).
    await page.keyboard.press("ControlOrMeta+k");
    await cmdField(page).fill("archive");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/archive$/);
    await expect(page.locator("h1")).toHaveText("Archive");
    await expect(page).toHaveTitle(/Archive/);

    // The curtain's run flag drops after the transition and the element is never shown at rest.
    await expect(page.locator(".f-curtain[data-run]")).toHaveCount(0, { timeout: 5_000 });
    await expect(page.locator(".f-curtain")).toBeHidden();
    const active = await page.evaluate(() => {
      try {
        return document.documentElement.matches(":active-view-transition");
      } catch {
        return false;
      }
    });
    expect(active).toBe(false);
    // The page is clickable: the top element at the centre is inside main, not an overlay.
    const covered = await page.evaluate(() => {
      const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
      return !!el && !el.closest("main, header, footer, [role=dialog]") && el !== document.body && el !== document.documentElement;
    });
    expect(covered).toBe(false);
    await expectNoHorizontalScroll(page);
  });

  test("a second navigation also lands cleanly", async ({ page }, testInfo) => {
    test.skip(testInfo.project.use.reducedMotion === "reduce", "no curtain with reduced motion");
    await gotoFolio(page, "/archive");
    await page.keyboard.press("ControlOrMeta+k");
    await cmdField(page).fill("older");
    await page.keyboard.press("Enter");
    await expect(page.locator("h1")).toHaveText("Older versions");
    await expect(cmdDialog(page)).toBeHidden();
    await page.keyboard.press("ControlOrMeta+k");
    await expect(cmdField(page)).toBeFocused();
    await cmdField(page).fill("lab");
    await page.keyboard.press("Enter");
    await expect(page.locator("h1")).toHaveText("Lab");
    await expect(page).toHaveTitle(/Lab/);
    await expect(page.locator(".f-curtain[data-run]")).toHaveCount(0, { timeout: 5_000 });
  });
});

test.describe("/lab", () => {
  test("loads cleanly: one h1, axe clean, no horizontal scroll, no console errors", async ({ page }) => {
    const c = watchConsole(page);
    const res = await gotoFolio(page, "/lab");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText("Lab");
    await expectNoHorizontalScroll(page);
    await expectAxeClean(page);
    expect(c.errors).toEqual([]);
  });

  test("no horizontal scroll at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/lab");
    await expect(page.getByRole("button", { name: "Classify" })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test("no TF.js or model request before Classify", async ({ page }) => {
    const urls: string[] = [];
    page.on("request", (r) => urls.push(r.url()));
    await gotoFolio(page, "/lab");
    await page.waitForLoadState("networkidle");
    expect(urls.filter((u) => /tfjs|tensorflow|model\.json|\.bin(\?|$)/i.test(u))).toEqual([]);
    const scripts = urls.filter((u) => /\.js(\?|$)/.test(u));
    for (const u of new Set(scripts)) {
      const body = await (await page.request.get(u)).text();
      expect(body.includes("tfjs-core") || body.includes("@tensorflow/tfjs"), `TF.js in ${u}`).toBe(false);
    }
  });

  test("classifying a sample shows three results in the live region (desktop Chromium)", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium" || !isDesktop(page), "desktop Chromium only");
    test.setTimeout(90_000);
    await gotoFolio(page, "/lab");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Classify" }).click();
    const list = page.getByRole("status").getByRole("list", { name: "Top three classes" });
    await expect(list.getByRole("listitem")).toHaveCount(3, { timeout: 30_000 });
    await expect(list.getByRole("listitem").first()).toContainText(/\d/);
    await expect(page.getByRole("status").filter({ hasText: /Most likely/ })).toHaveCount(1);
  });
});

test.describe("realtime is off without ABLY_API_KEY", () => {
  test("the token and reactions routes answer 404", async ({ request }) => {
    expect((await request.get("/api/realtime/token")).status()).toBe(404);
    expect((await request.get("/api/reactions/abroadly")).status()).toBe(404);
    expect((await request.post("/api/reactions/abroadly", { data: { n: 1 } })).status()).toBe(404);
  });

  test("no realtime DOM, no token request and no Ably script on Home or a case study", async ({ page }) => {
    const urls: string[] = [];
    page.on("request", (r) => urls.push(r.url()));
    for (const path of ["/", "/work/abroadly"]) {
      await gotoFolio(page, path);
      await page.waitForLoadState("networkidle");
      await expect(page.getByRole("button", { name: "Applaud this case study" })).toHaveCount(0);
      await expect(page.locator("[data-live-cursors], [data-live-visitors]")).toHaveCount(0);
    }
    expect(urls.filter((u) => /realtime|ably|\/api\/reactions/i.test(u))).toEqual([]);
  });
});
