// axe on every page/state at 360 (touch) and 1440 (fine pointer), after a scroll-through, all impacts.
// Also: menu open at 360 and 1440 on Home.
const C = require("./common");
const { AxeBuilder } = require("@axe-core/playwright");
const fs = require("fs");
const OUT = process.argv[2];
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];
(async () => {
  const browser = await C.chromium.launch();
  const out = { scans: {} };
  const V = Object.fromEntries(C.VIEWPORTS.map((v) => [v.name, v]));
  for (const vn of ["360x740", "1440x900", "360x740-rm"]) {
    const v = V[vn];
    const ctx = await browser.newContext(C.ctxOpts(v)); await C.skipPreloader(ctx);
    for (const p of [...C.PAGES, { id: "home+menu", path: "/", menu: true }]) {
      if (vn.endsWith("-rm") && !["home", "contact-error", "work"].includes(p.id)) continue;
      const page = await ctx.newPage();
      await page.goto(C.BASE + p.path, { waitUntil: "networkidle" });
      await page.waitForTimeout(400);
      await C.scrollThrough(page);
      await C.setState(page, p.state);
      if (p.menu) { await page.locator(v.width >= 768 ? ".f-burger button" : "header button[aria-controls=folio-menu]").evaluate((b) => b.click()); await page.waitForTimeout(1000); }
      const res = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      out.axeVersion = res.testEngine.version;
      out.scans[`${p.id}@${vn}`] = {
        violations: res.violations.map((x) => ({ id: x.id, impact: x.impact, help: x.help, count: x.nodes.length, nodes: x.nodes.slice(0, 5).map((n) => ({ target: n.target.join(" "), html: n.html.slice(0, 140), summary: (n.failureSummary || "").split("\n").slice(0, 3).join(" ") })) })),
        incomplete: res.incomplete.map((x) => ({ id: x.id, count: x.nodes.length, nodes: x.nodes.slice(0, 3).map((n) => n.target.join(" ")) })),
        passes: res.passes.length,
      };
      const s = out.scans[`${p.id}@${vn}`];
      console.log(`${p.id}@${vn}`, "violations:", s.violations.map((x) => `${x.id}(${x.impact})x${x.count}`).join(", ") || "none", "| incomplete:", s.incomplete.map((x) => `${x.id}x${x.count}`).join(", "));
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
})();
