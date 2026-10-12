import { expect, type Page, type TestInfo } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

export const isFolio = (testInfo: TestInfo) => testInfo.project.name.startsWith("folio-");

/** Collects console errors and uncaught page errors; read `.errors` at the end of the test. */
export function watchConsole(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  return { errors };
}

export async function expectNoHorizontalScroll(page: Page) {
  const m = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, w: window.innerWidth }));
  expect(m.s, `scrollWidth ${m.s} > innerWidth ${m.w}`).toBeLessThanOrEqual(m.w);
}

/** Folio rule: zero serious/critical axe violations. */
export async function expectAxeClean(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const blocking = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(blocking.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
}
