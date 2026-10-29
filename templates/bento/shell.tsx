import Link from "next/link";
import type { ReactNode } from "react";
import { CommandMenu, CommandMenuButton, ShortcutHint } from "@/components/shared/CommandMenu";
import { LocalTime } from "@/components/shared/LocalTime";
import { LiveVisitors } from "@/components/shared/realtime/LiveVisitors";
import { FocusMain } from "../index/client/FocusMain";
import type { TemplateProps } from "../types";
import { bentoCommands, PAGES } from "./commands";
import { Card, LABEL } from "./ui";
import "./bento.css";

// The Bento shell: every page is a column of cards on the soft page colour (bento.css), the
// header card (name home, page links, the ⌘K button) on top and the footer card at the bottom.
// Home passes no `current` and leaves the name out of the header (its intro card has the h1).
// Server Components; the client leaves are the shared FocusMain (Index's: focus after a client
// navigation), the clock, LiveVisitors and the ⌘K menu (only its key listener ships up front).

export type BentoPageId = "work" | "archive" | "lab" | "about" | "contact";

type BentoPageProps = TemplateProps & {
  /** The page being shown (aria-current="page"). Home has none. */
  current?: BentoPageId;
  /** The page a deeper one belongs to: a case study is inside "work" (aria-current="true"). */
  section?: BentoPageId;
  /** Home: the header leaves the name out (the intro card has it as the h1). */
  home?: boolean;
  children: ReactNode;
};

export function BentoPage({ content, settings, current, section, home, children }: BentoPageProps) {
  const { announcement } = settings;
  return (
    <div className="tpl-bento min-h-svh overflow-x-clip">
      {announcement ? (
        <p role="status" className="bg-lime px-6 py-3 text-center text-sm text-ink">
          {announcement.url ? (
            <a href={announcement.url} className="underline underline-offset-4">
              {announcement.text}
            </a>
          ) : (
            announcement.text
          )}
        </p>
      ) : null}
      <div className="b-page mx-auto grid max-w-7xl">
        <Card as="header" className="b-bar flex flex-wrap items-center gap-x-2">
          {home ? null : (
            <Link href="/" className="b-link inline-flex min-h-11 items-center px-3 text-lg font-semibold tracking-tight">
              {content.profile.name}
            </Link>
          )}
          <nav aria-label="Main" className="ml-auto">
            <ul className="flex flex-wrap">
              {PAGES.map((p) => {
                const id = p.href.slice(1);
                return (
                  <li key={p.href}>
                    <Link
                      href={p.href}
                      aria-current={id === current ? "page" : id === section ? "true" : undefined}
                      className="b-nav inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-medium"
                    >
                      {p.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <CommandMenuButton
            aria-label="Open the command menu"
            className="b-nav inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-medium"
          >
            <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4">
              <circle cx="7" cy="7" r="4.5" />
              <path d="M10.5 10.5L14 14" />
            </svg>
            <ShortcutHint className="hidden font-sans text-xs text-(--fg-muted) md:inline" />
          </CommandMenuButton>
        </Card>
        {children}
        <Footer content={content} clock={!home} />
      </div>
      <FocusMain />
      <CommandMenu items={bentoCommands(content)} />
    </div>
  );
}

/** Version, live visitors, local time (Home has its own clock card) and the pages not in the bar. */
function Footer({ content, clock }: Pick<TemplateProps, "content"> & { clock: boolean }) {
  const { profile, site } = content;
  return (
    <Card as="footer" className="b-foot grid gap-6 text-sm md:flex md:flex-wrap md:items-end md:justify-between">
      <ul aria-label="More pages" className="-mx-3 flex flex-wrap">
        {[
          { href: "/archive", label: "Project archive" },
          { href: "/lab", label: "Lab" },
          { href: "/v", label: "Older versions of this site" },
        ].map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="b-link inline-flex min-h-11 items-center px-3">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
      <dl className="flex flex-wrap gap-x-10 gap-y-4">
        <div>
          <dt className={LABEL}>Version</dt>
          <dd className="mt-1">{site.versionLabel}</dd>
        </div>
        {clock ? (
          <div>
            <dt className={LABEL}>Local time</dt>
            <dd className="mt-1">
              <LocalTime timeZone={profile.timezone} />
            </dd>
          </div>
        ) : null}
        <div className="self-end">
          <LiveVisitors className="b-live" />
        </div>
      </dl>
    </Card>
  );
}
