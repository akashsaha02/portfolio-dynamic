import Link from "next/link";
import type { ReactNode } from "react";
import { CommandMenu, CommandMenuButton, ShortcutHint } from "@/components/shared/CommandMenu";
import { LocalTime } from "@/components/shared/LocalTime";
import { LiveVisitors } from "@/components/shared/realtime/LiveVisitors";
import { FocusMain } from "../index/client/FocusMain";
import type { TemplateProps } from "../types";
import { terminalCommands } from "./commands";
import { Socials } from "./profile";
import { HOST, LINK, MUTED, Prompt } from "./ui";
import "./terminal.css";

// The Terminal shell: every page sits in one window. From md it is a framed window with a title
// bar (decorative: dots and `akash@portfolio: ~/work`); on phone the frame collapses and the
// window is the page. Inside: a header (name home, the pages as commands, ⌘K), the page's <main>
// and the footer (version, local time, who is here, socials, more pages, an idle prompt).
// Server Components; the client leaves are FocusMain (shared with Index), the clock,
// LiveVisitors and the ⌘K menu (only its key listener ships; the dialog loads on first open).

export type TerminalPageId = "home" | "work" | "archive" | "lab" | "about" | "contact";

/** The pages as commands. The verb is decoration, outside the link (aria-hidden; a no-break
 * space, as flex items drop a trailing one), so the link's visible text and its name are both the
 * page (WCAG 2.5.3, label in name: "click work" works for speech input). */
const PAGES: { id: TerminalPageId; href: string; verb: string; label: string }[] = [
  { id: "work", href: "/work", verb: "cd ", label: "work" },
  { id: "archive", href: "/archive", verb: "ls ", label: "archive" },
  { id: "lab", href: "/lab", verb: "./", label: "lab" },
  { id: "about", href: "/about", verb: "cat ", label: "about" },
  { id: "contact", href: "/contact", verb: "./", label: "contact" },
];

/** <main> under the header. */
export const MAIN = "pt-10 outline-none md:pt-14";

type TerminalPageProps = TemplateProps & {
  /** The page being shown (aria-current="page"). */
  current?: TerminalPageId;
  /** The page a deeper one belongs to: a case study is inside "work" (aria-current="true"). */
  section?: TerminalPageId;
  /** The working directory in the title bar, e.g. "~/work". */
  cwd?: string;
  children: ReactNode;
};

export function TerminalPage({ content, settings, current, section, cwd = "~", children }: TerminalPageProps) {
  const { announcement } = settings;
  const mark = (id: TerminalPageId) => (id === current ? "page" : id === section ? "true" : undefined);

  return (
    <div className="tpl-terminal relative min-h-svh overflow-x-clip bg-ink text-on-ink md:px-6 md:py-10">
      {announcement ? (
        <p role="status" className="bg-lime px-6 py-3 text-center text-sm text-ink md:mx-auto md:mb-6 md:max-w-5xl">
          {announcement.url ? (
            <a href={announcement.url} className="underline underline-offset-4">
              {announcement.text}
            </a>
          ) : (
            announcement.text
          )}
        </p>
      ) : null}

      <div className="t-win mx-auto max-w-5xl">
        <div aria-hidden="true" className="t-bar hidden md:flex">
          <span className="t-dots">
            <i />
            <i />
            <i />
          </span>
          <span className="truncate">
            {HOST}: {cwd}
          </span>
        </div>

        <div className="px-5 sm:px-8 md:px-12">
          <header className="flex flex-wrap items-center justify-between gap-x-6 border-b border-hairline-on-ink pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 md:pt-4">
            <Link href="/" aria-current={mark("home")} className={`${LINK} -ml-1 px-1 font-bold`}>
              <span aria-hidden="true" className="text-lime">
                ~/
              </span>
              {content.profile.name}
            </Link>
            <nav aria-label="Main" className="flex items-center">
              <ul className="-mx-2 flex flex-wrap">
                {PAGES.map((p) => (
                  <li key={p.id} className="inline-flex items-center pl-2">
                    <span aria-hidden="true" className={MUTED}>
                      {p.verb}
                    </span>
                    <Link href={p.href} aria-current={mark(p.id)} className="t-a t-nav inline-flex min-h-11 min-w-11 items-center pr-2">
                      {p.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <CommandMenuButton
                aria-label="Open the command menu"
                className="t-key ml-2 hidden min-h-11 min-w-11 items-center justify-center px-2 md:inline-flex"
              >
                <ShortcutHint />
              </CommandMenuButton>
            </nav>
          </header>

          {children}

          <Footer content={content} />
        </div>
      </div>

      <FocusMain />
      <CommandMenu items={terminalCommands(content)} />
    </div>
  );
}

/** Version, local time, who is here, socials and the pages that aren't in the header. */
function Footer({ content }: Pick<TemplateProps, "content">) {
  const { profile, site } = content;
  return (
    <footer className="mt-24 border-t border-hairline-on-ink pt-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-sm md:mt-32">
      <dl className="t-kv">
        <div>
          <dt className={MUTED}>version</dt>
          <dd>{site.versionLabel}</dd>
        </div>
        <div>
          <dt className={MUTED}>local time</dt>
          <dd>
            <LocalTime timeZone={profile.timezone} /> <span className={MUTED}>{profile.location}</span>
          </dd>
        </div>
      </dl>

      {/* Shown only once LiveVisitors renders (more than one person here): terminal.css. */}
      <div className="t-who mt-6">
        <Prompt cmd="who" />
        <p>
          <LiveVisitors />
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-x-4">
        <Socials socials={profile.socials} />
        <ul aria-label="More pages" className="-ml-1 flex flex-wrap gap-x-4">
          <li className="inline-flex items-center">
            <span aria-hidden="true" className={MUTED}>
              git log:&nbsp;
            </span>
            <Link href="/v" className={`${LINK} px-1`}>
              older versions
            </Link>
          </li>
        </ul>
      </div>

      <Prompt caret className="mt-6" />
    </footer>
  );
}
