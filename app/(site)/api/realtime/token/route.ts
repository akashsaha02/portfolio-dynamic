import { createTokenRequest, randomClientId, serverAblyKey } from "@/lib/realtime/ably-server";

// GET /api/realtime/token → a signed Ably TokenRequest for this browser tab (guide §10). The
// browser's Ably client calls it through `authCallback` (components/shared/realtime/ably.ts) when it
// connects and again when the token nears expiry; Ably then talks to the browser directly.
//
// Anonymous by design (public pages). What a token can do is fixed here, not by the caller: a
// random clientId, TTL 1 h, and only the capabilities in lib/realtime/ably-server.ts. Signing is
// local HMAC (no Ably call), so this costs one cheap function invocation per connection.
// No CORS headers: other sites' scripts can't read the response.
//
// 404 when realtime is off (no ABLY_API_KEY at build time) or the key is missing at runtime.

const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" };

export function GET(): Response {
  const key = serverAblyKey();
  if (!key) return new Response("Not found", { status: 404, headers: NO_STORE });
  return Response.json(createTokenRequest(key, { clientId: randomClientId() }), { headers: NO_STORE });
}
