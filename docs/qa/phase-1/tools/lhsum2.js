const fs = require("fs"), path = require("path");
const dir = process.argv[2]; const out = {};
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const names = [...new Set(fs.readdirSync(dir).map((f) => f.replace(/-\d\.json$/, "")))];
for (const n of names) {
  const runs = [1, 2, 3].map((i) => path.join(dir, `${n}-${i}.json`)).filter(fs.existsSync).map((f) => JSON.parse(fs.readFileSync(f)));
  const row = (r) => ({ perf: Math.round(r.categories.performance.score * 100), a11y: Math.round(r.categories.accessibility.score * 100), bp: Math.round(r.categories["best-practices"].score * 100), seo: Math.round(r.categories.seo.score * 100), fcp: Math.round(r.audits["first-contentful-paint"].numericValue), lcp: Math.round(r.audits["largest-contentful-paint"].numericValue), cls: +r.audits["cumulative-layout-shift"].numericValue.toFixed(3), tbt: Math.round(r.audits["total-blocking-time"].numericValue), si: Math.round(r.audits["speed-index"].numericValue) });
  const rows = runs.map(row); const m = {}; for (const k of Object.keys(rows[0])) m[k] = med(rows.map((r) => r[k]));
  const mi = rows.findIndex((r) => r.perf === m.perf); const r0 = runs[mi < 0 ? 0 : mi];
  const lcpI = r0.audits["lcp-breakdown-insight"]?.details?.items || [];
  const fails = (cat) => r0.categories[cat].auditRefs.map((a) => r0.audits[a.id]).filter((a) => a && a.score !== null && a.score < 1 && !["informative", "manual", "notApplicable"].includes(a.scoreDisplayMode)).map((a) => `${a.id}: ${a.displayValue || a.score}`);
  const reqs = r0.audits["network-requests"].details.items;
  out[n] = { runs: rows.map((r) => `${r.perf}/${r.a11y}/${r.lcp}/${r.cls}/${r.tbt}`), median: m, lcpElement: lcpI.find((i) => i.type === "node")?.snippet?.slice(0, 140), lcpPhases: Object.fromEntries((lcpI.find((i) => i.type === "table")?.items || []).map((x) => [x.subpart, Math.round(x.duration)])), fails: { perf: fails("performance"), a11y: fails("accessibility"), bp: fails("best-practices"), seo: fails("seo") }, totalKB: Math.round(r0.audits["total-byte-weight"].numericValue / 1024), scriptKB: Math.round(reqs.filter((i) => i.resourceType === "Script").reduce((s, i) => s + i.transferSize, 0) / 1024), scripts: reqs.filter((i) => i.resourceType === "Script").map((i) => i.url.split("/").pop() + " " + Math.round(i.transferSize / 1024)), imgFont: reqs.filter((i) => i.resourceType === "Image" || i.resourceType === "Font").map((i) => decodeURIComponent(i.url.replace(/^http:\/\/localhost:\d+/, "")).slice(0, 70) + " " + Math.round(i.transferSize / 1024) + "KB") };
}
console.log(JSON.stringify(out, null, 1));
fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 2));
