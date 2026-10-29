import Link from "next/link";
import type { TemplateProps } from "../../types";
import { BentoPage } from "../shell";
import { ArrowUpRight, Card, LABEL, PAGE_TITLE, TEXT_LINK } from "../ui";

// Bento 404, rendered by app/(site)/not-found.tsx for unknown case studies and every unmatched
// URL: one card with the h1, one line, and the ways back. Server Component.

const WAYS_BACK = [
  { href: "/", label: "Home" },
  { href: "/work", label: "Work" },
  { href: "/contact", label: "Contact" },
] as const;

export default function NotFound(props: TemplateProps) {
  return (
    <BentoPage {...props}>
      <main id="main" tabIndex={-1} className="outline-none">
        <Card className="py-12 md:py-20">
          <p className={`${LABEL} tabular-nums`}>404</p>
          <h1 className={`${PAGE_TITLE} mt-3`}>Page not found</h1>
          <p className="mt-4 text-lg text-(--fg-muted)">Sorry, there&rsquo;s nothing at this address.</p>
          <nav aria-label="Ways back" className="mt-8">
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
        </Card>
      </main>
    </BentoPage>
  );
}
