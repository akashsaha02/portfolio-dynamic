import { request, type APIRequestContext, type BrowserContext, type TestInfo } from "@playwright/test";
import { MongoClient } from "mongodb";
import { ADMIN_EMAIL, ADMIN_PASSWORD, DB_BASE_URL, DB_URI } from "./db-env";

/** True in the folio-db-* projects (keyed + DB-backed server, playwright.db.config.ts). */
export const isDb = (testInfo: TestInfo) => testInfo.project.name.startsWith("folio-db-");

let counter = 0;
/** A distinct client IP per call, so the 5-per-hour contact rate limit never trips across tests. */
export function uniqueIp(): string {
  counter += 1;
  const n = (Date.now() + counter * 7919 + Math.floor(Math.random() * 1e6)) >>> 0;
  return `10.${(n >> 16) & 255}.${(n >> 8) & 255}.${n & 255}`;
}

/**
 * The server runs with TRUSTED_PROXY_HOPS=1, so the last x-forwarded-for entry is the client IP.
 * Added only to requests to the app (not to Cloudflare's Turnstile frames, where a custom header
 * would trigger a CORS preflight).
 */
export async function useClientIp(context: BrowserContext, ip = uniqueIp()): Promise<string> {
  await context.route(
    (url) => url.origin === DB_BASE_URL,
    (route) => route.continue({ headers: { ...route.request().headers(), "x-forwarded-for": ip } }),
  );
  return ip;
}

export type AdminSession = { api: APIRequestContext; token: string; storageState: Awaited<ReturnType<APIRequestContext["storageState"]>> };

/** Logs in as the seeded admin. The returned `api` sends the JWT; `storageState` carries the session cookie. */
export async function adminLogin(): Promise<AdminSession> {
  const login = await request.newContext({ baseURL: DB_BASE_URL });
  const res = await login.post("/api/users/login", { data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  if (!res.ok()) throw new Error(`admin login failed: ${res.status()} ${await res.text()}`);
  const { token } = (await res.json()) as { token: string };
  const storageState = await login.storageState();
  await login.dispose();
  const api = await request.newContext({
    baseURL: DB_BASE_URL,
    extraHTTPHeaders: { Authorization: `JWT ${token}` },
  });
  return { api, token, storageState };
}

/** Raw documents straight from Mongo (the Payload collections are named after their slugs). */
export async function mongoFind(collection: string, filter: Record<string, unknown> = {}) {
  const client = new MongoClient(DB_URI);
  try {
    return await client.db().collection(collection).find(filter).toArray();
  } finally {
    await client.close();
  }
}
