// Contact-form rate limit: the pure parts (window math, IP extraction, IP hashing).
// Storage lives in lib/payload/rate-limit-store.ts. Unit-tested in tests/contact-backend.test.ts.

import { createHmac } from "node:crypto";

export type RateLimitWindow = { windowMs: number; max: number };

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Per visitor IP: at most 5 accepted messages an hour and 20 a day. */
export const CONTACT_RATE_LIMITS: readonly RateLimitWindow[] = [
  { windowMs: HOUR, max: 5 },
  { windowMs: DAY, max: 20 },
];

/** How far back the store must look: the longest window. */
export function lookbackMs(limits: readonly RateLimitWindow[] = CONTACT_RATE_LIMITS): number {
  return Math.max(...limits.map((l) => l.windowMs));
}

export type RateLimitDecision = { limited: false } | { limited: true; retryAfterMs: number };

/**
 * Decides whether one more hit is allowed, given the timestamps (ms) of earlier accepted hits.
 * A window is full when it already holds `max` hits newer than `now - windowMs`. When limited,
 * `retryAfterMs` is when the fullest window frees a slot.
 */
export function evaluateRateLimit(
  hits: readonly number[],
  now: number,
  limits: readonly RateLimitWindow[] = CONTACT_RATE_LIMITS,
): RateLimitDecision {
  let retryAfterMs = 0;
  for (const { windowMs, max } of limits) {
    const inWindow = hits.filter((t) => t > now - windowMs && t <= now).sort((a, b) => a - b);
    if (inWindow.length < max) continue;
    // A slot frees when enough of the oldest hits fall out: the (count - max + 1)-th oldest.
    const freesAt = inWindow[inWindow.length - max] + windowMs;
    retryAfterMs = Math.max(retryAfterMs, freesAt - now);
  }
  return retryAfterMs > 0 ? { limited: true, retryAfterMs } : { limited: false };
}

/** Friendly wait time for the limited message, e.g. "about 12 minutes", "about 3 hours". */
export function describeWait(ms: number): string {
  const minutes = Math.max(1, Math.ceil(ms / MINUTE));
  if (minutes < 60) return minutes === 1 ? "a minute" : `about ${minutes} minutes`;
  const hours = Math.ceil(minutes / 60);
  return hours === 1 ? "an hour" : `about ${hours} hours`;
}

/** Used when no IP header is present (local `next start` without a proxy). All such hits share one bucket. */
export const UNKNOWN_IP = "unknown";

export type ClientIpOptions = {
  /** Running on Vercel (`VERCEL=1`). */
  vercel?: boolean;
  /**
   * Off Vercel: how many reverse proxies you run in front of the app, each appending the address
   * it saw to `x-forwarded-for` (`TRUSTED_PROXY_HOPS`). 0 or unset: no proxy is trusted.
   */
  trustedProxyHops?: number;
};

function envOptions(): ClientIpOptions {
  const hops = Number.parseInt(process.env.TRUSTED_PROXY_HOPS ?? "", 10);
  return { vercel: process.env.VERCEL === "1", trustedProxyHops: Number.isFinite(hops) && hops > 0 ? hops : 0 };
}

// Cap the length: the value only feeds a hash, but junk shouldn't be unbounded.
const clean = (ip: string | undefined | null): string | undefined => ip?.trim().slice(0, 64) || undefined;

/**
 * The visitor IP for the rate limit, chosen so a client can't pick its own bucket (QA F-07).
 *
 * - On Vercel: `x-vercel-forwarded-for`, then `x-real-ip`, then the first `x-forwarded-for` hop.
 *   Vercel sets all three to the client address and overwrites any value the client sent
 *   (vercel.com/docs/headers/request-headers), so they can be trusted there.
 * - Elsewhere, with `TRUSTED_PROXY_HOPS=N`: the N-th `x-forwarded-for` entry from the right. Each
 *   trusted proxy appends what it saw, so that entry was written by the outermost proxy you run;
 *   anything to its left came from the client and is ignored.
 * - Elsewhere, without it: no header is trusted. `next start` reachable directly takes
 *   `x-forwarded-for` / `x-real-ip` straight from the client (it only fills XFF when absent), so
 *   rotating them would reset the limit. Every visitor shares the `unknown` bucket instead: a
 *   global 5/hour cap, strict but not bypassable.
 */
export function clientIpFromHeaders(headers: Pick<Headers, "get">, options: ClientIpOptions = envOptions()): string {
  if (options.vercel) {
    const ip =
      clean(headers.get("x-vercel-forwarded-for")?.split(",")[0]) ??
      clean(headers.get("x-real-ip")) ??
      clean(headers.get("x-forwarded-for")?.split(",")[0]);
    return ip ?? UNKNOWN_IP;
  }
  const hops = options.trustedProxyHops ?? 0;
  if (hops > 0) {
    const chain = (headers.get("x-forwarded-for") ?? "").split(",").map((hop) => hop.trim()).filter(Boolean);
    return clean(chain[chain.length - hops]) ?? UNKNOWN_IP;
  }
  return UNKNOWN_IP;
}

/** HMAC-SHA256 of the IP keyed with the server secret, so the stored key can't be reversed to an IP. */
export function hashClientIp(ip: string, secret: string): string {
  if (!secret) throw new Error("hashClientIp needs a secret (PAYLOAD_SECRET)");
  return createHmac("sha256", secret).update(`contact:${ip}`).digest("hex");
}
