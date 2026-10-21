import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-*/**",
    "playwright-report/**",
    "playwright-report-db/**",
    "test-results/**",
    "test-results-db/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Agent worktrees (with their own builds) and QA helper scripts.
    ".claude/**",
    "docs/qa/**",
    // Version archive snapshots: another build's minified output (scripts/snapshot-version.mjs).
    "public/v/**",
  ]),
]);

export default eslintConfig;
