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
  /**
   * Hostnames the widget may be solved on (lib/origins.ts `allowedHostnames()`). When Cloudflare's
   * answer names a hostname outside this list, the token was minted on another site and is refused
   * (QA F-08). Empty or omitted: no hostname check.
   */
  allowedHostnames?: readonly string[];
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

/**
 * Cloudflare's dummy secrets (1x… always passes, 2x… always fails, 3x… token already spent) answer
 * with the placeholder hostname "example.com", so the hostname check is skipped for them. They
 * never accept a real token, so this opens nothing in production.
 */
export function isTurnstileTestSecret(secret: string): boolean {
  return /^[123]x0+AA$/.test(secret);
}

export async function verifyTurnstile({
  token,
  secret,
  remoteIp,
  nodeEnv,
  allowedHostnames = [],
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
    const data = (await res.json()) as { success?: unknown; hostname?: unknown };
    if (data.success !== true) return { ok: false, reason: "invalid-token" };
    if (
      typeof data.hostname === "string" &&
      allowedHostnames.length > 0 &&
      !isTurnstileTestSecret(secret) &&
      !allowedHostnames.includes(data.hostname.toLowerCase())
    ) {
      return { ok: false, reason: "invalid-token" };
    }
    return { ok: true, skipped: false };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
