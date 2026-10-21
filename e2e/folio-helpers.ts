import { expect, type Page, type TestInfo } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Folio specs: call `waitForHydration(page)` (or `gotoFolio`) after goto, before any click/scroll/submit.
export const isFolio = (testInfo: TestInfo) => testInfo.project.name.startsWith("folio-");

/** Collects console errors and uncaught page errors; read `.errors` at the end of the test. */
// Turnstile's challenge iframe logs its own resource errors in WebKit ("Failed to load resource"
// from blob:https://challenges.cloudflare.com/...). They come from Cloudflare's frame, not the site.
const isTurnstileFrame = (url: string) => /^(blob:)?https:\/\/challenges\.cloudflare\.com\//.test(url);

export function watchConsole(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !isTurnstileFrame(m.location().url)) errors.push(`console: ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  return { errors };
}

export async function expectNoHorizontalScroll(page: Page) {
  const m = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, w: window.innerWidth }));
  expect(m.s, `scrollWidth ${m.s} > innerWidth ${m.w}`).toBeLessThanOrEqual(m.w);
}

/**
 * Waits until React has hydrated: LocalTime renders "--:--" on the server and digits after mount.
 * Generous timeout because WebKit hydrates slowly when the whole matrix runs at once.
 */
export async function waitForHydration(page: Page) {
  await expect(page.locator("time.tabular-nums").first()).toHaveText(/\d{2}:\d{2}/, { timeout: 20_000 });
}

/** `page.goto` plus `waitForHydration`; use before any click, scroll or submit. */
export async function gotoFolio(page: Page, url: string) {
  const res = await page.goto(url);
  await waitForHydration(page);
  return res;
}

/** Folio rule: zero serious/critical axe violations. */
export async function expectAxeClean(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const blocking = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(blocking.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
}
