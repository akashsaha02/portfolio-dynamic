import Link from "next/link";
import type { ReactNode } from "react";
import { CommandMenu, CommandMenuButton, ShortcutHint } from "@/components/shared/CommandMenu";
import { LocalTime } from "@/components/shared/LocalTime";
import { LiveVisitors } from "@/components/shared/realtime/LiveVisitors";
import { FocusMain } from "../index/client/FocusMain";
import type { TemplateProps } from "../types";
import { EmailButton, Socials } from "./blocks";
import { brutalCommands } from "./commands";
import { BTN } from "./ui";
import "./brutal.css";

// The Brutal shell: every page sits in `BrutalPage` (the `tpl-brutal` root on the paper grid):
// the announcement, a header bar (name home, page links as bordered tabs, a Search button for the
// ⌘K menu, which is also the touch way in), the page's <main>, and the ink footer. Server
// Components; the client leaves are FocusMain (Index's: focus after a client navigation, shared
// so it ships once), the command menu host, the clock and LiveVisitors.

export type BrutalPageId = "home" | "work" | "archive" | "lab" | "about" | "contact";

const PAGES: { id: BrutalPageId; href: string; label: string }[] = [
  { id: "work", href: "/work", label: "Work" },
  { id: "archive", href: "/archive", label: "Archive" },
  { id: "lab", href: "/lab", label: "Lab" },
  { id: "about", href: "/about", label: "About" },
  { id: "contact", href: "/contact", label: "Contact" },
];

/** Page padding, shared by the header, main and footer. */
const WRAP = "mx-auto w-full max-w-screen-xl px-4 sm:px-6 md:px-10";

type BrutalPageProps = TemplateProps & {
  /** The page being shown (aria-current="page"). */
  current?: BrutalPageId;
  /** The page a deeper one belongs to: a case study is inside "work" (aria-current="true"). */
  section?: BrutalPageId;
  children: ReactNode;
};

export function BrutalPage({ content, settings, current, section, children }: BrutalPageProps) {
  const { profile } = content;
  const { announcement } = settings;
  return (
    <div className="tpl-brutal relative flex min-h-svh flex-col overflow-x-clip text-ink">
      {announcement ? (
        <p role="status" className="b-rule bg-lime px-4 py-3 text-center font-bold">
          {announcement.url ? (
            <a href={announcement.url} className="underline decoration-2 underline-offset-4">
              {announcement.text}
            </a>
          ) : (
            announcement.text
          )}
        </p>
      ) : null}

      <header className="b-head bg-paper">
        <div className={`${WRAP} flex flex-wrap items-center gap-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3`}>
          <Link
            href="/"
            aria-current={current === "home" ? "page" : undefined}
            className={`${BTN} bg-lime px-3 text-sm`}
          >
            {profile.name}
          </Link>
          <CommandMenuButton className={`${BTN} ml-auto bg-paper px-3 text-sm md:order-last md:ml-0`}>
            Search
            <ShortcutHint className="hidden font-sans text-xs md:inline" />
          </CommandMenuButton>
          <nav aria-label="Main" className="w-full md:ml-auto md:w-auto">
            <ul className="flex flex-wrap gap-2">
              {PAGES.map((p) => (
                <li key={p.id}>
                  <Link
                    href={p.href}
                    aria-current={p.id === current ? "page" : p.id === section ? "true" : undefined}
                    className="b-nav"
                  >
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <div className={`${WRAP} flex-1 pb-20 md:pb-28`}>{children}</div>

      <Footer content={content} contact={current !== "contact"} />
      <FocusMain />
      <CommandMenu items={brutalCommands(content)} />
    </div>
  );
}

/** Ink block: the contact call to action, more pages, socials, version, local time, visitors. */
function Footer({ content, contact }: Pick<TemplateProps, "content"> & { contact: boolean }) {
  const { profile, site } = content;
  return (
    <footer className="b-dark bg-ink text-on-ink">
      <div className={`${WRAP} grid gap-12 pt-14 pb-[max(2.5rem,env(safe-area-inset-bottom))] md:grid-cols-2`}>
        <div>
          <p className="b-display b-h2">Let&rsquo;s work together</p>
          <div className="mt-8 flex flex-wrap gap-4">
            {contact ? (
              <Link href="/contact" className={`${BTN} bg-lime text-ink`}>
                Get in touch
              </Link>
            ) : null}
            <EmailButton email={profile.email} />
          </div>
        </div>
        <div className="grid content-start gap-8">
          <Socials socials={profile.socials} />
          <ul aria-label="More pages" className="-mx-2 flex flex-wrap">
            {[
              { href: "/archive", label: "Project archive" },
              { href: "/lab", label: "Lab" },
              { href: "/v", label: "Older versions of this site" },
            ].map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="b-hl inline-flex min-h-11 items-center px-2 font-bold underline decoration-lime decoration-2 underline-offset-4"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <dl className="flex flex-wrap gap-x-10 gap-y-4">
            <div>
              <dt className="b-tag bg-lime text-ink">Version</dt>
              <dd className="mt-2 font-bold">{site.versionLabel}</dd>
            </div>
            <div>
              <dt className="b-tag bg-lime text-ink">Local time</dt>
              <dd className="mt-2 font-bold">
                <LocalTime timeZone={profile.timezone} />
              </dd>
            </div>
          </dl>
          <LiveVisitors className="font-bold" />
        </div>
      </div>
    </footer>
  );
}
