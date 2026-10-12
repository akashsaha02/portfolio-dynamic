import Image from "next/image";
import { CopyButton } from "@/components/shared/CopyButton";
import { LocalTime } from "@/components/shared/LocalTime";
import type { Profile } from "@/lib/content-types";
import type { TemplateProps } from "../../types";
import { ContactForm } from "../contact/ContactForm";
import { FolioShell } from "../shell/FolioShell";
import { RollLabel } from "../ui/Action";
import { Chip } from "../ui/Chip";
import { ArrowUpRight, Check, CopyIcon } from "../ui/icons";
import "../pages-about-contact.css";

// Folio Contact (guide §4.6, work plan 1.6). The h1 and availability, then the numbered form
// (contact/ContactForm.tsx, the page's only client JS besides the shell's) and a details column:
// email (copy on tap, mailto where the clipboard is refused), socials, location and live local
// time. Phone and md: the details follow the form. lg: the details sit in a sticky right column.
// With `settings.contactFormEnabled` off the form is not rendered and the details take the page.

type DetailsProps = {
  profile: Pick<Profile, "email" | "socials" | "location" | "timezone">;
};

function ContactDetails({ profile }: DetailsProps) {
  const { email, socials, location, timezone } = profile;

  return (
    <aside aria-labelledby="contact-details-title" className="f-contact-details">
      <h2 id="contact-details-title" className="sr-only">
        Contact details
      </h2>

      <div className="f-contact-detail f-contact-detail-email">
        <h3 className="type-label">Email</h3>
        <CopyButton
          value={email}
          status="Email address copied"
          fallbackHref={`mailto:${email}`}
          aria-label={`Copy email address ${email}`}
          className="f-btn f-btn-outline f-roll-host mt-3 flex min-h-14 w-full px-6 text-base lg:w-auto"
        >
          <span aria-hidden="true" className="f-copy">
            <span>
              <RollLabel>{email}</RollLabel>
              <CopyIcon />
            </span>
            <span>
              Copied
              <Check />
            </span>
          </span>
        </CopyButton>
      </div>

      {socials.length ? (
        <div className="f-contact-detail">
          <h3 id="contact-socials" className="type-label">
            Socials
          </h3>
          <ul aria-labelledby="contact-socials" className="mt-2 -ml-2 grid">
            {socials.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="f-roll-host inline-flex min-h-11 items-center gap-2 px-2 text-lg"
                >
                  <RollLabel>{s.label}</RollLabel>
                  <ArrowUpRight />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="f-contact-detail">
        <h3 className="type-label">Location</h3>
        <p className="mt-3 text-lg">{location}</p>
        <h3 className="mt-6 type-label">Local time</h3>
        <p className="mt-3 text-lg">
          <LocalTime timeZone={timezone} />
        </p>
      </div>
    </aside>
  );
}

export default function Contact({ content, settings }: TemplateProps) {
  const { profile } = content;
  const { avatar, availability } = profile;
  const formEnabled = settings.contactFormEnabled;

  return (
    <FolioShell content={content} settings={settings} current="contact" footerVariant="compact">
      <main id="main" tabIndex={-1} className="outline-none">
        <div className="f-bleed f-contact">
          <div className="flex items-center gap-4 md:gap-6">
            {avatar ? (
              <Image
                src={avatar.src}
                alt={avatar.alt}
                width={avatar.width}
                height={avatar.height}
                sizes="(min-width: 768px) 96px, 64px"
                className="size-16 shrink-0 rounded-full object-cover md:size-24"
              />
            ) : null}
            <h1 id="contact-title" className="type-display">
              Get in touch
            </h1>
          </div>
          <Chip variant="solid" dot={availability.status !== "closed"} className="mt-6 md:mt-8">
            {availability.label}
          </Chip>

          <div className="f-contact-grid" data-solo={formEnabled ? undefined : ""}>
            {formEnabled ? (
              <div className="f-contact-main">
                <ContactForm labelledBy="contact-title" />
              </div>
            ) : null}
            <ContactDetails profile={profile} />
          </div>
        </div>
      </main>
    </FolioShell>
  );
}
