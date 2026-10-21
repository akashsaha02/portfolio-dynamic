import { after } from "next/server";
import type { Payload } from "payload";
import { caseStudyProjects, getPublishedSiteContent, hasDatabase } from "@/lib/data";
import { allowedOrigins } from "@/lib/origins";
import { consumeReactionRateLimit } from "@/lib/payload/rate-limit-store";
import { incrementReactionCount, readReactionCount } from "@/lib/payload/reaction-store";
import { clientIpFromHeaders } from "@/lib/rate-limit";
import { publishMessage, serverAblyKey } from "@/lib/realtime/ably-server";
import {
  MAX_CLAPS_PER_REQUEST,
  REACTION_COUNT_EVENT,
  REACTIONS_ON,
  reactionsChannel,
  SLUG_PATTERN,
} from "@/lib/realtime/channels";

// /api/reactions/{slug}: 👏 totals for a case study (work plan 6.5).
//   GET  → { count }                       cheap read, CDN-cached for 10 s
//   POST { n: 1..5 } → { count }           adds claps, then publishes the total to Ably
//
// Every check is here, on every request (public endpoint, no auth by design):
// feature on (build flag + key + database) → slug shape → slug is a real, published case study →
// (POST) same-origin JSON body, small and valid → rate limit per hashed IP (Mongo) → atomic $inc.
// Browsers never publish reactions to Ably themselves: their tokens can only subscribe there.

type Ctx = RouteContext<"/api/reactions/[slug]">;

const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" };
// A few seconds of staleness is fine: open pages get live updates over Ably, and the clapper's
// own POST answers with the fresh total.
const SHORT_CDN_CACHE = { "Cache-Control": "public, max-age=0, s-maxage=10, stale-while-revalidate=50" };

const MAX_BODY_BYTES = 256;

const json = (body: unknown, status: number, headers: Record<string, string> = NO_STORE) =>
  Response.json(body, { status, headers });

const notFound = () => json({ error: "not_found" }, 404);

async function payloadClient(): Promise<Payload> {
  const [{ getPayload }, { default: config }] = await Promise.all([import("payload"), import("@payload-config")]);
  return getPayload({ config });
}

/** The slug when reactions are on and it names a published case study; otherwise null. */
async function caseStudySlug(ctx: Ctx): Promise<string | null> {
  if (!REACTIONS_ON || !hasDatabase() || !serverAblyKey()) return null;
  const { slug } = await ctx.params;
  if (!SLUG_PATTERN.test(slug)) return null;
  // Published content only (cached and tag-invalidated in lib/data.ts), never drafts.
  const content = await getPublishedSiteContent();
  return caseStudyProjects(content).some((p) => p.slug === slug) ? slug : null;
}

function logFailure(stage: string, error: unknown): void {
  console.error(`[reactions] ${stage} (${error instanceof Error ? error.name : typeof error})`);
}

export async function GET(_request: Request, ctx: Ctx): Promise<Response> {
  try {
    const slug = await caseStudySlug(ctx);
    if (!slug) return notFound();
    const count = await readReactionCount(await payloadClient(), slug);
    return json({ count }, 200, SHORT_CDN_CACHE);
  } catch (error) {
    logFailure("read failed", error);
    return json({ error: "unavailable" }, 503);
  }
}

/** Same-origin check: browsers always send Origin on a fetch POST; anything else is refused. */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return Boolean(origin) && allowedOrigins().includes(origin as string);
}

/** `{ "n": 1..MAX }` from a small JSON body, or null. */
async function readClaps(request: Request): Promise<number | null> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return null;
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY_BYTES) return null;
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return null;
  try {
    const n = (JSON.parse(text) as { n?: unknown })?.n;
    return Number.isInteger(n) && (n as number) >= 1 && (n as number) <= MAX_CLAPS_PER_REQUEST ? (n as number) : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request, ctx: Ctx): Promise<Response> {
  let slug: string | null;
  try {
    slug = await caseStudySlug(ctx);
  } catch (error) {
    logFailure("slug check failed", error);
    return json({ error: "unavailable" }, 503);
  }
  if (!slug) return notFound();
  if (!sameOrigin(request)) return json({ error: "forbidden" }, 403);

  const claps = await readClaps(request);
  if (claps === null) return json({ error: "invalid" }, 400);

  let count: number;
  try {
    const payload = await payloadClient();
    const limit = await consumeReactionRateLimit(payload, clientIpFromHeaders(request.headers));
    if (limit.limited) {
      const retryAfter = Math.ceil(limit.retryAfterMs / 1000);
      return json({ error: "rate_limited", retryAfter }, 429, { ...NO_STORE, "Retry-After": String(retryAfter) });
    }
    count = await incrementReactionCount(payload, slug, claps);
  } catch (error) {
    logFailure("save failed", error);
    return json({ error: "unavailable" }, 503);
  }

  // Everyone else on the page sees the new total; after the response, so the clapper never waits.
  const key = serverAblyKey();
  const channel = reactionsChannel(slug);
  if (key) after(() => publishMessage(key, channel, REACTION_COUNT_EVENT, { c: count }));

  return json({ count }, 200);
}
