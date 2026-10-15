// F-15 re-check: nextProject pointing at a draft, anonymous vs admin, depth 0/1/2/5, findByID / list / slug query.
const B = process.argv[2] || "http://localhost:4300";
const T = (await (await fetch(B + "/api/users/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "qa-admin@example.com", password: "QaGate-Phase2-2026!" }) })).json()).token;
const get = async (p, auth) => (await fetch(B + p, { headers: auth ? { Authorization: `JWT ${T}` } : {} })).json();
const nook = (await get("/api/projects?where[slug][equals]=nook&depth=0", true)).docs[0];
const show = (v) => (v == null ? String(v) : typeof v === "object" ? `{object slug=${v.slug} _status=${v._status}}` : `"${v}"`);
console.log("nook.nextProject (admin, depth 0):", show(nook.nextProject));
for (const depth of [0, 1, 2, 5]) {
  for (const auth of [false, true]) {
    const byId = await get(`/api/projects/${nook.id}?depth=${depth}`, auth);
    const list = await get(`/api/projects?where[slug][equals]=nook&depth=${depth}`, auth);
    const draftQ = await get(`/api/projects/${nook.id}?depth=${depth}&draft=true`, auth);
    console.log(`depth=${depth} ${auth ? "admin" : "anon "} findByID=${show(byId.nextProject)} list=${show(list.docs?.[0]?.nextProject)} ?draft=true=${show(draftQ.nextProject)}`);
  }
}
// Control: nextProject -> a published project is kept for anonymous readers.
const abroadly = (await get("/api/projects?where[slug][equals]=abroadly&depth=0", true)).docs[0];
const cerebral = (await get("/api/projects?where[slug][equals]=cerebral-insights&depth=0", true)).docs[0];
const prev = cerebral.nextProject ?? null;
await fetch(B + `/api/projects/${cerebral.id}`, { method: "PATCH", headers: { Authorization: `JWT ${T}`, "Content-Type": "application/json" }, body: JSON.stringify({ nextProject: abroadly.id, _status: "published" }) });
for (const depth of [0, 1, 2]) {
  const r = await get(`/api/projects/${cerebral.id}?depth=${depth}`, false);
  console.log(`control cerebral-insights -> abroadly (published, has a newer draft) depth=${depth} anon nextProject=${show(r.nextProject)}`);
}
await fetch(B + `/api/projects/${cerebral.id}`, { method: "PATCH", headers: { Authorization: `JWT ${T}`, "Content-Type": "application/json" }, body: JSON.stringify({ nextProject: prev, _status: "published" }) });
// Depth cap.
const deep = await get("/api/projects?limit=1&depth=100&where[slug][equals]=nook", false);
console.log("depth=100 anon: stack[0] type =", typeof deep.docs?.[0]?.stack?.[0], " cover type =", typeof deep.docs?.[0]?.cover);
const dflt = await get("/api/projects?limit=1&where[slug][equals]=nook", false);
console.log("no depth anon (defaultDepth): stack[0] type =", typeof dflt.docs?.[0]?.stack?.[0]);
