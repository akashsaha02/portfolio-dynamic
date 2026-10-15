const { chromium } = require("d:/VacationCodes/focus/experiement/node_modules/playwright");
(async () => {
  const b = await chromium.launch(); 
  for (const path of ["/", "/contact", "/work/abroadly"]) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage();
    const js = []; const api = [];
    p.on("response", async (r) => { const u = r.url(); if (u.endsWith(".js") || u.includes(".js?")) { const buf = await r.body().catch(() => Buffer.alloc(0)); js.push([u.split("/").pop(), buf.length, buf.includes("BLOB_READ_WRITE_TOKEN") || buf.includes("payloadcms")]); } if (u.includes("/api/")) api.push(u); });
    await p.goto("http://localhost:3650" + path, { waitUntil: "networkidle" });
    console.log(path, "js files:", js.length, "total bytes:", js.reduce((a, x) => a + x[1], 0), "payload-ish chunks:", js.filter((x) => x[2]).map((x) => x[0]).join(",") || "none", "api calls:", api.length);
    await ctx.close();
  }
  await b.close();
})();
