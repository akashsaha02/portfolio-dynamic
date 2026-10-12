// Image variants requested per page at 360@3 (touch) and 1440@2 (fine pointer, incl. idle-mounted hover modal).
const C = require("./common");
const fs = require("fs");
const OUT = process.argv[2];
(async () => {
  const browser = await C.chromium.launch();
  const out = {}; const all = new Map();
  for (const v of [{ name: "360@3", width: 360, height: 740, touch: true, mobile: true, dpr: 3 }, { name: "1440@2", width: 1440, height: 900, dpr: 2 }]) {
    const ctx = await browser.newContext(C.ctxOpts(v, v.dpr)); await C.skipPreloader(ctx);
    for (const p of C.PAGES.filter((x) => !x.state)) {
      const page = await ctx.newPage(); const reqs = [];
      page.on("request", (r) => { if (r.resourceType() !== "image") return; const u = new URL(r.url()); if (u.pathname === "/_next/image") reqs.push({ src: u.searchParams.get("url"), w: +u.searchParams.get("w"), q: +u.searchParams.get("q") }); else reqs.push({ raw: u.pathname + u.search }); });
      await page.goto(C.BASE + p.path, { waitUntil: "networkidle" }); await page.waitForTimeout(3600);
      await C.scrollThrough(page); await page.waitForTimeout(800);
      const srcQuery = await page.evaluate(() => [...document.querySelectorAll("img")].map((i) => { const s = i.getAttribute("src") || ""; const m = s.match(/url=([^&]+)/); return m ? decodeURIComponent(m[1]) : s; }).filter((s) => s.includes("?")));
      const uniq = [...new Map(reqs.map((r) => [JSON.stringify(r), r])).values()];
      out[`${p.id}@${v.name}`] = { requests: uniq, srcWithQuery: srcQuery };
      for (const r of uniq) if (r.src) { const k = `${r.src} w${r.w} q${r.q}`; all.set(k, (all.get(k) || new Set()).add(`${p.id}@${v.name}`)); }
      console.log(`${p.id}@${v.name}`, uniq.map((r) => r.src ? `${r.src.replace("/projects/", "")}@${r.w}q${r.q}` : `RAW ${r.raw}`).join("  "), srcQuery.length ? "QUERY " + srcQuery : "");
      await page.close();
    }
    await ctx.close();
  }
  out.__distinct = [...all.entries()].map(([k, s]) => `${k}  <- ${[...s].join(",")}`).sort();
  console.log("\nDISTINCT (source, width, quality):", all.size); for (const l of out.__distinct) console.log(" ", l);
  await browser.close();
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
})();
