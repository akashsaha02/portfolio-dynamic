import Link from "next/link";
import type { ReactNode } from "react";
import { LocalTime } from "@/components/shared/LocalTime";
import { LiveVisitors } from "@/components/shared/realtime/LiveVisitors";
import type { TemplateProps } from "../types";
import { FocusMain } from "./client/FocusMain";
import { EYEBROW } from "./ui";
import "./index.css";

// The Index shell. `IndexRoot` is the `tpl-index` root every page sits in (ink page, announcement
// banner, focus after navigation). Home builds its own two columns inside it; every other page
// uses `IndexPage`: one centred column with a small header (name home, page links) and the footer.
// Server Components; the only client leaves here are FocusMain, the clock and LiveVisitors.

export type IndexPageId = "work" | "archive" | "lab" | "about" | "contact";

const PAGES: { id: IndexPageId; href: string; label: string }[] = [
  { id: "work", href: "/work", label: "Work" },
  { id: "archive", href: "/archive", label: "Archive" },
  { id: "lab", href: "/lab", label: "Lab" },
  { id: "about", href: "/about", label: "About" },
  { id: "contact", href: "/contact", label: "Contact" },
];

export function IndexRoot({ settings, children }: Pick<TemplateProps, "settings"> & { children: ReactNode }) {
  const { announcement } = settings;
  return (
    <div className="tpl-index relative min-h-svh overflow-x-clip bg-ink text-on-ink">
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
      {children}
      <FocusMain />
    </div>
  );
}

type IndexPageProps = TemplateProps & {
  /** The page being shown (aria-current="page"). */
  current?: IndexPageId;
  /** The page a deeper one belongs to: a case study is inside "work" (aria-current="true"). */
  section?: IndexPageId;
  /** Tables (Archive) get a wider column. */
  wide?: boolean;
  children: ReactNode;
};

export function IndexPage({ content, settings, current, section, wide, children }: IndexPageProps) {
  return (
    <IndexRoot settings={settings}>
      <div className={`mx-auto w-full px-6 md:px-12 ${wide ? "max-w-5xl" : "max-w-3xl"}`}>
        <header className="flex flex-wrap items-center justify-between gap-x-6 pt-[max(1.25rem,env(safe-area-inset-top))] md:pt-10">
          <Link href="/" className="-ml-1 inline-flex min-h-11 items-center px-1 text-lg font-semibold tracking-tight">
            {content.profile.name}
          </Link>
          <nav aria-label="Main">
            <ul className="-mx-2 flex flex-wrap">
              {PAGES.map((p) => (
                <li key={p.id}>
                  <Link
                    href={p.href}
                    aria-current={p.id === current ? "page" : p.id === section ? "true" : undefined}
                    className="i-link inline-flex min-h-11 min-w-11 items-center justify-center px-2 text-sm text-(--fg-muted) decoration-lime decoration-2 underline-offset-8 aria-[current]:text-on-ink aria-[current]:underline"
                  >
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>
        {children}
        <Footer content={content} />
      </div>
    </IndexRoot>
  );
}

/** Version, local time, live visitors and the pages that aren't in the Home nav. */
export function Footer({ content }: Pick<TemplateProps, "content">) {
  const { profile, site } = content;
  return (
    <footer className="mt-24 grid gap-6 border-t border-hairline-on-ink pt-8 pb-[max(2.5rem,env(safe-area-inset-bottom))] text-sm text-(--fg-muted) md:mt-32">
      <ul aria-label="More pages" className="-mx-2 flex flex-wrap">
        {[
          { href: "/archive", label: "Project archive" },
          { href: "/lab", label: "Lab" },
          { href: "/v", label: "Older versions of this site" },
        ].map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="i-link inline-flex min-h-11 min-w-11 items-center justify-center px-2">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
      <dl className="flex flex-wrap gap-x-10 gap-y-4">
        <div>
          <dt className={EYEBROW}>Version</dt>
          <dd className="mt-1 text-on-ink">{site.versionLabel}</dd>
        </div>
        <div>
          <dt className={EYEBROW}>Local time</dt>
          <dd className="mt-1 text-on-ink">
            <LocalTime timeZone={profile.timezone} />
          </dd>
        </div>
      </dl>
      <LiveVisitors className="text-on-ink" />
    </footer>
  );
}
