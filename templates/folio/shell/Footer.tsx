import Image from "next/image";
import { CopyButton } from "@/components/shared/CopyButton";
import { LocalTime } from "@/components/shared/LocalTime";
import type { Profile, SiteMeta } from "@/lib/content-types";
import { RollLabel } from "../ui/Action";
import { CurvedEdge } from "../ui/CurvedEdge";
import { FillButton } from "../ui/FillButton";
import { Check, CopyIcon } from "../ui/icons";
import { Magnetic } from "../ui/Magnetic";
import { RoundButton } from "../ui/RoundButton";

// Footer (guide §4.2 row 7): an ink surface whose curved top edge rises into the paper above and
// flattens as it scrolls up the screen (CSS scroll-driven where supported, .f-footer-curve).
// Optional avatar + "Let's work together", the big round "Get in touch" sitting on a hairline,
// email (copy on tap) and optional phone as pills, stacked full width on phone and side by side
// from md, then version · live local time · socials above the bottom safe area.
//
// "compact" (the Contact page, work plan 1.7) keeps only the curve and that bottom row: the call
// to action, the button back to /contact and the email pill would repeat the page itself.

export type FooterVariant = "full" | "compact";

type FooterProps = {
  profile: Pick<Profile, "email" | "phone" | "avatar" | "timezone" | "socials">;
  site: Pick<SiteMeta, "versionLabel">;
  variant?: FooterVariant;
};

export function Footer({ profile, site, variant = "full" }: FooterProps) {
  const { timezone, socials } = profile;
  const compact = variant === "compact";

  return (
    <footer
      aria-labelledby={compact ? undefined : "footer-title"}
      className="f-footer relative surface-ink mt-[7svh] md:mt-[12svh]"
    >
      <CurvedEdge edge="top" fill="var(--ink)" className="f-footer-curve" />
      <div className={`f-bleed ${compact ? "pt-10 md:pt-14" : "pt-section"}`}>
        {compact ? null : <FooterCta profile={profile} />}

        <div
          className={`f-footer-bottom grid gap-8 md:flex md:items-end md:justify-between ${compact ? "" : "mt-section pt-6"}`}
        >
          <dl className="flex flex-wrap gap-x-12 gap-y-6">
            <div>
              <dt className="type-label">Version</dt>
              <dd className="flex min-h-11 items-center">{site.versionLabel}</dd>
            </div>
            <div>
              <dt className="type-label">Local time</dt>
              <dd className="flex min-h-11 items-center">
                <LocalTime timeZone={timezone} />
              </dd>
            </div>
          </dl>
          <div>
            <p id="footer-socials" className="type-label">
              Socials
            </p>
            <ul aria-labelledby="footer-socials" className="-ml-2 flex flex-wrap gap-x-4 gap-y-2">
              {socials.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="f-roll-host inline-flex min-h-11 items-center px-2"
                  >
                    <RollLabel>{s.label}</RollLabel>
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

/** "Let's work together", the round "Get in touch" on its hairline, and the email/phone pills. */
function FooterCta({ profile }: { profile: FooterProps["profile"] }) {
  const { email, phone, avatar } = profile;

  return (
    <>
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
        <h2 id="footer-title" className="max-w-[12ch] type-display">
          Let&rsquo;s work together
        </h2>
      </div>

      {/* The round button sits on the hairline; the margins leave half its size on each side. */}
      <div className="f-footer-rule relative border-t border-(--rule)">
        <div className="absolute top-0 right-0 -translate-y-1/2 md:right-[8%]">
          <Magnetic>
            <RoundButton href="/contact" size="lg">
              Get in touch
            </RoundButton>
          </Magnetic>
        </div>
      </div>

      <div className="f-footer-pills grid gap-3 md:flex md:flex-wrap">
        <CopyButton
          value={email}
          status="Email address copied"
          fallbackHref={`mailto:${email}`}
          aria-label={`Copy email address ${email}`}
          className="f-btn f-btn-outline f-roll-host flex min-h-14 w-full px-7 text-base md:min-h-16 md:w-auto md:px-9 md:text-lg"
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
        {phone ? (
          <FillButton href={`tel:${phone.replace(/[^\d+]/g, "")}`} variant="outline" size="lg" block className="md:w-auto">
            {phone}
          </FillButton>
        ) : null}
      </div>
    </>
  );
}
