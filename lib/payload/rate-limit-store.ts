// Mongo-backed storage for the contact rate limit (collections/RateLimits.ts). The window math is
// pure and lives in lib/rate-limit.ts. Server only: imported by the contact Server Action.

import type { Payload } from "payload";
import {
  CONTACT_RATE_LIMITS,
  evaluateRateLimit,
  hashClientIp,
  lookbackMs,
  type RateLimitDecision,
  type RateLimitWindow,
} from "../rate-limit";

const SLUG = "rate-limits";

let ttlIndex: Promise<void> | null = null;

/**
 * Creates the TTL index on `expiresAt` once per server instance (createIndex is a no-op when it
 * already exists). Payload field indexes can't carry `expireAfterSeconds`, hence this. A failure
 * is logged and retried on the next call; the limit still works, old hits just linger.
 */
function ensureTtlIndex(payload: Payload): Promise<void> {
  ttlIndex ??= (async () => {
    const model = payload.db.collections?.[SLUG];
    if (!model) return;
    await model.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "expiresAt_ttl" });
  })().catch((error: unknown) => {
    ttlIndex = null;
    payload.logger.warn(`[rate-limit] TTL index not created: ${error instanceof Error ? error.name : "unknown error"}`);
  });
  return ttlIndex;
}

/**
 * Checks the limit for this IP and, when allowed, records the hit. Only accepted submissions
 * count, so a limited visitor doesn't extend their own wait by retrying.
 *
 * Not atomic: two simultaneous requests can both pass at the edge of a window. That is fine for
 * a contact form; Turnstile already stops automated floods.
 */
export async function consumeContactRateLimit(
  payload: Payload,
  ip: string,
  { now = Date.now(), limits = CONTACT_RATE_LIMITS }: { now?: number; limits?: readonly RateLimitWindow[] } = {},
): Promise<RateLimitDecision> {
  const key = hashClientIp(ip, payload.secret);
  const lookback = lookbackMs(limits);
  const maxHits = Math.max(...limits.map((l) => l.max));

  const [{ docs }] = await Promise.all([
    payload.find({
      collection: SLUG,
      overrideAccess: true,
      where: {
        key: { equals: key },
        createdAt: { greater_than: new Date(now - lookback).toISOString() },
      },
      select: { createdAt: true },
      sort: "-createdAt",
      // The newest `maxHits` hits are enough to decide every window.
      limit: maxHits,
      pagination: false,
      depth: 0,
    }),
    ensureTtlIndex(payload),
  ]);

  const decision = evaluateRateLimit(
    docs.map((d) => Date.parse(d.createdAt)),
    now,
    limits,
  );
  if (decision.limited) return decision;

  await payload.create({
    collection: SLUG,
    overrideAccess: true,
    data: { key, expiresAt: new Date(now + lookback).toISOString() },
    depth: 0,
  });
  return decision;
}
