// Admin reached on a host that is not in the CSRF allowlist (e.g. the LAN address `next start` prints).
const { chromium } = require("d:/VacationCodes/focus/experiement/node_modules/playwright");
const base = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 360, height: 740 } })).newPage();
  const log = []; p.on("response", (r) => r.url().includes("/api/users") && log.push(`${r.request().method()} ${new URL(r.url()).pathname} ${r.status()}`));
  await p.goto(base + "/admin/login", { waitUntil: "load" }); await p.waitForTimeout(1500);
  await p.fill('input[name="email"]', "qa-admin@example.com"); await p.fill('input[name="password"]', "QaGate-Phase2-2026!"); await p.click('button[type="submit"]');
  await p.waitForTimeout(5000);
  console.log("after login url:", p.url().replace(base, ""), "|", log.join(", "));
  await b.close();
})();
