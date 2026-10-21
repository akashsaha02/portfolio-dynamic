// Realtime (work plan 6.5 / 6.9, guide §10): build-time flags and Ably channel names, shared by
// the browser components (components/shared/realtime/) and the server routes. Pure, no imports.
//
// The flags are replaced at build time by next.config.ts (`env`), in client AND server code:
// - NEXT_PUBLIC_REALTIME: "on" when ABLY_API_KEY was set for the build, else "off". With "off"
//   the components return null before any hook runs and the bundler drops the rest, so the
//   page ships no realtime code; the routes answer 404.
// - NEXT_PUBLIC_REACTIONS: "on" when realtime is on AND DATABASE_URI was set for the build
//   (counts live in MongoDB). Without a database the reactions button is compiled out.
// - NEXT_PUBLIC_REALTIME_SCOPE: "live" (Vercel production), "preview" or "dev". It is part of
//   every channel name, so previews and local runs sharing one Ably app never mix with production.

export const REALTIME_ON = process.env.NEXT_PUBLIC_REALTIME === "on";
export const REACTIONS_ON = REALTIME_ON && process.env.NEXT_PUBLIC_REACTIONS === "on";

const SCOPE = process.env.NEXT_PUBLIC_REALTIME_SCOPE || "dev";

/** Site-wide presence: one member per open tab. Presence data `{ h: 1 }` = on Home with live cursors. */
export const VISITORS_CHANNEL = `site-${SCOPE}:visitors`;

/** Home-page cursor positions, published by the browsers themselves (see docs/ops/free-tier.md). */
export const CURSORS_CHANNEL = `site-${SCOPE}:cursors`;

/** Ably namespace of the per-case-study reaction channels; only the server publishes there. */
export const REACTIONS_NAMESPACE = `reactions-${SCOPE}`;

export const reactionsChannel = (slug: string): string => `${REACTIONS_NAMESPACE}:${slug}`;

/** Message name the server publishes on a reactions channel; data is `{ c: total }`. */
export const REACTION_COUNT_EVENT = "c";

/** Case-study slugs: lowercase letters, digits and hyphens (Payload's slug field produces these). */
export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

/** Most claps one POST may carry (the browser batches quick taps into one request). */
export const MAX_CLAPS_PER_REQUEST = 5;
