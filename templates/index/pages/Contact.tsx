import { LocalTime } from "@/components/shared/LocalTime";
import type { TemplateProps } from "../../types";
import { ContactForm } from "../client/ContactForm";
import { Availability, EmailButton, Socials } from "../profile";
import { IndexPage } from "../shell";
import { EYEBROW, PAGE_TITLE, PAGE_TOP } from "../ui";

// Index Contact, /contact: the h1 and availability, the form (client/ContactForm.tsx, through
// the shared Server Action), and the details: email (copy on tap), socials, location and local
// time, in a wrapping row under the form. With `settings.contactFormEnabled` off the form is not
// rendered and the details take the page.

export default function Contact(props: TemplateProps) {
  const { profile } = props.content;
  const formEnabled = props.settings.contactFormEnabled;

  return (
    <IndexPage {...props} current="contact">
      <main id="main" tabIndex={-1} className={PAGE_TOP}>
        <h1 id="contact-title" className={PAGE_TITLE}>
          Get in touch
        </h1>
        <Availability availability={profile.availability} className="mt-6" />

        <div className="mt-12 grid gap-16 md:mt-16">
          {formEnabled ? <ContactForm labelledBy="contact-title" /> : null}

          <aside
            aria-labelledby="contact-details-title"
            className={`flex flex-wrap gap-x-14 gap-y-8 ${formEnabled ? "border-t border-hairline-on-ink pt-10" : ""}`}
          >
            <h2 id="contact-details-title" className="sr-only">
              Contact details
            </h2>
            <div className="grid max-w-full min-w-0 justify-items-start">
              <h3 className={`${EYEBROW} text-(--fg-muted)`}>Email</h3>
              <div className="mt-3 grid max-w-full">
                <EmailButton email={profile.email} />
              </div>
            </div>
            {profile.socials.length ? (
              <div>
                <h3 className={`${EYEBROW} text-(--fg-muted)`}>Socials</h3>
                <Socials socials={profile.socials} className="mt-1" />
              </div>
            ) : null}
            <div>
              <h3 className={`${EYEBROW} text-(--fg-muted)`}>Location</h3>
              <p className="mt-2">{profile.location}</p>
              <h3 className={`${EYEBROW} mt-6 text-(--fg-muted)`}>Local time</h3>
              <p className="mt-2">
                <LocalTime timeZone={profile.timezone} />
              </p>
            </div>
          </aside>
        </div>
      </main>
    </IndexPage>
  );
}
