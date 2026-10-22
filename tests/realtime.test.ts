import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { browserCapability, createTokenRequest, parseAblyKey, randomClientId, TOKEN_TTL_MS } from "@/lib/realtime/ably-server";
import { CURSORS_CHANNEL, MAX_CLAPS_PER_REQUEST, REACTIONS_NAMESPACE, SLUG_PATTERN, VISITORS_CHANNEL } from "@/lib/realtime/channels";

describe("parseAblyKey", () => {
  it("parses appId.keyId:secret", () => {
    expect(parseAblyKey(" app.key:sec:ret ")).toEqual({ keyName: "app.key", keySecret: "sec:ret", raw: "app.key:sec:ret" });
  });
  it("rejects unset and malformed keys", () => {
    for (const bad of [undefined, "", "   ", "nocolon", ":secret", "app.key:", "nodot:secret", "a b.c:secret"]) {
      expect(parseAblyKey(bad), String(bad)).toBeNull();
    }
  });
});

describe("createTokenRequest", () => {
  const key = parseAblyKey("app.key:topsecret")!;
  const fixed = { clientId: "client-1", timestamp: 1_700_000_000_000, nonce: "n0nce" };

  it("signs the newline-joined fields with HMAC-SHA256 (Ably RSA9)", () => {
    const req = createTokenRequest(key, fixed);
    const text = ["app.key", TOKEN_TTL_MS, req.capability, "client-1", fixed.timestamp, "n0nce", ""].join("\n");
    expect(req.mac).toBe(createHmac("sha256", "topsecret").update(text).digest("base64"));
    expect(req).toMatchObject({ keyName: "app.key", ttl: TOKEN_TTL_MS, clientId: "client-1", nonce: "n0nce" });
  });

  it("is deterministic for fixed inputs and changes with the secret or clientId", () => {
    const a = createTokenRequest(key, fixed).mac;
    expect(createTokenRequest(key, fixed).mac).toBe(a);
    expect(createTokenRequest({ ...key, keySecret: "other" }, fixed).mac).not.toBe(a);
    expect(createTokenRequest(key, { ...fixed, clientId: "client-2" }).mac).not.toBe(a);
  });

  it("never carries the secret and lasts one hour", () => {
    const req = createTokenRequest(key, { clientId: randomClientId() });
    expect(JSON.stringify(req)).not.toContain("topsecret");
    expect(req.ttl).toBe(3_600_000);
  });

  it("random client ids are anonymous and distinct", () => {
    const ids = new Set(Array.from({ length: 20 }, randomClientId));
    expect(ids.size).toBe(20);
    for (const id of ids) expect(id).toMatch(/^[\w-]{16}$/);
  });
});

describe("browserCapability", () => {
  it("grants only the narrow set; browsers cannot publish reactions", () => {
    const cap = JSON.parse(browserCapability()) as Record<string, string[]>;
    expect(cap[VISITORS_CHANNEL]).toEqual(["presence", "subscribe"]);
    expect(cap[CURSORS_CHANNEL]).toEqual(["publish", "subscribe"]);
    expect(cap[`${REACTIONS_NAMESPACE}:*`]).toEqual(["subscribe"]);
    expect(Object.keys(cap)).toHaveLength(3);
    expect(browserCapability()).not.toContain("history");
  });
});

describe("reactions validation constants", () => {
  it("SLUG_PATTERN accepts real slugs and rejects traversal and junk", () => {
    for (const ok of ["abroadly", "a", "case-study-2", "a1"]) expect(SLUG_PATTERN.test(ok), ok).toBe(true);
    for (const bad of ["", "-a", "a-", "A", "a_b", "a/b", "../x", "a b", "a".repeat(65)]) expect(SLUG_PATTERN.test(bad), bad).toBe(false);
  });
  it("caps claps per request at a small number", () => {
    expect(MAX_CLAPS_PER_REQUEST).toBe(5);
  });
});
