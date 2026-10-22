// webServer for the DB-backed e2e (playwright.db.config.ts): starts an in-memory MongoDB replica
// set, seeds it, builds the Folio app WITH the Turnstile test site key and DATABASE_URI, then
// serves it. Killing this process (Playwright does at the end) stops the database.
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { MongoMemoryReplSet } from "mongodb-memory-server";

const appPort = process.env.DB_APP_PORT;
const mongoPort = Number(process.env.DB_MONGO_PORT);

const replSet = await MongoMemoryReplSet.create({
  replSet: { count: 1, name: "rs0" },
  instanceOpts: [{ port: mongoPort, ip: "127.0.0.1" }],
});
const uri = replSet.getUri("pw");
console.log(`[db-server] in-memory MongoDB at ${uri}`);

const env = {
  ...process.env,
  DATABASE_URI: uri,
  PAYLOAD_SECRET: randomBytes(24).toString("hex"),
  NEXT_DIST_DIR: ".next-db",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.TURNSTILE_SITE_KEY,
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET,
  TRUSTED_PROXY_HOPS: "1",
  // Payload's csrf list: lets the admin's cookie session work from the test origin.
  EXTRA_ALLOWED_ORIGINS: `http://localhost:${appPort}`,
  NEXT_PUBLIC_SITE_URL: `http://localhost:${appPort}`,
  SEED_ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  SEED_ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  // Never send real mail from a test run (an empty value also beats anything in .env.local).
  RESEND_API_KEY: "",
  ABLY_API_KEY: "",
  VERCEL_ANALYTICS_TOKEN: "",
  CONTACT_TO_EMAIL: "",
};

async function stop(code = 0) {
  // Never hang on the way out: Playwright waits for this process to exit.
  await Promise.race([replSet.stop().catch(() => {}), new Promise((resolve) => setTimeout(resolve, 10_000))]);
  process.exit(code);
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());

// Async on purpose: spawnSync would block this process, which must keep reading mongod's log
// pipe (mongodb-memory-server listens on it). A full pipe stalls mongod, and the seed with it.
const run = (script) =>
  new Promise((resolve) => {
    const c = spawn("npm", ["run", script], { env, stdio: "inherit", shell: true });
    c.on("exit", (code) => resolve(code ?? 1));
    c.on("error", () => resolve(1));
  });

for (const script of ["seed", "build"]) {
  const code = await run(script);
  if (code !== 0) {
    console.error(`[db-server] npm run ${script} failed (exit ${code})`);
    await stop(1);
  }
}

const child = spawn("npm", ["run", "start", "--", "-p", appPort], { env, stdio: "inherit", shell: true });
child.on("exit", () => stop());
