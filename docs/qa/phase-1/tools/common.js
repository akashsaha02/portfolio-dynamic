const { chromium, webkit } = require("playwright");
exports.chromium = chromium; exports.webkit = webkit;
exports.BASE = process.env.BASE || "http://localhost:3601";
exports.VIEWPORTS = [
  { name: "320x640", width: 320, height: 640, touch: true, mobile: true },
  { name: "360x740", width: 360, height: 740, touch: true, mobile: true },
  { name: "390x844", width: 390, height: 844, touch: true, mobile: true },
  { name: "414x896", width: 414, height: 896, touch: true, mobile: true },
  { name: "768x1024", width: 768, height: 1024, touch: true, mobile: true },
  { name: "1024x1366-touch", width: 1024, height: 1366, touch: true, mobile: false },
  { name: "1280x800", width: 1280, height: 800, touch: false },
  { name: "1440x900", width: 1440, height: 900, touch: false },
  { name: "740x360-land", width: 740, height: 360, touch: true, mobile: true },
  { name: "360x740-rm", width: 360, height: 740, touch: true, mobile: true, reduced: true },
  { name: "1440x900-rm", width: 1440, height: 900, touch: false, reduced: true },
];
exports.PAGES = [
  { id: "home", path: "/" },
  { id: "work", path: "/work" },
  { id: "work-ml", path: "/work?type=ml" },
  { id: "abroadly", path: "/work/abroadly" },
  { id: "nook", path: "/work/nook" },
  { id: "about", path: "/about" },
  { id: "contact", path: "/contact" },
  { id: "contact-error", path: "/contact", state: "error" },
  { id: "contact-success", path: "/contact", state: "success" },
  { id: "404", path: "/nope" },
];
exports.ctxOpts = (v, dpr = 1) => ({
  viewport: { width: v.width, height: v.height }, deviceScaleFactor: dpr,
  hasTouch: !!v.touch, isMobile: !!v.mobile, reducedMotion: v.reduced ? "reduce" : "no-preference",
});
// Skip the preloader for everything except the preloader probe.
exports.skipPreloader = (ctx) => ctx.addInitScript(() => { try { sessionStorage.setItem("folio:preloader", "1"); } catch {} });
exports.scrollThrough = async (page) => {
  await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 350) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 70)); } window.scrollTo(0, document.documentElement.scrollHeight); await new Promise((r) => setTimeout(r, 300)); window.scrollTo(0, 0); });
  await page.waitForTimeout(700);
};
exports.setState = async (page, state) => {
  if (!state) return;
  if (state === "error") {
    await page.fill("#contact-email", "not-an-email");
    await page.click("button[type=submit]");
    await page.waitForSelector(".f-contact-summary", { timeout: 8000 });
  } else if (state === "success") {
    await page.fill("#contact-name", "QA Tester");
    await page.fill("#contact-email", "qa@example.com");
    await page.check("#contact-intent-freelance", { force: true });
    await page.fill("#contact-message", "Hello, this is the QA gate checking the form.");
    await page.click("button[type=submit]");
    await page.waitForSelector(".f-contact-sent", { timeout: 8000 });
  }
  await page.waitForTimeout(400);
};
