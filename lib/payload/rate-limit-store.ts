// Mongo-backed storage for the rate limits (collections/RateLimits.ts). The window math is pure
// and lives in lib/rate-limit.ts. Server only: used by the contact Server Action and the reactions
// route (app/(site)/api/reactions/[slug]/route.ts).

import type { Payload } from "payload";
import {
  CONTACT_RATE_LIMITS,
  evaluateRateLimit,
  hashClientIp,
  lookbackMs,
  REACTION_RATE_LIMITS,
  type RateLimitDecision,
  type RateLimitScope,
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
export function consumeContactRateLimit(
  payload: Payload,
  ip: string,
  { now = Date.now(), limits = CONTACT_RATE_LIMITS }: ConsumeOptions = {},
): Promise<RateLimitDecision> {
  return consumeRateLimit(payload, ip, "contact", { now, limits });
}

/** The same for case-study reactions, with its own buckets and REACTION_RATE_LIMITS. */
export function consumeReactionRateLimit(
  payload: Payload,
  ip: string,
  { now = Date.now(), limits = REACTION_RATE_LIMITS }: ConsumeOptions = {},
): Promise<RateLimitDecision> {
  return consumeRateLimit(payload, ip, "reaction", { now, limits });
}

type ConsumeOptions = { now?: number; limits?: readonly RateLimitWindow[] };

async function consumeRateLimit(
  payload: Payload,
  ip: string,
  scope: RateLimitScope,
  { now, limits }: Required<ConsumeOptions>,
): Promise<RateLimitDecision> {
  const key = hashClientIp(ip, payload.secret, scope);
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
    // A single insert: no transaction (saves database round trips on every form send).
    disableTransaction: true,
    data: { key, expiresAt: new Date(now + lookback).toISOString() },
    depth: 0,
  });
  return decision;
}
