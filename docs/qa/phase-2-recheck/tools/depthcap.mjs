// F-15: maxDepth 2 cap. Builds crowdhex -> soulmatch -> nook, reads crowdhex anonymously at depth=100, restores.
const B = process.argv[2] || "http://localhost:4300";
const T = (await (await fetch(B + "/api/users/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "qa-admin@example.com", password: "QaGate-Phase2-2026!" }) })).json()).token;
const A = { Authorization: `JWT ${T}`, "Content-Type": "application/json" };
const bySlug = async (s) => (await (await fetch(`${B}/api/projects?where[slug][equals]=${s}&depth=0`, { headers: A })).json()).docs[0];
const [c, s, n] = [await bySlug("crowdhex"), await bySlug("soulmatch"), await bySlug("nook")];
const patch = (id, v) => fetch(`${B}/api/projects/${id}`, { method: "PATCH", headers: A, body: JSON.stringify({ nextProject: v, _status: "published" }) });
await patch(c.id, s.id); await patch(s.id, n.id);
const d = await (await fetch(`${B}/api/projects/${c.id}?depth=100`)).json();
const l1 = d.nextProject, l2 = l1?.nextProject;
console.log("depth=100 anon: L1 nextProject =", typeof l1, l1?.slug, "| L2 nextProject =", typeof l2, l2?.slug, "| L2.cover (would be depth 3) =", typeof l2?.cover, typeof l2?.cover === "string" ? "(id only: capped at 2)" : "(populated: NOT capped)");
await patch(c.id, c.nextProject ?? null); await patch(s.id, s.nextProject ?? null);
console.log("restored");
