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

/**
 * The visitor IP: the first hop of `x-forwarded-for`, else `x-real-ip`. On Vercel both are set by
 * the platform (a client-sent x-forwarded-for is overwritten), so the first hop is the real client.
 */
export function clientIpFromHeaders(headers: Pick<Headers, "get">): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || headers.get("x-real-ip")?.trim();
  // Cap the length: the value only feeds a hash, but junk shouldn't be unbounded.
  return ip ? ip.slice(0, 64) : UNKNOWN_IP;
}

/** HMAC-SHA256 of the IP keyed with the server secret, so the stored key can't be reversed to an IP. */
export function hashClientIp(ip: string, secret: string): string {
  if (!secret) throw new Error("hashClientIp needs a secret (PAYLOAD_SECRET)");
  return createHmac("sha256", secret).update(`contact:${ip}`).digest("hex");
}
