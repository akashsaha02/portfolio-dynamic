import { LocalTime } from "@/components/shared/LocalTime";
import type { TemplateProps } from "../../types";
import { ContactForm } from "../client/ContactForm";
import { Availability, EmailButton, Socials } from "../profile";
import { MAIN, TerminalPage } from "../shell";
import { H1, MUTED, Prompt } from "../ui";

// Terminal Contact, /contact: `./contact` with the h1 and availability, the form as a prompt
// session (client/ContactForm.tsx, through the shared Server Action), and the details as
// `key: value` lines: email (copy on tap), socials, location and local time. With
// `settings.contactFormEnabled` off the form is not rendered and the details take the page.

export default function Contact(props: TemplateProps) {
  const { profile } = props.content;
  const formEnabled = props.settings.contactFormEnabled;

  return (
    <TerminalPage {...props} current="contact" cwd="~/contact">
      <main id="main" tabIndex={-1} className={MAIN}>
        <Prompt cmd="./contact" />
        <h1 id="contact-title" className={H1}>
          Get in touch
        </h1>
        <p className="mt-4">
          <Availability availability={profile.availability} />
        </p>

        <div className="mt-10 grid gap-16 md:mt-14">
          {formEnabled ? <ContactForm labelledBy="contact-title" /> : null}

          <section
            aria-labelledby="contact-details-title"
            className={formEnabled ? "border-t border-hairline-on-ink pt-10" : ""}
          >
            <Prompt cmd="cat contact.txt" />
            <h2 id="contact-details-title" className="sr-only">
              Contact details
            </h2>
            <dl className="t-kv mt-4">
              <div>
                <dt className={MUTED}>email</dt>
                <dd className="min-w-0">
                  <EmailButton email={profile.email} />
                </dd>
              </div>
              {profile.socials.length ? (
                <div>
                  <dt className={MUTED}>socials</dt>
                  <dd>
                    <Socials socials={profile.socials} />
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className={MUTED}>location</dt>
                <dd>{profile.location}</dd>
              </div>
              <div>
                <dt className={MUTED}>local time</dt>
                <dd>
                  <LocalTime timeZone={profile.timezone} />
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </main>
    </TerminalPage>
  );
}
