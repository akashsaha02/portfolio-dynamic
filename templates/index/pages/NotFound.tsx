import Link from "next/link";
import type { TemplateProps } from "../../types";
import { IndexPage } from "../shell";
import { ArrowUpRight, PAGE_TITLE, PAGE_TOP, TEXT_LINK } from "../ui";

// Index 404, rendered by app/(site)/not-found.tsx for unknown case studies and every unmatched
// URL: the h1, one line, and the ways back. Server Component.

const WAYS_BACK = [
  { href: "/", label: "Home" },
  { href: "/work", label: "Work" },
  { href: "/contact", label: "Contact" },
] as const;

export default function NotFound(props: TemplateProps) {
  return (
    <IndexPage {...props}>
      <main id="main" tabIndex={-1} className={PAGE_TOP}>
        <p className="text-sm text-lime tabular-nums">404</p>
        <h1 className={`${PAGE_TITLE} mt-3`}>Page not found</h1>
        <p className="mt-4 text-lg text-(--fg-muted)">Sorry, there&rsquo;s nothing at this address.</p>
        <nav aria-label="Ways back" className="mt-10">
          <ul className="flex flex-wrap gap-x-8">
            {WAYS_BACK.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={TEXT_LINK}>
                  {l.label}
                  <ArrowUpRight />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
    </IndexPage>
  );
}
