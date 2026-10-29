"use client";
// Out of the React Compiler (as Index's form): its memo caches would grow a module that ships on
// every route of every template, and an uncontrolled form re-renders only once per answer.
"use no memo";

import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import {
  TURNSTILE_SITE_KEY,
  TurnstileWidget,
  type TurnstileHandle,
  type TurnstileStatus,
} from "@/components/shared/TurnstileWidget";
import { submitContact } from "@/lib/actions/contact";
import {
  CONTACT_FIELDS,
  CONTACT_INTENTS,
  CONTACT_INTENT_LABELS,
  CONTACT_LIMITS,
  initialContactState,
  type ContactField,
} from "@/lib/contact";

// Bento contact form: the protocol of Index's (templates/index/client/ContactForm.tsx) in Bento's
// card markup. `submitContact` is the only validation (noValidate), so every template shows the
// same messages:
//
// - error:   inputs refill from `state.values`, each field gets aria-invalid + aria-describedby,
//            and a role=alert summary takes focus, with links that focus each field.
// - pending: the button reads "Sending" and a second submit is ignored.
// - success: the confirmation replaces the form and its heading takes focus; "Send another
//            message" remounts a fresh form and focuses the first field.
//
// The honeypot (`website`) sits off-screen (bento.css .b-hp). Turnstile, only with a site key:
// "Send message" stays aria-disabled until a token is in the form, and the widget is reset after
// any failed send (tokens are single-use). Its theme follows the card, which follows the OS scheme.

const ID = "contact-";
const ORDER: ContactField[] = ["name", "email", "intent", "message"];
const errorId = (f: ContactField) => `${ID}${f}-error`;
/** What a summary link focuses: the input, or the first radio of the intent group. */
const targetId = (f: ContactField) => (f === "intent" ? `${ID}intent-${CONTACT_INTENTS[0]}` : `${ID}${f}`);

const CHECK_STATUS: Record<TurnstileStatus, string> = {
  idle: "Spam check by Cloudflare Turnstile.",
  checking: "Checking you’re human…",
  interactive: "Please complete the check above to send.",
  ready: "Ready to send.",
  error: "The spam check hit a problem. Trying again…",
  unsupported: "This browser can’t run the spam check. Please email me instead.",
  unavailable: "The spam check didn’t load. Check your connection or content blocker, or email me instead.",
};

const LABEL = "block text-sm font-medium";
const INPUT = "b-input mt-2 block w-full rounded-2xl border px-4 py-3 text-base";
const PILL = "b-pill inline-flex min-h-12 items-center rounded-full border px-6 font-medium";

export function ContactForm({ labelledBy }: { labelledBy: string }) {
  const [round, setRound] = useState(0);
  return <Form key={round} labelledBy={labelledBy} focusFirst={round > 0} onAgain={() => setRound((r) => r + 1)} />;
}

type FormProps = { labelledBy: string; focusFirst: boolean; onAgain: () => void };

function Form({ labelledBy, focusFirst, onAgain }: FormProps) {
  const [state, formAction, pending] = useActionState(submitContact, initialContactState);
  const summaryRef = useRef<HTMLDivElement>(null);
  const sentRef = useRef<HTMLHeadingElement>(null);
  const firstRef = useRef<HTMLInputElement>(null);
  const turnstileRef = useRef<TurnstileHandle>(null);
  const [check, setCheck] = useState<TurnstileStatus>("idle");
  // The widget's theme isn't in the markup, so reading the scheme here can't mismatch hydration.
  const [dark] = useState(() => typeof window !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches);

  // Every submission returns a new state object, so this runs once per answer.
  useEffect(() => {
    if (state.status === "error") {
      summaryRef.current?.focus();
      turnstileRef.current?.reset();
    }
    if (state.status === "success") sentRef.current?.focus();
  }, [state]);

  useEffect(() => {
    if (focusFirst) firstRef.current?.focus();
  }, [focusFirst]);

  if (state.status === "success") {
    return (
      <div>
        <h2 ref={sentRef} tabIndex={-1} className="text-2xl leading-snug font-semibold tracking-tight outline-none">
          {state.message}
        </h2>
        <button type="button" onClick={onAgain} className={`${PILL} mt-8`}>
          Send another message
        </button>
      </div>
    );
  }

  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const values = state.values ?? {};
  const field = (name: ContactField) => ({
    id: `${ID}${name}`,
    name: CONTACT_FIELDS[name],
    required: true,
    defaultValue: values[name],
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? errorId(name) : undefined,
  });
  const error = (name: ContactField) =>
    errors[name] ? (
      <p id={errorId(name)} className="b-error mt-2 text-sm font-medium">
        {errors[name]}
      </p>
    ) : null;

  // aria-disabled keeps the button focusable; this drops the second submit and any submit before
  // the spam check has a token. React skips the action when the default is prevented.
  const blocked = pending || (TURNSTILE_SITE_KEY !== undefined && check !== "ready");
  const guard = (e: FormEvent<HTMLFormElement>) => {
    if (blocked) e.preventDefault();
  };
  const listed = ORDER.filter((f) => errors[f]);

  return (
    <form
      action={formAction}
      onSubmit={guard}
      noValidate
      aria-labelledby={labelledBy}
      aria-busy={pending || undefined}
      className="grid gap-8"
    >
      {state.status === "error" ? (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="b-alert rounded-2xl border p-4 outline-none">
          <p className="font-medium">{state.message}</p>
          {listed.length ? (
            <ul className="mt-2 grid">
              {listed.map((f) => (
                <li key={f}>
                  <a
                    href={`#${targetId(f)}`}
                    onClick={(e) => {
                      const target = document.getElementById(targetId(f));
                      if (!target) return;
                      e.preventDefault();
                      target.focus();
                    }}
                    className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
                  >
                    {errors[f]}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-8 sm:grid-cols-2 sm:gap-4">
        <div>
          <label htmlFor={`${ID}name`} className={LABEL}>
            Name
          </label>
          <input
            ref={firstRef}
            type="text"
            autoComplete="name"
            autoCapitalize="words"
            spellCheck={false}
            maxLength={CONTACT_LIMITS.nameMax}
            className={INPUT}
            {...field("name")}
          />
          {error("name")}
        </div>
        <div>
          <label htmlFor={`${ID}email`} className={LABEL}>
            Email
          </label>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={CONTACT_LIMITS.emailMax}
            className={INPUT}
            {...field("email")}
          />
          {error("email")}
        </div>
      </div>

      <fieldset aria-describedby={errors.intent ? errorId("intent") : undefined}>
        <legend className={LABEL}>What are you looking for?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {CONTACT_INTENTS.map((intent) => (
            <label key={intent} className="b-choice inline-flex min-h-11 items-center gap-2.5 rounded-full border px-4 text-base">
              <input
                id={`${ID}intent-${intent}`}
                type="radio"
                name={CONTACT_FIELDS.intent}
                value={intent}
                required
                defaultChecked={values.intent === intent}
                className="size-4"
              />
              {CONTACT_INTENT_LABELS[intent]}
            </label>
          ))}
        </div>
        {error("intent")}
      </fieldset>

      <div>
        <label htmlFor={`${ID}message`} className={LABEL}>
          Message
        </label>
        <textarea rows={5} maxLength={CONTACT_LIMITS.messageMax} className={`${INPUT} resize-y`} {...field("message")} />
        {error("message")}
      </div>

      {/* Honeypot: off-screen for people, still in the DOM for bots. Never refilled. */}
      <div aria-hidden="true" className="b-hp">
        <label htmlFor={`${ID}website`}>Website</label>
        <input id={`${ID}website`} type="text" name={CONTACT_FIELDS.honeypot} tabIndex={-1} autoComplete="off" />
      </div>

      {TURNSTILE_SITE_KEY ? (
        <div className="min-w-0">
          <TurnstileWidget
            ref={turnstileRef}
            onStatusChange={setCheck}
            theme={dark ? "dark" : "light"}
            className="data-visible:mb-4"
          />
          <p role="status" className="text-sm text-(--fg-muted)">
            {CHECK_STATUS[check]}
          </p>
        </div>
      ) : null}

      <p role="status" className="sr-only">
        {pending ? "Sending your message" : ""}
      </p>

      <div>
        <button
          type="submit"
          aria-disabled={blocked || undefined}
          className="b-btn inline-flex min-h-12 w-full items-center justify-center rounded-full px-8 font-semibold aria-disabled:opacity-60 sm:w-auto"
        >
          {pending ? "Sending" : "Send message"}
        </button>
      </div>
    </form>
  );
}
