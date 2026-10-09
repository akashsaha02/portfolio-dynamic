// Summarise Lighthouse runs: node lhsum.js <dirWith mobile-1..3.json desktop-1..3.json> <outJson>
const fs = require("fs"), path = require("path");
const dir = process.argv[2]; const out = {};
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
for (const ff of ["mobile", "desktop"]) {
  const runs = [1, 2, 3].map((i) => JSON.parse(fs.readFileSync(path.join(dir, `${ff}-${i}.json`))));
  const row = (r) => ({
    perf: Math.round(r.categories.performance.score * 100),
    a11y: Math.round(r.categories.accessibility.score * 100),
    bp: Math.round(r.categories["best-practices"].score * 100),
    seo: Math.round(r.categories.seo.score * 100),
    fcp: Math.round(r.audits["first-contentful-paint"].numericValue),
    lcp: Math.round(r.audits["largest-contentful-paint"].numericValue),
    cls: +r.audits["cumulative-layout-shift"].numericValue.toFixed(3),
    tbt: Math.round(r.audits["total-blocking-time"].numericValue),
    si: Math.round(r.audits["speed-index"].numericValue),
  });
  const rows = runs.map(row); const m = {};
  for (const k of Object.keys(rows[0])) m[k] = med(rows.map((r) => r[k]));
  const r0 = runs[1];
  const lcpItems = r0.audits["lcp-breakdown-insight"]?.details?.items || [];
  const fails = (cat) => r0.categories[cat].auditRefs.map((a) => r0.audits[a.id])
    .filter((a) => a.score !== null && a.score < 1 && !["informative", "manual", "notApplicable"].includes(a.scoreDisplayMode))
    .map((a) => `${a.id}: ${a.displayValue || a.score}`);
  const reqs = r0.audits["network-requests"].details.items;
  out[ff] = {
    lighthouse: r0.lighthouseVersion,
    runs: rows,
    median: m,
    lcpElement: lcpItems.find((i) => i.type === "node")?.snippet?.slice(0, 160),
    lcpPhases: Object.fromEntries((lcpItems.find((i) => i.type === "table")?.items || []).map((x) => [x.subpart, Math.round(x.duration)])),
    failingAudits: { perf: fails("performance"), a11y: fails("accessibility"), bp: fails("best-practices"), seo: fails("seo") },
    totalBytes: r0.audits["total-byte-weight"].numericValue,
    scriptTransferBytes: reqs.filter((i) => i.resourceType === "Script").reduce((s, i) => s + i.transferSize, 0),
    imagesAndFonts: reqs.filter((i) => i.resourceType === "Image" || i.resourceType === "Font").map((i) => `${i.url.replace("http://localhost:3300", "").slice(0, 110)} ${Math.round(i.transferSize / 1024)}KB`),
  };
}
console.log(JSON.stringify(out, null, 1));
fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 2));
