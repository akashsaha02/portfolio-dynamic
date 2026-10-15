import { describe, expect, it, vi } from "vitest";
import { buildContactEmail, RESEND_API_URL, sendResendEmail } from "@/lib/contact-email";
import { clientIpFromHeaders, describeWait, evaluateRateLimit, hashClientIp } from "@/lib/rate-limit";
import { TURNSTILE_VERIFY_URL, verifyTurnstile } from "@/lib/turnstile";
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
  it("takes the first x-forwarded-for hop, then x-real-ip", () => {
    expect(clientIpFromHeaders(new Headers({ "x-forwarded-for": " 203.0.113.9, 10.0.0.1" }))).toBe("203.0.113.9");
    expect(clientIpFromHeaders(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(clientIpFromHeaders(new Headers())).toBe("unknown");
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
