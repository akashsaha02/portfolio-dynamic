// Contact form contract: types, field names, limits and pure validation.
//
// No "use server" here on purpose: this module exports constants and a sync function, and is
// safe to import from Client Components (field names, limits, initial state) and from unit tests.
// The Server Action lives in lib/actions/contact.ts.

export const CONTACT_INTENTS = ["full-time", "freelance", "research"] as const;
export type ContactIntent = (typeof CONTACT_INTENTS)[number];

/** Labels for the "What are you looking for?" options (guide §4.6). */
export const CONTACT_INTENT_LABELS: Record<ContactIntent, string> = {
  "full-time": "Full-time role",
  freelance: "Freelance",
  research: "Research",
};

/** A validated, normalised submission. */
export type ContactInput = {
  name: string;
  email: string;
  intent: ContactIntent;
  message: string;
};

export type ContactField = keyof ContactInput;

/**
 * Form `name` attributes. `honeypot` must be rendered visually hidden (off-screen, not
 * display:none), with tabIndex={-1}, autoComplete="off" and aria-hidden on its wrapper, so people
 * never fill it and bots do.
 */
export const CONTACT_FIELDS = {
  name: "name",
  email: "email",
  intent: "intent",
  message: "message",
  honeypot: "website",
} as const;

export const CONTACT_LIMITS = {
  nameMax: 100,
  emailMax: 254,
  messageMin: 10,
  messageMax: 5000,
} as const;

/** Return type of `submitContact`, and the state shape for `useActionState`. */
export type ContactState = {
  status: "idle" | "error" | "success";
  /** One message per invalid field, shown under that field. */
  fieldErrors?: Partial<Record<ContactField, string>>;
  /** Form-level message: a summary on error, the confirmation on success. */
  message?: string;
  /**
   * What the visitor typed, returned on error so inputs can use it as `defaultValue`
   * (React resets uncontrolled forms after an action). Never includes the honeypot.
   */
  values?: Partial<Record<ContactField, string>>;
};

export const initialContactState: ContactState = { status: "idle" };

export type ContactValidation =
  | { kind: "valid"; data: ContactInput }
  | {
      kind: "invalid";
      fieldErrors: Partial<Record<ContactField, string>>;
      values: Partial<Record<ContactField, string>>;
    }
  | { kind: "spam" };

type FormSource = FormData | Record<string, unknown>;

function read(source: FormSource, key: string): string {
  const value = source instanceof FormData ? source.get(key) : source[key];
  return typeof value === "string" ? value : "";
}

// Control characters other than tab and newline. Single-line fields also reject \t and \n.
const CONTROL_MULTILINE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const CONTROL_SINGLE_LINE = /[\u0000-\u001F\u007F]/;
// Pragmatic check: one @, no spaces, a dot in the domain. Real verification is the reply.
const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

// Invisible characters that can disguise text (QA F-06): "Ev‮e​x" renders as "Evxe" in
// the admin inbox and the email subject.
// - Bidi controls: ALM U+061C, LRM/RLM U+200E-200F, embeddings/overrides U+202A-202E, isolates
//   U+2066-2069.
// - Invisible / zero-width: soft hyphen U+00AD, U+180E, zero-width space U+200B, word joiner and
//   invisible operators U+2060-2064, BOM U+FEFF, Hangul fillers U+3164 and U+FFA0.
// Built with RegExp strings: tsconfig targets ES2017, which predates \p{...} regex literals.
const HIDDEN = new RegExp("[\\u061C\\u200E\\u200F\\u202A-\\u202E\\u2066-\\u2069\\u00AD\\u180E\\u200B\\u2060-\\u2064\\uFEFF\\u3164\\uFFA0]");
// ZWNJ U+200C and ZWJ U+200D are allowed only between two visible characters: they are part of
// Bengali, Hindi and Persian spelling (Bengali ra + ZWJ + hasant + ya) and of emoji sequences
// (woman + ZWJ + laptop). Anywhere else (start,
// end, next to a space or another joiner) they only hide things.
const VISIBLE = "\\p{L}\\p{M}\\p{N}\\p{Extended_Pictographic}\\p{Emoji_Modifier}";
const STRAY_JOINER = new RegExp(`(^|[^${VISIBLE}])[\\u200C\\u200D]|[\\u200C\\u200D](?![${VISIBLE}])`, "u");
// Email addresses are plain text: no format characters (Unicode category Cf) at all.
const FORMAT_CHAR = new RegExp("\\p{Cf}", "u");
// Message body only (QA N-02): invisible characters that text copied from web pages often carries,
// and that can't disguise anything in a body that never reaches a header or the subject: soft
// hyphen U+00AD, zero-width space U+200B, word joiner U+2060, BOM U+FEFF. They are removed instead
// of rejecting the message. Bidi controls and the rest of HIDDEN are still refused.
const STRIP_FROM_BODY = new RegExp("[\\u00AD\\u200B\\u2060\\uFEFF]", "g");

/** True when `value` hides characters a reader can't see (bidi controls, zero-width, stray joiners). */
export function hasHiddenCharacters(value: string): boolean {
  return HIDDEN.test(value) || STRAY_JOINER.test(value);
}

function isIntent(value: string): value is ContactIntent {
  return (CONTACT_INTENTS as readonly string[]).includes(value);
}

/**
 * Validates a contact submission. Pure: no I/O, safe to unit test.
 *
 * - Honeypot filled → `spam` (the action reports success without doing anything).
 * - Otherwise each field is trimmed and checked; all errors are reported at once.
 */
export function validateContact(source: FormSource): ContactValidation {
  if (read(source, CONTACT_FIELDS.honeypot).trim() !== "") return { kind: "spam" };

  // NFC first, so composed and decomposed spellings of the same name are stored the same way.
  const name = read(source, CONTACT_FIELDS.name).normalize("NFC").trim();
  const email = read(source, CONTACT_FIELDS.email).normalize("NFC").trim();
  const intent = read(source, CONTACT_FIELDS.intent).trim();
  const message = read(source, CONTACT_FIELDS.message)
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(STRIP_FROM_BODY, "")
    .trim();

  const fieldErrors: Partial<Record<ContactField, string>> = {};

  if (name === "") fieldErrors.name = "Please tell me your name.";
  else if (name.length > CONTACT_LIMITS.nameMax)
    fieldErrors.name = `Please keep your name under ${CONTACT_LIMITS.nameMax} characters.`;
  else if (CONTROL_SINGLE_LINE.test(name)) fieldErrors.name = "Please write your name on one line.";
  else if (hasHiddenCharacters(name))
    fieldErrors.name = "Your name contains hidden formatting characters. Please type it again.";

  if (email === "") fieldErrors.email = "Please add your email so I can reply.";
  else if (
    email.length > CONTACT_LIMITS.emailMax ||
    !EMAIL.test(email) ||
    CONTROL_SINGLE_LINE.test(email) ||
    FORMAT_CHAR.test(email) ||
    hasHiddenCharacters(email)
  )
    fieldErrors.email = "That email doesn’t look right. Check it and try again.";

  if (!isIntent(intent)) fieldErrors.intent = "Please pick what you’re looking for.";

  if (message.length < CONTACT_LIMITS.messageMin)
    fieldErrors.message = `Please write at least ${CONTACT_LIMITS.messageMin} characters.`;
  else if (message.length > CONTACT_LIMITS.messageMax)
    fieldErrors.message = `Please keep it under ${CONTACT_LIMITS.messageMax} characters.`;
  else if (CONTROL_MULTILINE.test(message))
    fieldErrors.message = "Your message contains characters I can’t accept.";
  else if (hasHiddenCharacters(message))
    fieldErrors.message =
      "Your message contains hidden text-direction or formatting characters. Please retype the part you pasted.";

  if (Object.keys(fieldErrors).length > 0 || !isIntent(intent)) {
    return { kind: "invalid", fieldErrors, values: { name, email, intent, message } };
  }

  return { kind: "valid", data: { name, email, intent, message } };
}
