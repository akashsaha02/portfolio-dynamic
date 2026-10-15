import { describe, expect, it, vi } from "vitest";
import { buildContactEmail, RESEND_API_URL, sendResendEmail } from "@/lib/contact-email";
import { clientIpFromHeaders, describeWait, evaluateRateLimit, hashClientIp } from "@/lib/rate-limit";
import { isTurnstileTestSecret, TURNSTILE_VERIFY_URL, verifyTurnstile } from "@/lib/turnstile";
import { allowedHostnames, allowedOrigins, MAX_EXTRA_ORIGINS, parseExtraOrigins, payloadServerURL } from "@/lib/origins";
import { jsonLdScript } from "@/lib/json-ld";
import { safeRedirectPath } from "@/lib/draft";

const MIN = 60_000;
const HOUR = 60 * MIN;

function jsonFetch(body: unknown, status = 200) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;
}

describe("verifyTurnstile", () => {
  const base = { token: "tok", secret: "sec", nodeEnv: "production" };

  it("skips without a secret outside production, fails closed in production", async () => {
    expect(await verifyTurnstile({ ...base, secret: undefined, nodeEnv: "development" })).toEqual({ ok: true, skipped: true });
    expect(await verifyTurnstile({ ...base, secret: undefined })).toEqual({ ok: false, reason: "not-configured" });
  });

  it("needs a token", async () => {
    const fetchImpl = jsonFetch({ success: true });
    expect(await verifyTurnstile({ ...base, token: null, fetchImpl })).toEqual({ ok: false, reason: "missing-token" });
    expect(await verifyTurnstile({ ...base, token: "x".repeat(2049), fetchImpl })).toEqual({ ok: false, reason: "invalid-token" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("posts secret, token and IP to siteverify", async () => {
    const fetchImpl = jsonFetch({ success: true });
    expect(await verifyTurnstile({ ...base, remoteIp: "1.2.3.4", fetchImpl })).toEqual({ ok: true, skipped: false });
    const [url, init] = vi.mocked(fetchImpl).mock.calls[0];
    expect(url).toBe(TURNSTILE_VERIFY_URL);
    expect(String(init?.body)).toBe("secret=sec&response=tok&remoteip=1.2.3.4");
  });

  it("refuses a token solved on another hostname", async () => {
    const allowedHostnames = ["akash.dev", "localhost"];
    const answer = (hostname?: string) => jsonFetch({ success: true, ...(hostname ? { hostname } : {}) });
    expect(await verifyTurnstile({ ...base, allowedHostnames, fetchImpl: answer("akash.dev") })).toEqual({ ok: true, skipped: false });
    expect(await verifyTurnstile({ ...base, allowedHostnames, fetchImpl: answer("evil.example") })).toEqual({
      ok: false,
      reason: "invalid-token",
    });
    // No hostname in the answer, or no allowlist: nothing to compare.
    expect(await verifyTurnstile({ ...base, allowedHostnames, fetchImpl: answer() })).toEqual({ ok: true, skipped: false });
    expect(await verifyTurnstile({ ...base, fetchImpl: answer("evil.example") })).toEqual({ ok: true, skipped: false });
  });

  it("skips the hostname check for Cloudflare's dummy secrets (they answer example.com)", async () => {
    const fetchImpl = jsonFetch({ success: true, hostname: "example.com" });
    const secret = "1x0000000000000000000000000000000AA";
    expect(isTurnstileTestSecret(secret)).toBe(true);
    expect(isTurnstileTestSecret("0x4AAAAAAAreal-secret")).toBe(false);
    expect(await verifyTurnstile({ ...base, secret, allowedHostnames: ["localhost"], fetchImpl })).toEqual({ ok: true, skipped: false });
  });

  it("maps failures", async () => {
    expect(await verifyTurnstile({ ...base, fetchImpl: jsonFetch({ success: false }) })).toEqual({ ok: false, reason: "invalid-token" });
    expect(await verifyTurnstile({ ...base, fetchImpl: jsonFetch({}, 500) })).toEqual({ ok: false, reason: "unavailable" });
    const throwing = vi.fn(async () => {
      throw new Error("network");
    }) as unknown as typeof fetch;
    expect(await verifyTurnstile({ ...base, fetchImpl: throwing })).toEqual({ ok: false, reason: "unavailable" });
  });
});

describe("evaluateRateLimit", () => {
  const now = 10 * 24 * HOUR;

  it("allows up to 5 an hour", () => {
    const four = [1, 2, 3, 4].map((m) => now - m * MIN);
    expect(evaluateRateLimit(four, now)).toEqual({ limited: false });
    const five = [...four, now - 50 * MIN];
    // The oldest hit (50 min ago) leaves the hour window in 10 minutes.
    expect(evaluateRateLimit(five, now)).toEqual({ limited: true, retryAfterMs: 10 * MIN });
  });

  it("ignores hits outside the window", () => {
    const old = [1, 2, 3, 4, 5].map((h) => now - h * HOUR - MIN);
    expect(evaluateRateLimit(old, now)).toEqual({ limited: false });
  });

  it("allows up to 20 a day", () => {
    const hits = Array.from({ length: 20 }, (_, i) => now - (2 + i) * HOUR + 30 * MIN);
    const decision = evaluateRateLimit(hits, now);
    expect(decision.limited).toBe(true);
    // Oldest hit is 20.5 h old, so a slot frees in 3.5 h.
    expect(decision.limited && decision.retryAfterMs).toBe(3.5 * HOUR);
    expect(evaluateRateLimit(hits.slice(1), now)).toEqual({ limited: false });
  });

  it("describes the wait", () => {
    expect(describeWait(10 * MIN)).toBe("about 10 minutes");
    expect(describeWait(1000)).toBe("a minute");
    expect(describeWait(3.5 * HOUR)).toBe("about 4 hours");
  });
});

describe("client IP", () => {
  const vercel = { vercel: true };

  it("on Vercel: x-vercel-forwarded-for, then x-real-ip, then the first x-forwarded-for hop", () => {
    expect(
      clientIpFromHeaders(
        new Headers({ "x-vercel-forwarded-for": "203.0.113.9", "x-real-ip": "198.51.100.2", "x-forwarded-for": "192.0.2.1" }),
        vercel,
      ),
    ).toBe("203.0.113.9");
    expect(clientIpFromHeaders(new Headers({ "x-real-ip": "198.51.100.2", "x-forwarded-for": "192.0.2.1" }), vercel)).toBe(
      "198.51.100.2",
    );
    expect(clientIpFromHeaders(new Headers({ "x-forwarded-for": " 203.0.113.9, 10.0.0.1" }), vercel)).toBe("203.0.113.9");
    expect(clientIpFromHeaders(new Headers(), vercel)).toBe("unknown");
  });

  it("off Vercel with no trusted proxy: ignores client-settable headers, so rotating them can't reset the limit", () => {
    for (const h of <Record<string, string>[]>[
      { "x-forwarded-for": "203.0.113.1" },
      { "x-forwarded-for": "203.0.113.2" },
      { "x-forwarded-for": "198.51.100.7, 203.0.113.1" },
      { "x-real-ip": "203.0.113.3" },
      { "x-vercel-forwarded-for": "203.0.113.4" },
    ]) {
      expect(clientIpFromHeaders(new Headers(h), { vercel: false })).toBe("unknown");
    }
  });

  it("off Vercel behind N trusted proxies: the N-th x-forwarded-for entry from the right", () => {
    // The client prepends a fake hop; the proxy appends the address it saw.
    const spoofed = new Headers({ "x-forwarded-for": "1.1.1.1, 203.0.113.9" });
    expect(clientIpFromHeaders(spoofed, { trustedProxyHops: 1 })).toBe("203.0.113.9");
    // Two proxies: client → CDN (appends client) → nginx (appends CDN).
    const twoHops = new Headers({ "x-forwarded-for": "1.1.1.1, 203.0.113.9, 10.0.0.5" });
    expect(clientIpFromHeaders(twoHops, { trustedProxyHops: 2 })).toBe("203.0.113.9");
    // Fewer entries than proxies: misconfigured, so no trusted address.
    expect(clientIpFromHeaders(new Headers({ "x-forwarded-for": "10.0.0.5" }), { trustedProxyHops: 2 })).toBe("unknown");
    expect(clientIpFromHeaders(new Headers(), { trustedProxyHops: 1 })).toBe("unknown");
  });

  it("reads VERCEL and TRUSTED_PROXY_HOPS from the environment by default", () => {
    const h = new Headers({ "x-forwarded-for": "1.1.1.1, 203.0.113.9" });
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("TRUSTED_PROXY_HOPS", "");
    expect(clientIpFromHeaders(h)).toBe("unknown");
    vi.stubEnv("TRUSTED_PROXY_HOPS", "1");
    expect(clientIpFromHeaders(h)).toBe("203.0.113.9");
    vi.stubEnv("VERCEL", "1");
    expect(clientIpFromHeaders(h)).toBe("1.1.1.1");
    vi.unstubAllEnvs();
  });

  it("hashes with the secret and never returns the IP", () => {
    const a = hashClientIp("203.0.113.9", "s1");
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toContain("203");
    expect(hashClientIp("203.0.113.9", "s2")).not.toBe(a);
    expect(() => hashClientIp("1.1.1.1", "")).toThrow();
  });
});

describe("contact email", () => {
  const input = { name: "Ada Lovelace", email: "ada@example.com", intent: "freelance" as const, message: "Hi\nthere" };

  it("builds a plain-text email with reply_to set to the visitor", () => {
    const email = buildContactEmail({ input, to: "me@example.com", inboxUrl: "https://x.dev/admin/collections/messages/1" });
    expect(email).toMatchObject({
      from: "Portfolio <onboarding@resend.dev>",
      to: ["me@example.com"],
      subject: "Portfolio: Freelance enquiry from Ada Lovelace",
      reply_to: "ada@example.com",
    });
    expect(email.text).toContain("Hi\nthere");
    expect(email.text).toContain("https://x.dev/admin/collections/messages/1");
  });

  it("keeps the subject on one line", () => {
    expect(buildContactEmail({ input: { ...input, name: "A\r\nBcc: x" }, to: "me@example.com" }).subject).not.toMatch(/[\r\n]/);
  });

  it("sends through the REST API and never throws", async () => {
    const fetchImpl = jsonFetch({ id: "1" });
    const email = buildContactEmail({ input, to: "me@example.com" });
    expect(await sendResendEmail({ apiKey: "re_x", email, idempotencyKey: "k", fetchImpl })).toEqual({ ok: true });
    const [url, init] = vi.mocked(fetchImpl).mock.calls[0];
    expect(url).toBe(RESEND_API_URL);
    expect(init?.headers).toMatchObject({ Authorization: "Bearer re_x", "Idempotency-Key": "k" });
    expect(await sendResendEmail({ apiKey: "re_x", email, fetchImpl: jsonFetch({}, 422) })).toEqual({ ok: false, status: 422 });
    const throwing = vi.fn(async () => {
      throw new Error("down");
    }) as unknown as typeof fetch;
    expect(await sendResendEmail({ apiKey: "re_x", email, fetchImpl: throwing })).toEqual({ ok: false });
  });
});

describe("safeRedirectPath", () => {
  const at = (q: string) => safeRedirectPath(`https://site.dev/api/draft${q}`);

  it("keeps local paths and refuses everything else", () => {
    expect(at("?path=/work/abroadly")).toBe("/work/abroadly");
    expect(at("?path=/work?x=1")).toBe("/work?x=1");
    expect(at("?path=%2Fwork%3Fx%3D1")).toBe("/work?x=1");
    for (const bad of ["", "?path=", "?path=https://evil.dev", "?path=//evil.dev", "?path=/\\evil.dev", "?path=javascript:alert(1)"]) {
      expect(at(bad), bad).toBe("/");
    }
  });
});

describe("jsonLdScript", () => {
  it("escapes < so the script can't be closed early", () => {
    const out = jsonLdScript({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("<");
    expect(JSON.parse(out)).toEqual({ name: "</script><script>alert(1)</script>" });
  });
});

describe("allowed origins (Payload csrf/cors, Turnstile hostname)", () => {
  const clear = () => {
    for (const k of ["NEXT_PUBLIC_SITE_URL", "EXTRA_ALLOWED_ORIGINS", "VERCEL", "VERCEL_ENV", "VERCEL_URL", "VERCEL_BRANCH_URL", "VERCEL_PROJECT_PRODUCTION_URL", "PORT"]) {
      vi.stubEnv(k, "");
    }
  };

  it("locally: the site URL plus localhost on the current port; no serverURL", () => {
    clear();
    vi.stubEnv("PORT", "4210");
    expect(allowedOrigins()).toEqual(["http://localhost:4210", "http://127.0.0.1:4210"]);
    expect(allowedHostnames()).toEqual(["localhost", "127.0.0.1"]);
    expect(payloadServerURL()).toBe("");
    vi.unstubAllEnvs();
  });

  it("on Vercel: https production, deployment and branch URLs, never localhost", () => {
    clear();
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "app-abc123.vercel.app");
    vi.stubEnv("VERCEL_BRANCH_URL", "app-git-feat.vercel.app");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "akash.dev");
    expect(allowedOrigins()).toEqual(["https://app-abc123.vercel.app", "https://akash.dev", "https://app-git-feat.vercel.app"]);
    expect(allowedOrigins().some((o) => o.includes("localhost"))).toBe(false);
    expect(payloadServerURL()).toBe("");
    vi.stubEnv("VERCEL_ENV", "production");
    expect(payloadServerURL()).toBe("https://akash.dev");
    vi.unstubAllEnvs();
  });

  it("merges EXTRA_ALLOWED_ORIGINS into origins and Turnstile hostnames", () => {
    clear();
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "akash.dev");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("EXTRA_ALLOWED_ORIGINS", " https://WWW.Akash.dev/ , https://akash-portfolio.vercel.app,https://akash.dev");
    expect(allowedOrigins()).toEqual(["https://akash.dev", "https://www.akash.dev", "https://akash-portfolio.vercel.app"]);
    expect(allowedHostnames()).toEqual(["akash.dev", "www.akash.dev", "akash-portfolio.vercel.app"]);
    vi.unstubAllEnvs();
  });
});

describe("parseExtraOrigins", () => {
  it("is empty when unset or blank", () => {
    expect(parseExtraOrigins(undefined)).toEqual([]);
    expect(parseExtraOrigins("")).toEqual([]);
    expect(parseExtraOrigins(" , ,")).toEqual([]);
  });

  it("normalises bare http(s) origins", () => {
    expect(parseExtraOrigins("https://Example.com:443, http://localhost:4300/, https://a.b.dev:8443")).toEqual([
      "https://example.com",
      "http://localhost:4300",
      "https://a.b.dev:8443",
    ]);
  });

  it.each([
    "example.com",
    "ftp://example.com",
    "javascript:alert(1)",
    "https://example.com/admin",
    "https://example.com?x=1",
    "https://example.com#x",
    "https://user:pw@example.com",
    "https://*.vercel.app",
    "*",
    "null",
  ])("rejects %j", (bad) => {
    expect(() => parseExtraOrigins(bad)).toThrow(/EXTRA_ALLOWED_ORIGINS/);
  });

  it(`allows at most ${MAX_EXTRA_ORIGINS}`, () => {
    const list = (n: number) => Array.from({ length: n }, (_, i) => `https://o${i}.dev`).join(",");
    expect(parseExtraOrigins(list(MAX_EXTRA_ORIGINS))).toHaveLength(MAX_EXTRA_ORIGINS);
    expect(() => parseExtraOrigins(list(MAX_EXTRA_ORIGINS + 1))).toThrow(/maximum/);
  });
});
