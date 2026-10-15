// Clean-DB first-register then logout then login, through the real admin UI.
const { chromium } = require("d:/VacationCodes/focus/experiement/node_modules/playwright");
const base = process.argv[2];
const email = "first-admin@example.com";
const password = "FirstRegister-QA-2026!";

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 } });
  const page = await ctx.newPage();
  const log = [];
  page.on("console", (m) => { if (m.type() === "error") log.push("console: " + m.text().slice(0, 200)); });
  page.on("response", (r) => { if (r.url().includes("/api/users")) log.push(`${r.request().method()} ${r.url().replace(base, "")} -> ${r.status()}`); });

  await page.goto(base + "/admin", { waitUntil: "networkidle" });
  log.push("landed: " + page.url().replace(base, ""));
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  const confirm = page.locator('input[name="confirm-password"]');
  if (await confirm.count()) await confirm.fill(password);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes("create-first-user"), { timeout: 20000 }).catch(() => log.push("did not leave create-first-user"));
  await page.waitForLoadState("networkidle");
  log.push("after register: " + page.url().replace(base, ""));
  const cookies = await ctx.cookies();
  log.push("cookies: " + JSON.stringify(cookies.map((c) => ({ name: c.name, httpOnly: c.httpOnly, sameSite: c.sameSite, secure: c.secure, expiresInH: Math.round((c.expires - Date.now() / 1000) / 360) / 10 }))));

  // Log out via REST then log back in through the UI.
  await page.goto(base + "/admin/logout", { waitUntil: "networkidle" });
  log.push("after logout: " + page.url().replace(base, ""));
  await page.goto(base + "/admin/login", { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.endsWith("/login"), { timeout: 20000 }).catch(() => log.push("did not leave login"));
  await page.waitForLoadState("networkidle");
  log.push("after login: " + page.url().replace(base, ""));
  const h = await page.locator("h1, h2").first().textContent().catch(() => "");
  log.push("first heading: " + h);
  await page.screenshot({ path: process.argv[3] });
  console.log(log.join("\n"));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
