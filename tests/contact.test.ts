import { describe, expect, it } from "vitest";
import { CONTACT_LIMITS, validateContact } from "@/lib/contact";
import { formatPeriod } from "@/lib/format";

const valid = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  intent: "freelance",
  message: "Hello, I would like to talk about a project.",
};

function invalidFields(input: Record<string, unknown>) {
  const r = validateContact(input);
  if (r.kind !== "invalid") throw new Error(`expected invalid, got ${r.kind}`);
  return Object.keys(r.fieldErrors).sort();
}

describe("validateContact", () => {
  it("accepts a valid submission and trims it", () => {
    const r = validateContact({ ...valid, name: "  Ada  ", message: `  ${valid.message}  ` });
    expect(r).toEqual({ kind: "valid", data: { ...valid, name: "Ada" } });
  });

  it("reads FormData", () => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(valid)) fd.set(k, v);
    expect(validateContact(fd).kind).toBe("valid");
  });

  it.each(["name", "email", "intent", "message"])("flags a missing %s only", (field) => {
    expect(invalidFields({ ...valid, [field]: "" })).toEqual([field]);
  });

  it("reports every error at once and returns the values", () => {
    const r = validateContact({});
    expect(r.kind).toBe("invalid");
    if (r.kind === "invalid") {
      expect(Object.keys(r.fieldErrors).sort()).toEqual(["email", "intent", "message", "name"]);
      expect(r.values).toEqual({ name: "", email: "", intent: "", message: "" });
    }
  });

  it("enforces name length", () => {
    expect(validateContact({ ...valid, name: "a".repeat(CONTACT_LIMITS.nameMax) }).kind).toBe("valid");
    expect(invalidFields({ ...valid, name: "a".repeat(CONTACT_LIMITS.nameMax + 1) })).toEqual(["name"]);
  });

  it("enforces message limits", () => {
    expect(validateContact({ ...valid, message: "x".repeat(CONTACT_LIMITS.messageMin) }).kind).toBe("valid");
    expect(invalidFields({ ...valid, message: "x".repeat(CONTACT_LIMITS.messageMin - 1) })).toEqual(["message"]);
    expect(validateContact({ ...valid, message: "x".repeat(CONTACT_LIMITS.messageMax) }).kind).toBe("valid");
    expect(invalidFields({ ...valid, message: "x".repeat(CONTACT_LIMITS.messageMax + 1) })).toEqual(["message"]);
  });

  it("enforces email length", () => {
    const local = "a".repeat(CONTACT_LIMITS.emailMax - "@b.co".length);
    expect(validateContact({ ...valid, email: `${local}@b.co` }).kind).toBe("valid");
    expect(invalidFields({ ...valid, email: `${local}a@b.co` })).toEqual(["email"]);
  });

  it.each(["plain", "a@b", "a@@b.co", "a b@c.co", "a@b .co", "@b.co", "a@.co", "a@b..co", "a@b.", "a@b.co\n"])(
    "rejects the bad email %j",
    (bad) => {
      // "a@b.co\n" is trimmed, so it is valid; the others must fail.
      if (bad.trim() === "a@b.co") return expect(validateContact({ ...valid, email: bad }).kind).toBe("valid");
      expect(invalidFields({ ...valid, email: bad })).toEqual(["email"]);
    },
  );

  it("rejects header-injection style emails", () => {
    expect(invalidFields({ ...valid, email: "a@b.co\nBcc: x@y.co" })).toEqual(["email"]);
  });

  it("rejects newlines, tabs and control characters in the name", () => {
    for (const bad of ["Ada\nLovelace", "Ada\tL", "Ada\u0000", "Ada\u007F"]) {
      expect(invalidFields({ ...valid, name: bad }), JSON.stringify(bad)).toEqual(["name"]);
    }
  });

  it("allows newlines and tabs in the message but not other control characters", () => {
    expect(validateContact({ ...valid, message: "Line one here\n\tLine two here" }).kind).toBe("valid");
    expect(validateContact({ ...valid, message: "Line one here\r\nLine two here" }).kind).toBe("valid");
    expect(invalidFields({ ...valid, message: "Hello there\u0000 friend" })).toEqual(["message"]);
    expect(invalidFields({ ...valid, message: "Hello there\u001B friend" })).toEqual(["message"]);
  });

  it("normalises CRLF in the message", () => {
    const r = validateContact({ ...valid, message: "First line here\r\nSecond line" });
    expect(r.kind === "valid" && r.data.message).toBe("First line here\nSecond line");
  });

  it.each(["", "other", "Freelance", "full_time", "__proto__"])("rejects the intent %j", (bad) => {
    expect(invalidFields({ ...valid, intent: bad })).toEqual(["intent"]);
  });

  it.each(["full-time", "freelance", "research"])("accepts the intent %s", (intent) => {
    expect(validateContact({ ...valid, intent }).kind).toBe("valid");
  });

  it("treats File and non-string values as empty", () => {
    const file = new File(["x"], "x.txt");
    const fd = new FormData();
    fd.set("name", file);
    fd.set("email", valid.email);
    fd.set("intent", valid.intent);
    fd.set("message", valid.message);
    expect(invalidFields(Object.fromEntries(fd))).toEqual(["name"]);
    expect(invalidFields({ ...valid, email: 42, message: null })).toEqual(["email", "message"]);
    expect(invalidFields({ ...valid, name: ["Ada"] })).toEqual(["name"]);
  });

  it("returns spam when the honeypot is filled, even if everything else is invalid", () => {
    expect(validateContact({ ...valid, website: "http://spam.example" })).toEqual({ kind: "spam" });
    expect(validateContact({ website: "x" })).toEqual({ kind: "spam" });
  });

  it("ignores a blank or whitespace honeypot", () => {
    expect(validateContact({ ...valid, website: "   " }).kind).toBe("valid");
    expect(validateContact({ ...valid, website: "" }).kind).toBe("valid");
  });
});

describe("validateContact: hidden characters (QA F-06)", () => {
  const u = (code: number) => String.fromCodePoint(code);

  it.each([
    ["RTL override", 0x202e],
    ["LTR embedding", 0x202a],
    ["first-strong isolate", 0x2068],
    ["right-to-left mark", 0x200f],
    ["Arabic letter mark", 0x061c],
    ["zero-width space", 0x200b],
    ["word joiner", 0x2060],
    ["byte order mark", 0xfeff],
    ["soft hyphen", 0x00ad],
    ["Hangul filler", 0x3164],
  ])("rejects a %s in name, email and message", (_label, code) => {
    const c = u(code);
    expect(invalidFields({ ...valid, name: `Ev${c}e` })).toEqual(["name"]);
    expect(invalidFields({ ...valid, email: `ada${c}@example.com` })).toEqual(["email"]);
    expect(invalidFields({ ...valid, message: `${valid.message}${c} more` })).toEqual(["message"]);
  });

  it("rejects the QA spoof name", () => {
    expect(invalidFields({ ...valid, name: `Ev${u(0x202e)}e${u(0x200b)}x` })).toEqual(["name"]);
  });

  it("allows ZWJ/ZWNJ inside words and emoji, rejects them stray", () => {
    const zwj = u(0x200d);
    const zwnj = u(0x200c);
    // Bengali ra + ZWJ + hasant + ya, a Persian word with ZWNJ, emoji ZWJ sequences.
    expect(validateContact({ ...valid, name: `Ak র${zwj}্য` }).kind).toBe("valid");
    expect(validateContact({ ...valid, name: `می${zwnj}خواهم` }).kind).toBe("valid");
    expect(
      validateContact({ ...valid, message: `${valid.message} \u{1F469}${zwj}\u{1F4BB} ❤️${zwj}\u{1F525}` }).kind,
    ).toBe("valid");
    expect(invalidFields({ ...valid, name: `${zwj}Ada` })).toEqual(["name"]);
    expect(invalidFields({ ...valid, name: `Ada${zwnj}` })).toEqual(["name"]);
    expect(invalidFields({ ...valid, name: `Ada ${zwj} Lovelace` })).toEqual(["name"]);
    expect(invalidFields({ ...valid, name: `A${zwj}${zwj}da` })).toEqual(["name"]);
    expect(invalidFields({ ...valid, email: `a${zwj}da@example.com` })).toEqual(["email"]);
  });

  it("NFC-normalises", () => {
    const r = validateContact({ ...valid, name: "José" });
    expect(r.kind === "valid" && r.data.name).toBe("José");
  });
});

describe("formatPeriod", () => {
  it("handles current, same year, across years and same month", () => {
    expect(formatPeriod("2025-11", null)).toBe("Nov 2025 – now");
    expect(formatPeriod("2025-07", "2025-10")).toBe("Jul – Oct 2025");
    expect(formatPeriod("2024-08", "2025-05")).toBe("Aug 2024 – May 2025");
    expect(formatPeriod("2024-03", "2024-03")).toBe("Mar 2024");
  });

  it("covers January and December", () => {
    expect(formatPeriod("2023-01", "2023-12")).toBe("Jan – Dec 2023");
  });

  it.each(["2025-13", "2025-00", "2025-1", "25-01", "2025/01", "", "2025-01-01"])("throws on %j", (bad) => {
    expect(() => formatPeriod(bad, null)).toThrow();
    expect(() => formatPeriod("2025-01", bad)).toThrow();
  });
});
