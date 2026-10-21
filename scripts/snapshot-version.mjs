// Freeze an old design of the site as static files (work plan 6.3):
//
//   node scripts/snapshot-version.mjs <tag> <id> [--period "Oct 2026"] [--cover] [--keep-temp]
//   e.g. node scripts/snapshot-version.mjs v1-editorial editorial --cover
//
// 1. Exports the git tag into a temporary directory outside the repo (os.tmpdir(), or
//    SNAPSHOT_TMP). The tag itself is never changed; every patch below touches the copy only.
// 2. Patches the copy for a static export: next.config gets `output: "export"`,
//    `basePath: "/v/<id>"`, `trailingSlash: true`, an image loader that adds the base path
//    (next/image doesn't prefix `src` itself; the export can't optimise images), no
//    headers/rewrites/redirects, and no type check. Routes that can't be exported (the Payload
//    admin, app/**/api, middleware/proxy) are deleted. A tag with other blockers (Server Actions,
//    dynamic route handlers) fails the build with Next's error; patch more here if that happens.
// 3. `npm ci` + `next build` in the copy, with no database (DATABASE_URI empty) and
//    SITE_TEMPLATE=<id> (for tags where the design was one template among several).
// 4. Copies out/ to public/v/<id>/ (replacing the old snapshot) and adds to every HTML file a
//    `<meta name="robots" content="noindex">` and a small fixed banner: "An older version of this
//    site (<period>). Back to the current site →" linking `/`. robots.txt / sitemap.xml from the
//    old build are dropped. The period comes from lib/versions.ts (entry `id: "<id>"`) unless
//    --period is given.
// 5. --cover: serves public/ locally and saves a 1600×1000 WebP screenshot (banner hidden) to
//    public/v/<id>-cover.webp with Playwright (chromium from `npx playwright install chromium`)
//    and sharp, both already dev/prod dependencies of this repo.
// 6. Deletes the temporary directory, node_modules included (--keep-temp keeps it for debugging).
//
// next.config.ts serves the result: /v/<id> → /v/<id>/index.html (rewrites), noindex and
// immutable caching headers for /v/:path+.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// --- arguments ---

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a === "--cover" || a === "--keep-temp"));
const periodIndex = args.indexOf("--period");
const periodArg = periodIndex >= 0 ? args[periodIndex + 1] : undefined;
const positional = args.filter((a, i) => !a.startsWith("--") && (periodIndex < 0 || i !== periodIndex + 1));
const [tag, id] = positional;

if (!tag || !id) {
  console.error('Usage: node scripts/snapshot-version.mjs <tag> <id> [--period "Oct 2026"] [--cover] [--keep-temp]');
  process.exit(1);
}
if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
  console.error(`id "${id}" must be lowercase letters, digits and dashes (it becomes /v/${id}/).`);
  process.exit(1);
}

const basePath = `/v/${id}`;
const target = path.join(repoRoot, "public", "v", id);

// --- helpers ---

class SnapshotError extends Error {}

/** Throws, so `finally` still deletes the temporary directory; the top level prints it and exits 1. */
function fail(message) {
  throw new SnapshotError(message);
}

process.on("uncaughtException", (error) => {
  console.error(`\n[snapshot] ${error instanceof SnapshotError ? error.message : (error?.stack ?? error)}`);
  process.exit(1);
});

function log(message) {
  console.log(`[snapshot] ${message}`);
}

/** Runs a command; exits with its output when it fails. `shell` only for npm (npm.cmd on Windows). */
function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, { stdio: "inherit", ...options });
  if (result.error) fail(`${command} ${commandArgs.join(" ")}: ${result.error.message}`);
  if (result.status !== 0) fail(`${command} ${commandArgs.join(" ")} exited with ${result.status}.`);
  return result;
}

function git(gitArgs, env = {}) {
  const result = spawnSync("git", gitArgs, { cwd: repoRoot, encoding: "utf8", env: { ...process.env, ...env } });
  if (result.status !== 0) fail(`git ${gitArgs.join(" ")}: ${result.stderr.trim()}`);
  return result.stdout.trim();
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function dirSize(dir) {
  return walk(dir).reduce((sum, file) => sum + fs.statSync(file).size, 0);
}

function removeDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
}

function escapeHtml(text) {
  return text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

/** The display period from lib/versions.ts, e.g. "Oct 2026". */
function periodFromVersions() {
  const source = fs.readFileSync(path.join(repoRoot, "lib", "versions.ts"), "utf8");
  const entry = source.split(/\n\s*\{\s*\n/).find((block) => new RegExp(`\\bid:\\s*"${id}"`).test(block));
  return entry?.match(/\bperiod:\s*"([^"]+)"/)?.[1];
}

// --- 1. export the tag ---

git(["rev-parse", "--verify", "--quiet", `${tag}^{commit}`]);
const period = periodArg ?? periodFromVersions();
if (!period) fail(`No period for "${id}": add it to lib/versions.ts or pass --period "Oct 2026".`);

const tmpRoot = fs.mkdtempSync(path.join(process.env.SNAPSHOT_TMP || os.tmpdir(), `snapshot-${id}-`));
const fromRepo = path.relative(repoRoot, tmpRoot);
if (!fromRepo.startsWith("..") && !path.isAbsolute(fromRepo)) {
  removeDir(tmpRoot);
  fail(`Temporary directory ${tmpRoot} is inside the repo: set SNAPSHOT_TMP to a folder outside it.`);
}
const src = path.join(tmpRoot, "src");
log(`exporting ${tag} into ${src}`);

let ok = false;
try {
  // A private index file, so the repo's own index and working tree are never touched.
  const indexFile = path.join(tmpRoot, "index");
  git(["read-tree", tag], { GIT_INDEX_FILE: indexFile });
  git(["checkout-index", "--all", "--force", `--prefix=${src.replaceAll("\\", "/")}/`], { GIT_INDEX_FILE: indexFile });
  fs.rmSync(indexFile, { force: true });

  // --- 2. patch the copy for a static export ---

  patchNextConfig(src);
  for (const blocker of exportBlockers(src)) {
    log(`removing ${path.relative(src, blocker)} (can't be statically exported)`);
    fs.rmSync(blocker, { recursive: true, force: true });
  }

  // --- 3. install and build ---

  log("npm ci (this takes a few minutes)");
  run("npm", ["ci", "--no-audit", "--no-fund", "--loglevel=error"], { cwd: src, shell: process.platform === "win32" });

  log(`next build (output: export, basePath: ${basePath})`);
  const buildEnv = {
    ...process.env,
    DATABASE_URI: "",
    SITE_TEMPLATE: id,
    NEXT_TELEMETRY_DISABLED: "1",
    NEXT_DIST_DIR: "",
    NEXT_PUBLIC_SITE_URL: process.env.SNAPSHOT_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://akashsaha.vercel.app",
  };
  run(process.execPath, [path.join(src, "node_modules", "next", "dist", "bin", "next"), "build"], { cwd: src, env: buildEnv });

  const out = path.join(src, "out");
  if (!fs.existsSync(path.join(out, "index.html"))) fail("The build finished but out/index.html is missing.");

  // --- 4. post-process and copy into public/v/<id>/ ---

  for (const name of ["robots.txt", "sitemap.xml"]) fs.rmSync(path.join(out, name), { force: true });
  const htmlFiles = walk(out).filter((file) => file.endsWith(".html"));
  for (const file of htmlFiles) fs.writeFileSync(file, markArchived(fs.readFileSync(file, "utf8"), period));
  log(`marked ${htmlFiles.length} HTML file(s) as archived`);

  removeDir(target);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(out, target, { recursive: true });
  log(`copied to ${path.relative(repoRoot, target)} (${(dirSize(target) / 1024).toFixed(0)} KB)`);

  ok = true;
} finally {
  if (flags.has("--keep-temp")) log(`kept ${tmpRoot}`);
  else {
    removeDir(tmpRoot);
    log(`deleted ${tmpRoot}`);
  }
}

// --- 5. cover screenshot ---

if (ok && flags.has("--cover")) await takeCover();

// --- patches ---

function patchNextConfig(dir) {
  const name = ["next.config.ts", "next.config.mjs", "next.config.js"].find((n) => fs.existsSync(path.join(dir, n)));
  const loaderFile = "snapshot-image-loader.mjs";
  fs.writeFileSync(
    path.join(dir, loaderFile),
    `// Added by scripts/snapshot-version.mjs: images are served as-is from ${basePath}/.\n` +
      `export default function snapshotImageLoader({ src }) {\n` +
      `  if (!src.startsWith("/") || src.startsWith("//") || src.startsWith(${JSON.stringify(basePath + "/")})) return src;\n` +
      `  return ${JSON.stringify(basePath)} + src;\n` +
      `}\n`,
  );

  const overrides = `{
    output: "export",
    basePath: ${JSON.stringify(basePath)},
    trailingSlash: true,
    distDir: ".next",
    images: { ...(base.images ?? {}), loader: "custom", loaderFile: "./${loaderFile}" },
    typescript: { ...(base.typescript ?? {}), ignoreBuildErrors: true },
    turbopack: { ...(base.turbopack ?? {}), root: ${JSON.stringify(dir.replaceAll("\\", "/"))} },
  }`;
  const wrapper = `
const __snapshot = (base) => {
  const config = { ...base, ...${overrides} };
  delete config.headers;
  delete config.rewrites;
  delete config.redirects;
  return config;
};
export default typeof __snapshotBase === "function"
  ? async (...args) => __snapshot(await __snapshotBase(...args))
  : __snapshot(__snapshotBase);
`;

  if (!name) {
    fs.writeFileSync(path.join(dir, "next.config.mjs"), `const __snapshotBase = {};\n${wrapper}`);
    return;
  }
  const file = path.join(dir, name);
  const source = fs.readFileSync(file, "utf8");
  const match = source.match(/export\s+default\s+([\s\S]+?);?\s*$/);
  if (!match) fail(`Couldn't find "export default" at the end of ${name}; patch it by hand in the script.`);
  const head = source.slice(0, match.index);
  const tsNoCheck = name.endsWith(".ts") ? "// @ts-nocheck\n" : "";
  fs.writeFileSync(file, `${tsNoCheck}${head}const __snapshotBase = (${match[1]});\n${wrapper}`);
  log(`patched ${name}`);
}

function exportBlockers(dir) {
  const found = [];
  for (const name of ["middleware.ts", "middleware.js", "proxy.ts", "proxy.js"]) {
    if (fs.existsSync(path.join(dir, name))) found.push(path.join(dir, name));
  }
  const app = path.join(dir, "app");
  if (!fs.existsSync(app)) return found;
  const visit = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const full = path.join(d, entry.name);
      if (entry.name === "(payload)" || entry.name === "api") found.push(full);
      else visit(full);
    }
  };
  visit(app);
  return found;
}

function markArchived(html, displayPeriod) {
  const meta = '<meta name="robots" content="noindex">';
  // Plain HTML at the end of <body>: React 19 skips unexpected nodes there when it hydrates.
  const banner =
    `<aside data-snapshot-banner aria-label="Archived version" style="position:fixed;left:50%;bottom:12px;` +
    `transform:translateX(-50%);z-index:2147483647;box-sizing:border-box;max-width:calc(100% - 24px);` +
    `padding:10px 16px;border-radius:999px;background:#111;color:#fff;font:14px/1.4 system-ui,-apple-system,` +
    `'Segoe UI',sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.25);text-align:center">` +
    `An older version of this site (${escapeHtml(displayPeriod)}). ` +
    `<a href="/" style="color:inherit;font-weight:600;text-decoration:underline;text-underline-offset:.2em">` +
    `Back to the current site →</a></aside>`;
  let result = /<meta name="robots"/i.test(html) ? html : html.replace(/<head(\s[^>]*)?>/i, (m) => `${m}${meta}`);
  result = result.includes("data-snapshot-banner") ? result : result.replace(/<\/body>/i, `${banner}</body>`);
  return result;
}

// --- cover ---

async function takeCover() {
  const publicDir = path.join(repoRoot, "public");
  const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json", ".txt": "text/plain" };
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = path.join(publicDir, urlPath);
    if (!file.startsWith(publicDir)) return res.writeHead(403).end();
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!fs.existsSync(file)) return res.writeHead(404).end();
    res.writeHead(200, { "Content-Type": types[path.extname(file)] ?? "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  try {
    const require = createRequire(path.join(repoRoot, "package.json"));
    const { chromium } = require("@playwright/test");
    const sharp = require("sharp");
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, reducedMotion: "reduce" });
      await page.goto(`http://127.0.0.1:${port}${basePath}/`, { waitUntil: "networkidle" });
      await page.addStyleTag({ content: "[data-snapshot-banner]{display:none!important}" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(2500); // intro animations
      const png = await page.screenshot({ type: "png" });
      const coverFile = path.join(publicDir, "v", `${id}-cover.webp`);
      const info = await sharp(png).webp({ quality: 78, effort: 6 }).toFile(coverFile);
      log(`cover: ${path.relative(repoRoot, coverFile)} (${info.width}×${info.height}, ${(info.size / 1024).toFixed(0)} KB)`);
    } finally {
      await browser.close();
    }
  } finally {
    server.close();
  }
}
