// Baseline audit: screenshots, overflow, tap targets, lime contrast, focus, reduced motion.
// Usage: node audit.js <baseUrl> <outDir>
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const BASE = process.argv[2] || "http://localhost:3300/";
const OUT = process.argv[3];
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: "320x640", width: 320, height: 640, touch: true, dpr: 2 },
  { name: "360x740", width: 360, height: 740, touch: true, dpr: 3 },
  { name: "390x844", width: 390, height: 844, touch: true, dpr: 3 },
  { name: "414x896", width: 414, height: 896, touch: true, dpr: 2 },
  { name: "768x1024", width: 768, height: 1024, touch: true, dpr: 2 },
  { name: "1024x1366-touch", width: 1024, height: 1366, touch: true, dpr: 2 },
  { name: "1280x800", width: 1280, height: 800, touch: false, dpr: 1 },
  { name: "1440x900", width: 1440, height: 900, touch: false, dpr: 1 },
  { name: "740x360-landscape", width: 740, height: 360, touch: true, dpr: 3 },
  { name: "360x740-reduced-motion", width: 360, height: 740, touch: true, dpr: 3, reduced: true },
];

function measure() {
  const vw = window.innerWidth;
  const doc = document.documentElement;
  // Elements whose box pokes past the viewport and that are not clipped by an ancestor.
  const offenders = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.right <= vw + 0.5) continue;
    let clipped = false;
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const ox = getComputedStyle(p).overflowX;
      if ((ox === "hidden" || ox === "clip") && p.getBoundingClientRect().right <= vw + 0.5) { clipped = true; break; }
    }
    if (!clipped) offenders.push({ tag: el.tagName.toLowerCase(), cls: (el.className?.baseVal ?? el.className ?? "").toString().slice(0, 80), right: Math.round(r.right) });
  }

  const targets = [];
  const sel = "nav a, header a, header button, #contact a, #work a, #experience a, #research a";
  for (const el of document.querySelectorAll(sel)) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    // Stretched-link cards: the ::after covers the card; measure the anchor box itself and the ::after.
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const after = getComputedStyle(el, "::after");
    const stretched = after.position === "absolute" && after.content !== "none";
    const region = el.closest("nav") ? "nav" : el.closest("header") ? "hero" : el.closest("#contact") ? "contact" : el.closest("#work") ? "work" : el.closest("#experience") ? "experience" : "research";
    targets.push({ region, text: (el.textContent || el.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 40), w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10, x: Math.round(r.left), right: Math.round(r.right), y: Math.round(r.top), stretched });
  }

  // Lime text: effective background via ancestor walk (first non-transparent bg).
  const parse = (c) => { const m = c.match(/[\d.]+/g); return m ? m.map(Number) : null; };
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const [h, l] = [lum(a), lum(b)].sort((x, y) => y - x); return (h + 0.05) / (l + 0.05); };
  const bgOf = (el) => { for (let p = el; p; p = p.parentElement) { const c = parse(getComputedStyle(p).backgroundColor); if (c && (c.length < 4 || c[3] > 0)) return c.slice(0, 3); } return parse(getComputedStyle(document.documentElement).backgroundColor).slice(0, 3); };
  const lime = [];
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    if (cs.display === "none") continue;
    const c = parse(cs.color);
    if (!c || !(c[0] === 210 && c[1] === 255 && c[2] === 0)) continue;
    const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!ownText) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0) continue;
    const bg = bgOf(el);
    lime.push({ tag: el.tagName.toLowerCase(), text: el.textContent.trim().slice(0, 30), bg: `rgb(${bg.join(",")})`, ratio: Math.round(ratio(c, bg) * 100) / 100, fontSize: cs.fontSize, ariaHidden: !!el.closest("[aria-hidden=true]") });
  }

  return {
    innerWidth: vw,
    scrollWidth: doc.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    horizontalScroll: doc.scrollWidth > vw,
    offenders: offenders.slice(0, 15),
    targets,
    lime,
    lenis: doc.classList.contains("lenis"),
    heroHeight: Math.round(document.querySelector("header").getBoundingClientRect().height),
    navRect: (() => { const r = document.querySelector("nav > div").getBoundingClientRect(); return { left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width) }; })(),
  };
}

(async () => {
  const browser = await chromium.launch();
  const results = {};
  for (const v of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: v.width, height: v.height },
      deviceScaleFactor: v.dpr,
      hasTouch: v.touch,
      isMobile: v.touch && v.width < 1024,
      reducedMotion: v.reduced ? "reduce" : "no-preference",
    });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500); // hero sequence ends at ~2.0s (sign 900ms + 1.1s)
    await page.screenshot({ path: path.join(OUT, `home-${v.name}.png`) });
    const m = await page.evaluate(measure);

    if (v.reduced) {
      m.reducedMotion = await page.evaluate(() => {
        const q = (s) => document.querySelector(s);
        const anim = (el) => { const cs = getComputedStyle(el); return { name: cs.animationName, duration: cs.animationDuration, timeline: cs.animationTimeline }; };
        const words = [...document.querySelectorAll("#about .word")];
        return {
          lenis: document.documentElement.classList.contains("lenis"),
          heroRise: anim(q(".hero-rise")),
          heroDevelop: anim(q(".hero-develop")),
          marquee: anim(q(".marquee")),
          aboutWordOpacityMin: Math.min(...words.map((w) => +getComputedStyle(w).opacity)),
          runningAnimations: document.getAnimations().map((a) => ({ id: a.animationName || a.constructor.name, state: a.playState, duration: a.effect?.getTiming().duration })).slice(0, 20),
        };
      });
    } else if (v.name === "360x740") {
      // About word reveal state before scrolling to it (motion on).
      m.aboutWordOpacityMin = await page.evaluate(() => Math.min(...[...document.querySelectorAll("#about .word")].map((w) => +getComputedStyle(w).opacity)));
    }

    // Full-page capture: scroll through so scroll-linked reveals settle, then shoot.
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } window.scrollTo(0, 0); });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, `home-${v.name}-full.png`), fullPage: true });
    results[v.name] = m;
    await ctx.close();
  }

  // Keyboard pass at 360 and 1280: tab order + focus ring + screenshots of first stops.
  for (const v of [VIEWPORTS[1], VIEWPORTS[6]]) {
    const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    const stops = [];
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return { tag: el.tagName.toLowerCase(), text: (el.textContent || el.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 40), outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`, offset: cs.outlineOffset, inView: r.top >= 0 && r.bottom <= innerHeight, w: Math.round(r.width), h: Math.round(r.height) };
      });
      if (!info) break;
      stops.push(info);
      if (i < 6 || info.text.startsWith("Abroadly") || info.text.startsWith("GitHub")) {
        await page.waitForTimeout(250);
        await page.screenshot({ path: path.join(OUT, `focus-${v.name}-${String(i + 1).padStart(2, "0")}.png`) });
      }
    }
    results[`keyboard-${v.name}`] = stops;
    await ctx.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT, "..", "audit-results.json"), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 1));
})();
