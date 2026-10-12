// Runs the e2e suite once per template, sequentially (both builds share .next).
// Usage: node e2e/run.mjs [editorial|folio] [playwright args...]   (no template = both)
import { spawnSync } from "node:child_process";

const all = ["editorial", "folio"];
const args = process.argv.slice(2);
const templates = all.includes(args[0]) ? [args.shift()] : all;

let failed = false;
for (const template of templates) {
  const r = spawnSync("npx", ["playwright", "test", ...args], {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, PW_TEMPLATE: template },
  });
  if (r.status !== 0) failed = true;
}
process.exit(failed ? 1 : 0);
