// Drives the real contact form (Folio /contact) and reports what the Server Action answered.
// Usage: node contact.cjs <base> <scenario-json-file>
// Each scenario: { label, xff?, token?: string|null, name, email, intent, message, website? , raw?: {field: value} }
const { chromium } = require("d:/VacationCodes/focus/experiement/node_modules/playwright");
const fs = require("fs");
const base = process.argv[2];
const scenarios = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));

(async () => {
  const browser = await chromium.launch();
  let captured = null;
  for (const sc of scenarios) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    if (sc.xff) await ctx.setExtraHTTPHeaders({ "x-forwarded-for": sc.xff });
    const page = await ctx.newPage();
    await page.goto(base + "/contact", { waitUntil: "networkidle" });
    // Fill through the DOM so values bypass maxLength (server must validate on its own).
    await page.evaluate((sc) => {
      const form = document.querySelector("form.f-contact-form");
      const set = (name, value) => {
        let el = form.querySelector(`[name="${name}"]:not([type=radio])`);
        if (!el) { el = document.createElement("input"); el.type = "hidden"; el.name = name; form.appendChild(el); }
        el.removeAttribute("maxlength");
        el.value = value;
      };
      set("name", sc.name ?? "");
      set("email", sc.email ?? "");
      set("message", sc.message ?? "");
      if (sc.website) set("website", sc.website);
      const radio = form.querySelector(`input[type=radio][value="${sc.intent}"]`);
      if (radio) radio.checked = true;
      else if (sc.intent) set("intent", sc.intent);
      if (sc.token !== null && sc.token !== undefined) set("cf-turnstile-response", sc.token);
    }, sc);
    const respP = page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/contact"), { timeout: 30000 });
    await page.locator('form.f-contact-form button[type="submit"]').click();
    const resp = await respP;
    if (!captured) {
      captured = { headers: resp.request().headers(), body: resp.request().postData()?.slice(0, 1500) };
      fs.writeFileSync(process.argv[3] + ".request.json", JSON.stringify(captured, null, 2));
    }
    const text = await resp.text();
    // The action's return value is serialised in the RSC payload; pull the state object out.
    const m = text.match(/\{"status":"(success|error|idle)".*?\}(?=\n|$)/s);
    let summary = m ? m[0] : text.slice(-400);
    summary = summary.replace(/\s+/g, " ").slice(0, 500);
    console.log(`[${sc.label}] HTTP ${resp.status()} :: ${summary}`);
    await ctx.close();
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
