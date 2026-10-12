// Phase 1 audit: screenshots (WebP) + per page x viewport measurements.
const C = require("./common");
const sharp = require("sharp");
const fs = require("fs"), path = require("path");
const OUT = process.argv[2]; const JSON_OUT = process.argv[3];
fs.mkdirSync(OUT, { recursive: true });
const FULL = new Set(["360x740", "768x1024", "1440x900"]);
const only = process.env.ONLY ? process.env.ONLY.split(",") : null;

function measure() {
  const vw = innerWidth, doc = document.documentElement;
  const shown = (el) => { const r = el.getBoundingClientRect(); if (r.width === 0 || r.height === 0) return false; const cs = getComputedStyle(el); return cs.visibility !== "hidden" && !el.closest("[inert]"); };
  const offenders = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.right <= vw + 0.5) continue;
    if (getComputedStyle(el).position === "fixed") continue;
    let clipped = false;
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const ox = getComputedStyle(p).overflowX; if ((ox === "hidden" || ox === "clip" || ox === "auto" || ox === "scroll") && p.getBoundingClientRect().right <= vw + 0.5) { clipped = true; break; } if (getComputedStyle(p).position === "fixed") { clipped = true; break; } }
    if (!clipped) offenders.push({ tag: el.tagName.toLowerCase(), cls: String(el.className?.baseVal ?? el.className ?? "").slice(0, 60), right: Math.round(r.right) });
  }
  const sel = 'a[href], button, summary, input:not([type=hidden]), textarea, select, [tabindex]:not([tabindex="-1"])';
  const seen = new Set(); const targets = [];
  for (let el of document.querySelectorAll(sel)) {
    if (el.closest(".f-hp,[aria-hidden=true]") && el.tagName !== "INPUT") continue;
    if (el.closest(".f-hp")) continue;
    if (el.matches("input[type=radio],input[type=checkbox]")) el = el.closest("label") || el;
    if (el.matches(".f-tile-link")) el = el.closest(".f-tile") || el;
    if (el.matches("main,[role=dialog],ul")) continue; // tabindex=-1 main / scroll rows
    if (seen.has(el) || !shown(el)) continue; seen.add(el);
    const r = el.getBoundingClientRect();
    const absTop = r.top + scrollY;
    if (r.right < 0 || r.left > vw || absTop + r.height < 0) continue;
    targets.push({ el, r, text: (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40), absTop });
  }
  const small = targets.filter((t) => t.r.width < 43.5 || t.r.height < 43.5).map((t) => ({ text: t.text, tag: t.el.tagName.toLowerCase(), w: Math.round(t.r.width * 10) / 10, h: Math.round(t.r.height * 10) / 10, y: Math.round(t.absTop) }));
  const close = [];
  for (let i = 0; i < targets.length; i++) for (let j = i + 1; j < targets.length; j++) {
    const a = targets[i], b = targets[j];
    if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
    const A = { l: a.r.left, r: a.r.right, t: a.absTop, b: a.absTop + a.r.height }, B = { l: b.r.left, r: b.r.right, t: b.absTop, b: b.absTop + b.r.height };
    const dx = Math.max(0, B.l - A.r, A.l - B.r), dy = Math.max(0, B.t - A.b, A.t - B.b);
    const d = Math.hypot(dx, dy);
    if (d < 7.5) close.push({ a: a.text, b: b.text, gap: Math.round(d * 10) / 10, overlap: dx === 0 && dy === 0 });
  }
  const inputs = [...document.querySelectorAll("input:not([type=hidden]):not([type=radio]),textarea,select")].filter((e) => !e.closest(".f-hp")).map((e) => ({ id: e.id, fs: parseFloat(getComputedStyle(e).fontSize) })).filter((x) => x.fs < 16);
  const parse = (c) => { const m = c.match(/[\d.]+/g); return m ? m.map(Number) : null; };
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const [h, l] = [lum(a), lum(b)].sort((x, y) => y - x); return (h + 0.05) / (l + 0.05); };
  const bgOf = (el) => { for (let p = el; p; p = p.parentElement) { const c = parse(getComputedStyle(p).backgroundColor); if (c && (c.length < 4 || c[3] > 0)) return c.slice(0, 3); } return [235, 238, 224]; };
  const lime = [];
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el); const c = parse(cs.color);
    if (!c || !(c[0] === 210 && c[1] === 255 && c[2] === 0)) continue;
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    if (!shown(el)) continue;
    const bg = bgOf(el); lime.push({ text: el.textContent.trim().slice(0, 30), bg: bg.join(","), ratio: Math.round(ratio(c, bg) * 100) / 100 });
  }
  const heads = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter((h) => h.getBoundingClientRect().width > 0 || h.classList.contains("sr-only")).map((h) => +h.tagName[1]);
  const skips = []; for (let i = 1; i < heads.length; i++) if (heads[i] > heads[i - 1] + 1) skips.push(`h${heads[i - 1]}->h${heads[i]}`);
  return {
    vw, scrollWidth: doc.scrollWidth, hScroll: doc.scrollWidth > vw, offenders: offenders.slice(0, 10),
    targets: targets.length, small, close: close.slice(0, 12), inputs, lime,
    h1: document.querySelectorAll("h1").length, mains: document.querySelectorAll("main").length,
    headingSkips: skips, imgNoAlt: document.querySelectorAll("img:not([alt])").length,
    lenis: doc.classList.contains("lenis"), hm: !!document.querySelector(".f-hm"),
    title: document.title, height: doc.scrollHeight,
  };
}

(async () => {
  const browser = await C.chromium.launch();
  const results = {};
  for (const v of C.VIEWPORTS) {
    const ctx = await browser.newContext(C.ctxOpts(v, 1));
    await C.skipPreloader(ctx);
    for (const p of C.PAGES) {
      if (only && !only.includes(p.id)) continue;
      const page = await ctx.newPage();
      const errors = [];
      page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 160)); });
      page.on("pageerror", (e) => errors.push("pageerror " + e.message.slice(0, 160)));
      const resp = await page.goto(C.BASE + p.path, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);
      await C.scrollThrough(page);
      await C.setState(page, p.state);
      const m = await page.evaluate(measure);
      m.status = resp.status(); m.errors = errors;
      const key = `${p.id}@${v.name}`; results[key] = m;
      const base = path.join(OUT, `${p.id}-${v.name}`);
      const shot = await page.screenshot();
      await sharp(shot).resize({ width: Math.min(720, v.width) }).webp({ quality: 72 }).toFile(base + ".webp");
      if (FULL.has(v.name) || p.state) {
        if (!p.state) await page.evaluate(() => window.scrollTo(0, 0));
        const full = await page.screenshot({ fullPage: true });
        await sharp(full, { limitInputPixels: false }).resize({ width: Math.min(480, v.width) }).webp({ quality: 55 }).toFile(base + "-full.webp");
      }
      console.log(key, m.status, "hScroll", m.hScroll, m.scrollWidth, "small", m.small.length, "close", m.close.length, "inputs<16", m.inputs.length, "lime", m.lime.length, "h1", m.h1, "lenis", m.lenis, "hm", m.hm, "err", errors.length);
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(JSON_OUT, JSON.stringify(results, null, 1));
})();
