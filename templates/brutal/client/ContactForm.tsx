"use client";
// Out of the React Compiler (as Index's form): this module ships on every route of every
// template, and an uncontrolled form that re-renders only per answer doesn't need memo caches.
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

// Brutal contact form: the protocol of templates/index/client/ContactForm.tsx (same fields,
// honeypot, Turnstile and messages, all from the shared Server Action `submitContact`, which is
// the only validation: noValidate) in Brutal's bordered blocks.
//
// - error:   inputs refill from `state.values`, each field gets aria-invalid + aria-describedby
//            and its message on a lime sticker, and a role=alert summary takes focus, with links
//            that focus each field.
// - pending: the button reads "Sending" and a second submit is ignored.
// - success: the confirmation replaces the form and its heading takes focus; "Send another
//            message" remounts a fresh form and focuses the first field.
//
// The honeypot (`website`) sits off-screen (brutal.css .b-hp). Turnstile, only with a site key:
// "Send message" stays aria-disabled until a token is in the form, and the widget is reset after
// any failed send (tokens are single-use). Light theme: the form sits on paper.

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

const LABEL = "block font-extrabold uppercase";
const BUTTON = "b-btn b-press bg-lime";

export function ContactForm({ labelledBy }: { labelledBy: string }) {
  const [round, setRound] = useState(0);
  return <Form key={round} labelledBy={labelledBy} again={round > 0} onAgain={() => setRound((r) => r + 1)} />;
}

type FormProps = { labelledBy: string; again: boolean; onAgain: () => void };

function Form({ labelledBy, again, onAgain }: FormProps) {
  const [state, formAction, pending] = useActionState(submitContact, initialContactState);
  // The error summary or the confirmation heading, whichever this answer rendered.
  const answerRef = useRef<HTMLDivElement & HTMLHeadingElement>(null);
  const firstRef = useRef<HTMLInputElement>(null);
  const turnstileRef = useRef<TurnstileHandle>(null);
  const [check, setCheck] = useState<TurnstileStatus>("idle");

  // Every submission returns a new state object, so this runs once per answer.
  useEffect(() => {
    if (state.status === "error") turnstileRef.current?.reset();
    answerRef.current?.focus();
  }, [state]);

  useEffect(() => {
    if (again) firstRef.current?.focus();
  }, [again]);

  if (state.status === "success") {
    return (
      <div>
        <h2 ref={answerRef} tabIndex={-1} className="b-display b-h3 outline-none">
          {state.message}
        </h2>
        <button type="button" onClick={onAgain} className={`${BUTTON} mt-8`}>
          Send another message
        </button>
      </div>
    );
  }

  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const values = state.values ?? {};
  const field = (name: ContactField) => ({
    id: ID + name,
    name: CONTACT_FIELDS[name],
    required: true,
    defaultValue: values[name],
    className: "b-input",
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? errorId(name) : undefined,
  });
  const error = (name: ContactField) =>
    errors[name] ? (
      <p id={errorId(name)} className="b-err">
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
        <div ref={answerRef} tabIndex={-1} role="alert" className="b-box bg-lime p-4 outline-none">
          <p className="font-extrabold">{state.message}</p>
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
                    className="inline-flex min-h-11 items-center font-bold underline decoration-2 underline-offset-4"
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
        <label htmlFor={ID + "name"} className={LABEL}>
          Name
        </label>
        <input
          ref={firstRef}
          type="text"
          autoComplete="name"
          autoCapitalize="words"
          spellCheck={false}
          maxLength={CONTACT_LIMITS.nameMax}
          {...field("name")}
        />
        {error("name")}
      </div>

      <div>
        <label htmlFor={ID + "email"} className={LABEL}>
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
          {...field("email")}
        />
        {error("email")}
      </div>

      <fieldset aria-describedby={errors.intent ? errorId("intent") : undefined}>
        <legend className={LABEL}>What are you looking for?</legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {CONTACT_INTENTS.map((intent) => (
            <label
              key={intent}
              className="b-opt b-tag min-h-11 cursor-pointer px-4 text-base normal-case"
            >
              <input
                id={`${ID}intent-${intent}`}
                type="radio"
                name={CONTACT_FIELDS.intent}
                value={intent}
                required
                defaultChecked={values.intent === intent}
                className="size-4 accent-ink"
              />
              {CONTACT_INTENT_LABELS[intent]}
            </label>
          ))}
        </div>
        {error("intent")}
      </fieldset>

      <div>
        <label htmlFor={ID + "message"} className={LABEL}>
          Message
        </label>
        <textarea rows={6} maxLength={CONTACT_LIMITS.messageMax} {...field("message")} />
        {error("message")}
      </div>

      {/* Honeypot: off-screen for people, still in the DOM for bots. Never refilled. */}
      <div aria-hidden="true" className="b-hp">
        <label htmlFor={ID + "website"}>Website</label>
        <input id={ID + "website"} type="text" name={CONTACT_FIELDS.honeypot} tabIndex={-1} autoComplete="off" />
      </div>

      {TURNSTILE_SITE_KEY ? (
        <div className="min-w-0">
          <TurnstileWidget ref={turnstileRef} onStatusChange={setCheck} theme="light" className="data-visible:mb-4" />
          <p role="status" className="text-sm text-muted">
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
          className={`${BUTTON} w-full aria-disabled:opacity-60 sm:w-auto`}
        >
          {pending ? "Sending" : "Send message"}
        </button>
      </div>
    </form>
  );
}
