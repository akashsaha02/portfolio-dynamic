// F-09/F-10/F-11 re-check at 360x740: exact sizes of our admin targets, live region state, list-only hint,
// and that the live-preview iframe actually rendered the site (not blocked by frame-ancestors).
const { chromium } = require("d:/VacationCodes/focus/experiement/node_modules/playwright");
const [base, out] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  const errs = []; p.on("console", (m) => m.type() === "error" && errs.push(m.text().slice(0, 160)));
  await p.goto(base + "/admin/login"); await p.fill('input[name="email"]', "qa-admin@example.com"); await p.fill('input[name="password"]', "QaGate-Phase2-2026!"); await p.click('button[type="submit"]');
  await p.waitForURL((u) => !u.pathname.endsWith("/login")); await p.waitForSelector(".ak-widget__foot a", { timeout: 30000 }); await p.waitForTimeout(1000);
  const sizes = (sel) => p.$$eval(sel, (els) => els.map((e) => { const r = e.getBoundingClientRect(); return `${(e.textContent || "").trim().slice(0, 30)} ${r.width.toFixed(1)}x${r.height.toFixed(1)}`; }));
  console.log("widget foot links:", (await sizes(".ak-widget__foot a")).join(" | "));
  console.log("segmented buttons:", (await sizes(".ak-segmented__btn")).join(" | "));
  const region = async () => p.$eval(".ak-widget__status", (e) => ({ role: e.getAttribute("role"), display: getComputedStyle(e).display, text: e.textContent, inA11yTree: e.getClientRects().length >= 0 && getComputedStyle(e).display !== "none" && getComputedStyle(e).visibility !== "hidden" }));
  console.log("live region idle:", JSON.stringify(await region()));
  // Record every text the live region takes while saving.
  await p.evaluate(() => { window.__seen = []; const el = document.querySelector(".ak-widget__status"); new MutationObserver(() => window.__seen.push(el.textContent)).observe(el, { childList: true, subtree: true, characterData: true }); });
  await p.locator(".ak-segmented__btn--limited").click();
  await p.waitForTimeout(2500);
  console.log("live region texts during save:", JSON.stringify(await p.evaluate(() => window.__seen)), "final:", JSON.stringify(await region()));
  await p.locator(".ak-segmented__btn--open").click(); await p.waitForTimeout(2500);
  await p.goto(base + "/admin/collections/messages", { waitUntil: "load" }); await p.waitForTimeout(2500);
  console.log("filter buttons:", (await sizes(".ak-filter__btn")).join(" | "));
  await p.goto(base + "/admin/collections/projects", { waitUntil: "load" }); await p.waitForTimeout(2500);
  console.log("projects list hint:", await p.locator(".ak-list-hint").count(), "| collection description elements:", await p.locator(".view-description, .custom-view-description").count());
  const id = await p.evaluate(async () => (await (await fetch("/api/projects?where[slug][equals]=abroadly&depth=0")).json()).docs[0].id);
  await p.goto(`${base}/admin/collections/projects/${id}`, { waitUntil: "load" }); await p.waitForTimeout(2500);
  console.log("project edit: hint present:", await p.locator(".ak-list-hint").count(), "| 'Drag rows' text on page:", await p.getByText("Drag rows to reorder").count());
  await p.screenshot({ path: `${out}/phone-project-edit-no-hint.png` });
  await p.locator('button:has-text("Live Preview"), [aria-label*="Live Preview" i], .live-preview-toggler').first().click();
  await p.waitForTimeout(4000);
  const frame = p.frames().find((f) => f.url().includes("/work/abroadly"));
  const fh1 = frame ? await frame.locator("h1").first().textContent().catch(() => "NO H1") : "NO FRAME";
  console.log("live preview frame url:", frame?.url(), "| frame h1:", fh1?.trim().slice(0, 60));
  await p.screenshot({ path: `${out}/phone-live-preview.png` });
  console.log("console errors:", JSON.stringify(errs));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
