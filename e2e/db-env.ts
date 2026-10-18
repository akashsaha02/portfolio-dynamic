// Constants shared by the DB-backed e2e (playwright.db.config.ts, e2e/db-server.mjs and the specs).
// The database is an in-memory MongoDB replica set started by db-server.mjs: nothing touches Atlas.

export const DB_PORT_BASE = Number(process.env.PW_PORT_BASE ?? 3100);
export const DB_APP_PORT = DB_PORT_BASE + 2;
export const DB_MONGO_PORT = Number(process.env.PW_DB_MONGO_PORT ?? 27057);
export const DB_URI = `mongodb://127.0.0.1:${DB_MONGO_PORT}/pw?replicaSet=rs0`;
export const DB_BASE_URL = `http://localhost:${DB_APP_PORT}`;

export const ADMIN_EMAIL = "e2e-admin@example.com";
export const ADMIN_PASSWORD = "e2e-admin-password-123";

// Cloudflare's documented dummy keys: the site key always passes the widget, and the secret
// always verifies (https://developers.cloudflare.com/turnstile/troubleshooting/testing/).
export const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";
export const TURNSTILE_TEST_SECRET = "1x0000000000000000000000000000000AA";
