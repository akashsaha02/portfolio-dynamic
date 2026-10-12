"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from "react";
import { submitContact } from "@/lib/actions/contact";
import {
  CONTACT_FIELDS,
  CONTACT_INTENTS,
  CONTACT_INTENT_LABELS,
  CONTACT_LIMITS,
  initialContactState,
  type ContactField,
  type ContactState,
} from "@/lib/contact";
import { RollLabel } from "../ui/Action";
import { Check } from "../ui/icons";
import { Magnetic } from "../ui/Magnetic";
import { RoundButton } from "../ui/RoundButton";

// The conversational contact form (guide §4.6, work plan 1.6): 01 name, 02 email, 03 intent,
// 04 message, each a real <label> (or <legend>) styled as the question, then a round "Send
// message" sitting on a hairline. `submitContact` validates on the server and is the only
// validation (noValidate), so every visitor sees the same messages:
//
// - error:   inputs refill from `state.values`, each field gets aria-invalid + aria-describedby,
//            and a role=alert summary at the top takes focus, with links to the fields.
// - pending: the button reads "Sending" and a second submit is ignored.
// - success: the form is replaced by the confirmation, whose heading takes focus. "Send another
//            message" remounts a fresh form (new action state) and focuses its first field.
//
// The honeypot (`website`) sits off-screen, not display:none, so bots still fill it; the action
// then answers "success" without sending. Styles: pages-about-contact.css (.f-q, .f-choice, …).

const IDS: Record<ContactField, string> = {
  name: "contact-name",
  email: "contact-email",
  intent: "contact-intent",
  message: "contact-message",
};
const ORDER: ContactField[] = ["name", "email", "intent", "message"];
const errorId = (field: ContactField) => `${IDS[field]}-error`;
/** What a summary link focuses: the input, or the first radio of the intent group. */
const targetId = (field: ContactField) => (field === "intent" ? `${IDS.intent}-${CONTACT_INTENTS[0]}` : IDS[field]);

type ContactFormProps = {
  /** id of the page heading, which names the form. */
  labelledBy: string;
};

export function ContactForm({ labelledBy }: ContactFormProps) {
  const [round, setRound] = useState(0);
  return <Form key={round} labelledBy={labelledBy} focusFirst={round > 0} onAgain={() => setRound((r) => r + 1)} />;
}

type FormProps = ContactFormProps & {
  focusFirst: boolean;
  onAgain: () => void;
};

function Form({ labelledBy, focusFirst, onAgain }: FormProps) {
  const [state, formAction, pending] = useActionState(submitContact, initialContactState);
  const summaryRef = useRef<HTMLDivElement>(null);
  const sentRef = useRef<HTMLHeadingElement>(null);
  const firstRef = useRef<HTMLInputElement>(null);

  // Every submission returns a new state object, so this runs once per answer.
  useEffect(() => {
    if (state.status === "error") summaryRef.current?.focus();
    if (state.status === "success") sentRef.current?.focus();
  }, [state]);

  useEffect(() => {
    if (focusFirst) firstRef.current?.focus();
  }, [focusFirst]);

  if (state.status === "success") {
    return (
      <div className="f-contact-sent">
        <span aria-hidden="true" className="f-contact-sent-icon surface-ink">
          <Check className="size-6" />
        </span>
        <h2 ref={sentRef} tabIndex={-1} className="mt-6 max-w-[22ch] type-heading outline-none">
          {state.message}
        </h2>
        <button type="button" onClick={onAgain} className="f-btn f-btn-outline f-roll-host mt-10 min-h-12 px-6 text-base">
          <RollLabel>Send another message</RollLabel>
        </button>
      </div>
    );
  }

  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const values = state.values ?? {};
  const field = (name: ContactField) => ({
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? errorId(name) : undefined,
  });

  // The button only looks disabled (aria-disabled keeps it focusable); this drops the second
  // submit, including Enter in a field. React skips the action when the default is prevented.
  const guard = (e: FormEvent<HTMLFormElement>) => {
    if (pending) e.preventDefault();
  };

  return (
    <form
      action={formAction}
      onSubmit={guard}
      noValidate
      aria-labelledby={labelledBy}
      aria-busy={pending || undefined}
      className="f-contact-form"
    >
      {state.status === "error" ? <Summary ref={summaryRef} state={state} /> : null}

      <div className="f-q">
        <label htmlFor={IDS.name} className="f-q-label">
          <Num>01</Num>
          What&rsquo;s your name?
        </label>
        <input
          ref={firstRef}
          id={IDS.name}
          name={CONTACT_FIELDS.name}
          type="text"
          inputMode="text"
          autoComplete="name"
          autoCapitalize="words"
          spellCheck={false}
          maxLength={CONTACT_LIMITS.nameMax}
          required
          defaultValue={values.name}
          className="f-q-input"
          {...field("name")}
        />
        <FieldError field="name" message={errors.name} />
      </div>

      <div className="f-q">
        <label htmlFor={IDS.email} className="f-q-label">
          <Num>02</Num>
          What&rsquo;s your email?
        </label>
        <input
          id={IDS.email}
          name={CONTACT_FIELDS.email}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={CONTACT_LIMITS.emailMax}
          required
          defaultValue={values.email}
          className="f-q-input"
          {...field("email")}
        />
        <FieldError field="email" message={errors.email} />
      </div>

      <fieldset className="f-q" aria-describedby={errors.intent ? errorId("intent") : undefined}>
        <legend className="f-q-label">
          <Num>03</Num>
          What are you looking for?
        </legend>
        <div className="f-choices">
          {CONTACT_INTENTS.map((intent) => (
            <label key={intent} className="f-choice">
              <input
                id={`${IDS.intent}-${intent}`}
                type="radio"
                name={CONTACT_FIELDS.intent}
                value={intent}
                required
                defaultChecked={values.intent === intent}
              />
              <span aria-hidden="true" className="f-choice-mark" />
              {CONTACT_INTENT_LABELS[intent]}
            </label>
          ))}
        </div>
        <FieldError field="intent" message={errors.intent} />
      </fieldset>

      <div className="f-q">
        <label htmlFor={IDS.message} className="f-q-label">
          <Num>04</Num>
          Your message
        </label>
        <textarea
          id={IDS.message}
          name={CONTACT_FIELDS.message}
          rows={4}
          maxLength={CONTACT_LIMITS.messageMax}
          required
          defaultValue={values.message}
          className="f-q-input f-q-textarea"
          {...field("message")}
        />
        <FieldError field="message" message={errors.message} />
      </div>

      {/* Honeypot: off-screen for people, still in the DOM for bots. Never refilled. */}
      <div aria-hidden="true" className="f-hp">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" type="text" name={CONTACT_FIELDS.honeypot} tabIndex={-1} autoComplete="off" />
      </div>

      {/* TURNSTILE SLOT (work plan 3.3): the Cloudflare Turnstile widget goes here, above the
          send row. Not added yet; submitContact keeps its signature when it starts verifying. */}

      <p role="status" className="sr-only">
        {pending ? "Sending your message" : ""}
      </p>

      {/* The round button sits on the closing hairline, like the footer's "Get in touch". */}
      <div className="f-contact-end">
        <div className="f-contact-send">
          <Magnetic>
            <RoundButton type="submit" size="lg" aria-disabled={pending || undefined}>
              {pending ? "Sending" : "Send message"}
            </RoundButton>
          </Magnetic>
        </div>
      </div>
    </form>
  );
}

/** The question number. Decorative: the label's accessible name is just the question. */
function Num({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden="true" className="f-q-num">
      {children}
    </span>
  );
}

function FieldError({ field, message }: { field: ContactField; message?: string }) {
  if (!message) return null;
  return (
    <p id={errorId(field)} className="f-q-error">
      <span aria-hidden="true" className="f-dot" />
      {message}
    </p>
  );
}

type SummaryProps = {
  ref: Ref<HTMLDivElement>;
  state: ContactState;
};

/** Error summary: announced (role=alert), focused, and each entry jumps to its field. */
function Summary({ ref, state }: SummaryProps) {
  const errors = ORDER.filter((f) => state.fieldErrors?.[f]);

  const jump = (e: MouseEvent<HTMLAnchorElement>, field: ContactField) => {
    const target = document.getElementById(targetId(field));
    if (!target) return;
    e.preventDefault();
    target.focus();
  };

  return (
    <div ref={ref} tabIndex={-1} role="alert" className="f-contact-summary surface-ink outline-none">
      <p className="font-medium">{state.message}</p>
      {errors.length ? (
        <ul className="mt-3 grid gap-1">
          {errors.map((f) => (
            <li key={f}>
              <a
                href={`#${targetId(f)}`}
                onClick={(e) => jump(e, f)}
                className="inline-flex min-h-11 items-center underline decoration-1 underline-offset-4"
              >
                {state.fieldErrors?.[f]}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
