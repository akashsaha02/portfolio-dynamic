import { LocalTime } from "@/components/shared/LocalTime";
import type { TemplateProps } from "../../types";
import { AvailabilityLine, EmailButton, SocialList } from "../cards";
import { ContactForm } from "../client/ContactForm";
import { BentoPage } from "../shell";
import { Card, LABEL, PAGE_TITLE } from "../ui";

// Bento Contact, /contact: the title card (h1 and availability), the form card (client/
// ContactForm.tsx, through the shared Server Action) and a column of small cards with the
// details: email (copy on tap), socials, location and local time. Desktop: form two thirds, the
// details beside it. With `settings.contactFormEnabled` off the form card is left out and the
// details sit in a row under the title.

export default function Contact(props: TemplateProps) {
  const { profile } = props.content;
  const formEnabled = props.settings.contactFormEnabled;

  return (
    <BentoPage {...props} current="contact">
      <main id="main" tabIndex={-1} className="grid gap-3 outline-none md:gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-3">
          <h1 id="contact-title" className={PAGE_TITLE}>
            Get in touch
          </h1>
          <AvailabilityLine availability={profile.availability} className="mt-4 text-lg" />
        </Card>

        {formEnabled ? (
          <Card className="lg:col-span-2">
            <ContactForm labelledBy="contact-title" />
          </Card>
        ) : null}

        <aside
          aria-labelledby="contact-details-title"
          className={`grid content-start gap-3 md:gap-4 ${formEnabled ? "" : "md:grid-cols-3 lg:col-span-3"}`}
        >
          <h2 id="contact-details-title" className="sr-only">
            Contact details
          </h2>
          <Card>
            <h3 className={LABEL}>Email</h3>
            <div className="mt-3 grid">
              <EmailButton email={profile.email} />
            </div>
          </Card>
          {profile.socials.length ? (
            <Card className="py-3">
              <h3 className={`${LABEL} pt-2`}>Socials</h3>
              <SocialList socials={profile.socials} />
            </Card>
          ) : null}
          <Card>
            <h3 className={LABEL}>Location</h3>
            <p className="mt-2">{profile.location}</p>
            <h3 className={`${LABEL} mt-6`}>Local time</h3>
            <p className="mt-2 text-2xl font-semibold tracking-tight">
              <LocalTime timeZone={profile.timezone} />
            </p>
          </Card>
        </aside>
      </main>
    </BentoPage>
  );
}
