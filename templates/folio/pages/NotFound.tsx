// Folio 404 (work plan 1.7), rendered by app/(site)/not-found.tsx through TemplateModule.NotFound
// for unknown case studies and, via the (site) catch-all, every unmatched URL. Inside the shell
// (no page is current): the h1, one line, and the three ways back as full-width pills on phone,
// in a row from md. Server Component, no client JS of its own.

import type { TemplateProps } from "../../types";
import { FolioShell } from "../shell/FolioShell";
import { FillButton } from "../ui/FillButton";
import { ArrowRight } from "../ui/icons";

const WAYS_BACK = [
  { href: "/", label: "Home" },
  { href: "/work", label: "Work" },
  { href: "/contact", label: "Contact" },
] as const;

export default function NotFound({ content, settings }: TemplateProps) {
  return (
    <FolioShell content={content} settings={settings} title="Page not found">
      <main id="main" tabIndex={-1} className="outline-none">
        <div className="f-bleed pt-[calc(var(--section-y)/2)] pb-section">
          <p className="type-label tabular-nums">404</p>
          <h1 className="mt-4 type-display md:mt-6">Page not found</h1>
          <p className="mt-6 max-w-[40ch] type-lead text-(--fg-muted) md:mt-8">
            Sorry, there&rsquo;s nothing at this address.
          </p>

          <nav aria-label="Ways back" className="mt-12 md:mt-16">
            <ul className="grid gap-3 md:flex md:flex-wrap">
              {WAYS_BACK.map((l) => (
                <li key={l.href}>
                  <FillButton
                    href={l.href}
                    variant={l.href === "/" ? "solid" : "outline"}
                    size="lg"
                    block
                    icon={<ArrowRight />}
                    className="justify-between md:w-auto md:justify-center"
                  >
                    {l.label}
                  </FillButton>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </main>
    </FolioShell>
  );
}
