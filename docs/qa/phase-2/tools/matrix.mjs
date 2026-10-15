// Access-control matrix: anonymous vs admin, every collection/global and operation, via REST.
const B = process.argv[2] || "http://localhost:3650";
const LEAK = "QA-DRAFT-LEAK";

async function call(method, path, { token, body, headers = {} } = {}) {
  const h = { ...headers };
  if (token) h.Authorization = `JWT ${token}`;
  if (body !== undefined) h["Content-Type"] = "application/json";
  const res = await fetch(B + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body), redirect: "manual" });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }
  return { status: res.status, text, json };
}

const login = await call("POST", "/api/users/login", { body: { email: "qa-admin@example.com", password: "QaGate-Phase2-2026!" } });
const T = login.json.token;

// --- Draft fixtures ---
const projects = (await call("GET", "/api/projects?limit=100&depth=0", { token: T })).json.docs;
const abroadly = projects.find((p) => p.slug === "abroadly");
const nook = projects.find((p) => p.slug === "nook");
const draftNew = await call("POST", "/api/projects?draft=true", { token: T, body: { name: `${LEAK} new project`, slug: "qa-draft-only", kind: LEAK, summary: LEAK, year: "2026", url: "https://example.com", linkLabel: "x" } });
const draftId = draftNew.json?.doc?.id;
const draftEdit = await call("PATCH", `/api/projects/${abroadly.id}?draft=true`, { token: T, body: { summary: `${LEAK} draft summary of abroadly` } });
const linkNext = await call("PATCH", `/api/projects/${nook.id}`, { token: T, body: { nextProject: draftId, _status: "published" } });
console.log("fixtures:", { draftNew: draftNew.status, draftId, draftEdit: draftEdit.status, linkNext: linkNext.status });

const rows = [];
function row(target, op, anon, admin, note = "") { rows.push({ target, op, anon, admin, note }); }
const s = (r) => {
  const leak = r.text.includes(LEAK) ? " LEAK" : "";
  const n = r.json?.docs ? ` (${r.json.docs.length} docs)` : r.json?.totalDocs !== undefined ? ` (total ${r.json.totalDocs})` : "";
  return `${r.status}${n}${leak}`;
};

const ids = {};
for (const slug of ["projects", "experience", "publications", "skills", "education", "media", "messages", "users", "rate-limits", "payload-locked-documents", "payload-preferences", "payload-migrations"]) {
  const adminList = await call("GET", `/api/${slug}?limit=1&depth=0`, { token: T });
  ids[slug] = adminList.json?.docs?.[0]?.id;
}
// A message to probe with: created through trusted code would be ideal; use the seed-less path: none exist yet, so note it.
console.log("ids:", ids);

for (const slug of Object.keys(ids)) {
  const id = ids[slug] || "000000000000000000000000";
  const anonList = await call("GET", `/api/${slug}?limit=100&depth=2`);
  const admList = await call("GET", `/api/${slug}?limit=100&depth=0`, { token: T });
  row(slug, "list", s(anonList), s(admList));
  row(slug, "findByID", s(await call("GET", `/api/${slug}/${id}?depth=2`)), s(await call("GET", `/api/${slug}/${id}`, { token: T })));
  row(slug, "count", s(await call("GET", `/api/${slug}/count`)), s(await call("GET", `/api/${slug}/count`, { token: T })));
  row(slug, "versions", s(await call("GET", `/api/${slug}/versions`)), s(await call("GET", `/api/${slug}/versions`, { token: T })));
  row(slug, "?draft=true list", s(await call("GET", `/api/${slug}?draft=true&limit=100`)), s(await call("GET", `/api/${slug}?draft=true&limit=100`, { token: T })));
  row(slug, "docAccess", s(await call("POST", `/api/${slug}/access/${id}`)), s(await call("POST", `/api/${slug}/access/${id}`, { token: T })));
  // Writes: anonymous only (admin writes covered separately to keep data intact).
  row(slug, "create (anon)", s(await call("POST", `/api/${slug}`, { body: { name: "qa", title: "qa", email: "qa@example.com", alt: "qa", key: "k", expiresAt: new Date().toISOString() } })), "-");
  row(slug, "update by id (anon)", s(await call("PATCH", `/api/${slug}/${id}`, { body: { name: "pwned", read: true } })), "-");
  row(slug, "bulk update (anon)", s(await call("PATCH", `/api/${slug}?where[id][exists]=true`, { body: { name: "pwned" } })), "-");
  row(slug, "delete by id (anon)", s(await call("DELETE", `/api/${slug}/${id}`)), "-");
  row(slug, "bulk delete (anon)", s(await call("DELETE", `/api/${slug}?where[id][exists]=true`)), "-");
}

// Draft-specific probes (anonymous).
const probes = {
  "where _status=draft": `/api/projects?where[_status][equals]=draft`,
  "draft-only by id": `/api/projects/${draftId}`,
  "draft-only by id ?draft=true": `/api/projects/${draftId}?draft=true`,
  "draft-only by slug": `/api/projects?where[slug][equals]=qa-draft-only&draft=true`,
  "abroadly ?draft=true": `/api/projects/${abroadly.id}?draft=true`,
  "nook depth=2 (nextProject -> draft)": `/api/projects/${nook.id}?depth=2`,
  "versions by id": `/api/projects/versions/${draftId}`,
  "where summary like LEAK": `/api/projects?where[summary][like]=${LEAK}&draft=true`,
  "select _status": `/api/projects?select[_status]=true&draft=true`,
  "globals profile": `/api/globals/profile?depth=2`,
  "globals site-settings": `/api/globals/site-settings?depth=2`,
  "globals profile versions": `/api/globals/profile/versions`,
  "globals profile access": `/api/globals/profile/access`,
  "access (schema)": `/api/access`,
  "graphql GET": `/api/graphql`,
  "graphql-playground": `/api/graphql-playground`,
  "users/me": `/api/users/me`,
  "users/init": `/api/users/init`,
  "og": `/api/og`,
};
for (const [name, path] of Object.entries(probes)) {
  const method = name.includes("access") && name !== "access (schema)" ? "POST" : "GET";
  const r = await call(method, path);
  const r2 = await call(method, path, { token: T });
  row(name, method, s(r), s(r2), name === "nook depth=2 (nextProject -> draft)" ? `anon nextProject=${JSON.stringify(r.json?.nextProject)?.slice(0, 60)}` : "");
}
row("graphql POST", "POST", s(await call("POST", "/api/graphql", { body: { query: "{__typename}" } })), "-");
// Globals writes.
for (const g of ["profile", "site-settings"]) {
  row(`global ${g}`, "update (anon)", s(await call("POST", `/api/globals/${g}`, { body: { name: "pwned", versionLabel: "pwned" } })), "-");
}
// Admin writes that must be refused even for the admin.
row("messages", "create (admin)", "-", s(await call("POST", "/api/messages", { token: T, body: { name: "qa", email: "qa@example.com", intent: "freelance", body: "hello there qa" } })));
row("rate-limits", "list/create (admin)", "-", s(await call("GET", "/api/rate-limits", { token: T })) + " / " + s(await call("POST", "/api/rate-limits", { token: T, body: { key: "x", expiresAt: new Date().toISOString() } })));
row("users", "update other fields (anon unlock)", s(await call("POST", "/api/users/unlock", { body: { email: "qa-admin@example.com" } })), "-");

console.log("| Target | Operation | Anonymous | Admin | Note |\n| --- | --- | --- | --- | --- |");
for (const r of rows) console.log(`| ${r.target} | ${r.op} | ${r.anon} | ${r.admin} | ${r.note} |`);
