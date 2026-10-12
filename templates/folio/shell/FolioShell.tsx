import type { ReactNode } from "react";
import type { TemplateProps } from "../../types";
import { Footer } from "./Footer";
import { MenuNav } from "./MenuNav";
import { MenuPanel } from "./MenuPanel";
import { MenuRoot } from "./MenuRoot";
import { FixedBurger } from "./MenuTriggers";
import type { ShellPage } from "./pages";
import { TopBar } from "./TopBar";

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

type FolioShellProps = TemplateProps & {
  /** Marks the current page in the top bar and the menu (aria-current + dot). */
  current?: ShellPage;
  children: ReactNode;
};

export function FolioShell({ content, settings, current, children }: FolioShellProps) {
  const { profile, site } = content;
  const firstName = profile.name.split(" ")[0];
  const { announcement } = settings;

  return (
    <div className="tpl-folio surface-paper relative min-h-svh overflow-x-clip">
      <MenuRoot
        menu={
          <MenuPanel>
            <MenuNav profile={profile} current={current} />
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
        <TopBar firstName={firstName} current={current} />
        <FixedBurger />
        {children}
        <Footer profile={profile} site={site} />
      </MenuRoot>
    </div>
  );
}
