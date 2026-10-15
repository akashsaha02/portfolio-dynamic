// F-08: hostname check with a non-dummy secret and a mocked siteverify answer. npx tsx <this file>
import { verifyTurnstile } from "../../../../lib/turnstile";
import { allowedHostnames } from "../../../../lib/origins";
const mock = (body: object) => (async () => new Response(JSON.stringify(body), { status: 200 })) as unknown as typeof fetch;
const secret = "0x4AAAAAAA-qa-not-a-real-secret";
const hosts = allowedHostnames();
console.log("allowedHostnames (local, PORT unset):", hosts.join(", "));
for (const [label, body] of [
  ["success, hostname evil.example", { success: true, hostname: "evil.example" }],
  ["success, hostname localhost", { success: true, hostname: "localhost" }],
  ["success, hostname LOCALHOST", { success: true, hostname: "LOCALHOST" }],
  ["success, no hostname field", { success: true }],
  ["success:false", { success: false, hostname: "localhost" }],
] as const) {
  const r = await verifyTurnstile({ token: "tok", secret, nodeEnv: "production", allowedHostnames: hosts, fetchImpl: mock(body) });
  console.log(`${label.padEnd(34)} -> ${JSON.stringify(r)}`);
}
const t = await verifyTurnstile({ token: "tok", secret: "1x0000000000000000000000000000000AA", nodeEnv: "production", allowedHostnames: hosts, fetchImpl: mock({ success: true, hostname: "example.com" }) });
console.log(`dummy 1x secret, hostname example.com -> ${JSON.stringify(t)}`);
