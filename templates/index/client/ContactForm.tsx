"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
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

// Index contact form: the same protocol as Folio's (templates/folio/contact/ContactForm.tsx) in
// plain stacked fields. `submitContact` is the only validation (noValidate), so both templates
// show the same messages:
//
// - error:   inputs refill from `state.values`, each field gets aria-invalid + aria-describedby,
//            and a role=alert summary takes focus, with links that focus each field.
// - pending: the button reads "Sending" and a second submit is ignored.
// - success: the confirmation replaces the form and its heading takes focus; "Send another
//            message" remounts a fresh form and focuses the first field.
//
// The honeypot (`website`) sits off-screen (index.css .i-hp). Turnstile, only with a site key:
// "Send message" stays aria-disabled until a token is in the form, and the widget is reset after
// any failed send (tokens are single-use).

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
const INPUT =
  "mt-2 block w-full rounded-md border border-hairline-on-ink bg-on-ink/5 px-4 py-3 text-base text-on-ink aria-invalid:border-lime";

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
        <button
          type="button"
          onClick={onAgain}
          className="i-outline mt-8 inline-flex min-h-12 items-center rounded-full border border-hairline-on-ink px-6 font-medium"
        >
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
      <p id={errorId(name)} className="mt-2 text-sm text-lime">
        {errors[name]}
      </p>
    ) : null;

  // aria-disabled keeps the button focusable; this drops the second submit and any submit before
  // the spam check has a token. React skips the action when the default is prevented.
  const blocked = pending || (TURNSTILE_SITE_KEY !== undefined && check !== "ready");
  const guard = (e: FormEvent<HTMLFormElement>) => {
    if (blocked) e.preventDefault();
  };
  const jump = (e: MouseEvent<HTMLAnchorElement>, f: ContactField) => {
    const target = document.getElementById(targetId(f));
    if (!target) return;
    e.preventDefault();
    target.focus();
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
        <div ref={summaryRef} tabIndex={-1} role="alert" className="rounded-md border border-lime p-4 outline-none">
          <p className="font-medium">{state.message}</p>
          {listed.length ? (
            <ul className="mt-2 grid">
              {listed.map((f) => (
                <li key={f}>
                  <a
                    href={`#${targetId(f)}`}
                    onClick={(e) => jump(e, f)}
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

      <fieldset aria-describedby={errors.intent ? errorId("intent") : undefined}>
        <legend className={LABEL}>What are you looking for?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {CONTACT_INTENTS.map((intent) => (
            <label
              key={intent}
              className="inline-flex min-h-11 items-center gap-2.5 rounded-full border border-hairline-on-ink px-4 text-base has-checked:border-lime"
            >
              <input
                id={`${ID}intent-${intent}`}
                type="radio"
                name={CONTACT_FIELDS.intent}
                value={intent}
                required
                defaultChecked={values.intent === intent}
                className="size-4 accent-lime"
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
      <div aria-hidden="true" className="i-hp">
        <label htmlFor={`${ID}website`}>Website</label>
        <input id={`${ID}website`} type="text" name={CONTACT_FIELDS.honeypot} tabIndex={-1} autoComplete="off" />
      </div>

      {TURNSTILE_SITE_KEY ? (
        <div className="min-w-0">
          <TurnstileWidget ref={turnstileRef} onStatusChange={setCheck} className="data-visible:mb-4" />
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
          className="i-btn inline-flex min-h-12 w-full items-center justify-center rounded-full bg-lime px-8 font-semibold text-ink aria-disabled:opacity-60 sm:w-auto"
        >
          {pending ? "Sending" : "Send message"}
        </button>
      </div>
    </form>
  );
}
