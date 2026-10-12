// Keyboard-only pass: tab order, visible focus ring and its contrast against the surface, focus obscured by the fixed burger.
const C = require("./common");
const sharp = require("sharp");
const fs = require("fs"), path = require("path");
const SHOTS = process.argv[2]; const OUT = process.argv[3];
(async () => {
  const browser = await C.chromium.launch();
  const out = {};
  for (const v of [{ name: "1440x900", width: 1440, height: 900 }, { name: "360x740", width: 360, height: 740 }]) {
    const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height } }); await C.skipPreloader(ctx);
    for (const p of ["/", "/work", "/work/abroadly", "/about", "/contact"]) {
      const page = await ctx.newPage();
      await page.goto(C.BASE + p, { waitUntil: "networkidle" }); await page.waitForTimeout(3600);
      const stops = []; let shots = 0;
      for (let i = 0; i < 70; i++) {
        await page.keyboard.press("Tab"); await page.waitForTimeout(60);
        const info = await page.evaluate(() => {
          const el = document.activeElement; if (!el || el === document.body) return null;
          const ringEl = el.matches(".f-tile-link") ? el.closest(".f-tile") : el;
          const cs = getComputedStyle(ringEl);
          const parse = (c) => { const m = c.match(/[\d.]+/g); return m ? m.map(Number) : null; };
          const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
          const ratio = (a, b) => { const [h, l] = [lum(a), lum(b)].sort((x, y) => y - x); return (h + 0.05) / (l + 0.05); };
          const bgOf = (e) => { for (let q = e.parentElement; q; q = q.parentElement) { const c = parse(getComputedStyle(q).backgroundColor); if (c && (c.length < 4 || c[3] > 0)) return c.slice(0, 3); } return [235, 238, 224]; };
          const oc = parse(cs.outlineColor); const bg = bgOf(ringEl);
          const r = el.getBoundingClientRect(); const rr = ringEl.getBoundingClientRect();
          const bur = document.querySelector(".f-burger[data-shown] button"); let obscured = 0;
          if (bur && !el.closest(".f-burger")) { const b = bur.getBoundingClientRect(); const ox = Math.max(0, Math.min(r.right, b.right) - Math.max(r.left, b.left)), oy = Math.max(0, Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top)); obscured = Math.round((ox * oy) / Math.max(1, r.width * r.height) * 100); }
          return { tag: el.tagName.toLowerCase(), text: (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 36), outline: cs.outlineStyle === "none" ? "none" : `${cs.outlineWidth} ${cs.outlineColor}`, shadow: cs.boxShadow.slice(0, 40), ringVsBg: oc ? Math.round(ratio(oc, bg) * 100) / 100 : null, bg: bg.join(","), inView: r.top >= 0 && r.bottom <= innerHeight, obscuredPct: obscured, box: { x: Math.round(rr.left), y: Math.round(rr.top), w: Math.round(rr.width), h: Math.round(rr.height) }, borderB: el.matches("input,textarea") ? cs.borderBottomWidth + " " + cs.borderBottomColor : undefined };
        });
        if (!info) { stops.push({ end: "body" }); break; }
        if (stops.length && stops[0].text === info.text && stops[0].tag === info.tag && i > 3) break; // wrapped
        stops.push(info);
        const interesting = i < 3 || /Abroadly|About me|Get in touch|Copy email|Send message|Full-time|Machine learning|DOI|Details|List|Live|Next|What/.test(info.text) || info.tag === "input" || info.tag === "textarea";
        if (interesting && shots < 7) {
          const b = info.box; const pad = 40;
          const clip = { x: Math.max(0, b.x - pad), y: Math.max(0, b.y - pad), width: Math.min(v.width - Math.max(0, b.x - pad), b.w + pad * 2), height: Math.min(v.height - Math.max(0, b.y - pad), b.h + pad * 2) };
          if (clip.width > 10 && clip.height > 10 && b.y >= 0) {
            const buf = await page.screenshot({ clip });
            await sharp(buf).resize({ width: Math.min(560, Math.round(clip.width)), withoutEnlargement: true }).webp({ quality: 70 }).toFile(path.join(SHOTS, `focus-${v.name}-${p === "/" ? "home" : p.replace(/\//g, "_").slice(1)}-${String(i + 1).padStart(2, "0")}.webp`));
            shots++;
          }
        }
      }
      out[`${p}@${v.name}`] = stops;
      const bad = stops.filter((s) => s.outline === "none" && !s.borderB && !s.shadow?.includes("rgb"));
      const low = stops.filter((s) => s.ringVsBg !== null && s.ringVsBg < 3 && s.outline !== "none");
      console.log(`${p}@${v.name}`, "stops", stops.length, "noRing", JSON.stringify(bad.map((s) => s.text)), "ring<3:1", JSON.stringify(low.map((s) => `${s.text} ${s.ringVsBg} on ${s.bg}`)), "offscreen", stops.filter((s) => s.inView === false).length, "obscured", JSON.stringify(stops.filter((s) => s.obscuredPct > 0).map((s) => `${s.text} ${s.obscuredPct}%`)));
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
})();
