"use server";

import { validateContact, type ContactState } from "../contact";

const SUCCESS_MESSAGE = "Thanks for your message. I’ll get back to you soon.";

/**
 * Contact form Server Action. Use with `useActionState(submitContact, initialContactState)`.
 *
 * Server Actions are public POST endpoints: everything is validated here, never trusted from the
 * client. There is no auth check because the form is public by design.
 *
 * STUB (work plan 0.2): validates and returns success, but sends and saves nothing.
 * Work plan 2.5 replaces the body below, keeping this exact signature:
 *   Turnstile verification → Mongo-backed rate limit → save to `messages` → Resend notification.
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

  // TODO(2.5): verify Turnstile, rate limit, persist and notify using `result.data`.
  return { status: "success", message: SUCCESS_MESSAGE };
}
