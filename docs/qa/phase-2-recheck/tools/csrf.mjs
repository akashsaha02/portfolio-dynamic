// F-02 re-check: cookie-authenticated REST writes by Origin / Sec-Fetch-Site, and CORS preflight.
// node csrf.mjs <base>
const B = process.argv[2] || "http://localhost:4300";
const login = await fetch(B + "/api/users/login", { method: "POST", headers: { "Content-Type": "application/json", Origin: B }, body: JSON.stringify({ email: "qa-admin@example.com", password: "QaGate-Phase2-2026!" }) });
const setCookie = login.headers.get("set-cookie") || "";
const cookie = setCookie.split(";")[0];
console.log("login", login.status, cookie.startsWith("payload-token=") ? "cookie ok" : "NO COOKIE");
const read = async () => (await (await fetch(B + "/api/globals/site-settings?depth=0")).json()).versionLabel;
async function write(label, headers, multipart = false) {
  const value = `qa-${label}-${Date.now()}`;
  let body, h = { Cookie: cookie, ...headers };
  if (multipart) { body = new FormData(); body.append("_payload", JSON.stringify({ versionLabel: value })); }
  else { body = JSON.stringify({ versionLabel: value }); h["Content-Type"] = "application/json"; }
  const r = await fetch(B + "/api/globals/site-settings", { method: "POST", headers: h, body });
  const t = await r.text();
  const changed = (await read()) === value;
  console.log(`${label.padEnd(44)} -> HTTP ${r.status} changed=${changed} ${t.slice(0, 90).replace(/\s+/g, " ")}`);
}
const before = await read();
await write("Origin https://evil.example", { Origin: "https://evil.example" });
await write("Origin https://evil.example multipart", { Origin: "https://evil.example" }, true);
await write("Origin null", { Origin: "null" });
await write("no Origin, Sec-Fetch-Site cross-site", { "Sec-Fetch-Site": "cross-site" });
await write("no Origin, no Sec-Fetch-Site (curl)", {});
await write("Origin http://localhost:4300.evil.example", { Origin: "http://localhost:4300.evil.example" });
await write("Origin http://localhost:9999 (other port)", { Origin: "http://localhost:9999" });
await write("no Origin, Sec-Fetch-Site same-origin", { "Sec-Fetch-Site": "same-origin" });
await write(`Origin ${B} (same origin)`, { Origin: B });
await write(`Origin ${B} multipart`, { Origin: B }, true);
await write("Origin http://127.0.0.1:<port>", { Origin: B.replace("localhost", "127.0.0.1") });
// Restore.
await fetch(B + "/api/globals/site-settings", { method: "POST", headers: { Cookie: cookie, Origin: B, "Content-Type": "application/json" }, body: JSON.stringify({ versionLabel: before }) });
console.log("restored versionLabel:", (await read()) === before);
for (const origin of ["https://evil.example", B]) {
  const r = await fetch(B + "/api/globals/site-settings", { method: "OPTIONS", headers: { Origin: origin, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type" } });
  console.log(`preflight Origin ${origin} -> ${r.status} ACAO=${r.headers.get("access-control-allow-origin")} ACAC=${r.headers.get("access-control-allow-credentials")} ACAM=${r.headers.get("access-control-allow-methods")}`);
  const g = await fetch(B + "/api/projects?limit=1&depth=0", { headers: { Origin: origin } });
  console.log(`GET /api/projects Origin ${origin} -> ${g.status} ACAO=${g.headers.get("access-control-allow-origin")}`);
}
