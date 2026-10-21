import { test, expect } from "@playwright/test";

const slugs = ["abroadly", "nook"];

for (const slug of slugs) {
  test(`/work/${slug} renders a case study`, async ({ page }) => {
    const res = await page.goto(`/work/${slug}`);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
  });
}

test("/work/does-not-exist returns 404", async ({ page }) => {
  const res = await page.goto("/work/does-not-exist");
  expect(res?.status()).toBe(404);
});
