import { LocalTime } from "@/components/shared/LocalTime";
import type { TemplateProps } from "../../types";
import { Availability, EmailButton, Socials } from "../blocks";
import { ContactForm } from "../client/ContactForm";
import { BrutalPage } from "../shell";
import { MAIN, PageHead, Tag } from "../ui";

// Brutal Contact, /contact: the h1 and availability, the form in a bordered paper block
// (client/ContactForm.tsx, through the shared Server Action), and the details beside it from lg
// (under it before): email (copy on tap), socials, location and local time. With
// `settings.contactFormEnabled` off the form is not rendered and the details take the page.

export default function Contact(props: TemplateProps) {
  const { profile } = props.content;
  const formEnabled = props.settings.contactFormEnabled;

  return (
    <BrutalPage {...props} current="contact">
      <main id="main" tabIndex={-1} className={MAIN}>
        <PageHead tag="Say hello" title="Get in touch" id="contact-title">
          <Availability availability={profile.availability} className="justify-self-start" />
        </PageHead>

        <div className="mt-10 grid gap-10 md:mt-16 lg:grid-cols-3">
          {formEnabled ? (
            <div className="b-box bg-paper p-4 sm:p-6 md:p-8 lg:col-span-2">
              <ContactForm labelledBy="contact-title" />
            </div>
          ) : null}

          <aside aria-labelledby="contact-details-title" className="grid content-start gap-8">
            <h2 id="contact-details-title" className="sr-only">
              Contact details
            </h2>
            <div className="b-box grid min-w-0 justify-items-start gap-4 bg-lime p-4">
              <h3 className="b-tag bg-paper">Email</h3>
              <EmailButton email={profile.email} />
            </div>
            {profile.socials.length ? (
              <div className="b-box grid gap-4 bg-paper p-4">
                <h3 className="b-tag justify-self-start bg-lime">Socials</h3>
                <Socials socials={profile.socials} />
              </div>
            ) : null}
            <div className="b-box grid gap-3 bg-ink p-4 text-on-ink">
              <h3>
                <Tag className="bg-lime text-ink">Location</Tag>
              </h3>
              <p className="text-xl font-black uppercase">{profile.location}</p>
              <h3 className="mt-3">
                <Tag className="bg-lime text-ink">Local time</Tag>
              </h3>
              <p className="text-xl font-black">
                <LocalTime timeZone={profile.timezone} />
              </p>
            </div>
          </aside>
        </div>
      </main>
    </BrutalPage>
  );
}
