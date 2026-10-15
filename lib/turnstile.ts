// Cloudflare Turnstile server-side verification (guide §9: free, unlimited).
//
// Pure apart from the injected `fetch`, so it is unit-tested without the network. No
// "server-only" import for the same reason; only the contact Server Action calls it, and the
// secret is passed in, never read from a NEXT_PUBLIC_ variable.

/** Form field the Turnstile widget writes its token into. */
export const TURNSTILE_FIELD = "cf-turnstile-response";

export const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Cloudflare's documented maximum token length. */
const TOKEN_MAX = 2048;

export type TurnstileFailure =
  /** No secret in production: fail closed. */
  | "not-configured"
  /** The form was posted without a token (widget not solved, or a bot posting directly). */
  | "missing-token"
  /** Cloudflare says the token is invalid, expired or already used. */
  | "invalid-token"
  /** Cloudflare could not be reached or answered with an error. */
  | "unavailable";

export type TurnstileResult = { ok: true; skipped: boolean } | { ok: false; reason: TurnstileFailure };

export type VerifyTurnstileArgs = {
  token: unknown;
  secret: string | undefined;
  /** Visitor IP, forwarded to Cloudflare as an extra signal. Optional. */
  remoteIp?: string;
  /** `process.env.NODE_ENV`. Without a secret, verification is skipped only outside production. */
  nodeEnv: string | undefined;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

export async function verifyTurnstile({
  token,
  secret,
  remoteIp,
  nodeEnv,
  fetchImpl = fetch,
  timeoutMs = 5000,
}: VerifyTurnstileArgs): Promise<TurnstileResult> {
  if (!secret) {
    return nodeEnv === "production" ? { ok: false, reason: "not-configured" } : { ok: true, skipped: true };
  }
  if (typeof token !== "string" || token.trim() === "") return { ok: false, reason: "missing-token" };
  if (token.length > TOKEN_MAX) return { ok: false, reason: "invalid-token" };

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const res = await fetchImpl(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return { ok: false, reason: "unavailable" };
    const data = (await res.json()) as { success?: unknown };
    return data.success === true ? { ok: true, skipped: false } : { ok: false, reason: "invalid-token" };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
