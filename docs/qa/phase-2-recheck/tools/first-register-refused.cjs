// F-04: what a visitor sees when submitting create-first-user on a Vercel deployment with an empty DB.
const { chromium } = require("d:/VacationCodes/focus/experiement/node_modules/playwright");
const [base, shot] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 360, height: 740 } })).newPage();
  await p.goto(base + "/admin", { waitUntil: "networkidle" });
  await p.fill('input[name="email"]', "attacker@example.com");
  await p.fill('input[name="password"]', "Attacker-Pass-2026!");
  await p.fill('input[name="confirm-password"]', "Attacker-Pass-2026!");
  const resp = p.waitForResponse((r) => r.url().includes("/api/users/first-register"));
  await p.click('button[type="submit"]');
  console.log("first-register status:", (await resp).status());
  await p.waitForTimeout(1500);
  console.log("url:", p.url().replace(base, ""), "| toast:", (await p.locator(".toast, [data-sonner-toast], .payload-toast-container li").allTextContents()).join(" / ").slice(0, 200));
  await p.screenshot({ path: shot });
  await b.close();
})();
