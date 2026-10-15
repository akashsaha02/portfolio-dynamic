// Contact notification email through Resend's REST API (no SDK dependency).
// Pure apart from the injected `fetch`; unit-tested in tests/contact-backend.test.ts.

import { CONTACT_INTENT_LABELS, type ContactInput } from "./contact";

export const RESEND_API_URL = "https://api.resend.com/emails";

/** Resend's shared test sender: works on the free plan without verifying a domain (guide §9). */
export const CONTACT_EMAIL_FROM = "Portfolio <onboarding@resend.dev>";

export type ResendEmail = {
  from: string;
  to: string[];
  subject: string;
  text: string;
  reply_to: string;
};

/** Defence in depth: validation already rejects line breaks in name/email (no header injection). */
function oneLine(value: string): string {
  return value.replace(/[\r\n\t]+/g, " ").trim();
}

export function buildContactEmail({
  input,
  to,
  inboxUrl,
  from = CONTACT_EMAIL_FROM,
}: {
  input: ContactInput;
  to: string;
  /** Link to the saved message in the admin, when known. */
  inboxUrl?: string;
  from?: string;
}): ResendEmail {
  const name = oneLine(input.name);
  const email = oneLine(input.email);
  const intent = CONTACT_INTENT_LABELS[input.intent];
  const lines = [
    "New message from the portfolio contact form.",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Looking for: ${intent}`,
    "",
    "Message:",
    input.message,
    "",
    "---",
    `Reply to this email to answer ${name} directly.`,
  ];
  if (inboxUrl) lines.push(`Saved in the admin inbox: ${inboxUrl}`);

  return {
    from,
    to: [to],
    subject: `Portfolio: ${intent} enquiry from ${name}`,
    text: lines.join("\n"),
    reply_to: email,
  };
}

export type SendResult = { ok: true } | { ok: false; status?: number };

/**
 * Sends one email. Never throws: the caller has already saved the message, so a failed email is
 * logged, not surfaced to the visitor. `idempotencyKey` stops duplicates if a send is retried.
 */
export async function sendResendEmail({
  apiKey,
  email,
  idempotencyKey,
  fetchImpl = fetch,
  timeoutMs = 8000,
}: {
  apiKey: string;
  email: ResendEmail;
  idempotencyKey?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}): Promise<SendResult> {
  try {
    const res = await fetchImpl(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(idempotencyKey && { "Idempotency-Key": idempotencyKey }),
      },
      body: JSON.stringify(email),
      signal: AbortSignal.timeout(timeoutMs),
    });
    return res.ok ? { ok: true } : { ok: false, status: res.status };
  } catch {
    return { ok: false };
  }
}
