"use server";

import config from "@payload-config";
import { headers } from "next/headers";
import { after } from "next/server";
import { getPayload, type Payload } from "payload";
import { validateContact, type ContactInput, type ContactState } from "../contact";
import { buildContactEmail, sendResendEmail } from "../contact-email";
import { getSiteContent } from "../data";
import { allowedHostnames } from "../origins";
import { consumeContactRateLimit } from "../payload/rate-limit-store";
import { clientIpFromHeaders, describeWait, UNKNOWN_IP } from "../rate-limit";
import { siteUrl } from "../seo";
import { TURNSTILE_FIELD, verifyTurnstile } from "../turnstile";

const SUCCESS_MESSAGE = "Thanks for your message. I’ll get back to you soon.";

// Logs carry a stage and an error class only: never names, emails, message bodies or IPs.
function logFailure(stage: string, error?: unknown): void {
  const kind = error instanceof Error ? error.name : error === undefined ? "" : typeof error;
  console.error(`[contact] ${stage}${kind ? ` (${kind})` : ""}`);
}

async function emailFallback(): Promise<string> {
  try {
    const { profile } = await getSiteContent();
    return ` You can also email me at ${profile.email}.`;
  } catch {
    return "";
  }
}

/**
 * Contact form Server Action. Use with `useActionState(submitContact, initialContactState)`.
 *
 * Server Actions are public POST endpoints: everything is validated here, never trusted from the
 * client. There is no auth check because the form is public by design.
 *
 * Steps (work plan 2.5): validate → honeypot → Cloudflare Turnstile → rate limit (per hashed IP,
 * Mongo-backed) → save to `messages` → Resend notification after the response. Every error after
 * validation returns `values` (so the form keeps what was typed) and a `message`, never
 * `fieldErrors`: those are only for invalid fields.
 */
export async function submitContact(prev: ContactState, formData: FormData): Promise<ContactState> {
  const result = validateContact(formData);

  // Bots get the same answer as people, so the honeypot isn't revealed.
  if (result.kind === "spam") return { status: "success", message: SUCCESS_MESSAGE };

  if (result.kind === "invalid") {
    return {
      status: "error",
      fieldErrors: result.fieldErrors,
      values: result.values,
      message: "Some details need another look.",
    };
  }

  const input = result.data;
  const values = { name: input.name, email: input.email, intent: input.intent, message: input.message };
  const fail = (message: string): ContactState => ({ status: "error", message, values });

  const ip = clientIpFromHeaders(await headers());

  // Connect to the database while Cloudflare checks the token: on a cold start that saves the
  // connection time. A failure here surfaces below, where the message is saved.
  const payloadReady = getPayload({ config });
  payloadReady.catch(() => {});

  const turnstile = await verifyTurnstile({
    token: formData.get(TURNSTILE_FIELD),
    secret: process.env.TURNSTILE_SECRET_KEY,
    remoteIp: ip === UNKNOWN_IP ? undefined : ip,
    nodeEnv: process.env.NODE_ENV,
    allowedHostnames: allowedHostnames(),
  });
  if (!turnstile.ok) {
    switch (turnstile.reason) {
      case "missing-token":
      case "invalid-token":
        return fail("I couldn’t confirm you’re not a bot. Please complete the check and send again.");
      case "unavailable":
        logFailure("turnstile unavailable");
        return fail(`The spam check didn’t respond. Please try again in a moment.${await emailFallback()}`);
      case "not-configured":
        logFailure("TURNSTILE_SECRET_KEY is not set in production");
        return fail(`The form isn’t available right now.${await emailFallback()}`);
    }
  }

  let payload: Payload;
  let messageId: string;
  try {
    payload = await payloadReady;

    const limit = await consumeContactRateLimit(payload, ip);
    if (limit.limited) {
      return fail(
        `You’ve sent a few messages already. Please try again in ${describeWait(limit.retryAfterMs)}.${await emailFallback()}`,
      );
    }

    const doc = await payload.create({
      collection: "messages",
      overrideAccess: true,
      // One insert is atomic on its own; a transaction would add round trips to the database.
      disableTransaction: true,
      data: { name: input.name, email: input.email, intent: input.intent, body: input.message, read: false },
      depth: 0,
    });
    messageId = String(doc.id);
  } catch (error) {
    logFailure("save failed", error);
    return fail(`Something went wrong on my side and your message wasn’t sent.${await emailFallback()}`);
  }

  // The message is saved; the email runs after the response so the visitor doesn't wait on it,
  // and a failed send never turns a saved message into an error.
  after(() => notifyByEmail(input, messageId));

  return { status: "success", message: SUCCESS_MESSAGE };
}

async function notifyByEmail(input: ContactInput, messageId: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) {
    console.warn("[contact] email skipped: RESEND_API_KEY or CONTACT_TO_EMAIL is not set (message saved)");
    return;
  }

  let inboxUrl: string | undefined;
  try {
    inboxUrl = new URL(`/admin/collections/messages/${messageId}`, siteUrl()).href;
  } catch {
    inboxUrl = undefined;
  }

  const sent = await sendResendEmail({
    apiKey,
    email: buildContactEmail({ input, to, inboxUrl }),
    idempotencyKey: `contact-message-${messageId}`,
  });
  if (!sent.ok) logFailure(`email failed${sent.status ? ` with HTTP ${sent.status}` : ""} (message saved)`);
}
