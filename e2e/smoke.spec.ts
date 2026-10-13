import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  return errors;
}

async function expectNoHorizontalScroll(page: Page) {
  const m = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(m.scrollWidth, `scrollWidth ${m.scrollWidth} > innerWidth ${m.innerWidth}`).toBeLessThanOrEqual(m.innerWidth);
}

test.describe("home /", () => {
  test("loads cleanly, one h1, no horizontal scroll", async ({ page }) => {
    const errors = collectErrors(page);
    const res = await page.goto("/");
    expect(res?.status()).toBe(200);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toHaveCount(1);
    await expectNoHorizontalScroll(page);
    expect(errors).toEqual([]);
  });

  test("axe scan (Folio: any violation fails; Editorial: soft)", async ({ page }, testInfo) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page }).analyze();
    await testInfo.attach("axe-violations.json", {
      body: JSON.stringify(results.violations, null, 2),
      contentType: "application/json",
    });
    for (const v of results.violations) {
      testInfo.annotations.push({
        type: `axe-${v.impact ?? "unknown"}`,
        description: `${v.id} (${v.nodes.length} nodes): ${v.help} [e.g. ${v.nodes
          .slice(0, 3)
          .map((n) => n.target.join(" "))
          .join(" | ")}]`,
      });
    }
    const blocking = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    if (testInfo.project.name.startsWith("folio-")) {
      // Folio has zero axe violations of any impact (F-20): any violation fails.
      expect(
        results.violations.map((v) => `${v.impact} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`),
      ).toEqual([]);
    } else if (blocking.length) {
      console.warn(`[axe soft] ${blocking.length} serious/critical: ${blocking.map((v) => v.id).join(", ")}`);
    }
  });
});

test.describe("home / with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("h1 is visible immediately", async ({ page }) => {
    await page.goto("/");
    const h1 = page.locator("h1");
    await expect(h1).toHaveCount(1);
    await expect(h1).toBeVisible({ timeout: 2000 });
    await expect(h1).not.toHaveText("");
  });
});
