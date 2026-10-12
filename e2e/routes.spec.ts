import { test, expect } from "@playwright/test";

const isFolio = (name: string) => name.startsWith("folio-");
const slugs = ["abroadly", "nook"];

for (const slug of slugs) {
  test(`/work/${slug} is 404 under Editorial (no case-study pages)`, async ({ page }, testInfo) => {
    test.skip(isFolio(testInfo.project.name), "Editorial only");
    const res = await page.goto(`/work/${slug}`);
    expect(res?.status()).toBe(404);
  });

  test(`/work/${slug} renders a case study under Folio`, async ({ page }, testInfo) => {
    test.skip(!isFolio(testInfo.project.name), "Folio only");
    const res = await page.goto(`/work/${slug}`);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
  });
}

test("/work/does-not-exist returns 404", async ({ page }) => {
  const res = await page.goto("/work/does-not-exist");
  expect(res?.status()).toBe(404);
});
