// Admin on a phone/tablet: screenshots, horizontal scroll, tap targets, XSS dialogs, availability toggle.
// node admin-mobile.cjs <base> <outdir> <width> <height> <tag>
const { chromium } = require("d:/VacationCodes/focus/experiement/node_modules/playwright");
const [base, out, W, H, tag] = process.argv.slice(2);
const results = { tag, pages: {}, dialogs: [], consoleErrors: [], availability: {} };

async function audit(page, name) {
  await page.waitForTimeout(2000);
  const info = await page.evaluate(() => {
    const doc = document.documentElement;
    const overflowX = doc.scrollWidth - window.innerWidth;
    const offenders = [];
    const els = document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=checkbox], [role=tab]');
    let total = 0;
    for (const el of els) {
      const r = el.getBoundingClientRect();
      const st = getComputedStyle(el);
      if (r.width === 0 || r.height === 0 || st.visibility === "hidden" || st.display === "none") continue;
      if (r.bottom < 0 || r.top > window.innerHeight * 3 || r.right <= 0 || r.left >= window.innerWidth) continue;
      const cx=Math.min(Math.max(r.left+r.width/2,0),window.innerWidth-1), cy=r.top+r.height/2; if (cy<0||cy>=window.innerHeight) continue; const top=document.elementFromPoint(cx,cy); if (!top || !(top===el || el.contains(top) || top.contains(el) || (el.tagName==="INPUT" && el.labels && [...el.labels].some(l=>l.contains(top))))) continue; total++;
      if (r.width < 44 || r.height < 44) {
        const label = (el.getAttribute("aria-label") || el.textContent || el.getAttribute("name") || el.className || el.tagName).toString().trim().replace(/\s+/g, " ").slice(0, 40);
        offenders.push(`${el.tagName.toLowerCase()}[${Math.round(r.width)}x${Math.round(r.height)}] ${label}`);
      }
    }
    // Widest element that sticks out of the viewport, if any.
    let widest = null;
    if (overflowX > 0) {
      for (const el of document.querySelectorAll("body *")) {
        const r = el.getBoundingClientRect();
        if (r.right > window.innerWidth + 1 && (!widest || r.right > widest.right)) widest = { right: Math.round(r.right), cls: (el.className || el.tagName).toString().slice(0, 60) };
      }
    }
    return { overflowX, total, small: offenders.length, offenders: offenders.slice(0, 25), widest, h1: document.querySelector("h1")?.textContent?.trim().slice(0, 60) };
  });
  results.pages[name] = info;
  await page.screenshot({ path: `${out}/${tag}-${name}.png` });
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: +W, height: +H }, hasTouch: true, isMobile: +W < 600, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on("dialog", async (d) => { results.dialogs.push(`${d.type()}: ${d.message()}`); await d.dismiss(); });
  page.on("console", (m) => { if (m.type() === "error") results.consoleErrors.push(m.text().slice(0, 160)); });

  await page.goto(base + "/admin/login", { waitUntil: "load" });
  await audit(page, "login");
  await page.fill('input[name="email"]', "qa-admin@example.com");
  await page.fill('input[name="password"]', "QaGate-Phase2-2026!");
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.endsWith("/login"), { timeout: 30000 });
  await page.waitForLoadState("networkidle");
  await audit(page, "dashboard");
  await page.screenshot({ path: `${out}/${tag}-dashboard-full.png`, fullPage: true });

  // Availability toggle: Closed, then check the stored value and the widget after a reload.
  const closed = page.locator(".ak-segmented__btn--closed");
  if (await closed.count()) {
    const box = await closed.boundingBox();
    results.availability.buttonBox = box && `${Math.round(box.width)}x${Math.round(box.height)}`;
    await closed.click();
    await page.waitForFunction(() => document.querySelector(".ak-segmented__btn--closed")?.getAttribute("aria-pressed") === "true" && !document.querySelector(".ak-segmented[aria-busy=true]"), null, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1500);
    results.availability.statusText = await page.locator(".ak-widget__status").first().textContent();
    const api = await page.evaluate(async () => (await (await fetch("/api/globals/profile?depth=0")).json()).availability);
    results.availability.afterClosed = api;
    await page.reload({ waitUntil: "load" });
    results.availability.pressedAfterReload = await page.locator(".ak-segmented__btn--closed").getAttribute("aria-pressed");
    await page.locator(".ak-segmented__btn--open").click();
    await page.waitForTimeout(2500);
    results.availability.afterOpen = await page.evaluate(async () => (await (await fetch("/api/globals/profile?depth=0")).json()).availability);
  } else results.availability.error = "toggle not found";

  await page.goto(base + "/admin/collections/messages", { waitUntil: "load" });
  await audit(page, "messages-list");
  await page.goto(base + "/admin/collections/messages?where[read][equals]=false", { waitUntil: "load" });
  await audit(page, "messages-unread");
  // Open the stored-XSS message.
  const xssId = await page.evaluate(async () => {
    const j = await (await fetch("/api/messages?where[email][equals]=xss@example.com&depth=0")).json();
    return j.docs?.[0]?.id;
  });
  if (xssId) {
    await page.goto(`${base}/admin/collections/messages/${xssId}`, { waitUntil: "load" });
    await audit(page, "message-detail");
  }

  const projectId = await page.evaluate(async () => (await (await fetch("/api/projects?where[slug][equals]=abroadly&depth=0")).json()).docs[0].id);
  await page.goto(base + "/admin/collections/projects", { waitUntil: "load" });
  await audit(page, "projects-list");
  results.dragHandles = await page.evaluate(() => {
    const els = [...document.querySelectorAll('[class*="drag"], [class*="sort-row"], [aria-roledescription="sortable"], button[aria-label*="rag"]')];
    return els.slice(0, 6).map((el) => { const r = el.getBoundingClientRect(); return `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 50)} ${Math.round(r.width)}x${Math.round(r.height)}`; });
  });
  await page.goto(`${base}/admin/collections/projects/${projectId}`, { waitUntil: "load" });
  await audit(page, "project-edit");
  await page.screenshot({ path: `${out}/${tag}-project-edit-full.png`, fullPage: true });

  // Live preview toggle.
  const lp = page.locator('button:has-text("Live Preview"), [aria-label*="Live Preview" i], .live-preview-toggler, a[href*="preview"]').first();
  if (await lp.count()) {
    await lp.click().catch((e) => (results.livePreviewError = e.message.slice(0, 100)));
    await page.waitForTimeout(4000);
    const frames = page.frames().map((f) => f.url()).filter((u) => u && !u.startsWith("about:"));
    results.livePreview = { frames, iframe: await page.locator("iframe").count() };
    await audit(page, "live-preview");
  } else results.livePreview = "toggle not found";

  await page.goto(base + "/admin/collections/media/create", { waitUntil: "load" });
  await audit(page, "media-create");
  await page.goto(base + "/admin/globals/profile", { waitUntil: "load" });
  await audit(page, "profile");

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})().catch((e) => { console.error(e); console.log(JSON.stringify(results, null, 2)); process.exit(1); });
