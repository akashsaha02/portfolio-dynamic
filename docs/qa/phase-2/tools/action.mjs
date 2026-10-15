// Direct Server Action replay for submitContact (no browser): node action.mjs <base> <scenarios.json>
import fs from "node:fs";
const base = process.argv[2];
const scenarios = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
const ACTION = process.env.ACTION_ID || "60376c4bc76c2b851065c11bdfc5f8c18df719c776";

export async function send(sc) {
  const fd = new FormData();
  const fields = { name: sc.name, email: sc.email, intent: sc.intent, message: sc.message, website: sc.website ?? "" };
  if (sc.token != null) fields["cf-turnstile-response"] = sc.token;
  Object.assign(fields, sc.raw || {});
  for (const [k, v] of Object.entries(fields)) if (v !== undefined) fd.append(`_1_${k}`, v);
  fd.append("0", JSON.stringify([{ status: "idle" }, "$K1"]));
  const headers = { "next-action": ACTION, accept: "text/x-component", ...(sc.headers || {}) };
  if (sc.xff) headers["x-forwarded-for"] = sc.xff;
  const res = await fetch(base + "/contact", { method: "POST", body: fd, headers });
  const text = await res.text();
  const m = text.match(/\{"status":"(success|error|idle)".*?\}(?=\n|$)/s);
  return `HTTP ${res.status} :: ${(m ? m[0] : text.slice(0, 300)).replace(/\s+/g, " ").slice(0, 420)}`;
}

for (const sc of scenarios) {
  const n = sc.repeat || 1;
  for (let i = 1; i <= n; i++) console.log(`[${sc.label}${n > 1 ? ` #${i}` : ""}] ${await send(sc)}`);
}
