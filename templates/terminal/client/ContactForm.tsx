"use client";
// Out of the React Compiler, as Index's form: its memo caches would double this module, which
// ships on every route of every template, and the form re-renders only once per answer.
"use no memo";

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

// Terminal contact form: the protocol of templates/index/client/ContactForm.tsx (the shared
// Server Action is the only validation, so every template shows the same messages), drawn as a
// prompt session: each field is a `?` question with a real <label> and a real input under it.
//
// - error:   inputs refill from `state.values`, each field gets aria-invalid + aria-describedby,
//            and a role=alert summary takes focus, with links that focus each field.
// - pending: the button reads "Sending" and a second submit is ignored.
// - success: the confirmation replaces the form and takes focus; "Send another message"
//            remounts a fresh form and focuses the first field.
//
// Honeypot (`website`) off-screen (terminal.css .t-hp). Turnstile only with a site key: the button
// stays aria-disabled until a token is in the form; the widget is reset after a failed send.

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

/** The `?` before each question. Decorative. */
const Q = () => (
  <span aria-hidden="true" className="text-lime">
    ?{" "}
  </span>
);

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
      <div className="t-out">
        <h2 ref={sentRef} tabIndex={-1} className="text-lg font-bold outline-none">
          <span aria-hidden="true" className="text-lime">
            ✓{" "}
          </span>
          {state.message}
        </h2>
        <button type="button" onClick={onAgain} className="t-btn t-ghost mt-6">
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
      <p id={errorId(name)} className="mt-2 text-lime">
        <span aria-hidden="true">! </span>
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
      className="t-form grid gap-8"
    >
      {state.status === "error" ? (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="t-alert outline-none">
          <p className="font-bold">
            <span aria-hidden="true" className="text-lime">
              error:{" "}
            </span>
            {state.message}
          </p>
          {listed.length ? (
            <ul className="mt-2 grid">
              {listed.map((f) => (
                <li key={f}>
                  <a href={`#${targetId(f)}`} onClick={(e) => jump(e, f)} className="t-a inline-flex min-h-11 items-center">
                    {errors[f]}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div>
        <label htmlFor={`${ID}name`}>
          <Q />
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
        <label htmlFor={`${ID}email`}>
          <Q />
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
        <legend>
          <Q />
          What are you looking for?
        </legend>
        <div className="mt-2 flex flex-wrap gap-x-6">
          {CONTACT_INTENTS.map((intent) => (
            <label key={intent} className="t-radio">
              <input
                id={`${ID}intent-${intent}`}
                type="radio"
                name={CONTACT_FIELDS.intent}
                value={intent}
                required
                defaultChecked={values.intent === intent}
              />
              {CONTACT_INTENT_LABELS[intent]}
            </label>
          ))}
        </div>
        {error("intent")}
      </fieldset>

      <div>
        <label htmlFor={`${ID}message`}>
          <Q />
          Message
        </label>
        <textarea rows={5} maxLength={CONTACT_LIMITS.messageMax} {...field("message")} />
        {error("message")}
      </div>

      {/* Honeypot: off-screen for people, still in the DOM for bots. Never refilled. */}
      <div aria-hidden="true" className="t-hp">
        <label htmlFor={`${ID}website`}>Website</label>
        <input id={`${ID}website`} type="text" name={CONTACT_FIELDS.honeypot} tabIndex={-1} autoComplete="off" />
      </div>

      {TURNSTILE_SITE_KEY ? (
        <div className="min-w-0">
          <TurnstileWidget ref={turnstileRef} onStatusChange={setCheck} theme="dark" className="data-visible:mb-4" />
          <p role="status" className="text-sm text-(--fg-muted)">
            {CHECK_STATUS[check]}
          </p>
        </div>
      ) : null}

      <p role="status" className="sr-only">
        {pending ? "Sending your message" : ""}
      </p>

      <div>
        <button type="submit" aria-disabled={blocked || undefined} className="t-btn">
          <span aria-hidden="true">$ </span>
          {pending ? "Sending" : "Send message"}
        </button>
      </div>
    </form>
  );
}
