const { chromium } = require("d:/VacationCodes/focus/experiement/node_modules/playwright");
const base = "http://localhost:3650";
async function order(p) { return p.evaluate(async () => (await (await fetch("/api/projects?sort=_order&limit=20&depth=0&draft=true")).json()).docs.map((d) => d.slug).join(",")); }
(async () => {
  const b = await chromium.launch();
  for (const mode of ["touch", "mouse"]) {
    const ctx = await b.newContext({ viewport: { width: 360, height: 740 }, hasTouch: mode === "touch", isMobile: mode === "touch" });
    const p = await ctx.newPage();
    await p.goto(base + "/admin/login"); await p.fill('input[name="email"]', "qa-admin@example.com"); await p.fill('input[name="password"]', "QaGate-Phase2-2026!"); await p.click('button[type="submit"]');
    await p.waitForURL((u) => !u.pathname.endsWith("/login")); await p.goto(base + "/admin/collections/projects"); await p.waitForTimeout(2500);
    const before = await order(p);
    const h = p.locator("tbody tr td.cell-_dragHandle .sort-row");
    const a = await h.nth(2).boundingBox(); const t = await h.nth(0).boundingBox();
    const sx = a.x + a.width / 2, sy = a.y + a.height / 2, ty = t.y + t.height / 2 - 10;
    if (mode === "mouse") {
      await p.mouse.move(sx, sy); await p.mouse.down(); await p.waitForTimeout(300);
      for (let i = 1; i <= 15; i++) { await p.mouse.move(sx, sy + ((ty - sy) * i) / 15); await p.waitForTimeout(30); }
      await p.mouse.up();
    } else {
      const cdp = await ctx.newCDPSession(p);
      const tp = (x, y) => [{ x, y, id: 1 }];
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: tp(sx, sy) });
      await p.waitForTimeout(400);
      for (let i = 1; i <= 15; i++) { await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: tp(sx, sy + ((ty - sy) * i) / 15) }); await p.waitForTimeout(30); }
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    }
    await p.waitForTimeout(3000);
    const after = await order(p);
    console.log(`${mode}: before=${before}\n${" ".repeat(mode.length)}  after =${after}  changed=${before !== after}`);
    await p.screenshot({ path: `shots/drag-${mode}.png` });
    await ctx.close();
  }
  await b.close();
})();
