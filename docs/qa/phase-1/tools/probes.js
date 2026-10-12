// Behaviour probes: preloader, hover modal, transitions, focus, menu, scroll restoration, aria-current,
// footer variant, 404, marquee, burger threshold.
const C = require("./common");
const sharp = require("sharp");
const fs = require("fs"), path = require("path");
const SHOTS = process.argv[2]; const OUT = process.argv[3];
const PART = process.env.PART || "ABCDG";
const R = {};
const log = (k, v) => { R[k] = v; console.log(k, JSON.stringify(v).slice(0, 700)); };
const V = Object.fromEntries(C.VIEWPORTS.map((v) => [v.name, v]));
const shot = async (page, name, clip) => { const b = await page.screenshot(clip ? { clip } : {}); await sharp(b).resize({ width: 720, withoutEnlargement: true }).webp({ quality: 72 }).toFile(path.join(SHOTS, name + ".webp")); };
const isGsapChunk = async (u) => { try { const t = await (await fetch(C.BASE + "/_next/static/chunks/" + u)).text(); return /GreenSock/.test(t); } catch { return false; } };

(async () => {
  const browser = await C.chromium.launch();
  const lcpInit = () => { window.__lcp = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp.push({ t: Math.round(e.startTime), el: e.element ? (e.element.tagName + "." + String(e.element.className).slice(0, 30) + " " + (e.element.textContent || e.element.getAttribute("alt") || "").slice(0, 30)) : null, size: e.size }); }).observe({ type: "largest-contentful-paint", buffered: true }); };

  // ---- A. Preloader
  if (PART.includes("A")) for (const vn of ["360x740", "1440x900"]) {
    const v = V[vn];
    const ctx = await browser.newContext(C.ctxOpts(v));
    await ctx.addInitScript(lcpInit);
    const page = await ctx.newPage();
    await page.goto(C.BASE + "/", { waitUntil: "commit" });
    const samples = [];
    let shotTaken = false;
    for (let i = 0; i < 100; i++) {
      const s = await page.evaluate(() => { const p = document.getElementById("f-pre"); const c = p && p.querySelector(".f-pre-curve"); return { t: Math.round(performance.now()), run: p ? p.hasAttribute("data-run") : null, sw: document.documentElement.scrollWidth, curveR: c ? Math.round(c.getBoundingClientRect().right) : null, word: p ? [...p.querySelectorAll(".f-pre-word")].findIndex((w) => getComputedStyle(w).opacity === "1") : null }; }).catch(() => null);
      if (s) samples.push(s);
      if (s && s.run && !shotTaken && s.t > 450) { await shot(page, `preloader-${vn}`); shotTaken = true; }
      if (s && s.run === false && samples.some((x) => x.run)) break;
      await page.waitForTimeout(30);
    }
    const runS = samples.filter((s) => s.run);
    await page.waitForTimeout(1500);
    const lcp = await page.evaluate(() => window.__lcp);
    const endIdx = samples.findIndex((s, i) => i > 0 && s.run === false && samples[i - 1].run);
    log(`preloader.first.${vn}`, { firstSample: samples[0]?.t, ranFrom: runS[0]?.t, endedAt: endIdx >= 0 ? samples[endIdx].t : null, maxScrollWidth: Math.max(...samples.map((s) => s.sw)), vw: v.width, curveRight: runS[0]?.curveR, wordsSeen: [...new Set(runS.map((s) => s.word))], lcp });
    await page.goto(C.BASE + "/", { waitUntil: "domcontentloaded" });
    log(`preloader.secondLoad.${vn}`, { run: await page.evaluate(() => document.getElementById("f-pre")?.hasAttribute("data-run")) });
    await ctx.close();
    for (const how of vn === "360x740" ? ["key", "tap"] : ["key", "wheel", "click"]) {
      const c2 = await browser.newContext(C.ctxOpts(v)); const p2 = await c2.newPage();
      await p2.goto(C.BASE + "/", { waitUntil: "commit" });
      await p2.waitForSelector("#f-pre[data-run]", { timeout: 3000, state: "attached" }).catch(() => {});
      await p2.waitForTimeout(250);
      const t0 = await p2.evaluate(() => performance.now());
      if (how === "key") await p2.keyboard.press("Space");
      if (how === "tap") await p2.touchscreen.tap(180, 400);
      if (how === "wheel") { await p2.mouse.move(700, 400); await p2.mouse.wheel(0, 200); }
      if (how === "click") await p2.mouse.click(700, 400);
      const end = await p2.waitForFunction(() => !document.getElementById("f-pre").hasAttribute("data-run"), null, { timeout: 4000, polling: 20 }).then(() => p2.evaluate(() => performance.now())).catch(() => null);
      log(`preloader.skip.${how}.${vn}`, { pressedAt: Math.round(t0), endedAt: end && Math.round(end), took: end && Math.round(end - t0), scrollYAfter: await p2.evaluate(() => scrollY), url: p2.url() });
      await c2.close();
    }
    const c3 = await browser.newContext(C.ctxOpts({ ...v, reduced: true })); const p3 = await c3.newPage();
    await p3.goto(C.BASE + "/", { waitUntil: "domcontentloaded" });
    log(`preloader.reduced.${vn}`, await p3.evaluate(() => ({ run: document.getElementById("f-pre")?.hasAttribute("data-run"), disp: getComputedStyle(document.getElementById("f-pre")).display, stored: sessionStorage.getItem("folio:preloader") })));
    await c3.close();
    const c4 = await browser.newContext(C.ctxOpts(v)); const p4 = await c4.newPage();
    await p4.goto(C.BASE + "/work", { waitUntil: "networkidle" });
    await p4.click("a.f-logo");
    await p4.waitForURL(C.BASE + "/");
    await p4.waitForTimeout(300);
    log(`preloader.softNavHome.${vn}`, await p4.evaluate(() => ({ run: document.getElementById("f-pre")?.hasAttribute("data-run"), disp: getComputedStyle(document.getElementById("f-pre")).display })));
    await c4.close();
  }

  // ---- B. Hover modal + GSAP loading
  if (PART.includes("B")) {
    const v = V["1440x900"]; const ctx = await browser.newContext(C.ctxOpts(v)); await C.skipPreloader(ctx);
    const page = await ctx.newPage();
    await page.goto(C.BASE + "/", { waitUntil: "load" });
    await page.waitForTimeout(3500);
    await page.locator(".f-recent-rows").scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const rows = page.locator(".f-recent-rows .f-row-link");
    const n = await rows.count();
    const box = await rows.nth(1).boundingBox();
    const px = box.x + box.width * 0.4, py = box.y + box.height / 2;
    await page.mouse.move(px, py, { steps: 8 });
    await page.waitForTimeout(1500);
    const st = await page.evaluate(([px, py]) => {
      const root = document.querySelector(".f-recent-rows .f-hm");
      const layers = [...root.querySelectorAll(".f-hm-layer")].map((l) => { const m = new DOMMatrix(getComputedStyle(l).transform); return { x: Math.round(m.e), y: Math.round(m.f) }; });
      const card = root.querySelector(".f-hm-card"); const label = root.querySelector(".f-hm-label"); const cur = root.querySelector(".f-hm-cursor");
      const rows = [...document.querySelectorAll(".f-recent-rows .f-row-link")].map((a) => getComputedStyle(a.firstElementChild).opacity);
      return { active: root.hasAttribute("data-active"), ariaHidden: root.getAttribute("aria-hidden"), layers, pointer: [Math.round(px), Math.round(py)], cardScale: new DOMMatrix(getComputedStyle(card).transform).a, label: label.textContent, labelScale: new DOMMatrix(getComputedStyle(label).transform).a, cursorBg: getComputedStyle(cur).backgroundColor, cursorSize: Math.round(cur.getBoundingClientRect().width), strip: getComputedStyle(root.querySelector(".f-hm-strip")).transform, rowsOpacity: rows, pe: getComputedStyle(root.querySelector(".f-hm-layer")).pointerEvents, imgs: [...root.querySelectorAll("img")].map((i) => decodeURIComponent(i.currentSrc.replace(/^.*url=/, "")).slice(0, 50)) };
    }, [px, py]);
    await shot(page, "hovermodal-home-1440x900");
    await page.mouse.move(box.x + box.width * 0.7, py + 10, { steps: 4 });
    await page.waitForTimeout(100);
    const mid = await page.evaluate(() => [...document.querySelectorAll(".f-recent-rows .f-hm-layer")].map((l) => Math.round(new DOMMatrix(getComputedStyle(l).transform).e)));
    await page.waitForTimeout(1300);
    const end = await page.evaluate(() => [...document.querySelectorAll(".f-recent-rows .f-hm-layer")].map((l) => Math.round(new DOMMatrix(getComputedStyle(l).transform).e)));
    const b3 = await rows.nth(3).boundingBox();
    await page.mouse.move(b3.x + 400, b3.y + b3.height / 2, { steps: 6 }); await page.waitForTimeout(1000);
    const strip3 = await page.evaluate(() => getComputedStyle(document.querySelector(".f-recent-rows .f-hm-strip")).transform);
    await shot(page, "hovermodal-home-row4-1440x900");
    await page.mouse.move(5, 5, { steps: 5 }); await page.waitForTimeout(900);
    const left = await page.evaluate(() => ({ active: document.querySelector(".f-recent-rows .f-hm").hasAttribute("data-active"), opac: [...document.querySelectorAll(".f-recent-rows .f-row-link")].map((a) => getComputedStyle(a.firstElementChild).opacity) }));
    log("hovermodal.home.1440", { rows: n, ...st, followMidX: mid, followEndX: end, targetX: Math.round(box.x + box.width * 0.7), stripRow4: strip3, afterLeave: left });
    await page.evaluate(() => document.querySelector(".f-recent-rows .f-row-link").focus());
    await page.keyboard.press("Tab");
    await page.waitForTimeout(800);
    log("hovermodal.keyboardDim.1440", await page.evaluate(() => ({ focused: document.activeElement.textContent.slice(0, 20), opac: [...document.querySelectorAll(".f-recent-rows .f-row-link")].map((a) => getComputedStyle(a.firstElementChild).opacity), modalActive: document.querySelector(".f-recent-rows .f-hm").hasAttribute("data-active") })));
    await page.goto(C.BASE + "/work", { waitUntil: "networkidle" });
    await page.waitForTimeout(3500);
    const wr = page.locator(".f-work-rows .f-row-link"); const wb = await wr.nth(2).boundingBox();
    await page.mouse.move(wb.x + 300, wb.y + wb.height / 2, { steps: 8 }); await page.waitForTimeout(1500);
    log("hovermodal.work.1440", await page.evaluate(() => { const r = document.querySelector(".f-work-rows .f-hm"); return { exists: !!r, active: r?.hasAttribute("data-active"), cardBg: r && getComputedStyle(r.querySelector(".f-hm-card")).backgroundColor, rowsOpacity: [...document.querySelectorAll(".f-work-rows .f-row-link")].map((a) => getComputedStyle(a.firstElementChild).opacity) }; }));
    await shot(page, "hovermodal-work-1440x900");
    await ctx.close();
    for (const vn of ["1024x1366-touch", "360x740", "1440x900-rm", "768x1024", "1440x900"]) {
      const v2 = V[vn]; const c2 = await browser.newContext(C.ctxOpts(v2)); await C.skipPreloader(c2);
      const p2 = await c2.newPage(); const js = []; p2.on("request", (r) => { if (r.resourceType() === "script") js.push(r.url().split("/").pop()); });
      await p2.goto(C.BASE + "/", { waitUntil: "networkidle" }); await p2.waitForTimeout(3500);
      await C.scrollThrough(p2);
      const gs = []; for (const u of [...new Set(js)]) if (await isGsapChunk(u)) gs.push(u);
      const timing = await p2.evaluate((g) => performance.getEntriesByType("resource").filter((e) => g.some((x) => e.name.endsWith(x))).map((e) => Math.round(e.startTime)), gs);
      const nav = await p2.evaluate(() => { const n = performance.getEntriesByType("navigation")[0]; return { load: Math.round(n.loadEventEnd), fcp: Math.round(performance.getEntriesByName("first-contentful-paint")[0]?.startTime) }; });
      log(`hovermodal.presence.${vn}`, await p2.evaluate(() => ({ hm: !!document.querySelector(".f-hm"), rowsDisplay: getComputedStyle(document.querySelector(".f-recent-rows")).display, tilesDisplay: getComputedStyle(document.querySelector(".f-recent-tiles")).display })));
      log(`gsapLoaded.${vn}`, { greensockChunks: gs, gsapStartMs: timing, ...nav, scripts: [...new Set(js)].length });
      await c2.close();
    }
  }

  // ---- C. Transitions, focus after nav, menu after transition, scroll restoration
  const vtInit = () => {
    window.__vt = [];
    const orig = document.startViewTransition && document.startViewTransition.bind(document);
    if (!orig) return;
    document.startViewTransition = (arg) => {
      const rec = { t0: Math.round(performance.now()) }; window.__vt.push(rec);
      const vt = orig(arg);
      vt.ready.then(() => { rec.anims = document.getAnimations().filter((a) => a.effect?.pseudoElement?.includes("view-transition")).map((a) => { const t = a.effect.getTiming(); return { pe: a.effect.pseudoElement, name: a.animationName, dur: t.duration, easing: t.easing }; }); }).catch((e) => (rec.err = String(e)));
      vt.finished.then(() => (rec.ms = Math.round(performance.now() - rec.t0))).catch(() => {});
      return vt;
    };
  };
  if (PART.includes("C")) {
    for (const vn of ["1440x900", "360x740", "1440x900-rm", "360x740-rm"]) {
      const v = V[vn]; const ctx = await browser.newContext(C.ctxOpts(v)); await C.skipPreloader(ctx); await ctx.addInitScript(vtInit);
      const page = await ctx.newPage();
      await page.goto(C.BASE + "/", { waitUntil: "networkidle" });
      if (v.width >= 768) await page.click("header nav a[href='/work']");
      else { await page.click("header button[aria-controls=folio-menu]"); await page.waitForTimeout(900); await page.click("#folio-menu a[href='/work']"); }
      await page.waitForURL(C.BASE + "/work"); await page.waitForTimeout(1000);
      log(`transition.home-to-work.${vn}`, await page.evaluate(() => ({ vt: window.__vt, active: document.activeElement === document.body ? "body" : document.activeElement.tagName + "#" + document.activeElement.id + " " + (document.activeElement.textContent || "").slice(0, 20), scrollY, title: document.title, menuOpen: document.getElementById("folio-menu").hasAttribute("data-open"), lock: document.documentElement.hasAttribute("data-folio-menu-open") })));
      await page.evaluate(() => window.scrollTo(0, 1400)); await page.waitForTimeout(800);
      const shown = await page.evaluate(() => document.querySelector(".f-burger").hasAttribute("data-shown"));
      const menu = { burgerShown: shown };
      if (shown) {
        await page.locator(".f-burger button").click(); await page.waitForTimeout(1000);
        menu.open = await page.evaluate(() => ({ dlg: document.getElementById("folio-menu").hasAttribute("data-open"), focus: document.activeElement.getAttribute("aria-label") || document.activeElement.textContent.slice(0, 20), expanded: document.querySelector(".f-burger button").getAttribute("aria-expanded"), htmlLock: document.documentElement.hasAttribute("data-folio-menu-open") }));
        const inside = []; for (let i = 0; i < 12; i++) { await page.keyboard.press("Tab"); inside.push(await page.evaluate(() => !!document.activeElement.closest("#folio-menu"))); }
        menu.tabStaysInside = inside.every(Boolean);
        await page.keyboard.press("Escape"); await page.waitForTimeout(1000);
        menu.afterEsc = await page.evaluate(() => ({ open: document.getElementById("folio-menu").hasAttribute("data-open"), focus: document.activeElement.getAttribute("aria-label") || document.activeElement.tagName }));
        if (vn === "360x740") await shot(page, "menu-after-transition-360x740");
      }
      log(`menuAfterTransition.${vn}`, menu);
      await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(300);
      const tile = page.locator("a[href='/work/abroadly']").filter({ visible: true }).first();
      await tile.focus(); await page.keyboard.press("Enter");
      await page.waitForURL(C.BASE + "/work/abroadly"); await page.waitForTimeout(1000);
      log(`focusAfterKeyboardNav.${vn}`, await page.evaluate(() => ({ active: document.activeElement === document.body ? "body" : document.activeElement.tagName + "#" + document.activeElement.id, scrollY, vtCount: window.__vt.length, last: window.__vt.at(-1) })));
      await page.keyboard.press("Tab");
      log(`firstTabAfterNav.${vn}`, await page.evaluate(() => document.activeElement.tagName + " " + (document.activeElement.textContent || "").trim().slice(0, 25)));
      await ctx.close();
    }
    for (const vn of ["360x740", "1440x900"]) {
      const v = V[vn]; const ctx = await browser.newContext(C.ctxOpts(v)); await C.skipPreloader(ctx);
      const page = await ctx.newPage();
      await page.goto(C.BASE + "/", { waitUntil: "networkidle" });
      const link = page.locator("a[href='/work/abroadly']").filter({ visible: true }).first();
      await link.scrollIntoViewIfNeeded(); await page.waitForTimeout(500);
      const y0 = await page.evaluate(() => Math.round(scrollY));
      await link.click(); await page.waitForURL(C.BASE + "/work/abroadly"); await page.waitForTimeout(1000);
      const y1 = await page.evaluate(() => Math.round(scrollY));
      await page.evaluate(() => window.scrollTo(0, 900)); await page.waitForTimeout(400);
      await page.goBack(); await page.waitForURL(C.BASE + "/"); await page.waitForTimeout(1300);
      const y2 = await page.evaluate(() => Math.round(scrollY));
      await page.goForward(); await page.waitForURL(C.BASE + "/work/abroadly"); await page.waitForTimeout(1300);
      const y3 = await page.evaluate(() => Math.round(scrollY));
      log(`scrollRestore.${vn}`, { homeBefore: y0, caseAfterClick: y1, homeAfterBack: y2, caseAfterForward_was900: y3 });
      await ctx.close();
    }
  }

  // ---- D/E/F. aria-current, footer variants, 404
  if (PART.includes("D")) {
    const v = V["1440x900"]; const ctx = await browser.newContext(C.ctxOpts(v)); await C.skipPreloader(ctx); const page = await ctx.newPage();
    for (const p of ["/", "/work", "/work/abroadly", "/about", "/contact", "/nope"]) {
      await page.goto(C.BASE + p, { waitUntil: "networkidle" });
      log(`page.${p}`, await page.evaluate(() => ({ bar: [...document.querySelectorAll("header a")].map((a) => `${a.getAttribute("href")}=${a.getAttribute("aria-current")}`).join(" "), menu: [...document.querySelectorAll("#folio-menu nav a")].map((a) => `${a.getAttribute("href")}=${a.getAttribute("aria-current")}`).join(" "), footer: { h2: document.querySelector("footer h2")?.textContent || null, contactLink: !!document.querySelector("footer a[href='/contact']"), copyEmail: !!document.querySelector("footer button"), height: Math.round(document.querySelector("footer").getBoundingClientRect().height), labelledby: document.querySelector("footer").getAttribute("aria-labelledby") }, title: document.title, desc: document.querySelector("meta[name=description]")?.content.slice(0, 50), ogImage: !!document.querySelector("meta[property='og:image']"), canonical: document.querySelector("link[rel=canonical]")?.href || null, h1: document.querySelector("h1")?.textContent, landmarks: { banner: document.querySelectorAll("header:not(main header):not(article header):not(section header)").length, main: document.querySelectorAll("main").length, contentinfo: document.querySelectorAll("footer").length, navs: [...document.querySelectorAll("nav")].map((n) => n.getAttribute("aria-label") || n.getAttribute("aria-labelledby")) } })));
    }
    const r404 = await page.goto(C.BASE + "/work/does-not-exist", { waitUntil: "networkidle" });
    log("404.caseStudy", { status: r404.status(), title: await page.title(), h1: await page.locator("h1").textContent(), robots: await page.locator("meta[name=robots]").getAttribute("content").catch(() => null) });
    const r2 = await page.goto(C.BASE + "/nope", { waitUntil: "networkidle" });
    log("404.catchAll", { status: r2.status(), title: await page.title(), robots: await page.locator("meta[name=robots]").getAttribute("content").catch(() => null), links: await page.locator("main nav a").evaluateAll((as) => as.map((a) => `${a.getAttribute("href")} ${Math.round(a.getBoundingClientRect().height)}`)) });
    await ctx.close();
  }

  // ---- G/H. Marquee + burger threshold at every width
  if (PART.includes("G")) for (const v of C.VIEWPORTS) {
    const ctx = await browser.newContext(C.ctxOpts(v)); await C.skipPreloader(ctx); const page = await ctx.newPage();
    await page.goto(C.BASE + "/", { waitUntil: "networkidle" }); await page.waitForTimeout(400);
    const m = await page.evaluate(() => {
      const mq = document.querySelector(".f-marquee"), tr = mq.querySelector(".f-marquee-track"), half = tr.firstElementChild, hero = document.querySelector("[data-folio-hero]"), img = hero.querySelector("img");
      const r = mq.getBoundingClientRect(), ir = img.getBoundingClientRect(), hr = hero.getBoundingClientRect(), role = document.querySelector(".f-hero-role").getBoundingClientRect();
      const a = tr.getAnimations()[0];
      return { fontPx: Math.round(parseFloat(getComputedStyle(mq).fontSize)), bandTop: Math.round(r.top), bandBottom: Math.round(r.bottom), halfW: Math.round(half.getBoundingClientRect().width), vw: innerWidth, gapRisk: half.getBoundingClientRect().width < innerWidth, anim: getComputedStyle(tr).animationName, playState: a?.playState ?? null, durS: a ? a.effect.getTiming().duration / 1000 : null, heroH: Math.round(hr.height), vh: innerHeight, portrait: { top: Math.round(ir.top), left: Math.round(ir.left), right: Math.round(ir.right), h: Math.round(ir.height) }, role: { top: Math.round(role.top), bottom: Math.round(role.bottom), left: Math.round(role.left), right: Math.round(role.right) }, roleOverPortrait: role.bottom > ir.top && role.right > ir.left && role.left < ir.right };
    });
    const heroBottom = await page.evaluate(() => { const h = document.querySelector("[data-folio-hero]"); return Math.round(h.getBoundingClientRect().bottom + scrollY); });
    let firstShown = null;
    for (let y = 0; y <= heroBottom + 200; y += 20) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(40); if (await page.evaluate(() => document.querySelector(".f-burger").hasAttribute("data-shown"))) { firstShown = y; break; } }
    const bz = await page.evaluate(() => { const b = document.querySelector(".f-burger button").getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height), top: Math.round(b.top), right: Math.round(innerWidth - b.right) }; });
    log(`marquee.${v.name}`, { ...m, burgerFirstShownAtScrollY: firstShown, heroBottom, burger: bz });
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(OUT, JSON.stringify(R, null, 1));
})();
