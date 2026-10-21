// Vercel Web Analytics for the admin dashboard (work plan 6.8), from Vercel's public Web Analytics
// API (https://vercel.com/docs/analytics/web-analytics-api):
//   GET https://api.vercel.com/v1/query/web-analytics/visits/count      → { data: { pageviews, visitors } }
//   GET https://api.vercel.com/v1/query/web-analytics/visits/aggregate  → { data: [{ timestamp | requestPath, pageviews, visitors }] }
// Bearer token; `projectId` accepts the project name; team projects need `teamId` or `slug`.
// Both endpoints count production traffic only by default.
//
// Server only: the token is read from the environment here and never leaves the server (the only
// caller is a Server Component widget, which renders numbers). Results are cached for an hour
// with `unstable_cache` (keyed by project and team, never by the token); failures throw inside the
// cached function, so an error is never cached, and come back as a quiet `error` result.
//
// Env: VERCEL_ANALYTICS_TOKEN (read-only token; unset = "not set up"), VERCEL_ANALYTICS_PROJECT
// (default "akashsaha"), VERCEL_ANALYTICS_TEAM (optional: a `team_…` id or the team slug).

import { unstable_cache } from "next/cache";

const API = "https://api.vercel.com/v1/query/web-analytics";
const DEFAULT_PROJECT = "akashsaha";
const DAY_MS = 86_400_000;
/** One hour, in seconds. */
const CACHE_SECONDS = 3600;
const TIMEOUT_MS = 8000;
const TOP_PAGES = 5;

export type Totals = { pageviews: number; visitors: number };

export type AnalyticsSummary = {
  last7: Totals;
  last30: Totals;
  /** The last 30 UTC days, oldest first, zero-filled. `date` is YYYY-MM-DD. */
  daily: Array<Totals & { date: string }>;
  /** Most viewed paths over the last 30 days. */
  topPages: Array<Totals & { path: string }>;
  /** ISO time the numbers were fetched (the cache can be up to an hour old). */
  fetchedAt: string;
};

export type AnalyticsResult =
  | { status: "not-configured" }
  | { status: "ok"; data: AnalyticsSummary }
  | { status: "error"; message: string };

type Scope = { project: string; team: string };

class AnalyticsError extends Error {}

function scope(): Scope {
  return {
    project: process.env.VERCEL_ANALYTICS_PROJECT?.trim() || DEFAULT_PROJECT,
    team: process.env.VERCEL_ANALYTICS_TEAM?.trim() ?? "",
  };
}

function utcDay(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

function messageFor(status: number): string {
  if (status === 401 || status === 403) return "Vercel rejected the token. Check VERCEL_ANALYTICS_TOKEN and its scope.";
  if (status === 404) return "Vercel couldn't find the project. Check VERCEL_ANALYTICS_PROJECT (and VERCEL_ANALYTICS_TEAM).";
  if (status === 402 || status === 410) return "Web Analytics isn't available for this project. Enable it in Vercel.";
  if (status === 429) return "Vercel is rate limiting requests. Try again later.";
  return `Vercel didn't answer (HTTP ${status}). Try again later.`;
}

async function query<T>(endpoint: "count" | "aggregate", params: Record<string, string>, { project, team }: Scope): Promise<T> {
  const token = process.env.VERCEL_ANALYTICS_TOKEN?.trim();
  if (!token) throw new AnalyticsError("VERCEL_ANALYTICS_TOKEN is not set.");

  const url = new URL(`${API}/visits/${endpoint}`);
  url.searchParams.set("projectId", project);
  if (team) url.searchParams.set(team.startsWith("team_") ? "teamId" : "slug", team);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    throw new AnalyticsError(timedOut ? "Vercel didn't answer in time. Try again later." : "Couldn't reach Vercel. Try again later.");
  }
  if (!response.ok) {
    // Status only: never the URL's query or headers.
    console.warn(`[analytics] Vercel Web Analytics answered ${response.status} for visits/${endpoint}`);
    throw new AnalyticsError(messageFor(response.status));
  }
  const body = (await response.json()) as { data?: unknown };
  return body.data as T;
}

function totals(value: unknown): Totals {
  const v = (value ?? {}) as Partial<Totals>;
  return { pageviews: Number(v.pageviews) || 0, visitors: Number(v.visitors) || 0 };
}

async function fetchSummary(s: Scope): Promise<AnalyticsSummary> {
  const now = Date.now();
  const until = new Date(now).toISOString();
  const since7 = utcDay(now - 6 * DAY_MS);
  const since30 = utcDay(now - 29 * DAY_MS);

  const [count7, count30, byDay, byPath] = await Promise.all([
    query<unknown>("count", { since: since7, until }, s),
    query<unknown>("count", { since: since30, until }, s),
    query<Array<{ timestamp?: string } & Partial<Totals>>>("aggregate", { since: since30, until, by: "day" }, s),
    // One extra row: when there are more paths than `limit`, the rest are grouped as "Others".
    query<Array<{ requestPath?: string } & Partial<Totals>>>(
      "aggregate",
      { since: since30, until, by: "requestPath", limit: String(TOP_PAGES + 1) },
      s,
    ),
  ]);

  const perDay = new Map<string, Totals>();
  for (const row of Array.isArray(byDay) ? byDay : []) {
    if (row.timestamp) perDay.set(row.timestamp.slice(0, 10), totals(row));
  }
  const daily = Array.from({ length: 30 }, (_, i) => {
    const date = utcDay(now - (29 - i) * DAY_MS);
    return { date, ...(perDay.get(date) ?? { pageviews: 0, visitors: 0 }) };
  });

  const topPages = (Array.isArray(byPath) ? byPath : [])
    .filter((row) => typeof row.requestPath === "string" && row.requestPath !== "Others")
    .map((row) => ({ path: row.requestPath as string, ...totals(row) }))
    .sort((a, b) => b.pageviews - a.pageviews)
    .slice(0, TOP_PAGES);

  return { last7: totals(count7), last30: totals(count30), daily, topPages, fetchedAt: until };
}

const cachedSummary = unstable_cache((project: string, team: string) => fetchSummary({ project, team }), ["vercel-analytics:v1"], {
  revalidate: CACHE_SECONDS,
  tags: ["vercel-analytics"],
});

/**
 * Page views and visitors for the dashboard. Never throws: no token gives `not-configured`, any
 * failure gives `error` with a short message for the admin. Call only for the signed-in admin.
 */
export async function getAnalytics(): Promise<AnalyticsResult> {
  if (!process.env.VERCEL_ANALYTICS_TOKEN?.trim()) return { status: "not-configured" };
  const { project, team } = scope();
  try {
    return { status: "ok", data: await cachedSummary(project, team) };
  } catch (error) {
    if (!(error instanceof AnalyticsError)) console.warn(`[analytics] ${error instanceof Error ? error.name : "error"}`);
    return { status: "error", message: error instanceof AnalyticsError ? error.message : "Couldn't load the numbers. Try again later." };
  }
}
