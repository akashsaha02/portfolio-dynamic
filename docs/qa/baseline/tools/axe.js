// axe scan of / at phone and desktop, before and after scrolling, plus reduced-motion timing probe
// and a focus-obscured-by-nav check. Usage: node axe.js <baseUrl> <outJson>
const { chromium } = require("playwright");
const { AxeBuilder } = require("@axe-core/playwright");
const fs = require("fs");

const BASE = process.argv[2] || "http://localhost:3300/";
const OUT = process.argv[3];
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

(async () => {
  const browser = await chromium.launch();
  const out = { axeVersion: null, scans: {} };
  for (const v of [
    { name: "phone-360x740", width: 360, height: 740, touch: true },
    { name: "desktop-1280x800", width: 1280, height: 800, touch: false },
  ]) {
    for (const when of ["on-load", "after-scroll"]) {
      const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height }, hasTouch: v.touch, isMobile: v.touch });
      const page = await ctx.newPage();
      await page.goto(BASE, { waitUntil: "networkidle" });
      await page.waitForTimeout(2500);
      if (when === "after-scroll") {
        await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 300) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)); } });
        await page.waitForTimeout(800);
      }
      const res = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      out.axeVersion = res.testEngine.version;
      out.scans[`${v.name}/${when}`] = {
        violations: res.violations.map((x) => ({ id: x.id, impact: x.impact, help: x.help, count: x.nodes.length, nodes: x.nodes.slice(0, 6).map((n) => ({ target: n.target.join(" "), summary: n.failureSummary?.split("\n").slice(0, 3).join(" ") })) })),
        incomplete: res.incomplete.map((x) => ({ id: x.id, count: x.nodes.length })),
        passes: res.passes.length,
      };
      await ctx.close();
    }
  }

  // Reduced motion: are things still hidden during their animation-delay?
  {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: "commit" });
    await page.waitForSelector("nav");
    const t0 = Date.now();
    const samples = [];
    for (let i = 0; i < 12; i++) {
      samples.push(await page.evaluate(() => ({
        t: Math.round(performance.now()),
        navOpacity: getComputedStyle(document.querySelector("nav")).opacity,
        ctaOpacity: getComputedStyle(document.querySelector("header .hero-fade-in.flex")).opacity,
        riseTransform: getComputedStyle(document.querySelector(".hero-rise")).transform,
        delays: { nav: getComputedStyle(document.querySelector("nav")).animationDelay, rise2: getComputedStyle(document.querySelectorAll(".hero-rise")[1]).animationDelay },
      })));
      await page.waitForTimeout(100);
    }
    out.reducedMotionTiming = { wallStart: t0, samples };
    await ctx.close();
  }

  // Focus obscured: tab through at 360 and see if the focused element sits under the fixed nav pill.
  for (const v of [{ w: 360, h: 740 }, { w: 1280, h: 800 }]) {
    const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: "networkidle" });
    const hits = [];
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press("Tab");
      await page.waitForTimeout(80);
      const r = await page.evaluate(() => {
        const el = document.activeElement; if (!el || el === document.body || el.closest("nav")) return null;
        const a = el.getBoundingClientRect(); const n = document.querySelector("nav > div").getBoundingClientRect();
        const overlapX = Math.max(0, Math.min(a.right, n.right) - Math.max(a.left, n.left));
        const overlapY = Math.max(0, Math.min(a.bottom, n.bottom) - Math.max(a.top, n.top));
        return { text: (el.textContent || "").trim().slice(0, 30), top: Math.round(a.top), coveredPx2: Math.round(overlapX * overlapY), area: Math.round(a.width * a.height) };
      });
      if (r && r.coveredPx2 > 0) hits.push(r);
    }
    out[`focusUnderNav-${v.w}`] = hits;
    await ctx.close();
  }

  await browser.close();
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  for (const [k, s] of Object.entries(out.scans)) console.log(k, "violations:", s.violations.map((x) => `${x.id}(${x.impact})x${x.count}`).join(", ") || "none", "| incomplete:", s.incomplete.map((x) => `${x.id}x${x.count}`).join(", "));
  console.log(JSON.stringify(out.reducedMotionTiming.samples.slice(0, 10)));
  console.log("focusUnderNav", JSON.stringify(out["focusUnderNav-360"]), JSON.stringify(out["focusUnderNav-1280"]));
})();
