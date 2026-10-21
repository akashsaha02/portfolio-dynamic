import { ViewTransition, type ReactNode } from "react";
import { CommandMenu } from "@/components/shared/CommandMenu";
import type { TemplateProps } from "../../types";
import { folioCommands } from "../commands";
import { FocusMain } from "./FocusMain";
import { Footer, type FooterVariant } from "./Footer";
import { MenuNav } from "./MenuNav";
import { MenuPanel } from "./MenuPanel";
import { MenuRoot } from "./MenuRoot";
import { FixedBurger } from "./MenuTriggers";
import type { ShellPage } from "./pages";
import { TopBar } from "./TopBar";
import "../transitions.css";

// The Folio global shell (guide §4.1, work plan 1.2), shared by every Folio page:
//
//   <FolioShell {...props} current="about">
//     <main id="main" tabIndex={-1}>…</main>
//   </FolioShell>
//
// It owns the `tpl-folio surface-paper` root, the announcement banner, the top bar, the fixed
// burger, the menu panel and the footer. Pages render only their <main>. Server Component; the
// client parts are the menu state, its triggers, the panel behaviour, the copy button and the
// clock, all small and free of GSAP (Magnetic fetches GSAP lazily on fine pointers only).
//
// Page transitions (work plan 1.7): the root sits in a <ViewTransition>, so every client
// navigation between Folio routes (Next runs them as React Transitions) crossfades the page; see
// transitions.css. It must stay the outermost element: React only runs enter/exit for a boundary
// with no DOM node above it in the subtree that mounts. `default="none"` keeps every other
// transition (form actions, filters) from animating. No-op where View Transitions are missing.
// FocusMain puts focus on the new <main> after each client navigation (QA F-04).
//
// The ⌘K command menu (work plan 6.2, components/shared/CommandMenu.tsx) is mounted here with
// Folio's commands (commands.ts); only its listener ships, the dialog loads on first open.

type FolioShellProps = TemplateProps & {
  /** The page being shown: aria-current="page" and the dot in the top bar and the menu. */
  current?: ShellPage;
  /**
   * The section a deeper page belongs to (a case study is inside "work"): aria-current="true"
   * and the dot, so the link reads as "current" without claiming to be this page.
   */
  section?: ShellPage;
  /**
   * The page's name for the page-transition curtain (work plan 6.9), e.g. a project's name on its
   * case study. Defaults to the label of `current` (Home, Work, About, Contact).
   */
  title?: string;
  /** "compact" drops the footer's call to action (for /contact, which is that action). */
  footerVariant?: FooterVariant;
  children: ReactNode;
};

export function FolioShell({ content, settings, current, section, footerVariant, children }: FolioShellProps) {
  const { profile, site } = content;
  const firstName = profile.name.split(" ")[0];
  const { announcement } = settings;

  return (
    <ViewTransition enter="f-page-in" exit="f-page-out" default="none">
      <div className="tpl-folio surface-paper relative min-h-svh overflow-x-clip">
        <MenuRoot
          menu={
            <MenuPanel>
              <MenuNav profile={profile} current={current} section={section} />
            </MenuPanel>
          }
        >
          {announcement ? (
            <p role="status" className="surface-ink px-gutter py-3 text-center text-sm">
              {announcement.url ? (
                <a href={announcement.url} className="underline underline-offset-4">
                  {announcement.text}
                </a>
              ) : (
                announcement.text
              )}
            </p>
          ) : null}
          <TopBar firstName={firstName} current={current} section={section} />
          <FixedBurger />
          {children}
          <Footer profile={profile} site={site} variant={footerVariant} />
          <FocusMain />
        </MenuRoot>
        {/* Outside MenuRoot, so the open panel's `inert` never covers it (work plan 6.2). */}
        <CommandMenu items={folioCommands(content)} />
      </div>
    </ViewTransition>
  );
}
