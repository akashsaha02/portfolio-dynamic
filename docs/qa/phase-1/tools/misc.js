const C = require("./common"); const sharp = require("sharp"); const path = require("path");
const SH = process.argv[2];
(async () => {
  const b = await C.chromium.launch();
  for (const v of [C.VIEWPORTS[1], C.VIEWPORTS[7]]) {
    const ctx = await b.newContext(C.ctxOpts(v)); const p = await ctx.newPage(); const errs = []; p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
    await p.goto("http://localhost:3600/", { waitUntil: "networkidle" }); await p.waitForTimeout(2500);
    await sharp(await p.screenshot()).resize({ width: 720, withoutEnlargement: true }).webp({ quality: 70 }).toFile(path.join(SH, `editorial-home-${v.name}.webp`));
    console.log("editorial", v.name, await p.evaluate(() => ({ h1: document.querySelectorAll("h1").length, sw: document.documentElement.scrollWidth, vw: innerWidth, tpl: !!document.querySelector(".tpl-folio") })), errs);
    await ctx.close();
  }
  const v = C.VIEWPORTS[9]; const ctx = await b.newContext(C.ctxOpts(v)); await C.skipPreloader(ctx); const p = await ctx.newPage();
  await p.goto(C.BASE + "/", { waitUntil: "networkidle" });
  const before = await p.evaluate(() => ({ armed: document.querySelector(".f-reveal").hasAttribute("data-armed") }));
  await C.scrollThrough(p);
  const r = await p.evaluate(() => ({ armed: document.querySelector(".f-reveal").hasAttribute("data-armed"), wordTransform: getComputedStyle(document.querySelector(".f-reveal .f-w > span")).transform, globe: getComputedStyle(document.querySelector(".f-globe-m")).animationName, running: document.getAnimations().map((a) => a.animationName || a.constructor.name) }));
  console.log("reduced", JSON.stringify(before), JSON.stringify(r));
  // motion on: reveal armed below fold?
  const c2 = await b.newContext(C.ctxOpts(C.VIEWPORTS[1])); await C.skipPreloader(c2); const p2 = await c2.newPage();
  await p2.goto(C.BASE + "/", { waitUntil: "networkidle" }); await p2.waitForTimeout(500);
  const a = await p2.evaluate(() => ({ armed: document.querySelector(".f-reveal").hasAttribute("data-armed"), t: getComputedStyle(document.querySelector(".f-reveal .f-w > span")).transform }));
  await p2.locator(".f-reveal").scrollIntoViewIfNeeded(); await p2.waitForTimeout(1600);
  const a2 = await p2.evaluate(() => ({ in: document.querySelector(".f-reveal").hasAttribute("data-in"), t: getComputedStyle(document.querySelector(".f-reveal .f-w > span:last-child")).transform, lastWordT: [...document.querySelectorAll(".f-reveal .f-w > span")].at(-1).style.cssText }));
  console.log("motion reveal", JSON.stringify(a), JSON.stringify(a2));
  await b.close();
})();
