import { test, expect } from "@playwright/test";

// Guide §5 rule 11: GSAP must never be in the first-load JS. GSAP core carries the "GreenSock"
// banner; the string "gsap" is a false positive (lazy-import references contain it).
test("no script in the initial HTML contains GSAP core", async ({ request }) => {
  const res = await request.get("/");
  expect(res.status()).toBe(200);
  const html = await res.text();
  const srcs = [...html.matchAll(/<script\b[^>]*?\ssrc="([^"]+)"/g)].map((m) => m[1]);
  expect(srcs.length, "expected script tags in the initial HTML").toBeGreaterThan(0);

  const offenders: string[] = [];
  for (const src of new Set(srcs)) {
    const body = await (await request.get(src)).text();
    if (body.includes("GreenSock")) offenders.push(src);
  }
  expect(offenders, "first-load scripts containing GSAP core").toEqual([]);
});
