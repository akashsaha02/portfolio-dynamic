// Throwaway MongoDB for local development: `npm run dev:db`.
//
// Starts a single-node in-memory replica set (Atlas is a replica set too, so Payload's
// transactions behave the same) on a fixed port and prints the DATABASE_URI to use. Nothing is
// written to disk or to the repo; stopping it (Ctrl+C) deletes all data. Re-run `npm run seed`
// after each start.
//
// The first run downloads a MongoDB binary into the mongodb-memory-server cache (~100 MB).
//
// Options (env): DEV_DB_PORT (default 27027), DEV_DB_NAME (default portfolio).

import { MongoMemoryReplSet } from "mongodb-memory-server";

const port = Number(process.env.DEV_DB_PORT || 27027);
const dbName = process.env.DEV_DB_NAME || "portfolio";

const replSet = await MongoMemoryReplSet.create({
  replSet: { count: 1, name: "rs0" },
  instanceOpts: [{ port, ip: "127.0.0.1" }],
});

const uri = replSet.getUri(dbName);

console.log(`
In-memory MongoDB is running (data is lost when this process stops).

  DATABASE_URI=${uri}

Use it for this shell session, e.g. in another terminal:
  PowerShell:  $env:DATABASE_URI="${uri}"; $env:PAYLOAD_SECRET="dev-only-secret"; npm run dev
  bash:        DATABASE_URI="${uri}" PAYLOAD_SECRET=dev-only-secret npm run dev
or put both in .env.local. Then seed: npm run seed

Press Ctrl+C to stop.
`);

let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await replSet.stop();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
